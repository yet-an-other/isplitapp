-- Create expense_attachment table
--
CREATE TABLE IF NOT EXISTS expense_attachment (
    id bigint NOT NULL,
    expense_id bigint NOT NULL,
    file_name text NULL,
    content_type text NOT NULL,
    size_bytes int NOT NULL,
    s3_key text NOT NULL,
    created_at timestamptz DEFAULT (now() at time zone 'utc') NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_expense_attachment_expense FOREIGN KEY(expense_id) REFERENCES expense(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_expense_attachment_s3_key ON expense_attachment(s3_key);
CREATE INDEX IF NOT EXISTS ix_expense_attachment_expense_id ON expense_attachment(expense_id);

