using System.Runtime.CompilerServices;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Utils;
using IB.ISplitApp.Core.Expenses.Payloads;
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
    /// <returns>Http response 201 in case of success creation or set of validation errors</returns>
    public static async Task<Results<CreatedAtRoute, ValidationProblem>> PartyCreate(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        PartyRequest party,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, party, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        // Create Party
        //
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
        

        await UpsertUserPartyVisibility(userId, partyId, db);

        return TypedResults.CreatedAtRoute(
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
        PartyRequest party,
        GenericValidator validator,
        ILoggerFactory loggerFactory,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, party, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        // Update party
        //
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
        
        await UpsertUserPartyVisibility(userId, partyId!, db);
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
    public static async Task<Results<Ok<PartyResponse>, NotFound, ValidationProblem>> PartyGet(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());        
        
        var partyQuery = from p in db.Parties
            where p.Id == partyId
            select new PartyResponse
            {
                Id = p.Id,
                Name = p.Name,
                Currency = p.Currency,
                Created = p.Created,
                Updated = p.Updated,                
                Participants = (
                    from pp in db.Participants 
                    where pp.PartyId == p.Id 
                    select new ParticipantResponse { Id = pp.Id, Name = pp.Name }).ToArray(),
                TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                FuTotalExpenses = (from e in db.Expenses where e.PartyId == p.Id && !e.IsReimbursement select e.MuAmount)
                    .Sum().ToFuAmount(),
                FuTotalReimbursement = (from e in db.Expenses where e.PartyId == p.Id && e.IsReimbursement select e.MuAmount)
                    .Sum().ToFuAmount()
            };

        var party = await partyQuery.FirstOrDefaultAsync();
        if (party == null)
            return TypedResults.NotFound();
        
        await UpsertUserPartyVisibility(userId, partyId!, db);
        return TypedResults.Ok(party);
    }

    /// <summary>
    /// Returns list of parties available to a user
    /// </summary>
    /// <param name="userId">unique user id </param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Response 200 and parties array </returns>
    public static async Task<Results<Ok<PartyResponse[]>, ValidationProblem>> PartyListGet(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(userId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        var parties = from p in db.Parties
            join up in db.UserParty on p.Id equals up.PartyId
            where up.UserId == userId
            select new PartyResponse
            {
                Id = p.Id,
                Name = p.Name,
                Currency = p.Currency,
                Created = p.Created,
                Updated = p.Updated,
                TotalParticipants = (from pp in db.Participants where pp.PartyId == p.Id select p.Id).Count(),
                FuTotalExpenses = (from e in db.Expenses where e.PartyId == p.Id && !e.IsReimbursement select e.MuAmount)
                    .Sum().ToFuAmount(),
                FuTotalReimbursement = (from e in db.Expenses where e.PartyId == p.Id && e.IsReimbursement select e.MuAmount)
                    .Sum().ToFuAmount()
            };

        return TypedResults.Ok(await parties.ToArrayAsync());
    }

    /// <summary>
    /// Create new expense in the provided party
    /// </summary>
    /// <param name="partyId">Unique party identifier</param>
    /// <param name="expense">Expense payload</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 201 with path if everything is ok</returns>
    public static async Task<Results<CreatedAtRoute, ValidationProblem>> ExpenseCreate(
        string? partyId,
        ExpenseRequest expense,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(IdUtil.DefaultId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        string expenseId = IdUtil.NewId();
        await db.InsertAsync(new Expense
        {
            Id = expenseId,
            PartyId = partyId!,
            Title = expense.Title,
            MuAmount = expense.FuAmount.ToMuAmount(),
            Date = expense.Date,
            IsReimbursement = expense.IsReimbursement,
            LenderId = expense.LenderId
        });

        await db.Borrowers.BulkCopyAsync(
            expense.Borrowers
                .Select((b, i) => new Borrower
                {
                    ExpenseId = expenseId, 
                    ParticipantId = b.ParticipantId,
                    MuAmount = (expense.FuAmount.ToMuAmount() / expense.Borrowers.Length)!
                        + (expense.FuAmount.ToMuAmount() % expense.Borrowers.Length <= i ? 0 : 1)
                })
        );
        
        return TypedResults.CreatedAtRoute(
            "GetExpense", 
            new RouteValueDictionary([new KeyValuePair<string, string>("expenseId", expenseId)]));
    }

    
    /// <summary>
    /// Updates specific expense
    /// </summary>
    /// <param name="expenseId">Unique id of expense to update</param>
    /// <param name="expense">Expense payload</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 204 with path if everything is ok</returns>
    public static async Task<Results<NoContent, NotFound, ValidationProblem>> ExpenseUpdate(
        string? expenseId,
        ExpenseRequest expense,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValidExpenseId(expenseId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var rows = await db.Expenses.Where(e => e.Id == expenseId)
            .Set(e => e.LenderId, expense.LenderId)
            .Set(e => e.Title, expense.Title)
            .Set(e => e.MuAmount, expense.FuAmount.ToMuAmount())
            .Set(e => e.Date, expense.Date)
            .Set(e => e.IsReimbursement, expense.IsReimbursement)
            .UpdateAsync();

        if (rows == 0)
            return TypedResults.NotFound();

        await db.Borrowers.Where(b => b.ExpenseId == expenseId).DeleteAsync();
        await db.Borrowers.BulkCopyAsync(
            expense.Borrowers
                .Select((b, i) => new Borrower
                {
                    ExpenseId = expenseId!, 
                    ParticipantId = b.ParticipantId,
                    MuAmount = (expense.FuAmount.ToMuAmount() / expense.Borrowers.Length)!
                               + (expense.FuAmount.ToMuAmount() % expense.Borrowers.Length <= i ? 0 : 1)
                })
        );
        
        return TypedResults.NoContent();
    }

    /// <summary>
    /// Get specific expense data
    /// </summary>
    /// <param name="expenseId">Unique id of expense to update</param>
    /// <param name="validator">Generic validation object <see cref="GenericValidator"/></param>
    /// <param name="db">DataContext object</param>
    /// <returns>Returns 200 with requested expense object if everything is ok</returns>
    public static async Task<Results<Ok<ExpenseResponse>, NotFound, ValidationProblem>> ExpenseGet(
        string? expenseId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValidExpenseId(expenseId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var expenseQuery = db.Expenses.Where(e => e.Id == expenseId)
            .Select(e => new ExpenseResponse
            {
                Id = e.Id,
                FuAmount = e.MuAmount.ToFuAmount(),
                Date = e.Date,
                IsReimbursement = e.IsReimbursement,
                Title = e.Title,
                LenderId = e.LenderId,
                LenderName = db.Participants
                    .Where(p => p.Id == e.LenderId)
                    .Select(p => p.Name).Single(),
                Borrowers = db.Borrowers
                    .Where(b => b.ExpenseId == e.Id)
                    .Select(b => new BorrowerResponse
                    {
                        ParticipantId = b.ParticipantId,
                        FuAmount = b.MuAmount.ToFuAmount(),
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
    public static async Task<Results<Ok<ExpenseResponse[]>, ValidationProblem>> PartyExpenseListGet(
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(IdUtil.DefaultId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        
        var expenseQuery = db.Expenses.Where(e => e.PartyId == partyId)
            .Select(e => new ExpenseResponse
            {
                Id = e.Id,
                FuAmount = e.MuAmount.ToFuAmount(),
                Date = e.Date,
                IsReimbursement = e.IsReimbursement,
                Title = e.Title,
                LenderId = e.LenderId,
                LenderName = db.Participants
                    .Where(p => p.Id == e.LenderId)
                    .Select(p => p.Name).Single(),
                Borrowers = db.Borrowers
                    .Where(b => b.ExpenseId == e.Id)
                    .Select((b, i) => new BorrowerResponse
                    {
                        ParticipantId = b.ParticipantId,
                        FuAmount = b.MuAmount.ToFuAmount(),
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
    public static async Task<Results<Ok<BalanceItem[]>, ValidationProblem>> PartyBalanceGet(
        string? partyId,
        GenericValidator validator,
        ExpenseDb db)
    {
        if (!validator.IsValid(IdUtil.DefaultId, partyId, out var validationResult))
            return TypedResults.ValidationProblem(validationResult.ToDictionary());

        var balanceQuery = db.Participants.Where(pp => pp.PartyId == partyId)
            .Select(pp => new BalanceItem
            {
                ParticipantId = pp.Id,
                ParticipantName = pp.Name,
                Amount = (
                    db.Expenses
                        .Where(e => e.LenderId == pp.Id)
                        .Select(e => e.MuAmount)
                        .Sum()
                    - db.Borrowers
                        .Where(b=> b.ParticipantId == pp.Id)
                        .Select(b=> b.MuAmount)
                        .Sum()
                    ).ToFuAmount()
            });

        return TypedResults.Ok(await balanceQuery.ToArrayAsync());
    }

    /// <summary>
    /// Creates User/Party association
    /// </summary>
    public static async Task UpsertUserPartyVisibility(string? userId, string partyId, ExpenseDb db)
    {
        await db.UserParty
            .Merge()
            .Using([new UserParty
            {
                UserId = userId!,
                PartyId = partyId
            }])
            .OnTargetKey()
            .InsertWhenNotMatched(s=>s)
            .MergeAsync();                
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
    
}