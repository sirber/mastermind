import { randomUUID } from 'node:crypto';
import { GameService } from '../../domain/game/services/GameService';
import type { GameRepository } from '../contracts/GameRepository';

export class StartGameCommandHandler {
  private readonly games: GameRepository;

  constructor(games: GameRepository) {
    this.games = games;
  }

  async handle(): Promise<string> {
    const game = GameService.createGame(randomUUID());
    await this.games.create(game);
    return game.id;
  }
}
