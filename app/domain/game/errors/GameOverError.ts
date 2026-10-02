import { GameError } from './GameError';

export class GameOverError extends GameError {
  constructor() {
    super('Game is already over');
  }
}
