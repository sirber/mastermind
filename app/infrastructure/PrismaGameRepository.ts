import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../prisma';
import type { GameRepository } from '../application/contracts/GameRepository';
import type { Game } from '../domain/game/entities/Game';
import { PersistedGameMapper } from './PersistedGameMapper';
import { GameConflictError } from '../domain/game/errors/GameConflictError';
import { GameService } from '../domain/game/services/GameService';

export class PrismaGameRepository implements GameRepository {
  async create(game: Game, playerId: string): Promise<void> {
    GameService.validateGame(game);
    await prisma.$transaction([
      prisma.game.create({
        data: {
          id: game.id,
          version: game.version,
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
    GameService.validateGame(game);
    const result = await prisma.game.updateMany({
      where: { id: game.id, version: game.version },
      data: {
        version: { increment: 1 },
        attemptsUsed: game.attemptsUsed,
        guesses: game.guesses as unknown as Prisma.InputJsonValue,
        feedbacks: game.feedbacks as unknown as Prisma.InputJsonValue,
        status: game.status,
      },
    });
    if (result.count !== 1) throw new GameConflictError();
    game.version++;
  }
}
