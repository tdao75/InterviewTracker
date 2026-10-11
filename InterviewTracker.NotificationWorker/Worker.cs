using System.Text.Json;
using InterviewTracker.NotificationWorker.Contracts;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using InterviewTracker.NotificationWorker.Services;
using RabbitMQ.Client;
using InterviewTracker.NotificationWorker.Data;
using InterviewTracker.NotificationWorker.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewTracker.NotificationWorker;

public sealed class Worker : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<Worker> _logger;
    private readonly IEmailSender _emailSender;

    private IConnection? _connection;
    private IChannel? _channel;
    private readonly IServiceScopeFactory _scopeFactory;

    public Worker(IConfiguration configuration, ILogger<Worker> logger, IEmailSender emailSender, IServiceScopeFactory scopeFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _emailSender = emailSender;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = GetRequiredSetting("RabbitMq:HostName"),
            Port = _configuration.GetValue<int>("RabbitMq:Port"),
            UserName = GetRequiredSetting("RabbitMq:UserName"),
            Password = GetRequiredSetting("RabbitMq:Password"),
            AutomaticRecoveryEnabled = true,
            ClientProvidedName = "InterviewTracker.NotificationWorker"
        };

        _connection = await ConnectWithRetryAsync(factory, stoppingToken);

        _channel = await _connection.CreateChannelAsync( cancellationToken: stoppingToken);

        var queueName = GetRequiredSetting("RabbitMq:QueueName");

        var deadLetterExchangeName = GetRequiredSetting("RabbitMq:DeadLetterExchangeName");

        var deadLetterQueueName = GetRequiredSetting("RabbitMq:DeadLetterQueueName");

        var deadLetterRoutingKey = GetRequiredSetting("RabbitMq:DeadLetterRoutingKey");

        await _channel.ExchangeDeclareAsync(
            exchange: deadLetterExchangeName,
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            arguments: null,
            cancellationToken: stoppingToken);

        await _channel.QueueDeclareAsync(
            queue: deadLetterQueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: stoppingToken);

        await _channel.QueueBindAsync(
            queue: deadLetterQueueName,
            exchange: deadLetterExchangeName,
            routingKey: deadLetterRoutingKey,
            arguments: null,
            cancellationToken: stoppingToken);

        var queueArguments = new Dictionary<string, object?>
        {
            ["x-dead-letter-exchange"] = deadLetterExchangeName,
            ["x-dead-letter-routing-key"] = deadLetterRoutingKey
        };

        await _channel.QueueDeclareAsync(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: queueArguments,
            cancellationToken: stoppingToken);

        await _channel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: 1,
            global: false,
            cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.ReceivedAsync += async (_, eventArgs) =>
        {
            try
            {
                var body = eventArgs.Body.ToArray();

                var message =
                    JsonSerializer.Deserialize<InterviewScheduledEvent>(
                        body);

                if (message is null)
                {
                    throw new InvalidOperationException("RabbitMQ message could not be deserialized.");
                }

                using var scope = _scopeFactory.CreateScope();

                var context = scope.ServiceProvider
                    .GetRequiredService<NotificationDbContext>();

                var alreadyProcessed =
                    await context.ProcessedMessages
                        .AsNoTracking()
                        .AnyAsync(
                            x => x.EventId == message.EventId,
                            stoppingToken);

                if (alreadyProcessed)
                {
                    _logger.LogInformation(
                        "Duplicate event {EventId} detected. " +
                        "Email will not be sent again.",
                        message.EventId);

                    await _channel.BasicAckAsync(
                        deliveryTag: eventArgs.DeliveryTag,
                        multiple: false,
                        cancellationToken: stoppingToken);

                    return;
                }

                var maxAttempts = _configuration.GetValue<int>(
    "Retry:MaxAttempts");

                var delaySeconds = _configuration.GetValue<int>(
                    "Retry:DelaySeconds");

                if (maxAttempts <= 0)
                {
                    maxAttempts = 3;
                }

                if (delaySeconds <= 0)
                {
                    delaySeconds = 5;
                }

                Exception? finalException = null;

                for (var attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    try
                    {
                        _logger.LogInformation(
                            "Sending interview email. " +
                            "Event: {EventId}, Attempt: {Attempt}/{MaxAttempts}",
                            message.EventId,
                            attempt,
                            maxAttempts);

                        await _emailSender.SendInterviewScheduledAsync(message,stoppingToken);

                        context.ProcessedMessages.Add(
                            new ProcessedMessage
                            {
                                EventId = message.EventId,
                                InterviewId = message.InterviewId,
                                ProcessedAtUtc = DateTime.UtcNow
                            });

                        await context.SaveChangesAsync(stoppingToken);

                        // Acknowledge only after recording the EventId.
                        await _channel.BasicAckAsync(
                            deliveryTag: eventArgs.DeliveryTag,
                            multiple: false,
                            cancellationToken: stoppingToken);

                        _logger.LogInformation(
                            "Message {EventId} processed and recorded.",
                            message.EventId);

                        return;

                        _logger.LogInformation(
                            "Message {EventId} processed successfully.",
                            message.EventId);

                        return;
                    }
                    catch (OperationCanceledException)
                        when (stoppingToken.IsCancellationRequested)
                    {
                        return;
                    }
                    catch (Exception exception)
                    {
                        finalException = exception;

                        _logger.LogWarning(
                            exception,
                            "Email attempt {Attempt}/{MaxAttempts} failed " +
                            "for event {EventId}.",
                            attempt,
                            maxAttempts,
                            message.EventId);

                        if (attempt < maxAttempts)
                        {
                            await Task.Delay(
                                TimeSpan.FromSeconds(delaySeconds),
                                stoppingToken);
                        }
                    }
                }

                _logger.LogError(
                    finalException,
                    "All email attempts failed for event {EventId}. " +
                    "Sending message to dead-letter queue.",
                    message.EventId);

                await _channel.BasicNackAsync(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: false,
                    cancellationToken: stoppingToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception,"Failed to process RabbitMQ message.");

                await _channel.BasicNackAsync(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: false,
                    cancellationToken: stoppingToken);
            }
        };

        await _channel.BasicConsumeAsync(
            queue: queueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        _logger.LogInformation(
            "Notification Worker is listening to queue {QueueName}.",
            queueName);

        try
        {
            await Task.Delay(
                Timeout.Infinite,
                stoppingToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation(
                "Notification Worker is stopping.");
        }
    }

    private string GetRequiredSetting(string key)
    {
        var value = _configuration[key];

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException( $"Configuration setting '{key}' is missing.");
        }

        return value;
    }

    public override async Task StopAsync(
        CancellationToken cancellationToken)
    {
        if (_channel is not null)
        {
            await _channel.CloseAsync(cancellationToken);
            await _channel.DisposeAsync();
        }

        if (_connection is not null)
        {
            await _connection.CloseAsync(cancellationToken);
            await _connection.DisposeAsync();
        }

        await base.StopAsync(cancellationToken);
    }
    private async Task<IConnection> ConnectWithRetryAsync(
    ConnectionFactory factory,
    CancellationToken cancellationToken)
    {
        var retrySeconds =
            _configuration.GetValue<int>(
                "RabbitMq:ConnectionRetrySeconds");

        if (retrySeconds <= 0)
        {
            retrySeconds = 5;
        }

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation(
                    "Connecting to RabbitMQ at {Host}:{Port}.",
                    factory.HostName,
                    factory.Port);

                var connection =
                    await factory.CreateConnectionAsync(
                        cancellationToken);

                _logger.LogInformation(
                    "Connected to RabbitMQ successfully.");

                return connection;
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "RabbitMQ is unavailable. Retrying in {Seconds} seconds.",
                    retrySeconds);

                await Task.Delay(
                    TimeSpan.FromSeconds(retrySeconds),
                    cancellationToken);
            }
        }

        throw new OperationCanceledException(cancellationToken);
    }
}