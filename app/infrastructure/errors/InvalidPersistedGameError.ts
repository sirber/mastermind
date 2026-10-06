export class InvalidPersistedGameError extends Error {
  readonly gameId: string;
  readonly field: string;

  constructor(gameId: string, field: string) {
    super(`Persisted game "${gameId}" has invalid ${field}`);
    this.name = 'InvalidPersistedGameError';
    this.gameId = gameId;
    this.field = field;
  }
}
