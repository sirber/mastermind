import { prisma } from '../prisma';
import type { PlayerRepository } from '../application/contracts/PlayerRepository';
import type { GuestPlayerRepository } from '../application/contracts/GuestPlayerRepository';
import type { Player } from '../domain/player/entities/Player';
import { Email } from '../domain/player/valueObjects/Email';

export class PrismaPlayerRepository implements PlayerRepository, GuestPlayerRepository {
  async createGuest(playerId: string): Promise<Player> {
    return this.toDomain(await prisma.player.create({ data: { id: playerId, email: null } }));
  }

  async getOrCreate(email: Email, newPlayerId: string): Promise<Player> {
    const record = await prisma.player.upsert({
      where: { email: email.value },
      create: { id: newPlayerId, email: email.value },
      update: {},
    });

    return this.toDomain(record);
  }

  async findById(playerId: string): Promise<Player | null> {
    const record = await prisma.player.findUnique({ where: { id: playerId } });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Player {
    return {
      id: record.id,
      email: record.email === null ? null : Email.create(record.email),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
