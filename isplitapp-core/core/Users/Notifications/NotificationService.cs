using System.Text.Json;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Users.Data;
using LinqToDB;
using WebPush;

namespace IB.ISplitApp.Core.Users.Notifications;

public class NotificationService(
    ILogger<NotificationService> logger,
    VapidDetails vapidDetails,
    ExpenseDb edb,
    UserDb udb)
{
    public async Task PushExpenseUpdateMessage(string userId, string expenseId, string title)
    {
        try
        {
            // Gather data for the message and create message
            //
            var messageData = await (
                    from e in edb.Expenses
                    join pp in edb.Participants on e.LenderId equals pp.Id
                    join p in edb.Parties on e.PartyId equals p.Id
                    where e.Id == expenseId
                    select new MessageData
                    {
                        Subject = title,
                        PartyId = e.PartyId,
                        Title = e.Title,
                        Amount = e.MuAmount.ToFuAmount(),
                        LenderName = pp.Name,
                        Currency = p.Currency
                    })
                .FirstOrDefaultAsync();

            if (messageData == null)
                return;
            
            // Get subscribers list
            //
            
            var subscriptions = await (from s in udb.Subscriptions
                join up in edb.UserParty on s.UserId equals up.UserId
                where up.PartyId == messageData.PartyId && s.UserId != userId // exclude device which made changes
                select s)
                .ToArrayAsync();

            await SendWebMessages(
                subscriptions.Where(s => !s.IsIos).ToArray(), 
                messageData.CreateWebMessage());

            await SendIosMessage(
                subscriptions.Where(s => s.IsIos).ToArray(),
                messageData.CreateIosMessage());
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error on Notification sending");
        }
    }

    private async Task SendWebMessages(IEnumerable<Subscription> subscribers, WebMessage webMessage)
    {
        try
        {
            var pushClient = new WebPushClient();
            foreach (var subscription in subscribers)
            {
                await pushClient.SendNotificationAsync(
                    subscription.PushSubscription(),
                    JsonSerializer.Serialize(webMessage),
                    vapidDetails);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error send message to web devices");
        }
    }

    private async Task SendIosMessage(IEnumerable<Subscription> subscribers, Message iosMessage)
    {
        try
        {
            foreach (var subscription in subscribers)
            {
                try
                {
                    iosMessage.Token = subscription.DeviceFcmToken;
                    var result = await FirebaseMessaging.DefaultInstance.SendAsync(iosMessage);
                    logger.LogDebug("iOS notification send {result}", result);
                }
                catch (FirebaseMessagingException fbException)
                {
                    logger.LogWarning(fbException, "ErrorCode: {errorCode}", fbException.ErrorCode);
                    if (fbException.ErrorCode == ErrorCode.NotFound)
                    {
                        await udb.Subscriptions.DeleteAsync(s => s.UserId == subscription.UserId);
                        logger.LogDebug("Delete unavailable device {deviceId}", subscription.UserId);
                    }
                    else
                    {
                        throw;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error send message to iOS devices");
        }
    }
}