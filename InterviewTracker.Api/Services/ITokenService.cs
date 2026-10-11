using InterviewTracker.Api.DTOs;
using InterviewTracker.Api.Models;

namespace InterviewTracker.Api.Services;

public interface ITokenService
{
    Task<AuthResponseDto> CreateTokenAsync(ApplicationUser user);
}