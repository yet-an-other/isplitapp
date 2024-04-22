using IB.ISplitApp.Core.Devices.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Devices.Endpoints;

/// <summary>
/// Removing device form the list of getting notifications
/// </summary>
public class RemoveSubscription: IEndpoint
{
    public string PathPattern => "/users/subscribe";
    public string Method => "DELETE";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("UnSubscribe");
    public Delegate Endpoint => async (
        [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
        RequestValidator validator,
        DeviceDb db) =>
    {
        validator
            .TryParseId(rawDeviceId, out var deviceId, "deviceId")
            .ThrowOnError();

        await db.Subscriptions.DeleteAsync(s => s.DeviceId == deviceId);
        return TypedResults.NoContent();
    };
}