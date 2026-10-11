using System.Security.Claims;
using InterviewTracker.Api.Data;
using InterviewTracker.Api.DTOs;
using InterviewTracker.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewTracker.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class JobApplicationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public JobApplicationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobApplication>>> GetAll()
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var applications = await _context.JobApplications
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.AppliedDate)
            .ToListAsync();

        return Ok(applications);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobApplication>> GetById(int id)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _context.JobApplications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == id && x.UserId == userId);

        if (application is null)
        {
            return NotFound(new
            {
                message = $"Job application with ID {id} was not found."
            });
        }

        return Ok(application);
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> Create(
        CreateJobApplicationDto request)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = new JobApplication
        {
            CompanyName = request.CompanyName,
            Position = request.Position,
            Status = "Applied",
            AppliedDate = request.AppliedDate,
            JobUrl = request.JobUrl,
            Notes = request.Notes,
            UserId = userId
        };

        _context.JobApplications.Add(application);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = application.Id },
            application);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateJobApplicationDto request)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _context.JobApplications
            .FirstOrDefaultAsync(
                x => x.Id == id && x.UserId == userId);

        if (application is null)
        {
            return NotFound(new
            {
                message = $"Job application with ID {id} was not found."
            });
        }

        application.CompanyName = request.CompanyName;
        application.Position = request.Position;
        application.Status = request.Status;
        application.AppliedDate = request.AppliedDate;
        application.JobUrl = request.JobUrl;
        application.Notes = request.Notes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();

        if (userId is null)
        {
            return Unauthorized();
        }

        var application = await _context.JobApplications
            .FirstOrDefaultAsync(
                x => x.Id == id && x.UserId == userId);

        if (application is null)
        {
            return NotFound(new
            {
                message = $"Job application with ID {id} was not found."
            });
        }

        _context.JobApplications.Remove(application);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}