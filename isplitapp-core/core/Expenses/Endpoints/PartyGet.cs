using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns specific party
/// </summary>
public class PartyGet : IEndpoint
{
    public string PathPattern => "/parties/{partyId}";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetParty");

    public Delegate Endpoint =>
        new Func<string?, string?, RequestValidator, ExpenseDb, Task<Results<Ok<PartyInfo>, NotFound>>>(
            async (
                [FromHeader(Name = HeaderName.Device)] rawDeviceId,
                [FromRoute(Name = "partyId")] rawPartyId, 
                validator, db) =>
            {
                validator
                    .TryParseId(rawDeviceId, out var deviceId, "deviceId")
                    .TryParseId(rawPartyId, out var partyId, "partyId")
                    .ThrowOnError();

                var partyQuery = from p in db.Parties
                    where p.Id == partyId
                    select new PartyInfo
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Currency = p.Currency,
                        Created = p.Created,
                        Updated = p.Updated,
                        UpdateTimestamp = p.Timestamp,
                        Participants = (
                            from pp in db.Participants
                            where pp.PartyId == p.Id
                            select new ParticipantInfo
                            {
                                Id = pp.Id,
                                Name = pp.Name,
                                CanDelete = db.Borrowers.Count(b => b.ParticipantId == pp.Id) == 0 &&
                                            db.Expenses.Count(e => e.LenderId == pp.Id) == 0
                            }).ToArray(),
                        TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                        TotalTransactions = (from e in db.Expenses where e.PartyId == p.Id select e.Id).Count(),
                        FuTotalExpenses = (from e in db.Expenses
                            where e.PartyId == p.Id && !e.IsReimbursement
                            select e.MuAmount).Sum().ToFuAmount(),
                        LastExpenseTimestamp = (from e in db.Expenses where e.PartyId == p.Id select e.Timestamp).Max(),
                        IsArchived = db.DeviceParty
                            .Where(d => d.PartyId == partyId && d.DeviceId == deviceId)
                            .Select(u => u.IsArchived)
                            .FirstOrDefault(),
                        FuOutstandingBalance = db.Participants
                            .Where(pp => pp.PartyId == partyId)
                            .Select(pp =>
                                db.Expenses
                                    .Where(e => e.LenderId == pp.Id)
                                    .Select(e => e.MuAmount)
                                    .Sum()
                                - db.Borrowers
                                    .Where(b => b.ParticipantId == pp.Id)
                                    .Select(b => b.MuAmount)
                                    .Sum()
                            )
                            .Where(a => a > 0)
                            .Sum()
                            .ToFuAmount()
                    };

                var party = await partyQuery.FirstOrDefaultAsync();
                if (party == null)
                    return TypedResults.NotFound();

                await CommonQuery.EnsureDevicePartyVisibility(deviceId, partyId, db);
                return TypedResults.Ok(party);
            });
}