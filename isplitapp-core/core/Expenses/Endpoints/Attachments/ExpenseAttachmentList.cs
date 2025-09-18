using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.ISplitApp.Core.Infrastructure.Attachments;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints.Attachments;

public class ExpenseAttachmentList : IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}/attachments";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("ListExpenseAttachments");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "expenseId")] string? rawExpenseId,
        RequestValidator validator,
        IAttachmentStorage storage,
        ExpenseDb db,
        CancellationToken ct) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .ThrowOnError();

        // Ensure expense exists
        var exists = await db.Expenses.AnyAsync(e => e.Id == expenseId, ct);
        if (!exists) return Results.NotFound();

        var items = await db.ExpenseAttachments
            .Where(a => a.ExpenseId == expenseId)
            .Select(a => new { a.Id, a.FileName, a.ContentType, a.SizeBytes, a.S3Key })
            .ToArrayAsync(ct);

        var ttl = TimeSpan.FromMinutes(10);
        var response = items
            .Select(a => {
                var presigned = storage.CreatePresignedGet(a.S3Key, ttl);
                return new AttachmentInfo(a.Id, a.FileName, a.ContentType, a.SizeBytes, presigned.Url, presigned.ExpiresAt);
            })
            .ToArray();

        return Results.Ok(response);
    };
}
