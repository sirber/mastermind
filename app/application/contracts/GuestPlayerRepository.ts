import type { Player } from '../../domain/player/entities/Player';

export interface GuestPlayerRepository {
  createGuest(_playerId: string): Promise<Player>;
}
