using System.ComponentModel.DataAnnotations;

namespace InterviewTracker.Api.DTOs;

public class CreateInterviewDto
{
    [Range(1, int.MaxValue)]
    public int JobApplicationId { get; set; }

    [Required]
    [MaxLength(50)]
    public string InterviewType { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Stage { get; set; } = string.Empty;

    [Required]
    public DateTime ScheduledAt { get; set; }

    [MaxLength(250)]
    public string? Location { get; set; }

    [MaxLength(500)]
    public string? MeetingUrl { get; set; }

    [MaxLength(150)]
    public string? InterviewerName { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}