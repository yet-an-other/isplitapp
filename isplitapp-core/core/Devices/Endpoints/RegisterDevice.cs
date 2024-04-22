using IB.ISplitApp.Core.Devices.Contract;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Devices.Endpoints;

public class RegisterDevice : IEndpoint
{
    public string PathPattern => "/login";

    public string Method => "GET";

    public RouteHandlerBuilder Build(RouteHandlerBuilder builder)
        => builder.WithName("Login");

    public Delegate Endpoint => (
            [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
            AuidFactory auidFactory) =>
        TypedResults
            .Ok(Auid.TryFromString(rawDeviceId!, out var deviceId)
                ? new DeviceInfo(deviceId)
                : new DeviceInfo(auidFactory.NewId()));
}