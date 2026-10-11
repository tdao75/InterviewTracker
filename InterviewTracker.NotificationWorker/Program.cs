using InterviewTracker.NotificationWorker;
using InterviewTracker.NotificationWorker.Services;
using InterviewTracker.NotificationWorker.Data;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddSingleton<IEmailSender, MailpitEmailSender>();
builder.Services.AddHostedService<Worker>();
builder.Services.AddDbContext<NotificationDbContext>(
    options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString(
                "DefaultConnection")));


var host = builder.Build();

await using (var scope =
    host.Services.CreateAsyncScope())
{
    var context = scope.ServiceProvider
        .GetRequiredService<NotificationDbContext>();

    await context.Database.MigrateAsync();
}

await host.RunAsync();
