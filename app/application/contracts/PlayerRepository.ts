import type { Player } from '../../domain/player/entities/Player';
import type { Email } from '../../domain/player/valueObjects/Email';

export interface PlayerRepository {
  getOrCreate(_email: Email, _newPlayerId: string): Promise<Player>;
  findById(_playerId: string): Promise<Player | null>;
}
