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

vi.mock('../api/playerSession', () => ({ playerIdFromRequest: vi.fn(() => 'player-1') }));

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

    const response = await loader({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1'),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(view);
    expect(getGame.handle).toHaveBeenCalledWith('game-1', 'player-1');
  });

  it('returns 404 for an unknown game', async () => {
    vi.mocked(getGame.handle).mockRejectedValue(new GameNotFoundError('missing'));

    const response = await loader({
      params: { gameId: 'missing' },
      request: new Request('http://local/api/games/missing'),
    } as never);

    expect(response.status).toBe(404);
  });

  it('requires a signed-in player', async () => {
    const { playerIdFromRequest } = await import('../api/playerSession');
    vi.mocked(playerIdFromRequest).mockReturnValueOnce(null);

    const response = await loader({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1'),
    } as never);

    expect(response.status).toBe(401);
    expect(getGame.handle).not.toHaveBeenCalled();
  });
});
