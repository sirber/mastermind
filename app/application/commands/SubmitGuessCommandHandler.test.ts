import { describe, expect, it, vi } from 'vitest';
import type { Game } from '../../domain/game/entities/Game';
import type { GameRepository } from '../contracts/GameRepository';
import { SubmitGuessCommandHandler } from './SubmitGuessCommandHandler';
import { GameNotFoundError } from '../../domain/game/errors/GameNotFoundError';
import { GameConflictError } from '../../domain/game/errors/GameConflictError';

function makeGame(): Game {
  return {
    id: 'game-1',
    version: 0,
    secretCode: { colors: ['red', 'blue', 'green', 'yellow'] },
    maxAttempts: 10,
    attemptsUsed: 0,
    guesses: [],
    feedbacks: [],
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('SubmitGuessCommandHandler', () => {
  it('reports one conflict for simultaneous stale submissions without losing history; a reload can retry', async () => {
    let persisted = makeGame();
    const repository: GameRepository = {
      create: vi.fn(),
      findById: async () => structuredClone(persisted),
      save: async (game) => {
        if (game.version !== persisted.version) throw new GameConflictError();
        game.version++;
        persisted = structuredClone(game);
      },
    };
    const handler = new SubmitGuessCommandHandler(repository);
    const command = {
      gameId: persisted.id,
      playerId: 'player-1',
      guess: { colors: ['red', 'red', 'red', 'red'] as const },
    };
    const submit = () =>
      handler.handle({ ...command, guess: { colors: [...command.guess.colors] } });
    const results = await Promise.allSettled([submit(), submit()]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: new GameConflictError(),
    });
    expect(persisted.attemptsUsed).toBe(1);
    expect(persisted.version).toBe(1);
    await submit();
    expect(persisted.attemptsUsed).toBe(2);
    expect(persisted.version).toBe(2);
  });
  it('applies a guess and persists the updated game', async () => {
    const game = makeGame();
    const repository: GameRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(game),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new SubmitGuessCommandHandler(repository);

    const result = await handler.handle({
      gameId: game.id,
      playerId: 'player-1',
      guess: { colors: ['red', 'red', 'red', 'red'] },
    });

    expect(result.feedback?.pegs.filter((peg) => peg === 'black')).toHaveLength(1);
    expect(repository.save).toHaveBeenCalledWith(game);
    expect(game.attemptsUsed).toBe(1);
  });

  it('fails with a domain error when the game does not exist', async () => {
    const repository: GameRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    await expect(
      new SubmitGuessCommandHandler(repository).handle({
        gameId: 'missing',
        playerId: 'player-1',
        guess: { colors: ['red', 'blue', 'green', 'yellow'] },
      })
    ).rejects.toBeInstanceOf(GameNotFoundError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
