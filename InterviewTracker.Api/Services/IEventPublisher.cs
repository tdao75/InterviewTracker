using InterviewTracker.Api.Contracts;

namespace InterviewTracker.Api.Services;

public interface IEventPublisher
{
    Task PublishInterviewScheduledAsync(
        InterviewScheduledEvent message,
        CancellationToken cancellationToken = default);
}