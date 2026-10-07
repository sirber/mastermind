import { prisma } from '../prisma';
import type { LeaderboardRepository } from '../application/contracts/LeaderboardRepository';
import type { RegisteredWinStatistics } from '../application/contracts/RegisteredWinStatistics';
import { LEADERBOARD_LIMIT } from '../application/contracts/LeaderboardLimit';

export class PrismaLeaderboardRepository implements LeaderboardRepository {
  async registeredWins(limit = LEADERBOARD_LIMIT): Promise<RegisteredWinStatistics[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > LEADERBOARD_LIMIT) {
      throw new RangeError(`Leaderboard limit must be between 1 and ${LEADERBOARD_LIMIT}`);
    }
    // Aggregate only the required columns; never load email addresses or secret codes.
    return prisma.$queryRaw<RegisteredWinStatistics[]>`
            SELECT p."id" AS "playerId", COUNT(*)::double precision AS "wins",
              SUM(g."attemptsUsed")::double precision AS "totalGuesses"
      FROM "Player" p
      JOIN "GamePlayer" gp ON gp."playerId" = p."id"
      JOIN "Game" g ON g."id" = gp."gameId"
      WHERE p."email" IS NOT NULL AND g."status" = 'won'
      GROUP BY p."id"
      ORDER BY COUNT(*) DESC, AVG(g."attemptsUsed") ASC, p."id" COLLATE "C" ASC
      LIMIT ${limit}
    `;
  }
}
