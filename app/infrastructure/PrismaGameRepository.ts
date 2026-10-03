import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../prisma';
import type { GameRepository } from '../application/contracts/GameRepository';
import type { Game } from '../domain/game/entities/Game';
import type { Feedback } from '../domain/game/valueObjects/Feedback';
import type { Guess } from '../domain/game/valueObjects/Guess';
import type { SecretCode } from '../domain/game/valueObjects/SecretCode';
import type { GameStatus } from '../domain/game/contracts/GameStatus';

export class PrismaGameRepository implements GameRepository {
  async create(game: Game): Promise<void> {
    await prisma.game.create({
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
    });
  }

  async findById(gameId: string): Promise<Game | null> {
    const record = await prisma.game.findUnique({ where: { id: gameId } });
    if (!record) return null;

    return {
      id: record.id,
      secretCode: record.secretCode as unknown as SecretCode,
      maxAttempts: record.maxAttempts,
      attemptsUsed: record.attemptsUsed,
      guesses: record.guesses as unknown as Guess[],
      feedbacks: record.feedbacks as unknown as Feedback[],
      status: record.status as GameStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
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
