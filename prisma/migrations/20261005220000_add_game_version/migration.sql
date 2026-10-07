-- Additive: existing histories, ownership, IDs and cookies remain unchanged.
ALTER TABLE "Game" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;