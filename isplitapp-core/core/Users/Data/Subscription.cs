using IB.ISplitApp.Core.Users.Contract;
using LinqToDB.Mapping;
using WebPush;

namespace IB.ISplitApp.Core.Users.Data;

[Table("subscription")]
public record Subscription
{
    public Subscription() {}

    public Subscription(string userId, SubscriptionPayload subscriptionPayload)
    {
        UserId = userId;
        PushEndpoint = subscriptionPayload.Endpoint;
        Auth = subscriptionPayload.Keys.Auth;
        P256Dh = subscriptionPayload.Keys.P256Dh;
    }
    
    [Column("id")]
    [PrimaryKey]
    public int Id { get; init; }

    [Column("user_id")]
    public string UserId { get; init; } = string.Empty;
    
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