using InterviewTracker.NotificationWorker.Contracts;

namespace InterviewTracker.NotificationWorker.Services;

public interface IEmailSender
{
    Task SendInterviewScheduledAsync(
        InterviewScheduledEvent message,
        CancellationToken cancellationToken = default);
}