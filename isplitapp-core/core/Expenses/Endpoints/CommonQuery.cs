using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.Data;

// ReSharper disable ArrangeRedundantParentheses

namespace IB.ISplitApp.Core.Expenses.Endpoints;

internal static class CommonQuery
{
    /// <summary>
    /// Ensures that specific device has access to the party
    /// </summary>
    internal static async Task EnsureDevicePartyVisibility(Auid deviceId, Auid partyId, ExpenseDb db)
    {
        await db.DeviceParty
            .Merge()
            .Using([new DeviceParty
            {
                DeviceId = deviceId,
                PartyId = partyId
            }])
            .OnTargetKey()
            .InsertWhenNotMatched(s=>s)
            .MergeAsync();                
    }

    /// <summary>
    /// Insert the borrowers with specific split strategy
    /// </summary>
    /// <param name="expenseId">unique expense id</param>
    /// <param name="expense">expense data</param>
    /// <param name="db">database connection</param>
    /// <exception cref="ArgumentOutOfRangeException"></exception>
    internal static async Task InsertBorrowersAsync(Auid expenseId, ExpensePayload expense, ExpenseDb db)
    {
        var totalShares = expense.Borrowers.Sum(b => b.Share);

        await db.Borrowers.BulkCopyAsync(
            expense.Borrowers
                .Select((b, i) => new Borrower
                {
                    ExpenseId = expenseId,
                    ParticipantId = b.ParticipantId,
                    Share = b.Share,
                    Percent = b.Percent,
                    MuAmount = expense.SplitMode switch
                    {
                        SplitMode.Evenly => Evenly(i),
                        SplitMode.ByShare => ByShares(i),
                        SplitMode.ByPercentage => ByPercentage(i),
                        SplitMode.ByAmount => ByAmount(i),
                        _ => throw new ArgumentOutOfRangeException(nameof(SplitMode))
                    }
                })
        );
        return;

        long ByAmount(int i) => expense.Borrowers[i].FuAmount.ToMuAmount();

        long ByPercentage(int i) => (expense.FuAmount.ToMuAmount() * expense.Borrowers[i].Percent) / 100;

        long ByShares(int i) => ((expense.FuAmount.ToMuAmount() / totalShares) * expense.Borrowers[i].Share
                                 + ((expense.FuAmount.ToMuAmount() % totalShares) * expense.Borrowers[i].Share <= i ? 0 : 1));

        long Evenly(int i) => (expense.FuAmount.ToMuAmount() / expense.Borrowers.Length)
                              + (expense.FuAmount.ToMuAmount() % expense.Borrowers.Length <= i ? 0 : 1);
    }

    /// <summary>
    /// Core party creation logic - creates party and participants, returns party ID or null if conflict
    /// </summary>
    /// <param name="deviceId">Device ID requesting the creation</param>
    /// <param name="party">Party payload data</param>
    /// <param name="auidFactory">Factory for generating IDs</param>
    /// <param name="db">Database connection</param>
    /// <param name="providedPartyId">Optional party ID provided by client</param>
    /// <returns>Created party ID or null if conflict occurred</returns>
    internal static async Task<Auid?> CreatePartyInternalAsync(
        Auid deviceId,
        PartyPayload party,
        AuidFactory auidFactory,
        ExpenseDb db,
        Auid? providedPartyId = null)
    {
        var partyId = providedPartyId ?? auidFactory.NewId();

        // Check if party already exists (only when ID is provided)
        if (providedPartyId.HasValue)
        {
            var existingParty = await db.GetTable<Party>()
                .Where(p => p.Id == providedPartyId.Value)
                .FirstOrDefaultAsync();
                
            if (existingParty != null)
            {
                return null; // Indicates conflict
            }
        }

        // Create Party
        await db.BeginTransactionAsync();
        await db.InsertAsync(new Party
        {
            Id = partyId,
            Name = party.Name,
            Currency = party.Currency,
            Description = party.Description,
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow,
            Timestamp = auidFactory.Timestamp()
        });

        // Create Participants - use client-provided IDs if available, otherwise generate
        var participants = party.Participants.Select(p => new Participant 
        { 
            Id = p.Id != Auid.Empty ? p.Id : auidFactory.NewId(), 
            Name = p.Name, 
            PartyId = partyId 
        });
        await db.BulkCopyAsync(participants);

        await EnsureDevicePartyVisibility(deviceId, partyId, db);
        await db.CommitTransactionAsync();
        
        return partyId;
    }

    /// <summary>
    /// Logs an activity to the activity log for audit trail
    /// </summary>
    /// <param name="partyId">ID of the party where activity occurred</param>
    /// <param name="deviceId">ID of the device that performed the activity</param>
    /// <param name="activityType">Type of activity (e.g., "ExpenseAdded", "GroupUpdated")</param>
    /// <param name="description">Human-readable description of the activity</param>
    /// <param name="db">Database connection</param>
    /// <param name="auidFactory">Factory for generating IDs and timestamps</param>
    /// <param name="entityId">Optional ID of the entity affected (expense, participant, etc.)</param>
    internal static async Task LogActivityAsync(
        Auid partyId, 
        Auid deviceId, 
        string activityType, 
        string description, 
        ExpenseDb db, 
        AuidFactory auidFactory,
        Auid? entityId = null)
    {
        var activityId = auidFactory.NewId();
        var timestamp = auidFactory.Timestamp();

        await db.InsertAsync(new ActivityLog
        {
            Id = activityId,
            PartyId = partyId,
            DeviceId = deviceId,
            ActivityType = activityType,
            EntityId = entityId,
            Description = description,
            Created = DateTime.UtcNow,
            Timestamp = timestamp
        });
    }
}