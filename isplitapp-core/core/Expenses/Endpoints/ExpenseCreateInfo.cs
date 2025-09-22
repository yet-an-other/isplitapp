using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Response returned after creating an expense.
/// Contains only data needed by client to proceed with follow-up actions (e.g., attachments upload).
/// </summary>
public record ExpenseCreateInfo
{
    public Auid ExpenseId { get; init; } = Auid.Empty;
    public string Timestamp { get; init; } = AuidFactory.MinTimestamp;
}
