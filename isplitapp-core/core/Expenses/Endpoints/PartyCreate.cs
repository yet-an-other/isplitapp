
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
        
        return TypedResults.CreatedAtRoute(
            new CreatedPartyInfo(partyId!.Value),
            "GetParty",
            new RouteValueDictionary { ["partyId"] = partyId.ToString() });
    };
}