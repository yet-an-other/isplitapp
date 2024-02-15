using LinqToDB.Mapping;

namespace IB.ISplitApp.Core.Expenses.Data;

public enum SplitMode
{
    [MapValue("Evenly")]
    Evenly = 0,
    
    [MapValue("ByShare")]
    ByShare = 1,
    
    [MapValue("ByPercentage")]
    ByPercentage = 2,    
    
    [MapValue("ByAmount")]
    ByAmount = 3,
}