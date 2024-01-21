namespace IB.ISplitApp.Core.Expenses;


public static class AmountExtension
{
    public const long MicroUnitSize = 100;
    
    public static long ToMuAmount(this decimal fuAmount)
    {
        return (long)(fuAmount * MicroUnitSize);
    }
    
    public static decimal ToFuAmount(this long muAmount)
    {
        return (decimal)muAmount / MicroUnitSize;
    }
}