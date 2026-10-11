namespace InterviewTracker.Api.DTOs;

public class DashboardStatisticsDto
{
    public int TotalApplications { get; set; }

    public int TotalInterviews { get; set; }

    public int UpcomingInterviews { get; set; }

    public int Offers { get; set; }

    public int Rejections { get; set; }
}