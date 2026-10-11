using System.Security.Claims;
using InterviewTracker.Api.Data;
using InterviewTracker.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<DashboardStatisticsDto>>
        GetStatistics()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return Unauthorized();
        }

        var currentTime = DateTime.Now;

        var statistics = new DashboardStatisticsDto
        {
            TotalApplications =
                await _context.JobApplications.CountAsync(
                    x => x.UserId == userId),

            TotalInterviews =
                await _context.Interviews.CountAsync(
                    x => x.JobApplication!.UserId == userId),

            UpcomingInterviews =
                await _context.Interviews.CountAsync(
                    x =>
                        x.JobApplication!.UserId == userId &&
                        x.ScheduledAt >= currentTime),

            Offers =
                await _context.JobApplications.CountAsync(
                    x =>
                        x.UserId == userId &&
                        x.Status == "Offer"),

            Rejections =
                await _context.JobApplications.CountAsync(
                    x =>
                        x.UserId == userId &&
                        x.Status == "Rejected")
        };

        return Ok(statistics);
    }
}