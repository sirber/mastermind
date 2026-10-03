import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loader } from './api.games.$gameId';
import { getGame } from '../api/gameHandlers';
import { GameNotFoundError } from '../domain/game/errors/GameNotFoundError';
import type { GameView } from '../application/contracts/GameView';

vi.mock('../api/gameHandlers', () => ({
  startGame: { handle: vi.fn() },
  submitGuess: { handle: vi.fn() },
  getGame: { handle: vi.fn() },
}));

describe('GET /api/games/:gameId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns public game state', async () => {
    const view = {
      id: 'game-1',
      status: 'in_progress',
      attemptsUsed: 0,
      maxAttempts: 10,
      guesses: [],
      feedbacks: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    } satisfies GameView;
    vi.mocked(getGame.handle).mockResolvedValue(view);

    const response = await loader({ params: { gameId: 'game-1' } } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(view);
    expect(getGame.handle).toHaveBeenCalledWith('game-1');
  });

  it('returns 404 for an unknown game', async () => {
    vi.mocked(getGame.handle).mockRejectedValue(new GameNotFoundError('missing'));

    const response = await loader({ params: { gameId: 'missing' } } as never);

    expect(response.status).toBe(404);
  });
});
