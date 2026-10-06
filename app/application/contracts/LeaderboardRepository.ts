import type { RegisteredWinStatistics } from './RegisteredWinStatistics';

export interface LeaderboardRepository {
  // Only persisted won games belonging to players with a non-null email.
  registeredWins(): Promise<RegisteredWinStatistics[]>;
}
