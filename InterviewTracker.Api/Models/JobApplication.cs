using System.Text.Json.Serialization;

namespace InterviewTracker.Api.Models;

public class JobApplication
{
    public int Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string Status { get; set; } = "Applied";

    public DateTime AppliedDate { get; set; }

    public string? JobUrl { get; set; }

    public string? Notes { get; set; }

    public string? UserId { get; set; }

    [JsonIgnore]
    public ApplicationUser? User { get; set; }

    public List<Interview> Interviews { get; set; } = [];
}