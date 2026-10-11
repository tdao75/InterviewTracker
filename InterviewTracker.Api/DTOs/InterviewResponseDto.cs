namespace InterviewTracker.Api.DTOs;

public class InterviewResponseDto
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string InterviewType { get; set; } = string.Empty;

    public string Stage { get; set; } = string.Empty;

    public DateTime ScheduledAt { get; set; }

    public string? Location { get; set; }

    public string? MeetingUrl { get; set; }

    public string? InterviewerName { get; set; }

    public string? Notes { get; set; }
}