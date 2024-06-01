using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Creates new expense
/// </summary>
public class ExpenseCreate: IEndpoint
{
    public string PathPattern => "/parties/{partyId}/expenses";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("CreateExpense");
    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "partyId")] string? rawPartyId,
        ExpensePayload expense,
        RequestValidator validator,
        AuidFactory auidFactory,
        NotificationService notificationService,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .Validate(expense)
            .ThrowOnError();

        await db.BeginTransactionAsync();
        var expenseId = auidFactory.NewId();
        await db.InsertAsync(new Expense
        {
            Id = expenseId,
            PartyId = partyId,
            Title = expense.Title,
            MuAmount = expense.FuAmount.ToMuAmount(),
            Date = expense.Date,
            IsReimbursement = expense.IsReimbursement,
            LenderId = expense.LenderId,
            SplitMode = expense.SplitMode,
            Timestamp = auidFactory.Timestamp()
        });

        await CommonQuery.InsertBorrowersAsync(expenseId, expense, db);
        await db.CommitTransactionAsync();

        await notificationService.PushExpenseUpdateMessage(deviceId, expenseId, "New expense");

        return TypedResults.CreatedAtRoute(
            "GetExpense",
            new RouteValueDictionary([new KeyValuePair<string, string>("expenseId", expenseId.ToString())]));
    };
}