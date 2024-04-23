namespace IB.Utils.Ids.FidProviders;

/// <summary>
/// Implements <see cref="IFidProvider"/> that returns constant factory Id given in a constructor
/// </summary>
public class ConstFidProvider(uint factoryId) : IFidProvider
{
    /// <summary>
    /// Returns factory id that was specified on object creation 
    /// </summary>
    /// <param name="maxFactoryId">maximum possible factory id</param>
    /// <exception cref="ApplicationException">If factoryId is greater than maximum possible factory id</exception>
    public uint GetFactoryId(uint maxFactoryId)
    {
        if (factoryId > maxFactoryId)
            throw new ApplicationException("Error object, factoryId can not be greater than maxFactoryId");
        
        return factoryId;
    }
}