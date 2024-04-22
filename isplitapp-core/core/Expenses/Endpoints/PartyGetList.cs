using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns parties available for device
/// </summary>
public class PartyGetList: IEndpoint
{
    public string PathPattern => "/parties";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetPartyList");
    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromQuery] string? filterArchived,
        [FromQuery] string? orderBy,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .ThrowOnError();

        var parties = from p in db.Parties
            join dp in db.DeviceParty on p.Id equals dp.PartyId
            where dp.DeviceId == deviceId
                  && (filterArchived == ArchivedFilterValues.Actual
                      ? !dp.IsArchived
                      : filterArchived != ArchivedFilterValues.Archived || dp.IsArchived)
            orderby orderBy == "lastUpdate" ? p.Updated : p.Created descending
            select new PartyInfo
            {
                Id = p.Id,
                Name = p.Name,
                Currency = p.Currency,
                Created = p.Created,
                Updated = p.Updated,
                UpdateTimestamp = p.Timestamp,
                TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                TotalTransactions = (from e in db.Expenses where e.PartyId == p.Id select e.Id).Count(),
                FuTotalExpenses = (from e in db.Expenses
                    where e.PartyId == p.Id && !e.IsReimbursement
                    select e.MuAmount).Sum().ToFuAmount(),
                IsArchived = dp.IsArchived,
                FuOutstandingBalance = db.Participants
                    .Where(pp => pp.PartyId == p.Id)
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

        return TypedResults.Ok(await parties.ToArrayAsync());
    };
}