-- V7: Fix holiday mapping ambiguity and nullability
ALTER TABLE shared.holidays ALTER COLUMN holiday_type DROP NOT NULL;

-- Sync data between redundant columns to avoid data loss
UPDATE shared.holidays SET type = holiday_type WHERE type IS NULL AND holiday_type IS NOT NULL;
UPDATE shared.holidays SET holiday_type = type WHERE holiday_type IS NULL AND type IS NOT NULL;
