using InterviewTracker.NotificationWorker.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace InterviewTracker.NotificationWorker.Data;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(
        DbContextOptions<NotificationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ProcessedMessage> ProcessedMessages => Set<ProcessedMessage>();

    protected override void OnModelCreating( ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProcessedMessage>(entity =>
        {
            entity.HasKey(x => x.EventId);

            entity.HasIndex(x => x.ProcessedAtUtc);
        });
    }
}