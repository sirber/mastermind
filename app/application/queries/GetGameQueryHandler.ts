import { GameNotFoundError } from '../../domain/game/errors/GameNotFoundError';
import type { GameRepository } from '../contracts/GameRepository';
import type { GameView } from '../contracts/GameView';

export class GetGameQueryHandler {
  private readonly games: GameRepository;

  constructor(games: GameRepository) {
    this.games = games;
  }

  async handle(gameId: string): Promise<GameView> {
    const game = await this.games.findById(gameId);
    if (!game) throw new GameNotFoundError(gameId);

    return {
      id: game.id,
      maxAttempts: game.maxAttempts,
      attemptsUsed: game.attemptsUsed,
      guesses: game.guesses,
      feedbacks: game.feedbacks,
      status: game.status,
      createdAt: game.createdAt.toISOString(),
      ...(game.status === 'in_progress' ? {} : { solution: game.secretCode }),
    };
  }
}
