import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../prisma';
import type { GameRepository } from '../application/contracts/GameRepository';
import type { Game } from '../domain/game/entities/Game';
import { PersistedGameMapper } from './PersistedGameMapper';

export class PrismaGameRepository implements GameRepository {
  async create(game: Game, playerId: string): Promise<void> {
    await prisma.$transaction([
      prisma.game.create({
        data: {
          id: game.id,
          secretCode: game.secretCode as unknown as Prisma.InputJsonValue,
          maxAttempts: game.maxAttempts,
          attemptsUsed: game.attemptsUsed,
          guesses: game.guesses as unknown as Prisma.InputJsonValue,
          feedbacks: game.feedbacks as unknown as Prisma.InputJsonValue,
          status: game.status,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        },
      }),
      prisma.gamePlayer.create({ data: { gameId: game.id, playerId } }),
    ]);
  }

  async findById(gameId: string, playerId: string): Promise<Game | null> {
    const record = await prisma.game.findFirst({
      where: { id: gameId, players: { some: { playerId } } },
    });
    if (!record) return null;

    return PersistedGameMapper.toDomain(record);
  }

  async save(game: Game): Promise<void> {
    await prisma.game.update({
      where: { id: game.id },
      data: {
        secretCode: game.secretCode as unknown as Prisma.InputJsonValue,
        maxAttempts: game.maxAttempts,
        attemptsUsed: game.attemptsUsed,
        guesses: game.guesses as unknown as Prisma.InputJsonValue,
        feedbacks: game.feedbacks as unknown as Prisma.InputJsonValue,
        status: game.status,
      },
    });
  }
}
