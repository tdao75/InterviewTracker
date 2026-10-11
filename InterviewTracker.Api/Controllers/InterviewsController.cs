using InterviewTracker.Api.Data;
using InterviewTracker.Api.DTOs;
using InterviewTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using InterviewTracker.Api.Contracts;
using InterviewTracker.Api.Services;
using System.Text.Json;

namespace InterviewTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class InterviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public InterviewsController(ApplicationDbContext context, IEventPublisher eventPublisher)
    {
        _context = context;
    }

    // GET: api/Interviews
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InterviewResponseDto>>> GetAll()
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }
        var interviews = await _context.Interviews
            .AsNoTracking().Where(x => x.JobApplication!.UserId == userId)
            .OrderBy(x => x.ScheduledAt)
            .Select(x => new InterviewResponseDto
            {
                Id = x.Id,
                JobApplicationId = x.JobApplicationId,
                CompanyName = x.JobApplication!.CompanyName,
                Position = x.JobApplication.Position,
                InterviewType = x.InterviewType,
                Stage = x.Stage,
                ScheduledAt = x.ScheduledAt,
                Location = x.Location,
                MeetingUrl = x.MeetingUrl,
                InterviewerName = x.InterviewerName,
                Notes = x.Notes
            })
            .ToListAsync();

        return Ok(interviews);
    }

    // GET: api/Interviews/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<InterviewResponseDto>> GetById(int id)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }
        var interview = await _context.Interviews
            .AsNoTracking()
            .Where(x => x.Id == id &&x.JobApplication!.UserId == userId)
            .Select(x => new InterviewResponseDto
            {
                Id = x.Id,
                JobApplicationId = x.JobApplicationId,
                CompanyName = x.JobApplication!.CompanyName,
                Position = x.JobApplication.Position,
                InterviewType = x.InterviewType,
                Stage = x.Stage,
                ScheduledAt = x.ScheduledAt,
                Location = x.Location,
                MeetingUrl = x.MeetingUrl,
                InterviewerName = x.InterviewerName,
                Notes = x.Notes
            })
            .FirstOrDefaultAsync();

        if (interview is null)
        {
            return NotFound(new
            {
                message = $"Interview with ID {id} was not found."
            });
        }

        return Ok(interview);
    }

    // GET: api/Interviews/upcoming
    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<InterviewResponseDto>>> GetUpcoming()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }
        var currentTime = DateTime.Now;
        var interviews = await _context.Interviews
            .AsNoTracking()
            .Where(x => x.ScheduledAt >= currentTime && x.JobApplication!.UserId == userId)
            .OrderBy(x => x.ScheduledAt)
            .Select(x => new InterviewResponseDto
            {
                Id = x.Id,
                JobApplicationId = x.JobApplicationId,
                CompanyName = x.JobApplication!.CompanyName,
                Position = x.JobApplication.Position,
                InterviewType = x.InterviewType,
                Stage = x.Stage,
                ScheduledAt = x.ScheduledAt,
                Location = x.Location,
                MeetingUrl = x.MeetingUrl,
                InterviewerName = x.InterviewerName,
                Notes = x.Notes
            })
            .ToListAsync();

        return Ok(interviews);
    }

    // POST: api/Interviews
    [HttpPost]
    public async Task<ActionResult<InterviewResponseDto>> Create(CreateInterviewDto request)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var jobApplication = await _context.JobApplications.Include(x=> x.User).FirstOrDefaultAsync(x => x.Id == request.JobApplicationId && x.UserId == userId);
       
        if (jobApplication is null)
        {
            return BadRequest(new
            {
                message = "The selected job application does not exist."
            });
        }

        var interview = new Interview
        {
            JobApplicationId = request.JobApplicationId,
            InterviewType = request.InterviewType,
            Stage = request.Stage,
            ScheduledAt = request.ScheduledAt,
            Location = request.Location,
            MeetingUrl = request.MeetingUrl,
            InterviewerName = request.InterviewerName,
            Notes = request.Notes
        };

        jobApplication.Status = request.Stage;

        await using var transaction = await _context.Database.BeginTransactionAsync(HttpContext.RequestAborted);

        try
        {
            _context.Interviews.Add(interview);

            // First save generates interview.Id.
            await _context.SaveChangesAsync(
                HttpContext.RequestAborted);

            var scheduledEvent = new InterviewScheduledEvent
            {
                EventId = Guid.NewGuid(),
                InterviewId = interview.Id,
                JobApplicationId = jobApplication.Id,
                UserId = userId,
                RecipientEmail =
                    jobApplication.User?.Email ?? string.Empty,
                CompanyName = jobApplication.CompanyName,
                Position = jobApplication.Position,
                Stage = interview.Stage,
                InterviewType = interview.InterviewType,
                ScheduledAt = interview.ScheduledAt
            };

            var outboxMessage = new OutboxMessage
            {
                Id = scheduledEvent.EventId,
                Type = nameof(InterviewScheduledEvent),
                Payload = JsonSerializer.Serialize(scheduledEvent),
                OccurredAtUtc = DateTime.UtcNow,
                ProcessedAtUtc = null,
                RetryCount = 0,
                LastError = null
            };

            _context.OutboxMessages.Add(outboxMessage);

            await _context.SaveChangesAsync(HttpContext.RequestAborted);

            await transaction.CommitAsync(HttpContext.RequestAborted);

            Console.WriteLine($"Interview {interview.Id} and outbox event " + $"{outboxMessage.Id} saved successfully.");
        }
        catch
        {
            await transaction.RollbackAsync(
                HttpContext.RequestAborted);

            throw;
        }
        Console.WriteLine("RabbitMQ publisher completed.");

        var response = new InterviewResponseDto
        {
            Id = interview.Id,
            JobApplicationId = interview.JobApplicationId,
            CompanyName = jobApplication.CompanyName,
            Position = jobApplication.Position,
            InterviewType = interview.InterviewType,
            Stage = interview.Stage,
            ScheduledAt = interview.ScheduledAt,
            Location = interview.Location,
            MeetingUrl = interview.MeetingUrl,
            InterviewerName = interview.InterviewerName,
            Notes = interview.Notes
        };

        return CreatedAtAction(nameof(GetById),new { id = interview.Id },response);
    }

    // PUT: api/Interviews/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateInterviewDto request)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }
        var interview = await _context.Interviews.Include(x => x.JobApplication).FirstOrDefaultAsync(x =>x.Id == id && x.JobApplication!.UserId == userId);

        if (interview is null)
        {
            return NotFound(new
            {
                message = $"Interview with ID {id} was not found."
            });
        }


        interview.InterviewType = request.InterviewType;
        interview.Stage = request.Stage;
        interview.ScheduledAt = request.ScheduledAt;
        interview.Location = request.Location;
        interview.MeetingUrl = request.MeetingUrl;
        interview.InterviewerName = request.InterviewerName;
        interview.Notes = request.Notes;

        interview.JobApplication!.Status = request.Stage;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Interviews/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }
        var interview = await _context.Interviews.FirstOrDefaultAsync(x => x.Id == id && x.JobApplication!.UserId == userId);

        if (interview is null)
        {
            return NotFound(new
            {
                message = $"Interview with ID {id} was not found."
            });
        }

        _context.Interviews.Remove(interview);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}