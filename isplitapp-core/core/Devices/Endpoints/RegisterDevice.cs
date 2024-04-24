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
            [FromHeader(Name = HeaderName.Device)] Auid? deviceId,
            AuidFactory auidFactory) =>
        TypedResults
            .Ok(deviceId != null && deviceId != Auid.Empty
                ? new DeviceInfo(deviceId.Value)
                : new DeviceInfo(auidFactory.NewId()));
}