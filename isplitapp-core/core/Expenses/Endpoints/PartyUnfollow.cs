using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Remove link between device & party, so party will not be available on device
/// </summary>
public class PartyUnfollow: IEndpoint
{
    public string PathPattern => "/parties/{partyId}";
    public string Method => "DELETE";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("UnfollowParty");
    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "partyId")] string? rawPartyId,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .ThrowOnError();

        await db.DeviceParty.DeleteAsync(dp => dp.PartyId == partyId && dp.DeviceId == deviceId);
        return TypedResults.NoContent();
    };
}