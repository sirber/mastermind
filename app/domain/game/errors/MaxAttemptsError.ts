import { GameError } from './GameError';

export class MaxAttemptsError extends GameError {
  constructor() {
    super('Maximum attempts reached');
  }
}
