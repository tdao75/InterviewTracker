using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExistingDatabaseBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing database schema.
            // No changes required.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Do not drop existing database tables.
        }
    }
}
