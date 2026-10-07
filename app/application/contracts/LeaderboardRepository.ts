import type { RegisteredWinStatistics } from './RegisteredWinStatistics';

export interface LeaderboardRepository {
  // Only persisted won games belonging to players with a non-null email.
  // Ordered by wins DESC, exact average ASC, then player ID in C collation ASC.
  registeredWins(_limit?: number): Promise<RegisteredWinStatistics[]>;
}
