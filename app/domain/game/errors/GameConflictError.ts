import { GameError } from './GameError';

export class GameConflictError extends GameError {
  constructor() {
    super('The game changed during submission. Reload it before trying again.');
    this.name = 'GameConflictError';
  }
}
