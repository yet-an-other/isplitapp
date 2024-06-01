namespace IB.ISplitApp.Core.Infrastructure;

/// <summary>
/// Need to implement by every endpoint in minimap
/// IEndpoint implementation should contain exactly one Minimal API endpoint definition.
/// </summary>
public interface IEndpoint
{
    /// <summary>
    /// Url pattern for endpoint e.g. "/parties/{partyId}"
    /// </summary>
    public string PathPattern { get; }

    /// <summary>
    /// Http method for endpoint e.g. "GET"
    /// </summary>
    public string Method { get; }

    /// <summary>
    /// Endpoint definition
    /// </summary>
    public Delegate Endpoint { get; }

    /// <summary>
    /// Used to add additional configuration to endpoint
    /// </summary>
    public RouteHandlerBuilder Build(RouteHandlerBuilder builder) => builder;
    
}