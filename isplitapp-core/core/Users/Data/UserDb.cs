
using LinqToDB;
using LinqToDB.Data;

namespace IB.ISplitApp.Core.Users.Data;

public class UserDb(DataOptions<UserDb> options) : DataConnection(options.Options)
{

    /// <summary>
    /// Subscription table in database
    /// </summary>
    public ITable<Subscription> Subscriptions => this.GetTable<Subscription>();
}
