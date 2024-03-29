using System.Text.Json;
using System.Text.Json.Serialization;
using IB.ISplitApp.Core.Expenses;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Users.Data;
using LinqToDB;
using WebPush;

namespace IB.ISplitApp.Core.Utils;

public class NotificationService(ILogger<NotificationService> logger, VapidDetails vapidDetails, ExpenseDb edb, UserDb udb)
{
    private class Message
    {
        [JsonPropertyName("title")] 
        public string Title { get; init; } = string.Empty;
        
        [JsonPropertyName("body")]
        public string Body { get; init; } = string.Empty;

        [JsonPropertyName("data")]
        public CustomData Data { get; init; } = new CustomData();
    }

    private class CustomData
    {
        [JsonPropertyName("partyId")]
        public string PartyId { get; init; } = string.Empty;
    }
    
    public async Task PushMessage(string expenseId, string title)
    {
        try
        {
            // Gather data for the message and create message
            //
            var expense = await (
                    from e in edb.Expenses
                    join pp in edb.Participants on e.LenderId equals pp.Id
                    join p in edb.Parties on e.PartyId equals p.Id
                    where e.Id == expenseId
                    select new
                    {
                        e.PartyId,
                        e.Title,
                        Amount = e.MuAmount.ToFuAmount(),
                        LenderName = pp.Name,
                        p.Currency
                    })
                .FirstOrDefaultAsync();

            if (expense == null)
                return;

            var message = new Message
            {
                Title = title,
                Body = $"{expense.Title}\n {expense.Amount} {expense.Currency}\n Paid by {expense.LenderName}",
                Data = new CustomData
                {
                    PartyId = expense.PartyId
                }
            };

            // Send message
            //
            var pushClient = new WebPushClient();
            var subscriptions = from s in udb.Subscriptions
                join up in edb.UserParty on s.UserId equals up.UserId
                where up.PartyId == expense.PartyId
                select s;

            foreach (var subscription in subscriptions)
            {
                await pushClient.SendNotificationAsync(
                    subscription.PushSubscription(),
                    JsonSerializer.Serialize(message),
                    vapidDetails);
            }
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error on Notification sending");
        }
    }
}
