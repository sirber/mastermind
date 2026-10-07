import type { Game } from '../../domain/game/entities/Game';

export interface GameRepository {
  create(_game: Game, _playerId: string): Promise<void>;
  findById(_gameId: string, _playerId: string): Promise<Game | null>;
  // Atomically match the loaded version, increment it on success, or throw GameConflictError.
  save(_game: Game): Promise<void>;
}
