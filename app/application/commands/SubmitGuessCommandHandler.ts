import { GameService } from '../../domain/game/services/GameService';
import { GameNotFoundError } from '../../domain/game/errors/GameNotFoundError';
import type { SubmitGuessCommand } from '../../domain/game/contracts/SubmitGuessCommand';
import type { SubmitGuessResult } from '../../domain/game/contracts/SubmitGuessResult';
import type { GameRepository } from '../contracts/GameRepository';

export class SubmitGuessCommandHandler {
  private readonly games: GameRepository;

  constructor(games: GameRepository) {
    this.games = games;
  }

  async handle(command: SubmitGuessCommand): Promise<SubmitGuessResult> {
    const game = await this.games.findById(command.gameId, command.playerId);
    if (!game) throw new GameNotFoundError(command.gameId);

    const result = GameService.submitGuess(game, command.guess);
    await this.games.save(game);
    return result;
  }
}
