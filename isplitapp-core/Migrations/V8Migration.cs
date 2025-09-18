namespace Migrations;

using FluentMigrator;

[Migration(8, "v8 - add expense_attachment and draft_attachment tables")]
public class V8Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v8-Up.sql");
    }

    public override void Down()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v8-Down.sql");
    }
}
