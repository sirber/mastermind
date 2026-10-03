import { GameError } from './GameError';

export class GameNotFoundError extends GameError {
  constructor(gameId: string) {
    super(`Game ${gameId} was not found`);
    this.name = 'GameNotFoundError';
  }
}
