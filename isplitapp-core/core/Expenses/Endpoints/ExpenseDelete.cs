using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
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
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out _, "deviceId")
            .TryParseId(rawExpenseId, out var expenseId, "expenseId")
            .ThrowOnError();

        await db.Expenses.DeleteAsync(e => e.Id == expenseId);
        return TypedResults.NoContent();
    };
}