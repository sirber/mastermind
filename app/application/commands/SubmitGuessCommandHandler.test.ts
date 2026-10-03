import { describe, expect, it, vi } from 'vitest';
import type { Game } from '../../domain/game/entities/Game';
import type { GameRepository } from '../contracts/GameRepository';
import { SubmitGuessCommandHandler } from './SubmitGuessCommandHandler';
import { GameNotFoundError } from '../../domain/game/errors/GameNotFoundError';

function makeGame(): Game {
  return {
    id: 'game-1',
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
        guess: { colors: ['red', 'blue', 'green', 'yellow'] },
      })
    ).rejects.toBeInstanceOf(GameNotFoundError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
