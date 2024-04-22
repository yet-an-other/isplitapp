CREATE OR REPLACE FUNCTION s2int(IN sid text)
    RETURNS bigint
    LANGUAGE plpgsql AS
$$
DECLARE sidLen int;
    DECLARE lid bigint;
    DECLARE curCharNum int;
    DECLARE cht CHAR(1);
    DECLARE step bigint;
BEGIN
    sid = '0' || SUBSTRING(sid, 0, 11);
    sidLen = length(sid);
    lid = 0;
    for i in 1..sidLen Loop

            cht = substr(sid, sidLen - (i - 1), 1);

            IF ASCII(cht) >= 48 AND ASCII(cht) <= 57 THEN
                curCharNum = ASCII(cht) - 48;
            ELSEIF ASCII(cht) >= 65 AND ASCII(cht) <= 90 THEN
                curCharNum = ASCII(cht) - 55;
            ELSEIF ASCII(cht) >= 97 AND ASCII(cht) <= 122 THEN
                curCharNum = ASCII(cht) - 61;
            ELSE
                RAISE EXCEPTION 'Invalid character %', cht;
            END IF;

            step = pow(62, i - 1);
            lid = lid + curCharNum * step;
            -- RAISE NOTICE 'i want to print %, char %, askii %, step %, num %', lid, cht, ASCII(cht), step, curCharNum;
        End loop;
    RETURN lid;
END;
$$;

-- Associations Devices & Parties
--
CREATE TABLE device_party(
                   id SERIAL NOT NULL,
                   device_id bigint NOT NULL,
                   party_id bigint NOT NULL,
                   is_archived boolean DEFAULT false,

                   PRIMARY KEY(device_id, party_id)
                   --CONSTRAINT fk_device_party_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE ON UPDATE CASCADE 
);

-- Copy all data from legacy table
--
INSERT INTO device_party (device_id, party_id, is_archived)
SELECT s2int(user_id), s2int(party_id), is_archived
FROM user_party;
DROP TABLE user_party;

-- Update borrower
--
ALTER TABLE borrower DROP CONSTRAINT fk_borrower_participant;
ALTER TABLE borrower DROP CONSTRAINT fk_borrower_expense;

ALTER TABLE borrower ADD COLUMN participant_id_tmp bigint NOT NULL DEFAULT 0;
UPDATE borrower SET participant_id_tmp = s2int(participant_id);
ALTER TABLE borrower DROP COLUMN participant_id;
ALTER TABLE borrower RENAME COLUMN participant_id_tmp TO participant_id;

ALTER TABLE borrower ADD COLUMN expense_id_tmp bigint NOT NULL DEFAULT 0;
UPDATE borrower SET expense_id_tmp = s2int(expense_id);
ALTER TABLE borrower DROP COLUMN expense_id;
ALTER TABLE borrower RENAME COLUMN expense_id_tmp TO expense_id;

-- Update expense
-- 
ALTER TABLE expense DROP CONSTRAINT fk_expense_party;
ALTER TABLE expense DROP CONSTRAINT fk_expense_participant;

ALTER TABLE expense DROP CONSTRAINT expense_pkey;
ALTER TABLE expense ADD COLUMN id_tmp bigint NOT NULL DEFAULT 0;
UPDATE expense SET id_tmp = s2int(id);
ALTER TABLE expense DROP COLUMN id;
ALTER TABLE expense RENAME COLUMN id_tmp TO id;
ALTER TABLE expense ADD PRIMARY KEY (id);

ALTER TABLE expense ADD COLUMN lender_id_tmp bigint NOT NULL DEFAULT 0;
UPDATE expense SET lender_id_tmp = s2int(lender_id);
ALTER TABLE expense DROP COLUMN lender_id;
ALTER TABLE expense RENAME COLUMN lender_id_tmp TO lender_id;

DROP INDEX "ix_expense_party_id";
ALTER TABLE expense ADD COLUMN party_id_tmp bigint NOT NULL DEFAULT 0;
UPDATE expense SET party_id_tmp = s2int(party_id);
ALTER TABLE expense DROP COLUMN party_id;
ALTER TABLE expense RENAME COLUMN party_id_tmp TO party_id;
CREATE INDEX ix_expense_party_id ON expense(party_id);

ALTER TABLE expense ALTER COLUMN "date" TYPE timestamptz;

ALTER TABLE expense RENAME COLUMN update_timestamp TO timestamp;
ALTER TABLE expense ALTER COLUMN timestamp SET DEFAULT '0000000';
UPDATE expense SET timestamp = SUBSTRING(timestamp, 0, 8);


-- Update participant
-- 
ALTER TABLE participant DROP CONSTRAINT fk_participant_paty;
ALTER TABLE participant DROP CONSTRAINT participant_pkey;
ALTER TABLE participant ADD COLUMN id_tmp bigint NOT NULL DEFAULT 0;
UPDATE participant SET id_tmp = s2int(id);
ALTER TABLE participant DROP COLUMN id;
ALTER TABLE participant RENAME COLUMN id_tmp TO id;
ALTER TABLE participant ADD PRIMARY KEY (id);

DROP INDEX "ix_participant_party_id";
ALTER TABLE participant ADD COLUMN party_id_tmp bigint NOT NULL DEFAULT 0;
UPDATE participant SET party_id_tmp = s2int(party_id);
ALTER TABLE participant DROP COLUMN party_id;
ALTER TABLE participant RENAME COLUMN party_id_tmp TO party_id;
CREATE INDEX ix_participant_party_id ON participant(party_id);

-- Change subscription table
--
DROP INDEX "idx_subscription_user_id";
ALTER TABLE subscription ADD COLUMN device_id bigint NOT NULL DEFAULT 0;
UPDATE subscription SET device_id = s2int(user_id);
ALTER TABLE subscription DROP COLUMN user_id;
CREATE UNIQUE INDEX ix_subscription_device_id ON subscription(device_id); 


-- Update party table
-- 
ALTER TABLE party DROP CONSTRAINT party_pkey;
ALTER TABLE party ADD COLUMN id_tmp bigint NOT NULL DEFAULT 0;
UPDATE party SET id_tmp = s2int(id);
ALTER TABLE party DROP COLUMN id;
ALTER TABLE party RENAME COLUMN id_tmp TO id;
ALTER TABLE party ADD PRIMARY KEY (id);

ALTER TABLE party RENAME COLUMN update_timestamp TO timestamp;
UPDATE party SET timestamp = SUBSTRING(timestamp, 0, 8);
ALTER TABLE party ALTER COLUMN timestamp SET DEFAULT '0000000';
ALTER TABLE party ALTER COLUMN created TYPE timestamptz;
ALTER TABLE party ALTER COLUMN updated TYPE timestamptz;


-- Constraints
--
ALTER TABLE device_party ADD CONSTRAINT fk_device_party_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE borrower ADD CONSTRAINT fk_borrower_participant FOREIGN KEY(participant_id) REFERENCES participant(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE borrower ADD CONSTRAINT fk_borrower_expense FOREIGN KEY(expense_id) REFERENCES expense(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE expense ADD CONSTRAINT fk_expense_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE expense ADD CONSTRAINT fk_expense_participant FOREIGN KEY(lender_id) REFERENCES participant(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE participant ADD CONSTRAINT fk_participant_party FOREIGN KEY(party_id) REFERENCES party(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- cleanup
--

DROP FUNCTION s2int;
