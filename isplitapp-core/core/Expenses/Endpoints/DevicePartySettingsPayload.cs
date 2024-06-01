namespace IB.ISplitApp.Core.Expenses.Endpoints;

public record DevicePartySettingsPayload
{
    public bool IsArchived { get; init; } = false;
}