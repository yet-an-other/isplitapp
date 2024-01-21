
-- Create tables
--
CREATE TABLE party(
                      id text NOT NULL,
                      name text NOT NULL,
                      currency text NOT NULL,
                      created timestamp without time zone default (now() at time zone 'utc') NOT NULL,
                      updated timestamp without time zone default (now() at time zone 'utc') NOT NULL,

                      PRIMARY KEY(id)
);

-- Participants
--
CREATE TABLE participant(
                            id text NOT NULL,
                            party_id text NOT NULL,
                            name text NOT NULL,

                            PRIMARY KEY(id),
                            CONSTRAINT fk_participant_paty FOREIGN KEY(party_id) REFERENCES party(id)
);
CREATE INDEX IX_participant_party_id ON "participant" USING btree ("party_id");

-- Associations Users & Groups
--
CREATE TABLE user_party(
                           id SERIAL NOT NULL,
                           user_id text NOT NULL,
                           party_id text NOT NULL,

                           PRIMARY KEY(user_id, party_id),
                           CONSTRAINT fk_user_party_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE
);

-- Expenses
--
CREATE TABLE expense(
                        id text NOT NULL,
                        party_id text NOT NULL,
                        title text NOT NULL,
                        amount bigint NOT NULL,
                        "date" timestamp without time zone default (now() at time zone 'utc') NOT NULL,
                        is_reimbursement boolean NOT NULL,
                        lender_id text,

                        PRIMARY KEY(id),
                        CONSTRAINT fk_expense_party FOREIGN KEY(party_id) REFERENCES party(id),
                        CONSTRAINT fk_expense_participant FOREIGN KEY(lender_id) REFERENCES participant(id)
);
CREATE INDEX IX_expense_party_id ON "expense" USING btree ("party_id");

CREATE TABLE borrower(
                         id SERIAL NOT NULL,
                         expense_id text NOT NULL,
                         participant_id text NOT NULL,
                         amount bigint default(0) NOT NULL,
                         shared_part int default(1) NOT NULL,
                         percent int default(0) NOT NULL,

                         PRIMARY KEY(id),
                         CONSTRAINT fk_borrower_expense FOREIGN KEY(expense_id) REFERENCES expense(id),
                         CONSTRAINT fk_borrower_participant FOREIGN KEY (participant_id) REFERENCES participant(id)
);
CREATE INDEX IX_borrower_expense_id ON "borrower" USING btree ("expense_id");