using IB.ISplitApp.Core.Devices.Endpoints;
using IB.Utils.Ids;
using LinqToDB.Mapping;
using WebPush;

namespace IB.ISplitApp.Core.Devices.Data;

[Table("subscription")]
public record Subscription
{
    public Subscription() {}

    public Subscription(Auid deviceId, SubscriptionPayload subscriptionPayload)
    {
        DeviceId = deviceId;
        IsIos = subscriptionPayload.IsIos;
        DeviceFcmToken = subscriptionPayload.DeviceFcmToken;
        PushEndpoint = subscriptionPayload.Endpoint;
        Auth = subscriptionPayload.Keys.Auth;
        P256Dh = subscriptionPayload.Keys.P256Dh;
    }
    
    [Column("id")]
    [PrimaryKey, Identity]
    public int Id { get; init; }

    [Column("device_id")]
    public Auid DeviceId { get; init; } = Auid.Empty;

    [Column("is_ios")]
    public bool IsIos { get; init; } = false;

    [Column("device_fcm_token")] 
    public string DeviceFcmToken { get; init; } = string.Empty;
    
    [Column("push_endpoint")]
    public string PushEndpoint { get; init; } = string.Empty;

    [Column("p256dh")]
    public string P256Dh { get; init; } = string.Empty;

    [Column("auth")]
    public string Auth { get; init; } = string.Empty;
}

public static class SubscriptionExtension
{
    public static PushSubscription PushSubscription(this Subscription subscription)
    {
        return new PushSubscription(subscription.PushEndpoint, subscription.P256Dh, subscription.Auth);
    }
}