using FirebaseAdmin.Messaging;

namespace IB.ISplitApp.Core.Users.Notifications;

public record MessageData
{
    public string Subject { get; init; } = string.Empty;
    public string PartyId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string LenderName  { get; init; } = string.Empty;
    public string Currency   { get; init; } = string.Empty;
    public string Body => $"{Title}\n {Amount} {Currency}\n Paid by {LenderName}";
}

public static class MessageDataExtensions
{
    public static WebMessage CreateWebMessage(this MessageData md)
    {
        return new WebMessage
        {
            Title = md.Subject,
            Body = md.Body,
            Data = new CustomData
            {
                PartyId = md.PartyId
            }
        };
    }

    public static Message CreateIosMessage(this MessageData md)
    {
        return new Message
        {
            Notification = new Notification
            {
                Title = md.Subject,
                Body = md.Body
            },
            Data = new Dictionary<string, string>
            {
                { "partyId", md.PartyId }
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound = "default"
                }
            }
        };
    }
}