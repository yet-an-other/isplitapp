using FluentValidation;
using IB.ISplitApp.Core.Infrastructure;
using IB.Utils.Ids;
using Microsoft.Extensions.DependencyInjection;

namespace Tests;

public class RequestValidatorTest
{
    private readonly ServiceCollection _serviceCollection = new();
    private readonly AuidFactory _auidFactory = new();


    
    [Fact]
    public void ValidatorShouldReturnErrorIfOneObjectIsWrong()
    {
        // Setup
        //
        _serviceCollection.AddTransient<IValidator<ComplexObject>, ComplexObjectValidator>();
        var serviceProvider = _serviceCollection.BuildServiceProvider();
        var complexObject = new ComplexObject { AnyField = string.Empty};
        var validator = new RequestValidator(serviceProvider);
        
        // Act
        //
        validator
            .TryParseId(_auidFactory.MinAuid.ToString(), out _, "test-id")
            .Validate(complexObject);
            
        
        // Assert
        //
        Assert.False(validator.ValidationResult.IsValid);
        Assert.Collection(validator.ValidationResult.Errors, i => string.IsNullOrEmpty(i.ErrorMessage));
    }
    
    [Fact]
    public void ValidatorShouldReturnAllErrorsIfAllObjectsAreWrong()
    {
        // Setup
        //
        _serviceCollection.AddTransient<IValidator<ComplexObject>, ComplexObjectValidator>();
        var serviceProvider = _serviceCollection.BuildServiceProvider();

        var validator = new RequestValidator(serviceProvider);
        var complexObject = new ComplexObject { AnyField = string.Empty}; 
        
        // Act
        //
        var validationStatus = validator
            .TryParseId("0", out _, "tid1")
            .Validate(complexObject)
            .TryParseId("zzzzzzzzzzzz", out _);
            
        // Assert
        //
        Assert.False(validationStatus.ValidationResult.IsValid);
        Assert.Collection(validationStatus.ValidationResult.Errors, 
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

        var validator = new RequestValidator(serviceProvider);
        var complexObject = new ComplexObject { AnyField = "not empty"};
        var idToParse = _auidFactory.NewId();
        
        // Act
        //
        var validationStatus = validator
            .TryParseId(_auidFactory.NewId().ToString(), out _)
            .Validate(complexObject)
            .TryParseId(idToParse.ToString(), out var parsedId);
        
        // Assert
        //
        Assert.True(validationStatus.ValidationResult.IsValid);
        Assert.Empty(validationStatus.ValidationResult.Errors);
        Assert.Equal(idToParse, parsedId);
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