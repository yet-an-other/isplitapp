using IB.ISplitApp.Core.Utils;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Users;

/// <summary>
/// Set of commands to execute api requests on User object
/// </summary>
public static class UserCommand
{
    /// <summary>
    /// Returns logged user
    /// </summary>
    /// <param name="userId">Optional user id</param>
    /// <returns>
    /// If correct userId is provided in header then the same user info will be returned
    /// If userId is empty then new user will be created and returned
    /// </returns>
    public static Ok<User> Login([FromHeader(Name = IdUtil.UserHeaderName)] string? userId)
    {
        
        return TypedResults
            .Ok(!IdUtil.IsValidId(userId) 
                ? new User(IdUtil.NewId()) 
                : new User(userId!));
    }
    
    public static async Task<Results<NoContent, ValidationProblem>> RegisterSubscription(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId,
        string subscriptionPayload)
    {

        return TypedResults.NoContent();
    }
    
    public static async Task<Results<NoContent, ValidationProblem>> DeleteSubscription(
        [FromHeader(Name = IdUtil.UserHeaderName)] string? userId)
    {

        return TypedResults.NoContent();
    }
}