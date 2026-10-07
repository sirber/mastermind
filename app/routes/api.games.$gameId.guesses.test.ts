import { beforeEach, describe, expect, it, vi } from 'vitest';
import { action } from './api.games.$gameId.guesses';
import { submitGuess } from '../api/gameHandlers';
import { GameConflictError } from '../domain/game/errors/GameConflictError';

vi.mock('../api/gameHandlers', () => ({
  startGame: { handle: vi.fn() },
  submitGuess: { handle: vi.fn() },
  getGame: { handle: vi.fn() },
}));

vi.mock('../api/playerSession', () => ({ playerIdFromRequest: vi.fn(() => 'player-1') }));

describe('POST /api/games/:gameId/guesses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 409 when another request has already saved this version', async () => {
    vi.mocked(submitGuess.handle).mockRejectedValueOnce(new GameConflictError());
    const response = await action({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1/guesses', {
        method: 'POST',
        body: JSON.stringify({ colors: ['red', 'red', 'red', 'red'] }),
      }),
    } as never);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: new GameConflictError().message });
  });

  it('rejects malformed guesses', async () => {
    const response = await action({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1/guesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: ['red', 'not-a-color'] }),
      }),
    } as never);

    expect(response.status).toBe(400);
    expect(submitGuess.handle).not.toHaveBeenCalled();
  });

  it('submits valid guesses through the command handler', async () => {
    vi.mocked(submitGuess.handle).mockResolvedValue({
      success: true,
      feedback: { pegs: ['black', 'empty', 'empty', 'empty'] },
      gameStatus: 'in_progress',
    });

    const response = await action({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1/guesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: ['red', 'red', 'red', 'red'] }),
      }),
    } as never);

    expect(response.status).toBe(200);
    expect(submitGuess.handle).toHaveBeenCalledWith({
      gameId: 'game-1',
      playerId: 'player-1',
      guess: { colors: ['red', 'red', 'red', 'red'] },
    });
  });

  it('requires a signed-in player', async () => {
    const { playerIdFromRequest } = await import('../api/playerSession');
    vi.mocked(playerIdFromRequest).mockReturnValueOnce(null);

    const response = await action({
      params: { gameId: 'game-1' },
      request: new Request('http://local/api/games/game-1/guesses', { method: 'POST' }),
    } as never);

    expect(response.status).toBe(401);
    expect(submitGuess.handle).not.toHaveBeenCalled();
  });
});
