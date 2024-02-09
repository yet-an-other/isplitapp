namespace IB.ISplitApp.Core.Expenses.Contract;

public record ParticipantInfo
{
    public string Id { get; init; } = string.Empty;
    
    public string Name { get; init; } = string.Empty;

    public bool CanDelete { get; init; } = true;
}