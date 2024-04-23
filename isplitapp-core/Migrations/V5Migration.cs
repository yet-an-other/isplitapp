namespace Migrations;

using FluentMigrator;

[Migration(5, "v5 - major refactoring with rename")]
public class V5Migration: Migration
{
    public override void Up()
    {
        Execute.EmbeddedScript("Migrations.SqlMigrations.v5-Up.sql");
    }

    public override void Down()
    {
        
    }
}