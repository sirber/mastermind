import { prisma } from '../prisma';
import type { LeaderboardRepository } from '../application/contracts/LeaderboardRepository';
import type { RegisteredWinStatistics } from '../application/contracts/RegisteredWinStatistics';

export class PrismaLeaderboardRepository implements LeaderboardRepository {
  registeredWins(): Promise<RegisteredWinStatistics[]> {
    // Aggregate only the required columns; never load email addresses or secret codes.
    return prisma.$queryRaw<RegisteredWinStatistics[]>`
      SELECT p."id" AS "playerId", COUNT(*)::integer AS "wins",
             SUM(g."attemptsUsed")::integer AS "totalGuesses"
      FROM "Player" p
      JOIN "GamePlayer" gp ON gp."playerId" = p."id"
      JOIN "Game" g ON g."id" = gp."gameId"
      WHERE p."email" IS NOT NULL AND g."status" = 'won'
      GROUP BY p."id"
    `;
  }
}
