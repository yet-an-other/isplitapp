namespace IB.Utils.Ids.FidProviders;

/// <summary>
/// Contract for factory id generators
/// </summary>
public interface IFidProvider
{
    /// <summary>
    /// Should return an unique factory id within the system, to avoid duplications
    /// </summary>
    /// <param name="maxFactoryId">maximum possible value of factory id</param>
    /// <returns>
    /// The unique within system factory id
    /// </returns>
    public uint GetFactoryId(uint maxFactoryId);
}