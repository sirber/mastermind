import { prisma } from '../prisma';
import type { PlayerRepository } from '../application/contracts/PlayerRepository';
import type { Player } from '../domain/player/entities/Player';
import { Email } from '../domain/player/valueObjects/Email';

export class PrismaPlayerRepository implements PlayerRepository {
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
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): Player {
    return {
      id: record.id,
      email: Email.create(record.email),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
