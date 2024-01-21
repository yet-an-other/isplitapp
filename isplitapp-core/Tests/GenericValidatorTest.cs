using FluentValidation;
using IB.ISplitApp.Core.Utils;
using Microsoft.Extensions.DependencyInjection;

namespace Tests;

public class GenericValidatorTest
{
    private readonly ServiceCollection _serviceCollection = new();

    
    [Fact]
    public void ValidatorShouldReturnErrorIfOneObjectIsWrong()
    {
        // Setup
        //
        _serviceCollection.AddTransient<IValidator<ComplexObject>, ComplexObjectValidator>();
        var serviceProvider = _serviceCollection.BuildServiceProvider();

        var validator = new GenericValidator(serviceProvider);
        var complexObject = new ComplexObject { AnyField = "notEmpty" }; 
        
        // Act
        //
        var validationStatus = validator.IsValid(IdUtil.NewId(), "wrongId", complexObject, out var validationResult);
        
        // Assert
        //
        Assert.False(validationStatus);
        Assert.Collection(validationResult.Errors, i => string.IsNullOrEmpty(i.ErrorMessage));
    }
    
    [Fact]
    public void ValidatorShouldReturnAllErrorsIfAllObjectAreWrong()
    {
        // Setup
        //
        _serviceCollection.AddTransient<IValidator<ComplexObject>, ComplexObjectValidator>();
        var serviceProvider = _serviceCollection.BuildServiceProvider();

        var validator = new GenericValidator(serviceProvider);
        var complexObject = new ComplexObject { AnyField = string.Empty}; 
        
        // Act
        //
        var validationStatus = validator.IsValid("wrongId1", "wrongId2", complexObject, out var validationResult);
        
        // Assert
        //
        Assert.False(validationStatus);
        Assert.Collection(validationResult.Errors, 
            i => string.IsNullOrEmpty(i.ErrorMessage),
            i => string.IsNullOrEmpty(i.ErrorMessage),
            i => string.IsNullOrEmpty(i.ErrorMessage));
    }    
    
    [Fact]
    public void ValidatorShouldReturnTrueIfAllValid()
    {
        // Setup
        //
        _serviceCollection.AddTransient<IValidator<ComplexObject>, ComplexObjectValidator>();
        var serviceProvider = _serviceCollection.BuildServiceProvider();

        var validator = new GenericValidator(serviceProvider);
        var complexObject = new ComplexObject { AnyField = "not empty"}; 
        
        // Act
        //
        var validationStatus = validator.IsValid(IdUtil.NewId(), IdUtil.NewId(), complexObject, out var validationResult);
        
        // Assert
        //
        Assert.True(validationStatus);
        Assert.Empty(validationResult.Errors);
    }     
}


public class ComplexObject
{
    public string AnyField { get; set; } = string.Empty;
}

public class ComplexObjectValidator : AbstractValidator<ComplexObject>
{
    public ComplexObjectValidator()
    {
        RuleFor(c => c.AnyField).NotEmpty();
    }
}