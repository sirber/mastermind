import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { loader as getGameAction } from './api.games.$gameId';
import { action as startGameAction } from './api.games';
import { action as submitGuessAction } from './api.games.$gameId.guesses';
import { PrismaGameRepository } from '../infrastructure/PrismaGameRepository';
import { prisma } from '../prisma';
import type { Color } from '../domain/game/valueObjects/Color';
import { action as sessionAction } from './api.session';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to run database-backed integration tests');
}

const createdGameIds: string[] = [];
let createdPlayerId: string | null = null;
const games = new PrismaGameRepository();

describe('game API integration', () => {
  afterEach(async () => {
    if (createdGameIds.length > 0) {
      await prisma.game.deleteMany({ where: { id: { in: createdGameIds } } });
    }
    if (createdPlayerId) {
      await prisma.player.delete({ where: { id: createdPlayerId } });
      createdPlayerId = null;
    }
    createdGameIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists games created and updated through the API handlers', async () => {
    const email = `integration-${randomUUID()}@example.com`;
    const loginResponse = await sessionAction({
      request: new Request('http://local/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
    } as never);
    expect(loginResponse.status).toBe(200);
    const { player } = (await loginResponse.json()) as { player: { id: string; email: string } };
    createdPlayerId = player.id;
    const sessionCookie = loginResponse.headers.get('Set-Cookie')!.split(';')[0];
    const returningLogin = await sessionAction({
      request: new Request('http://local/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toUpperCase() }),
      }),
    } as never);
    expect((await returningLogin.json()).player.id).toBe(player.id);

    const createResponse = await startGameAction({
      request: new Request('http://local/api/games', {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      }),
    } as never);
    expect(createResponse.status).toBe(201);
    const { gameId } = (await createResponse.json()) as { gameId: string };
    createdGameIds.push(gameId);

    const persistedGame = await games.findById(gameId, player.id);
    expect(persistedGame).not.toBeNull();
    await expect(games.findById(gameId, 'another-player')).resolves.toBeNull();

    const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const guess = persistedGame!.secretCode.colors.map((secretColor) =>
      colors.find((color) => color !== secretColor)
    ) as [Color, Color, Color, Color];
    const submitResponse = await submitGuessAction({
      params: { gameId },
      request: new Request(`http://local/api/games/${gameId}/guesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ colors: guess }),
      }),
    } as never);

    expect(submitResponse.status).toBe(200);
    expect(await submitResponse.json()).toMatchObject({ success: true, gameStatus: 'in_progress' });

    const readResponse = await getGameAction({
      params: { gameId },
      request: new Request(`http://local/api/games/${gameId}`, {
        headers: { Cookie: sessionCookie },
      }),
    } as never);
    expect(readResponse.status).toBe(200);
    const gameView = await readResponse.json();
    expect(gameView).toMatchObject({
      id: gameId,
      attemptsUsed: 1,
      guesses: [{ colors: guess }],
      status: 'in_progress',
    });
    expect(gameView).not.toHaveProperty('solution');
  });
});
