using System.Globalization;
using System.Runtime.CompilerServices;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Utils;
using IB.ISplitApp.Core.Expenses.Contract;
using IB.ISplitApp.Core.Users.Notifications;
using LinqToDB;
using LinqToDB.Data;
using LinqToDB.Tools;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses;

/// <summary>
/// A set of static methods to execute API commands on Expense objects
/// </summary>
public static class ExpenseCommand
{
    /// <summary>
    /// Creates new party
    /// </summary>
    /// <param name="userId">User ID who creates the party</param>
    /// <param name="party">A Party description</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <param name="httpContext">DataContext object</param>
    /// <returns>Http response 201 in case of success creation or set of validation errors</returns>
    public static async Task<Results<CreatedAtRoute<CreatedPartyInfo>, ValidationProblem>> PartyCreate(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        PartyPayload party,
        GenericValidator validator,
        HttpContext? httpContext,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, party, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        // Create Party
        //
        await db.BeginTransactionAsync();
        string partyId = IdUtil.NewId();
        await db.InsertAsync(new Party
        {
            Id = partyId,
            Name = party.Name,
            Currency = party.Currency,
            Created = DateTime.UtcNow,
            Updated = DateTime.UtcNow
        });
        
        // Create Participants
        //
        var participants = party.Participants.Select(
            p => new Participant { Id = IdUtil.NewId(), Name = p.Name, PartyId = partyId });
        await db.BulkCopyAsync(participants);
        
        await UpsertUserPartyVisibility(userId!, partyId, db);
        await db.CommitTransactionAsync();
        
        httpContext?.Response.Headers.TryAdd("X-Created-Id", partyId);
        
        return TypedResults.CreatedAtRoute(
            new CreatedPartyInfo(partyId),
            "GetParty",
            new RouteValueDictionary([new KeyValuePair<string, string>("partyId", partyId)]));

    }

    /// <summary>
    /// Updates party data and change participants
    /// </summary>
    /// <param name="userId">Unique user ID who changed the party</param>
    /// <param name="partyId">Unique party ID which will be changed</param>
    /// <param name="party">New party data</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="loggerFactory">Logger Factory</param>
    /// <param name="db">DataContext object</param>
    /// <returns>Response 204 if everything is Ok</returns>
    public static async Task<Results<NoContent, NotFound, ValidationProblem>> PartyUpdate(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string? partyId,
        PartyPayload party,
        GenericValidator validator,
        ILoggerFactory loggerFactory,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, party, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        // Update party
        //
        await db.BeginTransactionAsync();
        var rowsAffected = await db.Parties
            .Where(g => g.Id == partyId)
            .Set(g => g.Name, party.Name)
            .Set(g => g.Currency, party.Currency)
            .Set(g => g.Updated, DateTime.UtcNow)
            .UpdateAsync();

        if (rowsAffected == 0)
            return TypedResults.NotFound();
        
        // Delete removed participants
        //
        await db.Participants.Where(p =>
                p.PartyId == partyId &&
                p.Id.NotIn(party.Participants.Select(sp => sp.Id)) &&
                p.Id.NotIn(db.Expenses.Where(e => e.PartyId == partyId).Select(e => e.LenderId)) &&
                p.Id.NotIn(
                    db.Borrowers
                        .Where(b => b.ExpenseId.In(db.Expenses
                            .Where(e => e.PartyId == partyId)
                            .Select(e => e.Id)))
                        .Select(b => b.ParticipantId)))
            .DeleteAsync();
            
        // Update participants
        //
        await db.Participants.Merge()
            .Using(party.Participants.Select(p => new Participant
            {
                Id = string.IsNullOrEmpty(p.Id) ? IdUtil.NewId() : p.Id,
                PartyId = partyId!,
                Name = p.Name
            }))
            .On((t, s) => t.Id == s.Id)
            .UpdateWhenMatched()
            .InsertWhenNotMatched()
            .MergeAsync();
        
        await UpsertUserPartyVisibility(userId!, partyId!, db);
        await db.CommitTransactionAsync();
        
        return TypedResults.NoContent();
    }

    /// <summary>
    /// Returns requested group
    /// </summary>
    /// <param name="userId">User who wants to see the group</param>
    /// <param name="partyId">PartyId to watch</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Response 200 and a Party if everything is Ok</returns>
    public static async Task<Results<Ok<PartyInfo>, NotFound, ValidationProblem>> PartyGet(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());        
        
        var partyQuery = from p in db.Parties
            where p.Id == partyId
            select new PartyInfo
            {
                Id = p.Id,
                Name = p.Name,
                Currency = p.Currency,
                Created = p.Created,
                Updated = p.Updated,                
                Participants = (
                    from pp in db.Participants 
                    where pp.PartyId == p.Id 
                    select new ParticipantInfo
                    {
                        Id = pp.Id, 
                        Name = pp.Name,
                        CanDelete = db.Borrowers.Count(b=>b.ParticipantId == pp.Id) == 0 &&
                                    db.Expenses.Count(e => e.LenderId == pp.Id) == 0
                    }).ToArray(),
                TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                TotalTransactions = (from e in db.Expenses where e.PartyId == p.Id select e.Id).Count(),
                FuTotalExpenses = (from e in db.Expenses 
                    where e.PartyId == p.Id && !e.IsReimbursement 
                    select e.MuAmount).Sum().ToFuAmount(),
                IsArchived = db.UserParty
                    .Where(u=>u.PartyId == partyId && u.UserId == userId)
                    .Select(u=>u.IsArchived)
                    .FirstOrDefault(),
                FuOutstandingBalance = db.Participants
                    .Where(pp => pp.PartyId == partyId)
                    .Select(pp =>
                        db.Expenses
                            .Where(e => e.LenderId == pp.Id)
                            .Select(e => e.MuAmount)
                            .Sum()
                        - db.Borrowers
                            .Where(b => b.ParticipantId == pp.Id)
                            .Select(b => b.MuAmount)
                            .Sum()
                    )
                    .Where(a => a > 0)
                    .Sum()
                    .ToFuAmount()
            };

        var party = await partyQuery.FirstOrDefaultAsync();
        if (party == null)
            return TypedResults.NotFound();
        
        await UpsertUserPartyVisibility(userId!, partyId!, db);
        return TypedResults.Ok(party);
    }

    /// <summary>
    /// Returns list of parties available to a user
    /// </summary>
    /// <param name="userId">unique user id </param>
    /// <param name="filterArchived">filter by isArchived can be 'all' (default), 'actual' and 'archived' </param>
    /// <param name="orderBy">if orderBy is 'lastUpdate' then sorted by last update and by create time otherwise</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Response 200 and parties array </returns>
    public static async Task<Results<Ok<PartyInfo[]>, ValidationProblem>> PartyListGet(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        [FromQuery] string? filterArchived,
        [FromQuery] string? orderBy,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var parties = from p in db.Parties
            join up in db.UserParty on p.Id equals up.PartyId
            where up.UserId == userId 
                  && (filterArchived == ArchivedFilterValues.Actual 
                        ? !up.IsArchived 
                        : filterArchived != ArchivedFilterValues.Archived || up.IsArchived)
            orderby (orderBy == "lastUpdate" ? p.Updated.ToString(CultureInfo.InvariantCulture) : p.Id) descending
            select new PartyInfo
            {
                Id = p.Id,
                Name = p.Name,
                Currency = p.Currency,
                Created = p.Created,
                Updated = p.Updated,
                TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                TotalTransactions = (from e in db.Expenses where e.PartyId == p.Id select e.Id).Count(),
                FuTotalExpenses = (from e in db.Expenses
                    where e.PartyId == p.Id && !e.IsReimbursement
                    select e.MuAmount).Sum().ToFuAmount(),
                IsArchived = up.IsArchived,
                FuOutstandingBalance = db.Participants
                    .Where(pp => pp.PartyId == p.Id)
                    .Select(pp =>
                        db.Expenses
                            .Where(e => e.LenderId == pp.Id)
                            .Select(e => e.MuAmount)
                            .Sum()
                        - db.Borrowers
                            .Where(b => b.ParticipantId == pp.Id)
                            .Select(b => b.MuAmount)
                            .Sum()
                    )
                    .Where(a=> a > 0)
                    .Sum()
                    .ToFuAmount()
            };

        return TypedResults.Ok(await parties.ToArrayAsync());
    }

    /// <summary>
    /// Delete User Party association
    /// </summary>
    /// <param name="userId">unique user id </param>
    /// <param name="partyId">Unique party identifier</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 201 if everything is ok</returns>
    public static async Task<Results<NoContent, ValidationProblem>> PartyUnfollow(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,        
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        await db.UserParty.DeleteAsync(up => up.PartyId == partyId && up.UserId == userId);
        return TypedResults.NoContent();
    }

    /// <summary>
    /// Updates user settings for specific party
    /// </summary>
    /// <param name="userId">unique user id</param>
    /// <param name="partyId">unique party id</param>
    /// <param name="settingsPayload">settings to update</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>201 if everything is ok, or <see cref="ValidationProblem"/> otherwise</returns>
    public static async Task<Results<NoContent, ValidationProblem>> PartyUpdateUserSettings(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,        
        string? partyId,
        UserPartySettingsPayload settingsPayload,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        await db.UserParty
            .Where(up => up.PartyId == partyId && up.UserId == userId)
            .Set(u => u.IsArchived, settingsPayload.IsArchived)
            .UpdateAsync();

        return TypedResults.NoContent();
    }

    /// <summary>
    /// Create new expense in the provided party
    /// </summary>
    /// <param name="userId">user made changes</param>
    /// <param name="partyId">Unique party identifier</param>
    /// <param name="expense">Expense payload</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="edb">DataContext object</param>
    /// <param name="notificationService">Service to notify participants about the change</param>
    /// <returns>Returns 201 with path if everything is ok</returns>
    public static async Task<Results<CreatedAtRoute, ValidationProblem>> ExpenseCreate(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string? partyId,
        ExpensePayload expense,
        GenericValidator validator,
        ExpenseDb edb,
        NotificationService notificationService)
    {
        if (!validator.IsValid(userId, partyId, expense, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        await edb.BeginTransactionAsync();
        var expenseId = IdUtil.NewId();
        await edb.InsertAsync(new Expense
        {
            Id = expenseId,
            PartyId = partyId!,
            Title = expense.Title,
            MuAmount = expense.FuAmount.ToMuAmount(),
            Date = expense.Date,
            IsReimbursement = expense.IsReimbursement,
            LenderId = expense.LenderId,
            SplitMode = expense.SplitMode
        });

        await InsertBorrowersAsync(expenseId, expense, edb);
        await edb.CommitTransactionAsync();
        
        await notificationService.PushExpenseUpdateMessage(userId!, expenseId, "New expense");
        
        return TypedResults.CreatedAtRoute(
            "GetExpense", 
            new RouteValueDictionary([new KeyValuePair<string, string>("expenseId", expenseId)]));
    }


    /// <summary>
    /// Updates specific expense
    /// </summary>
    /// <param name="userId">user made changes</param>
    /// <param name="expenseId">Unique id of expense to update</param>
    /// <param name="expense">Expense payload</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <param name="notificationService">Service to notify participants about the change</param>
    /// <returns>Returns 204 with path if everything is ok</returns>
    public static async Task<Results<NoContent, NotFound, ValidationProblem>> ExpenseUpdate(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string? expenseId,
        ExpensePayload expense,
        GenericValidator validator,
        ExpenseDb db,
        NotificationService notificationService)
    {
        if (!validator.IsValid(userId, expenseId, expense, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        await db.BeginTransactionAsync();
        var rows = await db.Expenses.Where(e => e.Id == expenseId)
            .Set(e => e.LenderId, expense.LenderId)
            .Set(e => e.Title, expense.Title)
            .Set(e => e.MuAmount, expense.FuAmount.ToMuAmount())
            .Set(e => e.Date, expense.Date)
            .Set(e => e.IsReimbursement, expense.IsReimbursement)
            .Set(e => e.SplitMode, expense.SplitMode)
            .UpdateAsync();

        if (rows == 0)
            return TypedResults.NotFound();

        await db.Borrowers.Where(b => b.ExpenseId == expenseId).DeleteAsync();
        await InsertBorrowersAsync(expenseId!, expense, db);
        await db.CommitTransactionAsync();
        
        await notificationService.PushExpenseUpdateMessage(userId!, expenseId!, "Expense updated");
        
        return TypedResults.NoContent();
    }

    /// <summary>
    /// Get specific expense data
    /// </summary>
    /// <param name="expenseId">Unique id of expense to update</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 200 with requested expense object if everything is ok</returns>
    public static async Task<Results<Ok<ExpenseInfo>, NotFound, ValidationProblem>> ExpenseGet(
        string? expenseId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValidExpenseId(expenseId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var expenseQuery = db.Expenses.Where(e => e.Id == expenseId)
            .Select(e => new ExpenseInfo
            {
                Id = e.Id,
                FuAmount = e.MuAmount.ToFuAmount(),
                Date = e.Date,
                IsReimbursement = e.IsReimbursement,
                Title = e.Title,
                LenderId = e.LenderId,
                SplitMode = e.SplitMode,
                LenderName = db.Participants
                    .Where(p => p.Id == e.LenderId)
                    .Select(p => p.Name).Single(),
                Borrowers = db.Borrowers
                    .Where(b => b.ExpenseId == e.Id)
                    .Select(b => new BorrowerInfo
                    {
                        ParticipantId = b.ParticipantId,
                        FuAmount = b.MuAmount.ToFuAmount(),
                        Share = b.Share,
                        Percent = b.Percent,
                        ParticipantName = db.Participants
                            .Where(p => p.Id == b.ParticipantId)
                            .Select(p => p.Name)
                            .Single()
                    }).ToArray()
            });
        
        return await expenseQuery.FirstOrDefaultAsync() is { } expense 
            ? TypedResults.Ok(expense)
            : TypedResults.NotFound();
    }

    /// <summary>
    /// Get all expenses in party
    /// </summary>
    /// <param name="partyId">Unique id of the party</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 200 with all party expenses if everything is ok</returns>
    public static async Task<Results<Ok<ExpenseInfo[]>, ValidationProblem>> PartyExpenseListGet(
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(IdUtil.DefaultId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        var expenseQuery = db.Expenses
            .Where(e => e.PartyId == partyId)
            .OrderByDescending(e=>e.Date)
            .Select(e => new ExpenseInfo
            {
                Id = e.Id,
                FuAmount = e.MuAmount.ToFuAmount(),
                Date = e.Date,
                IsReimbursement = e.IsReimbursement,
                Title = e.Title,
                LenderId = e.LenderId,
                SplitMode = e.SplitMode,
                LenderName = db.Participants
                    .Where(p => p.Id == e.LenderId)
                    .Select(p => p.Name).Single(),
                Borrowers = db.Borrowers
                    .Where(b => b.ExpenseId == e.Id)
                    .Select(b => new BorrowerInfo
                    {
                        ParticipantId = b.ParticipantId,
                        FuAmount = b.MuAmount.ToFuAmount(),
                        Share = b.Share,
                        Percent = b.Percent,
                        ParticipantName = db.Participants
                            .Where(p => p.Id == b.ParticipantId)
                            .Select(p => p.Name)
                            .Single()
                    }).ToArray()
            });

        return TypedResults.Ok(await expenseQuery.ToArrayAsync());
    }


    /// <summary>
    /// Get party balance (Who owes whom)
    /// </summary>
    /// <param name="partyId">Unique id of the party</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 200 with all balance entries if everything is ok</returns>
    public static async Task<Results<Ok<BalanceInfo>, ValidationProblem>> PartyBalanceGet(
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(IdUtil.DefaultId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var rawEntries = await db.Participants
            .Where(pp => pp.PartyId == partyId)
            .Select(pp => new RawBalanceEntry
            {
                ParticipantId = pp.Id,
                ParticipantName = pp.Name,
                MuAmount =
                    db.Expenses
                        .Where(e => e.LenderId == pp.Id)
                        .Select(e => e.MuAmount)
                        .Sum() 
                    - db.Borrowers
                        .Where(b => b.ParticipantId == pp.Id)
                        .Select(b => b.MuAmount)
                        .Sum()
            }).ToArrayAsync();

        var balances = rawEntries.Select(b => new BalanceEntry
        {
            ParticipantId = b.ParticipantId,
            ParticipantName = b.ParticipantName,
            FuAmount = b.MuAmount.ToFuAmount()
        }).ToArray();
        var reimbursements = CalculateReimbursements(rawEntries);

        return TypedResults.Ok(new BalanceInfo { Balances = balances, Reimbursements = reimbursements });
    }
    
    /// <summary>
    /// Delete Expense
    /// </summary>
    /// <param name="userId">unique user id </param>
    /// <param name="expenseId">Unique expense identifier</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 204 with path if everything is ok</returns>
    public static async Task<Results<NoContent, ValidationProblem>> ExpenseDelete(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,        
        string? expenseId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, expenseId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        await db.Expenses.DeleteAsync(e => e.Id == expenseId);
        return TypedResults.NoContent();
    }
    
    /// <summary>
    /// Creates User/Party association
    /// </summary>
    private static async Task UpsertUserPartyVisibility(string userId, string partyId, ExpenseDb db)
    {
        await db.UserParty
            .Merge()
            .Using([new UserParty
            {
                UserId = userId,
                PartyId = partyId
            }])
            .OnTargetKey()
            .InsertWhenNotMatched(s=>s)
            .MergeAsync();                
    }
    
    private static async Task InsertBorrowersAsync(string expenseId, ExpensePayload expense, ExpenseDb db)
    {
        int totalShares = expense.Borrowers.Sum(b => b.Share);
        
        long Evenly(int i) => (expense.FuAmount.ToMuAmount() / expense.Borrowers.Length)
                               + (expense.FuAmount.ToMuAmount() % expense.Borrowers.Length <= i ? 0 : 1);
        
        long ByShares(int i) => ((expense.FuAmount.ToMuAmount() / totalShares)
                                + (expense.FuAmount.ToMuAmount() % totalShares <= i ? 0 : 1))
                                * expense.Borrowers[i].Share;
        
        long ByPercentage(int i) => (expense.FuAmount.ToMuAmount() * expense.Borrowers[i].Percent) / 100;
        
        long ByAmount(int i) => expense.Borrowers[i].FuAmount.ToMuAmount();
        
        await db.Borrowers.BulkCopyAsync(
            expense.Borrowers
                .Select((b, i) => new Borrower
                {
                    ExpenseId = expenseId, 
                    ParticipantId = b.ParticipantId,
                    Share = b.Share,
                    Percent = b.Percent,
                    MuAmount = expense.SplitMode switch
                    {
                        SplitMode.Evenly => Evenly(i),
                        SplitMode.ByShare => ByShares(i),
                        SplitMode.ByPercentage => ByPercentage(i),
                        SplitMode.ByAmount => ByAmount(i),
                        _ => throw new ArgumentOutOfRangeException(nameof(SplitMode))
                    }
                })
        );
    }
    
    /// <summary>
    /// A sugar to get an instance of ILogger 
    /// </summary>
    /// <param name="loggerFactory">LoggerFactory instance from DI</param>
    /// <param name="methodName">calling method name</param>
    private static ILogger Log(this ILoggerFactory loggerFactory, [CallerMemberName]string? methodName = default)
    {
        return loggerFactory.CreateLogger($"{typeof(ExpenseCommand)}.{methodName}");
    }    
    
    private class RawBalanceEntry
    {
        public string ParticipantId { get; init; } = default!;
        public string ParticipantName { get; init; } = default!;
        public long MuAmount { get; set; }
    }

    private static ReimburseEntry[] CalculateReimbursements(IEnumerable<RawBalanceEntry> rawBalances)
    {
        var sortedBalances = rawBalances.OrderByDescending(e => e.MuAmount).ToList();
        var reimbursements = new List<ReimburseEntry>();
        
        while (sortedBalances.Count > 0)
        {
            var first = sortedBalances[0];
            var last = sortedBalances[^1];
            var reminder = first.MuAmount + last.MuAmount;
            var entry = new ReimburseEntry
            {
                FromId = last.ParticipantId,
                FromName = last.ParticipantName,
                ToId = first.ParticipantId,
                ToName = first.ParticipantName
            };    
            
            if (reminder > 0)
            {
                entry.FuAmount = -last.MuAmount.ToFuAmount();
                first.MuAmount = reminder;
                sortedBalances.RemoveAt(sortedBalances.Count - 1);
            }
            else
            {
                entry.FuAmount = first.MuAmount.ToFuAmount();
                last.MuAmount = reminder;
                sortedBalances.RemoveAt(0);
            }
            if (entry.FuAmount != 0)
                reimbursements.Add(entry);
        }
        return reimbursements.ToArray();
    }
}