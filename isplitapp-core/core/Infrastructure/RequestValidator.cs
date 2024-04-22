using FluentValidation;
using FluentValidation.Results;
using IB.Utils.Ids;

namespace IB.ISplitApp.Core.Infrastructure;

/// <summary>
/// Helper on top of the FluentValidator to check all data in request
/// (including params, query, path, etc..) in one fluent statement 
/// </summary>
public class RequestValidator(IServiceProvider serviceProvider)
{ 
    /// <summary>
    /// Result of validation <see cref="ValidationResult"/>
    /// </summary>
    public ValidationResult ValidationResult { get; } = new();

    /// <summary>
    /// Returns validation status
    /// </summary>
    public bool IsValid => ValidationResult.IsValid;

    /// <summary>
    /// Flattened list of errors
    /// </summary>
    public IDictionary<string, string[]> Errors => ValidationResult.ToDictionary();

    /// <summary>
    /// Attempt to parse and validate string as <see cref="Auid"/> object
    /// </summary>
    /// <param name="sid">string representation of id</param>
    /// <param name="auid">new <see cref="Auid"/> if parsing was success</param>
    /// <param name="idName">Name of parameter to include in error</param>
    /// <returns>True if parsing was successful</returns>
    public RequestValidator TryParseId(string? sid, out Auid auid, string idName = "")
    {
        if (Auid.TryFromString(sid!, out auid))
            return this;
        
        ValidationResult
            .Errors
            .Add(new ValidationFailure(idName, $"{idName} validation error"));
        
        return this;
    }

    /// <summary>
    /// Validates business object with FluentValidator
    /// </summary>
    /// <param name="entity">Entity to validate</param>
    /// <typeparam name="T">Entity type</typeparam>
    /// <returns>The same object to chane another call</returns>
    /// <remarks>
    /// <see cref="IValidator"/> for entity should be registered in ServiceProvider
    /// </remarks>
    public RequestValidator Validate<T>(T entity)
    {
        var validator = serviceProvider.GetRequiredService<IValidator<T>>();
        var result = validator.Validate(entity);
        ValidationResult.Errors.AddRange(result.Errors);
        return this;
    }

    /// <summary>
    /// Throws if IsValid is false 
    /// </summary>
    /// <exception cref="ValidationException"> with all collected errors</exception>
    public void ThrowOnError()
    {
        if (!IsValid)
            throw new ValidationException(ValidationResult.Errors);
    }
}

