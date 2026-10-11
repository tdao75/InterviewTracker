using System.Net;
using InterviewTracker.NotificationWorker.Contracts;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace InterviewTracker.NotificationWorker.Services;

public sealed class MailpitEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailpitEmailSender> _logger;

    public MailpitEmailSender(
        IConfiguration configuration,
        ILogger<MailpitEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendInterviewScheduledAsync(
        InterviewScheduledEvent message,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message.RecipientEmail))
        {
            throw new InvalidOperationException(
                "The notification recipient email is missing.");
        }

        var fromName = GetRequiredSetting("Smtp:FromName");
        var fromEmail = GetRequiredSetting("Smtp:FromEmail");
        var smtpHost = GetRequiredSetting("Smtp:Host");
        var smtpPort = _configuration.GetValue<int>("Smtp:Port");

        var company = WebUtility.HtmlEncode(message.CompanyName);
        var position = WebUtility.HtmlEncode(message.Position);
        var stage = WebUtility.HtmlEncode(message.Stage);
        var interviewType =
            WebUtility.HtmlEncode(message.InterviewType);

        var email = new MimeMessage();

        email.From.Add(
            new MailboxAddress(fromName, fromEmail));

        email.To.Add(
            MailboxAddress.Parse(message.RecipientEmail));

        email.Subject =
            $"Interview scheduled: {message.CompanyName}";

        email.Body = new BodyBuilder
        {
            HtmlBody = $"""
                <h2>Interview scheduled</h2>

                <p>Your interview details are:</p>

                <table>
                    <tr>
                        <td><strong>Company</strong></td>
                        <td>{company}</td>
                    </tr>
                    <tr>
                        <td><strong>Position</strong></td>
                        <td>{position}</td>
                    </tr>
                    <tr>
                        <td><strong>Stage</strong></td>
                        <td>{stage}</td>
                    </tr>
                    <tr>
                        <td><strong>Type</strong></td>
                        <td>{interviewType}</td>
                    </tr>
                    <tr>
                        <td><strong>Date</strong></td>
                        <td>{message.ScheduledAt:F}</td>
                    </tr>
                </table>

                <p>Good luck with your interview!</p>
                """
        }.ToMessageBody();

        using var smtpClient = new SmtpClient();

        await smtpClient.ConnectAsync(
            smtpHost,
            smtpPort,
            SecureSocketOptions.None,
            cancellationToken);

        await smtpClient.SendAsync(
            email,
            cancellationToken);

        await smtpClient.DisconnectAsync(
            quit: true,
            cancellationToken);

        _logger.LogInformation(
            "Local email sent to {RecipientEmail} " +
            "for interview {InterviewId}.",
            message.RecipientEmail,
            message.InterviewId);
    }

    private string GetRequiredSetting(string key)
    {
        var value = _configuration[key];

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Configuration setting '{key}' is missing.");
        }

        return value;
    }
}