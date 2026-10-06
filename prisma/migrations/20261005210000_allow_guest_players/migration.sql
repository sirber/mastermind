-- Existing email players and their game associations remain unchanged.
-- PostgreSQL permits multiple NULLs in the existing unique email index.
ALTER TABLE "Player" ALTER COLUMN "email" DROP NOT NULL;
