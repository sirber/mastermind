import type { Game } from '../../domain/game/entities/Game';

export interface GameRepository {
  create(_game: Game): Promise<void>;
  findById(_gameId: string): Promise<Game | null>;
  save(_game: Game): Promise<void>;
}
