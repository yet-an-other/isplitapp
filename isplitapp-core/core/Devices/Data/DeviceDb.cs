using LinqToDB;
using LinqToDB.Data;

namespace IB.ISplitApp.Core.Devices.Data;

public class DeviceDb(DataOptions<DeviceDb> options) : DataConnection(options.Options)
{

    /// <summary>
    /// Subscription table in database
    /// </summary>
    public ITable<Subscription> Subscriptions => this.GetTable<Subscription>();
}
