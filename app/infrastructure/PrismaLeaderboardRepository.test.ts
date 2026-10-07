import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../prisma';
import { PrismaLeaderboardRepository } from './PrismaLeaderboardRepository';

vi.mock('../prisma', () => ({ prisma: { $queryRaw: vi.fn() } }));

describe('PrismaLeaderboardRepository', () => {
  beforeEach(() => vi.clearAllMocks());
  it('orders aggregates in SQL before applying a parameterized result bound', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    await new PrismaLeaderboardRepository().registeredWins(2);
    const [strings, limit] = vi.mocked(prisma.$queryRaw).mock.calls[0];
    const sql = (strings as TemplateStringsArray).join('?');
    expect(sql).toMatch(
      /ORDER BY COUNT\(\*\) DESC, AVG\(g\."attemptsUsed"\) ASC, p\."id" COLLATE "C" ASC\s+LIMIT \?/
    );
    expect(limit).toBe(2);
    expect(sql).toContain('p."email" IS NOT NULL');
    expect(sql).not.toContain('secretCode');
  });
  it.each([0, -1, 101, 1.5, NaN])('rejects invalid limits: %s', async (limit) => {
    await expect(new PrismaLeaderboardRepository().registeredWins(limit)).rejects.toThrow(
      RangeError
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
