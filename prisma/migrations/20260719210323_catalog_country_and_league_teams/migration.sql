-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- Backfill: create a Country row for every distinct existing League.country value
INSERT INTO "Country" ("id", "name", "updatedAt")
SELECT gen_random_uuid()::text, "country", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "country" FROM "League" WHERE "country" IS NOT NULL) AS distinct_countries;

-- AlterTable: League gains countryId, backfilled from the old free-text column, then drops it
ALTER TABLE "League" ADD COLUMN "countryId" TEXT;

UPDATE "League" l
SET "countryId" = c."id"
FROM "Country" c
WHERE l."country" = c."name";

ALTER TABLE "League" DROP COLUMN "country";

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Referee gains an optional countryId (no backfill source, starts null)
ALTER TABLE "Referee" ADD COLUMN "countryId" TEXT;

-- AddForeignKey
ALTER TABLE "Referee" ADD CONSTRAINT "Referee_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: implicit many-to-many between League and Team
CREATE TABLE "_LeagueToTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LeagueToTeam_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LeagueToTeam_B_index" ON "_LeagueToTeam"("B");

-- AddForeignKey
ALTER TABLE "_LeagueToTeam" ADD CONSTRAINT "_LeagueToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeagueToTeam" ADD CONSTRAINT "_LeagueToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey: remove the player-team-history feature entirely (product decision —
-- current team only, no historical spells or per-bet snapshot)
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_targetPlayerTeamAtBetId_fkey";

ALTER TABLE "PlayerTeamHistory" DROP CONSTRAINT "PlayerTeamHistory_playerId_fkey";

ALTER TABLE "PlayerTeamHistory" DROP CONSTRAINT "PlayerTeamHistory_teamId_fkey";

-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "targetPlayerTeamAtBetId";

-- DropTable
DROP TABLE "PlayerTeamHistory";
