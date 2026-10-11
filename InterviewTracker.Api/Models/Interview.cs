using System.Text.Json.Serialization;

namespace InterviewTracker.Api.Models;

public class Interview
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public string InterviewType { get; set; } = string.Empty;

    public string Stage { get; set; } = string.Empty;

    public DateTime ScheduledAt { get; set; }

    public string? Location { get; set; }

    public string? MeetingUrl { get; set; }

    public string? InterviewerName { get; set; }

    public string? Notes { get; set; }

    [JsonIgnore]
    public JobApplication? JobApplication { get; set; }
}