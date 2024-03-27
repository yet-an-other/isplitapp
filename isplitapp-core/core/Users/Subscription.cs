using LinqToDB.Mapping;
using WebPush;

namespace IB.ISplitApp.Core.Users;

[Table("subscription")]
public record Subscription
{
    public Subscription() {}

    public Subscription(string userId, PushSubscription pushSubscription)
    {
        UserId = userId;
        PushEndpoint = pushSubscription.Endpoint;
        Auth = pushSubscription.Auth;
        P256Dh = pushSubscription.P256DH;
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