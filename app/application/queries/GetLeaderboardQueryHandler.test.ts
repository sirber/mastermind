import { describe, expect, it, vi } from 'vitest';
import { GetLeaderboardQueryHandler } from './GetLeaderboardQueryHandler';

describe('GetLeaderboardQueryHandler', () => {
  it('returns an empty leaderboard when nobody has won', async () => {
    const repository = { registeredWins: vi.fn().mockResolvedValue([]) };
    await expect(new GetLeaderboardQueryHandler(repository).handle()).resolves.toEqual([]);
    expect(repository.registeredWins).toHaveBeenCalledWith(100);
  });

  it('preserves repository ranking and generates stable aliases and sequential ranks', async () => {
    const repository = {
      registeredWins: vi.fn().mockResolvedValue([
        { playerId: 'c', wins: 3, totalGuesses: 6 },
        { playerId: 'a', wins: 3, totalGuesses: 12 },
        { playerId: 'b', wins: 3, totalGuesses: 12 },
        { playerId: 'z', wins: 2, totalGuesses: 6 },
      ]),
    };
    const entries = await new GetLeaderboardQueryHandler(repository).handle();
    expect(
      entries.map(({ rank, wins, averageGuesses }) => ({ rank, wins, averageGuesses }))
    ).toEqual([
      { rank: 1, wins: 3, averageGuesses: 2 },
      { rank: 2, wins: 3, averageGuesses: 4 },
      { rank: 3, wins: 3, averageGuesses: 4 },
      { rank: 4, wins: 2, averageGuesses: 3 },
    ]);
    expect(entries[1].displayName).toBe(
      (
        await new GetLeaderboardQueryHandler({
          registeredWins: async () => [{ playerId: 'a', wins: 1, totalGuesses: 1 }],
        }).handle()
      )[0].displayName
    );
    expect(entries[1].displayName).not.toBe(entries[2].displayName);
    expect(Object.keys(entries[0]).sort()).toEqual([
      'averageGuesses',
      'displayName',
      'rank',
      'wins',
    ]);
    expect(entries[0].displayName).toMatch(/^Joueur [0-9a-f]{16}$/);
  });
});
