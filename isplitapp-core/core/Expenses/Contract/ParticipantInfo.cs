using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Expenses.Contract;

public record ParticipantInfo
{
    public Auid Id { get; init; } = Auid.Empty;
    
    public string Name { get; init; } = string.Empty;

    public bool CanDelete { get; init; } = true;
}