import { describe, expect, it, vi } from 'vitest';
import { loader } from './api.leaderboard';
import { getLeaderboard } from '../api/leaderboardHandlers';

vi.mock('../api/leaderboardHandlers', () => ({ getLeaderboard: { handle: vi.fn() } }));

describe('GET /api/leaderboard', () => {
  it('returns public ranking without requiring a session and prevents stale caching', async () => {
    const entries = [{ rank: 1, displayName: 'Joueur abc', wins: 2, averageGuesses: 3 }];
    vi.mocked(getLeaderboard.handle).mockResolvedValueOnce(entries);
    const response = await loader();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ entries });
  });
});
