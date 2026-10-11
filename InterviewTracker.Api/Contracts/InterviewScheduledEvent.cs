namespace InterviewTracker.Api.Contracts;

public record InterviewScheduledEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public int InterviewId { get; init; }

    public int JobApplicationId { get; init; }

    public string UserId { get; init; } = string.Empty;

    public string RecipientEmail { get; init; } = string.Empty;

    public string CompanyName { get; init; } = string.Empty;

    public string Position { get; init; } = string.Empty;

    public string Stage { get; init; } = string.Empty;

    public string InterviewType { get; init; } = string.Empty;

    public DateTime ScheduledAt { get; init; }

    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}