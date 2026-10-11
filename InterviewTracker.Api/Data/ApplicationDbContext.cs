using InterviewTracker.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InterviewTracker.Api.Data;

public class ApplicationDbContext: IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options): base(options)
    {
    }

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();

    public DbSet<Interview> Interviews =>Set<Interview>();
    public DbSet<OutboxMessage> OutboxMessages =>Set<OutboxMessage>();

    protected override void OnModelCreating(
    ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<OutboxMessage>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Payload)
                .IsRequired();

            entity.Property(x => x.LastError)
                .HasMaxLength(2000);

            entity.HasIndex(x => new
            {
                x.ProcessedAtUtc,
                x.OccurredAtUtc
            });
        });
    }
}