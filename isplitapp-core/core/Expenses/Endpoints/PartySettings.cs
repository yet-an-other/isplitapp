
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Updates party settings
/// </summary>
public class PartySettings: IEndpoint
{
    public string PathPattern => "/parties/{partyId}/settings";
    public string Method => "PUT";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("UpdatePartySettings");

    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        [FromRoute(Name = "partyId")] string? rawPartyId,
        DevicePartySettingsPayload settingsPayload,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .ThrowOnError();

        await db.DeviceParty
            .Where(dp => dp.PartyId == partyId && dp.DeviceId == deviceId)
            .Set(u => u.IsArchived, settingsPayload.IsArchived)
            .UpdateAsync();

        return TypedResults.NoContent();
    };
}