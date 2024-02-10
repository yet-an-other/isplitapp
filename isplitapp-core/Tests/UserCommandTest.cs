using IB.ISplitApp.Core.Users;
using IB.ISplitApp.Core.Utils;

namespace Tests;

public class UserCommandTest
{
    [Fact]
    public void LoginShouldGenerateNewIdIfEmptyOrWrongIdProvided()
    {
        // Setup
        //
        var emptyId = String.Empty;
        var wrongId = "Abdkljien";
        
        // Act
        //
        var emptyIdResult = UserCommand.Login(emptyId);
        var wrongIdResult = UserCommand.Login(wrongId);
        
        // Assert
        //
        Assert.True(IdUtil.IsValidId(emptyIdResult.Value?.Id));
        Assert.True(IdUtil.IsValidId(wrongIdResult.Value?.Id));
        Assert.NotEqual(emptyIdResult.Value?.Id, wrongIdResult.Value?.Id);
    }

    [Fact]
    public void LoginWithCorrectIdShouldReturnBackTheSame()
    {
        // Setup
        //
        var id = IdUtil.NewId();
        
        // Act
        //
        var idResult = UserCommand.Login(id);
        
        // Assert
        //
        Assert.Equal(id, idResult.Value?.Id);
    }
}