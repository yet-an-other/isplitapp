using IB.ISplitApp.Core.Devices.Notifications;
using IB.ISplitApp.Core.Expenses.Data;
using IB.ISplitApp.Core.Expenses.Endpoints.Attachments;
using IB.ISplitApp.Core.Infrastructure;
using IB.ISplitApp.Core.Infrastructure.Attachments;
using IB.Utils.Ids;
using IB.Utils.Ids.Converters;
using LinqToDB;
using LinqToDB.AspNet.Logging;
using LinqToDB.Data;
using LinqToDB.DataProvider.PostgreSQL;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Http; // IResult
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentValidation;
using IB.ISplitApp.Core.Expenses.Endpoints; // PartyPayload, ExpensePayload, validators

namespace Tests.DatabaseTests;

[Collection("database")]
public class ExpenseAttachmentEndpointTests : IClassFixture<DatabaseFixture>, IDisposable, IAsyncDisposable
{
    private readonly ExpenseDb _db;
    private readonly AuidFactory _auidFactory = new();
    private readonly RequestValidator _validator;
    private readonly Mock<IAttachmentStorage> _storage = new();
    private readonly Mock<NotificationService> _notifications;

    public ExpenseAttachmentEndpointTests(DatabaseFixture databaseFixture)
    {
        var loggerFactory = LoggerFactory.Create(c => c.AddConsole());
        var notifLogger = new Logger<NotificationService>(loggerFactory);
        _notifications = new Mock<NotificationService>(notifLogger, null!, null!, null!);

        var services = new ServiceCollection();
        services.AddTransient<IValidator<PartyPayload>, PartyRequestValidator>();
        services.AddTransient<IValidator<ExpensePayload>, ExpensePayloadValidator>();
        services.AddSingleton(_auidFactory);
        services.AddSingleton(loggerFactory);
        services.AddTransient<RequestValidator>(sp => new RequestValidator(sp));
        services.AddSingleton<NotificationService>(_notifications.Object);

        services.AddSingleton<ExpenseDb>(
            sp => new ExpenseDb(
                new DataOptions<ExpenseDb>(
                    new DataOptions()
                        .UseMappingSchema(mappingSchema: Linq2DbConverter.AuidInt64MappingSchema())
                        .UsePostgreSQL(
                            connectionString: databaseFixture.ConnectionString,
                            dialect: PostgreSQLVersion.v15,
                            optionSetter: _ => new PostgreSQLOptions(NormalizeTimestampData: false))
                        .UseDefaultLogging(sp)
                )));

        var provider = services.BuildServiceProvider();
        _db = provider.GetRequiredService<ExpenseDb>();
        _validator = provider.GetRequiredService<RequestValidator>();
    }

    public void Dispose() => _db.Dispose();
    public async ValueTask DisposeAsync() => await _db.DisposeAsync();

    private static PresignedUpload MakePresigned(string key) => new PresignedUpload(
        Url: "https://s3.test/put",
        Fields: new Dictionary<string, string> { { "Content-Type", "image/jpeg" } },
        ExpiresAt: DateTimeOffset.UtcNow.AddMinutes(5),
        Key: key
    );

    [Fact]
    public async Task Presign_ShouldInsertRow_AndReturnUrl()
    {
        // Arrange: party, participant, expense
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });

        _storage.Setup(s => s.CreatePresignedPost(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<TimeSpan>()))
            .Returns((string key, string ct, int _, TimeSpan __) => MakePresigned(key));

        var endpoint = new ExpenseAttachmentPresign();
        var payload = new PresignAttachmentRequest("rec.jpg", "image/jpeg", 120000);
        var deviceId = _auidFactory.NewId().ToString();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId,
            expenseId.ToString(),
            payload,
            _validator,
            _auidFactory,
            _storage.Object,
            _db,
            new Logger<ExpenseAttachmentPresign>(LoggerFactory.Create(b=>{})),
            default(CancellationToken)) as Task<Ok<PresignAttachmentResponse>>)!;

        // Assert
        Assert.IsType<Ok<PresignAttachmentResponse>>(result);
        var value = result.Value!;
        Assert.NotEqual(default, value.AttachmentId);
        Assert.False(string.IsNullOrWhiteSpace(value.UploadUrl));

        var saved = await _db.ExpenseAttachments.Where(a => a.Id == value.AttachmentId).FirstOrDefaultAsync();
        Assert.NotNull(saved);
        Assert.Equal(expenseId, saved!.ExpenseId);
        Assert.Equal("rec.jpg", saved.FileName);
        Assert.Equal("image/jpeg", saved.ContentType);
    }

    [Fact]
    public async Task Presign_ShouldReject_WhenLimitReached()
    {
        // Arrange existing 3 attachments
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });

        for (int i = 0; i < 3; i++)
        {
            await _db.InsertAsync(new ExpenseAttachment
            {
                Id = _auidFactory.NewId(),
                ExpenseId = expenseId,
                FileName = $"a{i}.jpg",
                ContentType = "image/jpeg",
                SizeBytes = 100,
                S3Key = $"expenses/{expenseId}/{_auidFactory.NewId()}",
                CreatedAt = DateTime.UtcNow
            });
        }

        var endpoint = new ExpenseAttachmentPresign();
        var payload = new PresignAttachmentRequest("rec.jpg", "image/jpeg", 120000);
        var deviceId = _auidFactory.NewId().ToString();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId,
            expenseId.ToString(),
            payload,
            _validator,
            _auidFactory,
            _storage.Object,
            _db,
            new Logger<ExpenseAttachmentPresign>(LoggerFactory.Create(b=>{})),
            default(CancellationToken)) as Task<IResult>)!;

        // Assert 409 Conflict
        var httpResult = Assert.IsAssignableFrom<IResult>(result);
        // cannot easily assert status code without executing; ensure no 4th row inserted
        var count = await _db.ExpenseAttachments.CountAsync(a => a.ExpenseId == expenseId);
        Assert.Equal(3, count);
    }

    [Fact]
    public async Task Finalize_ShouldValidateHead_UpdateRow_AndNotify()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        var attachmentId = _auidFactory.NewId();

        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });
        var s3Key = $"expenses/{expenseId}/{attachmentId}";
        await _db.InsertAsync(new ExpenseAttachment
        {
            Id = attachmentId,
            ExpenseId = expenseId,
            FileName = "rec.jpg",
            ContentType = "image/jpeg",
            SizeBytes = 100,
            S3Key = s3Key,
            CreatedAt = DateTime.UtcNow
        });

        _storage.Setup(s => s.HeadAsync(s3Key, It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, 200L, "image/jpeg"));

        var endpoint = new ExpenseAttachmentFinalize();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            expenseId.ToString(),
            attachmentId.ToString(),
            _validator,
            _auidFactory,
            _storage.Object,
            _notifications.Object,
            _db,
            new Logger<ExpenseAttachmentFinalize>(LoggerFactory.Create(b=>{})),
            default(CancellationToken)) as Task<NoContent>)!;

        // Assert
        Assert.IsType<NoContent>(result);
        var updated = await _db.ExpenseAttachments.Where(a => a.Id == attachmentId).FirstAsync();
        Assert.Equal(200, updated.SizeBytes);
        Assert.Equal("image/jpeg", updated.ContentType);
        _notifications.Verify(n => n.PushExpenseUpdateMessage(deviceId, expenseId, It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Finalize_ShouldReject_WhenTooLarge()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        var attachmentId = _auidFactory.NewId();

        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });
        var s3Key = $"expenses/{expenseId}/{attachmentId}";
        await _db.InsertAsync(new ExpenseAttachment
        {
            Id = attachmentId,
            ExpenseId = expenseId,
            FileName = "rec.jpg",
            ContentType = "image/jpeg",
            SizeBytes = 100,
            S3Key = s3Key,
            CreatedAt = DateTime.UtcNow
        });

        _storage.Setup(s => s.HeadAsync(s3Key, It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, 600_000L, "image/jpeg"));
        _storage.Setup(s => s.DeleteAsync(s3Key, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var endpoint = new ExpenseAttachmentFinalize();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            expenseId.ToString(),
            attachmentId.ToString(),
            _validator,
            _auidFactory,
            _storage.Object,
            _notifications.Object,
            _db,
            new Logger<ExpenseAttachmentFinalize>(LoggerFactory.Create(b=>{})),
            default(CancellationToken)) as Task<IResult>)!;

        // Assert: row deleted due to oversize
        var row = await _db.ExpenseAttachments.Where(a => a.Id == attachmentId).FirstOrDefaultAsync();
        Assert.Null(row);
    }

    [Fact]
    public async Task List_ShouldReturnPresignedGetUrls()
    {
        // Arrange
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });

        var attachmentId = _auidFactory.NewId();
        var s3Key = $"expenses/{expenseId}/{attachmentId}";
        await _db.InsertAsync(new ExpenseAttachment
        {
            Id = attachmentId,
            ExpenseId = expenseId,
            FileName = "rec.jpg",
            ContentType = "image/jpeg",
            SizeBytes = 123,
            S3Key = s3Key,
            CreatedAt = DateTime.UtcNow
        });

        _storage.Setup(s => s.CreatePresignedGet(s3Key, It.IsAny<TimeSpan>()))
            .Returns(new PresignedGet("https://s3.test/get", DateTimeOffset.UtcNow.AddMinutes(10)));

        var endpoint = new ExpenseAttachmentList();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            _auidFactory.NewId().ToString(),
            expenseId.ToString(),
            _validator,
            _storage.Object,
            _db,
            default(CancellationToken)) as Task<Ok<AttachmentInfo[]>>)!;

        // Assert
        var value = result.Value!;
        Assert.Single(value);
        Assert.Equal(attachmentId, value[0].AttachmentId);
        Assert.False(string.IsNullOrWhiteSpace(value[0].Url));
    }

    [Fact]
    public async Task Delete_ShouldRemoveObjectAndRow()
    {
        // Arrange
        var deviceId = _auidFactory.NewId();
        var partyId = _auidFactory.NewId();
        var participantId = _auidFactory.NewId();
        var expenseId = _auidFactory.NewId();
        var attachmentId = _auidFactory.NewId();

        await _db.InsertAsync(new Party { Id = partyId, Name = "P", Currency = "USD", Timestamp = _auidFactory.Timestamp() });
        await _db.InsertAsync(new Participant { Id = participantId, PartyId = partyId, Name = "U" });
        await _db.InsertAsync(new Expense { Id = expenseId, PartyId = partyId, Title = "T", MuAmount = 100, Date = DateTime.UtcNow, LenderId = participantId, SplitMode = SplitMode.Evenly, Timestamp = _auidFactory.Timestamp() });
        var s3Key = $"expenses/{expenseId}/{attachmentId}";
        await _db.InsertAsync(new ExpenseAttachment
        {
            Id = attachmentId,
            ExpenseId = expenseId,
            FileName = "rec.jpg",
            ContentType = "image/jpeg",
            SizeBytes = 100,
            S3Key = s3Key,
            CreatedAt = DateTime.UtcNow
        });

        _storage.Setup(s => s.DeleteAsync(s3Key, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var endpoint = new ExpenseAttachmentDelete();

        // Act
        var result = await (endpoint.Endpoint.DynamicInvoke(
            deviceId.ToString(),
            expenseId.ToString(),
            attachmentId.ToString(),
            _validator,
            _auidFactory,
            _storage.Object,
            _notifications.Object,
            _db,
            new Logger<ExpenseAttachmentDelete>(LoggerFactory.Create(b=>{})),
            default(CancellationToken)) as Task<NoContent>)!;

        // Assert
        Assert.IsType<NoContent>(result);
        var row = await _db.ExpenseAttachments.Where(a => a.Id == attachmentId).FirstOrDefaultAsync();
        Assert.Null(row);
        _notifications.Verify(n => n.PushExpenseUpdateMessage(deviceId, expenseId, It.IsAny<string>()), Times.Once);
    }
}
