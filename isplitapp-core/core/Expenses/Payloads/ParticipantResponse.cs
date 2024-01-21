namespace IB.ISplitApp.Core.Expenses.Payloads;

public record ParticipantResponse
{
    public string Id { get; init; } = string.Empty;
    
    public string Name { get; init; } = string.Empty;
}