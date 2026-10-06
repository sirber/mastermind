import { randomUUID } from 'node:crypto';
import type { GuestPlayerRepository } from '../contracts/GuestPlayerRepository';
import type { Player } from '../../domain/player/entities/Player';

export class PlayAsGuestCommandHandler {
  private readonly guests: GuestPlayerRepository;

  constructor(guests: GuestPlayerRepository) {
    this.guests = guests;
  }

  handle(): Promise<Player> {
    return this.guests.createGuest(randomUUID());
  }
}
