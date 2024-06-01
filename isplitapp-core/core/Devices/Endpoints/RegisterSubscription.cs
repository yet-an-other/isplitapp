using IB.ISplitApp.Core.Devices.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Devices.Endpoints;

/// <summary>
/// Registering new devices for subscription to notifications about changes in expenses
/// </summary>
public class RegisterSubscription: IEndpoint
{
    public string PathPattern => "/users/subscribe";
    public string Method => "POST";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("Subscribe");
    public Delegate Endpoint =>
        async (
            [FromHeader(Name = HeaderName.Device)] string? rawDeviceId,
            SubscriptionPayload subscriptionPayload,
            RequestValidator validator,
            DeviceDb db) =>
        {
            validator
                .TryParseId(rawDeviceId, out var deviceId, "deviceId")
                .Validate(subscriptionPayload)
                .ThrowOnError();

            await db.Subscriptions
                .Merge()
                .Using([new Subscription(deviceId, subscriptionPayload)])
                .On(t => t.DeviceId, s => s.DeviceId)
                .InsertWhenNotMatched()
                .UpdateWhenMatched()
                .MergeAsync();

            return TypedResults.NoContent();
        };
}