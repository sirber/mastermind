import { beforeEach, describe, expect, it, vi } from 'vitest';
import { action } from './api.games.$gameId.guesses';
import { submitGuess } from '../api/gameHandlers';

vi.mock('../api/gameHandlers', () => ({
  startGame: { handle: vi.fn() },
  submitGuess: { handle: vi.fn() },
  getGame: { handle: vi.fn() },
}));

describe('POST /api/games/:gameId/guesses', () => {
  beforeEach(() => vi.clearAllMocks());

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
      guess: { colors: ['red', 'red', 'red', 'red'] },
    });
  });
});
