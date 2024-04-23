namespace IB.ISplitApp.Core.Expenses.Contract;

public record DevicePartySettingsPayload
{
    public bool IsArchived { get; init; } = false;
}