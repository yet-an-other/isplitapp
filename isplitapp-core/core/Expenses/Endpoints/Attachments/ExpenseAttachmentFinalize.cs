using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.ISplitApp.Core.Infrastructure.Attachments;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints.Attachments;

public class ExpenseAttachmentFinalize : IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}/attachments/{attachmentId}/finalize";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("FinalizeExpenseAttachment");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "expenseId")] string? rawExpenseId,
        [FromRoute(Name = "attachmentId")] string? rawAttachmentId,
        RequestValidator validator,
        AuidFactory auidFactory,
        IAttachmentStorage storage,
        NotificationService notifications,
        ExpenseDb db,
        ILogger<ExpenseAttachmentFinalize> logger,
        CancellationToken ct) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .TryParseId(rawAttachmentId, out var attachmentId, "attachmentId")
            .ThrowOnError();

        // Ensure attachment exists and belongs to expense
        var record = await db.ExpenseAttachments
            .Where(a => a.Id == attachmentId && a.ExpenseId == expenseId)
            .Select(a => new { a.Id, a.ExpenseId, a.S3Key, a.FileName })
            .FirstOrDefaultAsync(ct);
        if (record == null)
        {
            return Results.NotFound();
        }

        var head = await storage.HeadAsync(record.S3Key, ct);
        if (!head.Exists)
        {
            return Results.BadRequest(new { error = "upload_not_found" });
        }
        if (head.Size is null or > 512000)
        {
            // too large: cleanup object and row
            await storage.DeleteAsync(record.S3Key, ct);
            await db.ExpenseAttachments.DeleteAsync(x => x.Id == attachmentId, token: ct);
            return Results.BadRequest(new { error = "file_too_large", max = 512000 });
        }

        // Update metadata
        await db.ExpenseAttachments
            .Where(a => a.Id == attachmentId)
            .Set(a => a.SizeBytes, (int)head.Size!.Value)
            .Set(a => a.ContentType, head.ContentType ?? "application/octet-stream")
            .UpdateAsync(ct);

        // Log activity and notify
        var partyId = await db.Expenses.Where(e => e.Id == expenseId).Select(e => e.PartyId).SingleAsync(ct);
        await CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseAttachmentAdded", $"Added receipt {record.FileName ?? attachmentId.ToString()}", db, auidFactory, expenseId);
        await notifications.PushExpenseUpdateMessage(deviceId, expenseId, "Receipt added");

        logger.LogInformation("Finalized attachment {AttachmentId} for expense {ExpenseId}", attachmentId, expenseId);
        return Results.NoContent();
    };
}
