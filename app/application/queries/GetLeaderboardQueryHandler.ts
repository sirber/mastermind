import { createHash } from 'node:crypto';
import type { LeaderboardRepository } from '../contracts/LeaderboardRepository';
import type { LeaderboardEntry } from '../contracts/LeaderboardEntry';
import { LEADERBOARD_LIMIT } from '../contracts/LeaderboardLimit';

export class GetLeaderboardQueryHandler {
  private readonly repository: LeaderboardRepository;

  constructor(repository: LeaderboardRepository) {
    this.repository = repository;
  }

  async handle(): Promise<LeaderboardEntry[]> {
    // Preserve SQL's exact numeric ordering rather than re-sort rounded JS numbers.
    const statistics = await this.repository.registeredWins(LEADERBOARD_LIMIT);
    return statistics.map((entry, index) => ({
      rank: index + 1,
      // Hash the random ID, never the email: aliases cannot reveal mailbox identity.
      displayName: `Joueur ${createHash('sha256').update(entry.playerId).digest('hex').slice(0, 16)}`,
      wins: entry.wins,
      averageGuesses: entry.totalGuesses / entry.wins,
    }));
  }
}
