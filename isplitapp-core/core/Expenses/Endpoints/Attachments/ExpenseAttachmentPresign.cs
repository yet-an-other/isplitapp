using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.ISplitApp.Core.Infrastructure.Attachments;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints.Attachments;

public class ExpenseAttachmentPresign : IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}/attachments/presign";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("PresignExpenseAttachment");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "expenseId")] string? rawExpenseId,
        [FromBody] PresignAttachmentRequest request,
        RequestValidator validator,
        AuidFactory auidFactory,
        IAttachmentStorage storage,
        ExpenseDb db,
        ILogger<ExpenseAttachmentPresign> logger,
        CancellationToken ct) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .ThrowOnError();

        // Validate content type
        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(request.ContentType))
        {
            return Results.BadRequest(new { error = "invalid_content_type", allowed });
        }
        if (request.ExpectedSizeBytes is <= 0 or > 512000)
        {
            return Results.BadRequest(new { error = "invalid_size", max = 512000 });
        }

        // Ensure expense exists and get partyId for activity later
        var expense = await db.Expenses
            .Where(e => e.Id == expenseId)
            .Select(e => new { e.Id, e.PartyId, e.Title })
            .FirstOrDefaultAsync(ct);
        if (expense == null)
        {
            return Results.NotFound();
        }

        // Enforce <= 3 attachments
        var count = await db.ExpenseAttachments.CountAsync(a => a.ExpenseId == expenseId, ct);
        if (count >= 3)
        {
            return Results.Conflict(new { error = "max_attachments_reached", max = 3 });
        }

        var attachmentId = auidFactory.NewId();
        var s3Key = $"expenses/{expenseId}/{attachmentId}";

        // Create DB row with preliminary info. Size will be verified on finalize.
        await db.InsertAsync(new ExpenseAttachment
        {
            Id = attachmentId,
            ExpenseId = expenseId,
            FileName = request.FileName,
            ContentType = request.ContentType,
            SizeBytes = Math.Min(request.ExpectedSizeBytes, 512000),
            S3Key = s3Key,
            CreatedAt = DateTime.UtcNow
        }, token: ct);

        var expiry = TimeSpan.FromMinutes(5);
        var presigned = storage.CreatePresignedPost(s3Key, request.ContentType, 512000, expiry);

        logger.LogInformation("Presigned upload for expense {ExpenseId} attachment {AttachmentId}", expenseId, attachmentId);

        return Results.Ok(new PresignAttachmentResponse(
            attachmentId,
            presigned.Url,
            presigned.Fields,
            512000,
            presigned.ExpiresAt));
    };
}
