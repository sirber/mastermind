import { beforeEach, describe, expect, it, vi } from 'vitest';
import { action } from './api.games';
import { startGame } from '../api/gameHandlers';

vi.mock('../api/gameHandlers', () => ({
  startGame: { handle: vi.fn() },
  submitGuess: { handle: vi.fn() },
  getGame: { handle: vi.fn() },
}));

vi.mock('../api/playerSession', () => ({ playerIdFromRequest: vi.fn(() => 'player-1') }));

describe('POST /api/games', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts a game and returns its id', async () => {
    vi.mocked(startGame.handle).mockResolvedValue('game-1');

    const response = await action({
      request: new Request('http://local/api/games', { method: 'POST' }),
    } as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ gameId: 'game-1' });
    expect(startGame.handle).toHaveBeenCalledWith('player-1');
  });

  it('requires a signed-in player', async () => {
    const { playerIdFromRequest } = await import('../api/playerSession');
    vi.mocked(playerIdFromRequest).mockReturnValueOnce(null);

    const response = await action({
      request: new Request('http://local/api/games', { method: 'POST' }),
    } as never);

    expect(response.status).toBe(401);
    expect(startGame.handle).not.toHaveBeenCalled();
  });
});
