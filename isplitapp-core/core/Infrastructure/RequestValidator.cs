using FluentValidation;
using FluentValidation.Results;
using IB.Utils.Ids;
using Microsoft.AspNetCore.Diagnostics;

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
        sid = TransformLegacyId(sid);
        if (Auid.TryParse(sid!, out auid))
            return this;
        
        ValidationResult
            .Errors
            .Add(new ValidationFailure(
                idName, 
                _errorMessages.TryGetValue(idName, out var error) 
                    ? error 
                    : $"{idName} validation error"));
        
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
    /// Throws ValidationError if IsValid is false 
    /// </summary>
    /// <exception cref="ValidationException"> with all collected errors</exception>
    public void ThrowOnError()
    {
        if (!IsValid)
            throw new ValidationException(ValidationResult.Errors);
    }

    /// <summary>
    /// Handle ValidationException and convert it to ValidationProblem response
    /// Must be registered in app.UseExceptionHandler;
    /// </summary>
    public static void ValidationExceptionHandler(IApplicationBuilder exApp)
    {
        exApp.Run(async context =>
        {
            if (context.RequestServices.GetService<IProblemDetailsService>() is { } problemDetailsService)
            {
                var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                switch (exceptionHandlerFeature?.Error)
                {
                    case ValidationException validationException:
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await problemDetailsService.WriteAsync(new ProblemDetailsContext
                        {
                            HttpContext = context,
                            ProblemDetails =
                            {
                                Title = "One or more validation errors occurred.",
                                Extensions =
                                    new Dictionary<string, object?>
                                    {
                                        {
                                            "errors",
                                            validationException.Errors
                                                .GroupBy(x => x.PropertyName)
                                                .ToDictionary(
                                                    g => g.Key,
                                                    g => g.Select(x => x.ErrorMessage))
                                        }

                                    },
                                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
                            }
                        });
                        break;
                    case BadHttpRequestException badRequestException:
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await problemDetailsService.WriteAsync(new ProblemDetailsContext
                        {
                            HttpContext = context,
                            ProblemDetails =
                            {
                                Title = "One or more validation errors occurred.",
                                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                                Detail = badRequestException.Message
                            }
                        });
                        break;
                }
            }
        });
    }

    private readonly Dictionary<string, string> _errorMessages = new()
    {
        { "deviceId", "The X-Device-Id header is not correct" },
        { "partyId", "The partyId is not correct" },
        { "expenseId", "The expenseId is not correct" }
    };
    
    private string? TransformLegacyId(string? legacyId)
    {
        if (legacyId?.Length == 16 &&
            (legacyId.StartsWith("CN") ||
             legacyId.StartsWith("CM") ||
             legacyId.StartsWith("CK") ||
             legacyId.StartsWith("CP")))
            return $"0{legacyId[..10]}";
        return legacyId;
    }
}

