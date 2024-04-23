using HttpMethod = Microsoft.AspNetCore.Server.Kestrel.Core.Internal.Http.HttpMethod;

namespace IB.ISplitApp.Core.Infrastructure;

/// <summary>
/// Need to implement by every endpoint in minimap
/// IEndpoint implementation should contain exactly one Minimal API endpoint definition.
/// </summary>
public interface IEndpoint
{
    // /// <summary>
    // /// Endpoint logic implementation
    // /// </summary>
    // /// <param name="app">Use to call MapGet, MapPost, etc.</param>
    // void MapEndpoint(IEndpointRouteBuilder app);
    
    public string PathPattern { get; }

    public string Method { get; }

    public Delegate Endpoint { get; }

    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder;
    
}