using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Updates expenses
/// </summary>
public class ExpenseUpdate: IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}";
    public string Method => "PUT";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("UpdateExpense");

    public Delegate Endpoint =>
        new Func<string?, string?, ExpensePayload, RequestValidator, AuidFactory, NotificationService, ExpenseDb,
            Task<Results<NoContent, NotFound>>>(
            async (
                [FromHeader(Name = HeaderName.Device)] rawDeviceId,
                [FromRoute(Name = "expenseId")] rawExpenseId,
                expense, validator, auidFactory, notificationService, db) =>
            {
                validator
                    .TryParseId(rawDeviceId, out var deviceId, "deviceId")
                    .TryParseId(rawExpenseId, out var expenseId, "expenseId")
                    .Validate(expense)
                    .ThrowOnError();

                await db.BeginTransactionAsync();
                var rows = await db.Expenses.Where(e => e.Id == expenseId)
                    .Set(e => e.LenderId, expense.LenderId)
                    .Set(e => e.Title, expense.Title)
                    .Set(e => e.MuAmount, expense.FuAmount.ToMuAmount())
                    .Set(e => e.Date, expense.Date)
                    .Set(e => e.IsReimbursement, expense.IsReimbursement)
                    .Set(e => e.SplitMode, expense.SplitMode)
                    .Set(e => e.Timestamp, auidFactory.Timestamp())
                    .UpdateAsync();

                if (rows == 0)
                    return TypedResults.NotFound();

                await db.Borrowers.Where(b => b.ExpenseId == expenseId).DeleteAsync();
                await CommonQuery.InsertBorrowersAsync(expenseId, expense, db);
                await db.CommitTransactionAsync();

                await notificationService.PushExpenseUpdateMessage(deviceId, expenseId, "Expense updated");

                return TypedResults.NoContent();
            });
}