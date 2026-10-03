import { describe, expect, it, vi } from 'vitest';
import type { GameRepository } from '../contracts/GameRepository';
import { StartGameCommandHandler } from './StartGameCommandHandler';

describe('StartGameCommandHandler', () => {
  it('creates and persists a new game, returning its id', async () => {
    const repository: GameRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new StartGameCommandHandler(repository);

    const gameId = await handler.handle();

    expect(gameId).toBeTruthy();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: gameId,
        status: 'in_progress',
        maxAttempts: 10,
      })
    );
  });
});
