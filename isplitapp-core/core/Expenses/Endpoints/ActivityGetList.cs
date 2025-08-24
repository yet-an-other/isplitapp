using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Infrastructure;
using LinqToDB;
using Microsoft.AspNetCore.Mvc;

namespace IB.ISplitApp.Core.Expenses.Endpoints;

/// <summary>
/// Returns activities in specified party
/// </summary>
public class ActivityGetList: IEndpoint
{
    public string PathPattern => "/parties/{partyId}/activities";
    public string Method => "GET";
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder.WithName("GetActivityList");

    public Delegate Endpoint => async (
        [FromRoute(Name = "partyId")] string? rawPartyId,
        RequestValidator validator,
        ExpenseDb db) =>
    {
        validator
            .TryParseId(rawPartyId, out var partyId, "partyId")
            .ThrowOnError();

        var activities = await db.ActivityLogs
            .Where(a => a.PartyId == partyId)
            .OrderByDescending(a => a.Created)
            .Select(a => new ActivityInfo
            {
                Id = a.Id,
                ActivityType = a.ActivityType,
                Description = a.Description,
                Created = a.Created,
                Timestamp = a.Timestamp,
                EntityId = a.EntityId,
                DeviceId = a.DeviceId
            }).ToArrayAsync();

        return TypedResults.Ok(activities);
    };
}