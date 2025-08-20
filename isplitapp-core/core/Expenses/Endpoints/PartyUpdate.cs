using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using LinqToDB.Tools;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Updates party
/// </summary>
public class PartyUpdate: IEndpoint
{
    public string PathPattern => "/parties/{partyId}";
    public string Method => "PUT";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("UpdateParty");

    public Delegate Endpoint => 
        new Func<string?, string?, PartyPayload, RequestValidator, AuidFactory, ExpenseDb, Task<Results<NotFound, NoContent>>>( 
            async (
            [FromHeader(Name = HeaderName.Device)] rawDeviceId,
            [FromRoute(Name = "partyId")] rawPartyId, party, validator, auidFactory, db) =>
        {
            validator
                .TryParseId(rawDeviceId, out var deviceId, "deviceId")
                .TryParseId(rawPartyId, out var partyId, "partyId")
                .Validate(party)
                .ThrowOnError();

            // Update party
            //
            await db.BeginTransactionAsync();
            var rowsAffected = await db.Parties
                .Where(p => p.Id == partyId)
                .Set(p => p.Name, party.Name)
                .Set(p => p.Currency, party.Currency)
                .Set(p => p.Description, party.Description)
                .Set(p => p.Updated, DateTime.UtcNow)
                .Set(p => p.Timestamp, auidFactory.Timestamp())
                .UpdateAsync();

            if (rowsAffected == 0)
                return TypedResults.NotFound();

            // Delete removed participants
            //
            await db.Participants.Where(p =>
                    p.PartyId == partyId &&
                    p.Id.NotIn(party.Participants
                        .Where(sp => sp.Id != Auid.Empty)
                        .Select(sp => sp.Id)) &&
                    p.Id.NotIn(db.Expenses.Where(e => e.PartyId == partyId).Select(e => e.LenderId)) &&
                    p.Id.NotIn(
                        db.Borrowers
                            .Where(b => b.ExpenseId.In(db.Expenses
                                .Where(e => e.PartyId == partyId)
                                .Select(e => e.Id)))
                            .Select(b => b.ParticipantId)))
                .DeleteAsync();

            // Update participants
            //
            await db.Participants.Merge()
                .Using(party.Participants.Select(p => new Participant
                {
                    Id = p.Id == Auid.Empty ? auidFactory.NewId() : p.Id,
                    PartyId = partyId,
                    Name = p.Name
                }))
                .On((t, s) => t.Id == s.Id)
                .UpdateWhenMatched()
                .InsertWhenNotMatched()
                .MergeAsync();

            await CommonQuery.EnsureDevicePartyVisibility(deviceId, partyId, db);
            await db.CommitTransactionAsync();

            return TypedResults.NoContent();
        });
}