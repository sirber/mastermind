import { GameError } from './GameError';

export class DuplicateGuessError extends GameError {
  constructor() {
    super('Duplicate guess');
  }
}
