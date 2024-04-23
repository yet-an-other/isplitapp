using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns expenses in specified party
/// </summary>
public class ExpenseGetList: IEndpoint
{
    public string PathPattern => "/parties/{partyId}/expenses";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetExpenseList");

    public Delegate Endpoint => async (
        [FromRoute(Name = "partyId")] string? rawPartyId,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .ThrowOnError();

        var expenses = await db.Expenses
            .Where(e => e.PartyId == partyId)
            .OrderByDescending(e => e.Date)
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
                    .Select(p => p.Name)
                    .Single(),
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
            }).ToArrayAsync();

        return TypedResults.Ok(expenses);
    };
}