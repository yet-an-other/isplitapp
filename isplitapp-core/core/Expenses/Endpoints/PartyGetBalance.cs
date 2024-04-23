using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns who owes whom and calculates reimbursement suggestions
/// </summary>
public class PartyGetBalance: IEndpoint
{
    public string PathPattern => "/parties/{partyId}/balance";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetBalance");

    public Delegate Endpoint => async (
        [FromRoute(Name = "partyId")] string? rawPartyId,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .ThrowOnError();

        var rawEntries = await db.Participants
            .Where(pp => pp.PartyId == partyId)
            .Select(pp => new RawBalanceEntry
            {
                ParticipantId = pp.Id,
                ParticipantName = pp.Name,
                MuAmount =
                    db.Expenses
                        .Where(e => e.LenderId == pp.Id)
                        .Select(e => e.MuAmount)
                        .Sum()
                    - db.Borrowers
                        .Where(b => b.ParticipantId == pp.Id)
                        .Select(b => b.MuAmount)
                        .Sum()
            }).ToArrayAsync();

        var balances = rawEntries.Select(b => new BalanceEntry
        {
            ParticipantId = b.ParticipantId,
            ParticipantName = b.ParticipantName,
            FuAmount = b.MuAmount.ToFuAmount()
        }).ToArray();
        var reimbursements = CalculateReimbursements(rawEntries);

        return TypedResults.Ok(new BalanceInfo { Balances = balances, Reimbursements = reimbursements });
    };
    
    private static ReimburseEntry[] CalculateReimbursements(IEnumerable<RawBalanceEntry> rawBalances)
    {
        var sortedBalances = rawBalances.OrderByDescending(e => e.MuAmount).ToList();
        var reimbursements = new List<ReimburseEntry>();
        
        while (sortedBalances.Count > 0)
        {
            var first = sortedBalances[0];
            var last = sortedBalances[^1];
            var reminder = first.MuAmount + last.MuAmount;
            var entry = new ReimburseEntry
            {
                FromId = last.ParticipantId,
                FromName = last.ParticipantName,
                ToId = first.ParticipantId,
                ToName = first.ParticipantName
            };    
            
            if (reminder > 0)
            {
                entry.FuAmount = -last.MuAmount.ToFuAmount();
                first.MuAmount = reminder;
                sortedBalances.RemoveAt(sortedBalances.Count - 1);
            }
            else
            {
                entry.FuAmount = first.MuAmount.ToFuAmount();
                last.MuAmount = reminder;
                sortedBalances.RemoveAt(0);
            }
            if (entry.FuAmount != 0)
                reimbursements.Add(entry);
        }
        return reimbursements.ToArray();
    }
    
    private class RawBalanceEntry
    {
        public Auid ParticipantId { get; init; } = Auid.Empty;
        public string ParticipantName { get; init; } = default!;
        public long MuAmount { get; set; }
    }
}