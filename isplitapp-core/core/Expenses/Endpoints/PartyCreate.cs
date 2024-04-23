using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using LinqToDB;
using LinqToDB.Data;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Creates new party
/// </summary>
public class PartyCreate: IEndpoint
{
    public string PathPattern => "/parties";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("CreateParty");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromBody] PartyPayload party,
        [FromServices] RequestValidator validator,
        [FromServices] AuidFactory auidFactory,
        [FromServices] ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .Validate(party)
            .ThrowOnError();

        // Create Party
        //
        await db.BeginTransactionAsync();
        var partyId = auidFactory.NewId();
        await db.InsertAsync(new Party
        {
            Id = partyId,
            Name = party.Name,
            Currency = party.Currency,
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow,
            Timestamp = auidFactory.Timestamp()
        });

        // Create Participants
        //
        var participants = party.Participants.Select(
            p => new Participant { Id = auidFactory.NewId(), Name = p.Name, PartyId = partyId });
        await db.BulkCopyAsync(participants);

        await CommonQuery.EnsureDevicePartyVisibility(deviceId, partyId, db);
        await db.CommitTransactionAsync();
        
        return TypedResults.CreatedAtRoute(
            new CreatedPartyInfo(partyId),
            "GetParty",
            new RouteValueDictionary([new KeyValuePair<string, string>("partyId", partyId.ToString())]));
    };
}