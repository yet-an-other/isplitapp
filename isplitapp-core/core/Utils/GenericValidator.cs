using FluentValidation;
using FluentValidation.Results;

namespace IB.ISplitApp.Core.Utils;

/// <summary>
/// Service class to provide validations of simple objects like strings
/// in FluentValidator format
/// </summary>
public class GenericValidator(IServiceProvider serviceProvider)
{
    /// <summary>
    /// Check if User ID is valid 
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="result">Error description if user id is wrong</param>
    /// <returns>true if user id is valid</returns>
    public bool IsValid(string? userId, out ValidationResult result)
    {
        result = new ValidationResult();
        if (IdUtil.IsValidId(userId))
            return true;

        result.Errors.Add(
            new ValidationFailure(
                nameof(userId), 
                $"{nameof(userId)} in header {IdUtil.UserHeaderName} is empty or not valid"));

        return false;
    }

    
    /// <summary>
    /// Check if User ID and Party ID is valid 
    /// </summary>
    /// <param name="userId">Unique user ID</param>
    /// <param name="partyId">Unique party ID</param>
    /// <param name="result">Errors descriptions if something wrong</param>
    /// <returns>true if both objects are valid</returns>    
    public bool IsValid(string? userId, string? partyId, out ValidationResult result)
    {
        var isUserIdValid = IsValid(userId, out result);
        var isPartyIdValid = IdUtil.IsValidId(partyId);

        if (isPartyIdValid && isUserIdValid)
            return true;
        
        if (!isPartyIdValid)
            result.Errors.Add(
                new ValidationFailure(
                    nameof(partyId), 
                    $"{nameof(partyId)} provided in path is empty or not valid"));

        return false;
    }
    
    /// <summary>
    /// Check if Expense ID is valid 
    /// </summary>
    /// <param name="expenseId">Unique party ID</param>
    /// <param name="result">Errors descriptions if something wrong</param>
    /// <returns>true if expenseId is valid</returns>    
    public bool IsValidExpenseId(string? expenseId, out ValidationResult result)
    {
        result = new ValidationResult();
        var isExpenseIdValid = IdUtil.IsValidId(expenseId);

        if (isExpenseIdValid)
            return true;
        
        result.Errors.Add(
            new ValidationFailure(
                nameof(expenseId), 
                $"{nameof(expenseId)} provided in path is empty or not valid"));

        return false;
    }

    /// <summary>
    /// Check if User ID and complex object is valid 
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="entity">
    /// Complex object to validate via FluentValidator
    /// <see cref="IValidator{T}"/> should be registered in <see cref="IServiceCollection"/> for this object
    /// </param>
    /// <param name="result">Errors descriptions if something wrong</param>
    /// <returns>true if all objects are valid</returns>     
    public bool IsValid<T>(string? userId, T entity, out ValidationResult result)
    {
        var isIdsValid = IsValid(userId, out result);
        var validator = serviceProvider.GetRequiredService<IValidator<T>>();
        var entityValidation = validator.Validate(entity);

        if (isIdsValid && entityValidation.IsValid)
            return true;
        
        if (!entityValidation.IsValid)
            result.Errors.AddRange(entityValidation.Errors);

        return false;
    }    
    
    /// <summary>
    /// Check if User ID, Party ID and complex object are valid 
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="partyId"></param>
    /// <param name="entity">
    /// Complex object to validate via FluentValidator
    /// <see cref="IValidator{T}"/> should be registered in <see cref="IServiceCollection"/> for this object
    /// </param>
    /// <param name="result">Errors descriptions if something wrong</param>
    /// <returns>true if all objects are valid</returns>      
    public bool IsValid<T>(string? userId, string? partyId, T entity, out ValidationResult result)
    {
        var isIdsValid = IsValid(userId, partyId, out result);
        var validator = serviceProvider.GetRequiredService<IValidator<T>>();
        var entityValidation = validator.Validate(entity);

        if (isIdsValid && entityValidation.IsValid)
            return true;
        
        if (!entityValidation.IsValid)
            result.Errors.AddRange(entityValidation.Errors);

        return false;
    }
}