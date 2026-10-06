import { describe, expect, it, vi } from 'vitest';
import type { GameRepository } from '../contracts/GameRepository';
import { GetGameQueryHandler } from './GetGameQueryHandler';

describe('GetGameQueryHandler', () => {
  it('returns game progress without exposing the secret code', async () => {
    const repository: GameRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'game-1',
        secretCode: { colors: ['red', 'blue', 'green', 'yellow'] },
        maxAttempts: 10,
        attemptsUsed: 1,
        guesses: [{ colors: ['orange', 'orange', 'orange', 'orange'] }],
        feedbacks: [{ pegs: ['empty', 'empty', 'empty', 'empty'] }],
        status: 'in_progress',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
      save: vi.fn(),
    };

    const result = await new GetGameQueryHandler(repository).handle('game-1', 'player-1');

    expect(result).toMatchObject({ id: 'game-1', attemptsUsed: 1, status: 'in_progress' });
    expect(result).not.toHaveProperty('secretCode');
  });
});
