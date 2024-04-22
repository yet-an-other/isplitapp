using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Expenses.Data;
using IB.Utils.Ids;
using LinqToDB;
using LinqToDB.Data;
// ReSharper disable ArrangeRedundantParentheses

namespace IB.ISplitApp.Core.Expenses.Endpoints;

internal class CommonQuery
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

        long ByShares(int i) => ((expense.FuAmount.ToMuAmount() / totalShares)
                                 + (expense.FuAmount.ToMuAmount() % totalShares <= i ? 0 : 1))
                                * expense.Borrowers[i].Share;

        long Evenly(int i) => (expense.FuAmount.ToMuAmount() / expense.Borrowers.Length)
                              + (expense.FuAmount.ToMuAmount() % expense.Borrowers.Length <= i ? 0 : 1);
    }
}