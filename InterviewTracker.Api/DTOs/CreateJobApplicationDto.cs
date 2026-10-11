using System.ComponentModel.DataAnnotations;
namespace InterviewTracker.Api.DTOs
{
    public class CreateJobApplicationDto
    {
        [Required]
        [MaxLength(150)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Position { get; set; } = string.Empty;

        [Required]
        public DateTime AppliedDate { get; set; }

        [MaxLength(500)]
        public string? JobUrl { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }
    }
}
