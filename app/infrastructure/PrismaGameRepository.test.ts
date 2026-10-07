import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../prisma';
import { GameService } from '../domain/game/services/GameService';
import { PrismaGameRepository } from './PrismaGameRepository';

vi.mock('../prisma', () => ({ prisma: { game: { updateMany: vi.fn() } } }));

describe('PrismaGameRepository optimistic saves', () => {
  beforeEach(() => vi.clearAllMocks());

  it('matches the loaded version atomically and increments it after success', async () => {
    vi.mocked(prisma.game.updateMany).mockResolvedValue({ count: 1 });
    const game = GameService.createGame('game-1');
    await new PrismaGameRepository().save(game);
    expect(prisma.game.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: game.id, version: 0 },
        data: expect.objectContaining({ version: { increment: 1 } }),
      })
    );
    expect(game.version).toBe(1);
  });

  it('rejects a stale or deleted game without incrementing its version', async () => {
    vi.mocked(prisma.game.updateMany).mockResolvedValue({ count: 0 });
    const game = GameService.createGame('game-1');
    await expect(new PrismaGameRepository().save(game)).rejects.toMatchObject({
      name: 'GameConflictError',
    });
    expect(game.version).toBe(0);
  });
});
