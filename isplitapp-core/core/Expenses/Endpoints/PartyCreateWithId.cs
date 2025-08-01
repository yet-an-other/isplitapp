using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Creates new party with client-provided ID
/// </summary>
public class PartyCreateWithId: IEndpoint
{
    public string PathPattern => "/parties/{partyId}";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => 
        builder
            .ProducesValidationProblem()
            .WithName("CreatePartyWithId");

    public Delegate Endpoint =>
        new Func<string, string?, PartyPayload, RequestValidator, AuidFactory, ExpenseDb, Task<IResult>>(
            async (
                [FromRoute] partyId,
                [FromHeader(Name = HeaderName.Device)] rawDeviceId,
                [FromBody] party,
                validator,
                auidFactory,
                db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(partyId, out var parsedPartyId, "partyId")
            .Validate(party)
            .ThrowOnError();

        var createdPartyId = await CommonQuery.CreatePartyInternalAsync(deviceId, party, auidFactory, db, parsedPartyId);
        
        if (createdPartyId == null)
        {
            return TypedResults.Conflict(new { message = "Party with this ID already exists" });
        }
        
        return TypedResults.CreatedAtRoute(
            new CreatedPartyInfo(createdPartyId.Value),
            "GetParty",
            new RouteValueDictionary { ["partyId"] = createdPartyId.ToString() });
    });
}