namespace IB.ISplitApp.Core.Expenses.Contract;

public record UserPartySettingsPayload
{
    public bool IsArchived { get; init; } = false;
}