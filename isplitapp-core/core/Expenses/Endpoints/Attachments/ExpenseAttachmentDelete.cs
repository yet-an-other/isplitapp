using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.ISplitApp.Core.Infrastructure.Attachments;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints.Attachments;

public class ExpenseAttachmentDelete : IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}/attachments/{attachmentId}";
    public string Method => "DELETE";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("DeleteExpenseAttachment");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "expenseId")] string? rawExpenseId,
        [FromRoute(Name = "attachmentId")] string? rawAttachmentId,
        RequestValidator validator,
        AuidFactory auidFactory,
        IAttachmentStorage storage,
        NotificationService notifications,
        ExpenseDb db,
        ILogger<ExpenseAttachmentDelete> logger,
        CancellationToken ct) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .TryParseId(rawAttachmentId, out var attachmentId, "attachmentId")
            .ThrowOnError();

        var record = await db.ExpenseAttachments
            .Where(a => a.Id == attachmentId && a.ExpenseId == expenseId)
            .Select(a => new { a.S3Key, a.FileName })
            .FirstOrDefaultAsync(ct);

        if (record == null)
        {
            return Results.NotFound();
        }

        await db.BeginTransactionAsync(ct);
        try
        {
            await storage.DeleteAsync(record.S3Key, ct);
            await db.ExpenseAttachments.DeleteAsync(a => a.Id == attachmentId, token: ct);

            var partyId = await db.Expenses.Where(e => e.Id == expenseId).Select(e => e.PartyId).SingleAsync(ct);
            await CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseAttachmentRemoved", $"Removed receipt {record.FileName ?? attachmentId.ToString()}", db, auidFactory, expenseId);
            await db.CommitTransactionAsync(ct);
        }
        catch
        {
            await db.RollbackTransactionAsync(ct);
            throw;
        }

        await notifications.PushExpenseUpdateMessage(deviceId, expenseId, "Receipt removed");
        logger.LogInformation("Deleted attachment {AttachmentId} for expense {ExpenseId}", attachmentId, expenseId);
        return Results.NoContent();
    };
}
