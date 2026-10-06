import type { Game } from '../../domain/game/entities/Game';

export interface GameRepository {
  create(_game: Game, _playerId: string): Promise<void>;
  findById(_gameId: string, _playerId: string): Promise<Game | null>;
  save(_game: Game): Promise<void>;
}
