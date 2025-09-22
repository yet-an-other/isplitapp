using LinqToDB;
using LinqToDB.Data;

namespace IB.ISplitApp.Core.Expenses.Data;

/// <summary>
/// Service class provides data access layer to db
/// </summary>
public class ExpenseDb(DataOptions<ExpenseDb> options) : DataConnection(options.Options)
{
    /// <summary>
    /// party table in database
    /// </summary>
    public ITable<Party> Parties => this.GetTable<Party>();

    /// <summary>
    /// participant table
    /// </summary>
    public ITable<Participant> Participants => this.GetTable<Participant>();

    /// <summary>
    /// user_party table to track association between users and parties
    /// </summary>
    public ITable<DeviceParty> DeviceParty => this.GetTable<DeviceParty>();

    /// <summary>
    /// expense table
    /// </summary>
    public ITable<Expense> Expenses => this.GetTable<Expense>();

    /// <summary>
    /// borrower table
    /// </summary>
    public ITable<Borrower> Borrowers => this.GetTable<Borrower>();

    /// <summary>
    /// activity_log table to track changes in parties
    /// </summary>
    public ITable<ActivityLog> ActivityLogs => this.GetTable<ActivityLog>();

    /// <summary>
    /// expense_attachment table
    /// </summary>
    public ITable<ExpenseAttachment> ExpenseAttachments => this.GetTable<ExpenseAttachment>();
}