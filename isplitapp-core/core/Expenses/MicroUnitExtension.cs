namespace IB.ISplitApp.Core.Expenses;

/// <summary>
/// Conversions amount between micro units and fiat 
/// </summary>
public static class MicroUnitExtension
{
    public const long MicroUnitSize = 100;
    
    /// <summary>
    /// Converts to micro-unit
    /// </summary>
    /// <param name="fuAmount">decimal amount</param>
    /// <returns>int amount</returns>
    public static long ToMuAmount(this decimal fuAmount)
    {
        return (long)(fuAmount * MicroUnitSize);
    }
    
    /// <summary>
    /// Converts to fiat
    /// </summary>
    /// <param name="muAmount">int amount</param>
    /// <returns>decimal amount</returns>
    public static decimal ToFuAmount(this long muAmount)
    {
        return (decimal)muAmount / MicroUnitSize;
    }
}