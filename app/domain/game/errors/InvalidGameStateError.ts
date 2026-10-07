export class InvalidGameStateError extends Error {
  constructor(readonly field: string) {
    super(`Invalid game state: ${field}`);
    this.name = 'InvalidGameStateError';
  }
}
