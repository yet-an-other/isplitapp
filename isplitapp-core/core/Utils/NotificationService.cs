using System.Text.Json;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Users.Data;
using WebPush;

namespace IB.ISplitApp.Core.Utils;

public class NotificationService(VapidDetails vapidDetails, ExpenseDb edb, UserDb udb)
{
    public async Task PushMessage<T>(string partyId, T message)
    {
        var pushClient = new WebPushClient();
        var subscriptions = from s in udb.Subscriptions
            join up in edb.UserParty on s.UserId equals up.UserId
            where up.PartyId == partyId
            select s;

        foreach (var subscription in subscriptions)
        {
            await pushClient.SendNotificationAsync(
                subscription.PushSubscription(),
                JsonSerializer.Serialize(message),
                vapidDetails);
        }
    }
}