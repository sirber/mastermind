import { createHash } from 'node:crypto';
import type { LeaderboardRepository } from '../contracts/LeaderboardRepository';
import type { LeaderboardEntry } from '../contracts/LeaderboardEntry';

export class GetLeaderboardQueryHandler {
  private readonly repository: LeaderboardRepository;

  constructor(repository: LeaderboardRepository) {
    this.repository = repository;
  }

  async handle(): Promise<LeaderboardEntry[]> {
    const statistics = await this.repository.registeredWins();
    statistics.sort(
      (left, right) =>
        right.wins - left.wins ||
        left.totalGuesses / left.wins - right.totalGuesses / right.wins ||
        (left.playerId < right.playerId ? -1 : left.playerId > right.playerId ? 1 : 0)
    );
    return statistics.map((entry, index) => ({
      rank: index + 1,
      // Hash the random ID, never the email: aliases cannot reveal mailbox identity.
      displayName: `Joueur ${createHash('sha256').update(entry.playerId).digest('hex').slice(0, 16)}`,
      wins: entry.wins,
      averageGuesses: entry.totalGuesses / entry.wins,
    }));
  }
}
