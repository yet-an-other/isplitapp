
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Creates new party
/// </summary>
public class PartyCreate: IEndpoint
{
    public string PathPattern => "/parties";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => 
        builder
            .ProducesValidationProblem()
            .WithName("CreateParty");

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

        var partyId = await CommonQuery.CreatePartyInternalAsync(deviceId, party, auidFactory, db);
        
        // Log party creation activity
        await CommonQuery.LogActivityAsync(
            partyId!.Value, 
            deviceId, 
            "PartyCreated", 
            $"Created party: {party.Name}", 
            db, 
            auidFactory, 
            partyId);
        
        return TypedResults.CreatedAtRoute(
            new CreatedPartyInfo(partyId.Value),
            "GetParty",
            new RouteValueDictionary { ["partyId"] = partyId.ToString() });
    };
}