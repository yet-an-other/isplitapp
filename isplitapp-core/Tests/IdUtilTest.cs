using IB.ISplitApp.Core.Utils;

namespace Tests;

public class IdUtilTest
{
    [Fact]
    public void IsValidReturnsTrueOnCorrectAndFalseOnWrongIds()
    {
        // Setup
        //
        var generatedId = IdUtil.NewId();
        var correctId = "AbCdEfGhIjKlMnOp";
        var withDigitId = "AbCdEfGhIjKlMn2p";
        var shorterId = "AbCdEfGhIjKlMnO";
        var longerId = "AbCdEfGhIjKlMnOpQ";
        var spaceId = "AbCdEfG IjKlMnOp";
        
        // Act
        //
        var generatedIdResult = IdUtil.IsValidId(generatedId);
        var correctIdResult = IdUtil.IsValidId(correctId);
        var withDigitIdResult = IdUtil.IsValidId(withDigitId);
        var shorterIdResult = IdUtil.IsValidId(shorterId);
        var longerIdResult = IdUtil.IsValidId(longerId);
        var spaceIdResult = IdUtil.IsValidId(spaceId);
        
        
        // Assert
        //
        Assert.True(generatedIdResult);
        Assert.True(correctIdResult);
        Assert.False(withDigitIdResult);
        Assert.False(shorterIdResult);
        Assert.False(longerIdResult);
        Assert.False(spaceIdResult);       
    }


    [Fact]
    public void DefaultIdIsCorrectId()
    {
        Assert.True(IdUtil.IsValidId(IdUtil.DefaultId));
    }
}