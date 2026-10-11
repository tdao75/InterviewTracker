using System.Text.Json;
using InterviewTracker.Api.Contracts;
using InterviewTracker.Api.Data;
using InterviewTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewTracker.Api.Services;

public class OutboxProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventPublisher _eventPublisher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OutboxProcessor> _logger;

    public OutboxProcessor(
        IServiceScopeFactory scopeFactory,
        IEventPublisher eventPublisher,
        IConfiguration configuration,
        ILogger<OutboxProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _eventPublisher = eventPublisher;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        var pollingSeconds =
            _configuration.GetValue<int>(
                "Outbox:PollingSeconds");

        var batchSize =
            _configuration.GetValue<int>(
                "Outbox:BatchSize");

        if (pollingSeconds <= 0)
        {
            pollingSeconds = 5;
        }

        if (batchSize <= 0)
        {
            batchSize = 10;
        }

        _logger.LogInformation(
            "Outbox processor started. Polling every {Seconds} seconds.",
            pollingSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingMessagesAsync(
                    batchSize,
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error while processing outbox messages.");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(pollingSeconds),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("Outbox processor stopped.");
    }

    private async Task ProcessPendingMessagesAsync(
        int batchSize,
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var context =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var messages = await context.OutboxMessages
            .Where(x => x.ProcessedAtUtc == null)
            .OrderBy(x => x.OccurredAtUtc)
            .Take(batchSize)
            .ToListAsync(cancellationToken);

        if (messages.Count == 0)
        {
            return;
        }

        _logger.LogInformation(
            "Found {Count} pending outbox message(s).",
            messages.Count);

        foreach (var outboxMessage in messages)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                return;
            }

            await ProcessMessageAsync(
                context,
                outboxMessage,
                cancellationToken);
        }
    }

    private async Task ProcessMessageAsync(
        ApplicationDbContext context,
        OutboxMessage outboxMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            if (outboxMessage.Type !=
                nameof(InterviewScheduledEvent))
            {
                throw new InvalidOperationException(
                    $"Unsupported outbox message type: " +
                    $"{outboxMessage.Type}");
            }

            var scheduledEvent =
                JsonSerializer.Deserialize<InterviewScheduledEvent>(
                    outboxMessage.Payload);

            if (scheduledEvent is null)
            {
                throw new InvalidOperationException(
                    "Outbox payload could not be deserialized.");
            }

            await _eventPublisher
                .PublishInterviewScheduledAsync(
                    scheduledEvent,
                    cancellationToken);

            outboxMessage.ProcessedAtUtc = DateTime.UtcNow;
            outboxMessage.LastError = null;

            await context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Outbox message {OutboxMessageId} published.",
                outboxMessage.Id);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            outboxMessage.RetryCount++;
            outboxMessage.LastError =
                TruncateError(exception.ToString(), 2000);

            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception saveException)
            {
                _logger.LogError(
                    saveException,
                    "Could not record failure for outbox message {Id}.",
                    outboxMessage.Id);
            }

            _logger.LogWarning(
                exception,
                "Failed to publish outbox message {Id}. " +
                "Retry count: {RetryCount}.",
                outboxMessage.Id,
                outboxMessage.RetryCount);
        }
    }

    private static string TruncateError(
        string error,
        int maximumLength)
    {
        return error.Length <= maximumLength
            ? error
            : error[..maximumLength];
    }
}