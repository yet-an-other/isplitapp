using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

public class ExpenseDelete: IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}";
    public string Method => "DELETE";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("DeleteExpense");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "expenseId")] string? rawExpenseId,
        RequestValidator validator,
        AuidFactory auidFactory,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .ThrowOnError();

        // Get expense info for activity logging before deletion
        var expenseInfo = await db.Expenses
            .Where(e => e.Id == expenseId)
            .Select(e => new { e.Title, e.PartyId })
            .SingleOrDefaultAsync();
            
        if (expenseInfo != null)
        {
            // Log expense deletion activity
            await CommonQuery.LogActivityAsync(
                expenseInfo.PartyId, 
                deviceId, 
                "ExpenseDeleted", 
                $"Deleted expense: {expenseInfo.Title}", 
                db, 
                auidFactory, 
                expenseId);
        }

        await db.Expenses.DeleteAsync(e => e.Id == expenseId);

        return TypedResults.NoContent();
    };
}