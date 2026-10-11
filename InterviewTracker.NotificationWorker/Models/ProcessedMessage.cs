namespace InterviewTracker.NotificationWorker.Models;

public class ProcessedMessage
{
    public Guid EventId { get; set; }

    public int InterviewId { get; set; }

    public DateTime ProcessedAtUtc { get; set; }
}