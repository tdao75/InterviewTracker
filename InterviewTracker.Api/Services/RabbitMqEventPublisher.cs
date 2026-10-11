using System.Text;
using System.Text.Json;
using InterviewTracker.Api.Contracts;
using RabbitMQ.Client;

namespace InterviewTracker.Api.Services;

public sealed class RabbitMqEventPublisher :
    IEventPublisher,
    IAsyncDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RabbitMqEventPublisher> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqEventPublisher(IConfiguration configuration,ILogger<RabbitMqEventPublisher> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task PublishInterviewScheduledAsync(InterviewScheduledEvent message,CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);

        try
        {
            await EnsureConnectedAsync(cancellationToken);

            var channel = _channel;

            if (channel is null || !channel.IsOpen)
            {
                throw new InvalidOperationException("RabbitMQ channel could not be initialized.");
            }

            var exchangeName = GetRequiredSetting("RabbitMq:ExchangeName");

            var routingKey = GetRequiredSetting("RabbitMq:RoutingKey");

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = new BasicProperties
            {
                ContentType = "application/json",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId = message.EventId.ToString(),
                Type = nameof(InterviewScheduledEvent)
            };

            await channel.BasicPublishAsync(
                exchange: exchangeName,
                routingKey: routingKey,
                mandatory: true,
                basicProperties: properties,
                body: body,
                cancellationToken: cancellationToken);

            Console.WriteLine($"Published InterviewScheduled event " + $"{message.EventId} for interview " + $"{message.InterviewId}.");
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task EnsureConnectedAsync(
    CancellationToken cancellationToken)
    {
        if (_connection?.IsOpen == true && _channel?.IsOpen == true)
        {
            return;
        }

        var factory = new ConnectionFactory
        {
            HostName = GetRequiredSetting("RabbitMq:HostName"),
            Port = _configuration.GetValue<int>("RabbitMq:Port"),
            UserName = GetRequiredSetting("RabbitMq:UserName"),
            Password = GetRequiredSetting("RabbitMq:Password"),
            AutomaticRecoveryEnabled = true,
            ClientProvidedName = "InterviewTracker.Api"
        };

        Console.WriteLine($"Connecting to RabbitMQ at {factory.HostName}:{factory.Port}.");

        // Assign the CLASS FIELDS. Do not put "var" before these names.
        _connection = await factory.CreateConnectionAsync(cancellationToken);

        Console.WriteLine($"RabbitMQ connection open: {_connection.IsOpen}");

        _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);

        Console.WriteLine($"RabbitMQ channel open: {_channel.IsOpen}");

        var exchangeName = GetRequiredSetting("RabbitMq:ExchangeName");

        var queueName = GetRequiredSetting("RabbitMq:QueueName");

        var routingKey = GetRequiredSetting("RabbitMq:RoutingKey");

        var deadLetterExchangeName = GetRequiredSetting("RabbitMq:DeadLetterExchangeName");

        var deadLetterQueueName = GetRequiredSetting("RabbitMq:DeadLetterQueueName");

        var deadLetterRoutingKey = GetRequiredSetting( "RabbitMq:DeadLetterRoutingKey");


        await _channel.ExchangeDeclareAsync(
            exchange: exchangeName,
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            arguments: null,
            cancellationToken: cancellationToken);

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
            cancellationToken: cancellationToken);

        await _channel.QueueBindAsync(
            queue: queueName,
            exchange: exchangeName,
            routingKey: routingKey,
            arguments: null,
            cancellationToken: cancellationToken);

        Console.WriteLine(
            $"RabbitMQ queue '{queueName}' is ready.");
    }

    private string GetRequiredSetting(string key)
    {
        return _configuration[key] ?? throw new InvalidOperationException($"Configuration setting '{key}' is missing.");
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.CloseAsync();
            await _channel.DisposeAsync();
        }

        if (_connection is not null)
        {
            await _connection.CloseAsync();
            await _connection.DisposeAsync();
        }

        _lock.Dispose();
    }
}