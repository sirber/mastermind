import { randomUUID } from 'node:crypto';
import { Email } from '../../domain/player/valueObjects/Email';
import type { PlayerRepository } from '../contracts/PlayerRepository';

export class LoginWithEmailCommandHandler {
  private readonly players: PlayerRepository;

  constructor(players: PlayerRepository) {
    this.players = players;
  }

  async handle(email: string) {
    return this.players.getOrCreate(Email.create(email), randomUUID());
  }
}
