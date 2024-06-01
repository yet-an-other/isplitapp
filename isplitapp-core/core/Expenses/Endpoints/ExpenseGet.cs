using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns specific expense
/// </summary>
public class ExpenseGet: IEndpoint
{
    public string PathPattern => "/expenses/{expenseId}";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetExpense");
    public Delegate Endpoint =>
        new Func<string?, RequestValidator, ExpenseDb, Task<Results<Ok<ExpenseInfo>, NotFound>>>(
            async (
                [FromRoute(Name = "expenseId")] rawExpenseId, validator, db) =>
            {
                validator
                    .TryParseId(rawExpenseId, out var expenseId, "expenseId")
                    .ThrowOnError();

                var expense = await db.Expenses
                    .Where(e => e.Id == expenseId)
                    .Select(e => new ExpenseInfo
                    {
                        Id = e.Id,
                        FuAmount = e.MuAmount.ToFuAmount(),
                        Date = e.Date,
                        IsReimbursement = e.IsReimbursement,
                        Title = e.Title,
                        LenderId = e.LenderId,
                        SplitMode = e.SplitMode,
                        UpdateTimestamp = e.Timestamp,
                        LenderName = db.Participants
                            .Where(p => p.Id == e.LenderId)
                            .Select(p => p.Name).Single(),
                        Borrowers = db.Borrowers
                            .Where(b => b.ExpenseId == e.Id)
                            .Select(b => new BorrowerInfo
                            {
                                ParticipantId = b.ParticipantId,
                                FuAmount = b.MuAmount.ToFuAmount(),
                                Share = b.Share,
                                Percent = b.Percent,
                                ParticipantName = db.Participants
                                    .Where(p => p.Id == b.ParticipantId)
                                    .Select(p => p.Name)
                                    .Single()
                            }).ToArray()
                    }).FirstOrDefaultAsync();

                return expense != null
                    ? TypedResults.Ok(expense)
                    : TypedResults.NotFound();
            });
}