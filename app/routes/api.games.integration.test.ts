import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { loader as getGameAction } from './api.games.$gameId';
import { action as startGameAction } from './api.games';
import { action as submitGuessAction } from './api.games.$gameId.guesses';
import { PrismaGameRepository } from '../infrastructure/PrismaGameRepository';
import { prisma } from '../prisma';
import type { Color } from '../domain/game/valueObjects/Color';
import { action as sessionAction, loader as sessionLoader } from './api.session';
import { loader as leaderboardLoader } from './api.leaderboard';
import { PrismaLeaderboardRepository } from '../infrastructure/PrismaLeaderboardRepository';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to run database-backed integration tests');
}

const createdGameIds: string[] = [];
const createdPlayerIds: string[] = [];
const games = new PrismaGameRepository();

describe('game API integration', () => {
  afterEach(async () => {
    if (createdGameIds.length > 0) {
      await prisma.game.deleteMany({ where: { id: { in: createdGameIds } } });
    }
    if (createdPlayerIds.length > 0) {
      await prisma.player.deleteMany({ where: { id: { in: createdPlayerIds } } });
      createdPlayerIds.length = 0;
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
    createdPlayerIds.push(player.id);
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

  it('isolates signed guests and ranks only persisted registered wins, including deterministic ties', async () => {
    async function identity(guest: boolean) {
      const response = await sessionAction({
        request: new Request('http://local/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            guest ? { guest: true } : { email: `integration-${randomUUID()}@example.com` }
          ),
        }),
      } as never);
      expect(response.status).toBe(200);
      const { player } = await response.json();
      createdPlayerIds.push(player.id);
      return {
        id: player.id as string,
        email: player.email as string | null,
        cookie: response.headers.get('Set-Cookie')!.split(';')[0],
      };
    }

    async function start(player: { id: string; cookie: string }) {
      const response = await startGameAction({
        request: new Request('http://local/api/games', {
          method: 'POST',
          headers: { Cookie: player.cookie },
        }),
      } as never);
      expect(response.status).toBe(201);
      const { gameId } = await response.json();
      createdGameIds.push(gameId);
      const game = await games.findById(gameId, player.id);
      expect(game).not.toBeNull();
      return game!;
    }

    async function guess(gameId: string, cookie: string, colors: Color[]) {
      return submitGuessAction({
        params: { gameId },
        request: new Request(`http://local/api/games/${gameId}/guesses`, {
          method: 'POST',
          headers: { Cookie: cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify({ colors }),
        }),
      } as never);
    }

    async function win(player: { id: string; cookie: string }, attempts = 1) {
      const game = await start(player);
      const wrong: Color[] = game.secretCode.colors.map((color) =>
        color === 'red' ? 'blue' : 'red'
      );
      for (let index = 1; index < attempts; index++) {
        expect((await guess(game.id, player.cookie, wrong)).status).toBe(200);
      }
      const response = await guess(game.id, player.cookie, game.secretCode.colors);
      expect(await response.json()).toMatchObject({ gameStatus: 'won' });
      expect((await games.findById(game.id, player.id))?.status).toBe('won');
      return game;
    }

    const guest = await identity(true);
    const otherGuest = await identity(true);
    const registered = await identity(false);
    const tied = await identity(false);
    const efficient = await identity(false);
    expect(guest.email).toBeNull();
    const resumed = await sessionLoader({
      request: new Request('http://local/api/session', { headers: { Cookie: guest.cookie } }),
    } as never);
    expect((await resumed.json()).player).toEqual({ id: guest.id, email: null });
    const retained = await sessionAction({
      request: new Request('http://local/api/session', {
        method: 'POST',
        headers: { Cookie: guest.cookie },
        body: JSON.stringify({ guest: true }),
      }),
    } as never);
    expect((await retained.json()).player.id).toBe(guest.id);

    const guestGame = await win(guest);
    const registeredGame = await win(registered, 2);
    await win(tied, 2);
    await win(efficient);
    // Unfinished and lost games must not affect wins or average guesses.
    const unfinished = await start(registered);
    const lost = await start(registered);
    const wrong: Color[] = lost.secretCode.colors.map((color) =>
      color === 'red' ? 'blue' : 'red'
    );
    for (let index = 0; index < lost.maxAttempts; index++)
      await guess(lost.id, registered.cookie, wrong);
    expect((await games.findById(lost.id, registered.id))?.status).toBe('lost');
    expect((await games.findById(unfinished.id, registered.id))?.status).toBe('in_progress');

    for (const [game, intruder] of [
      [guestGame, otherGuest],
      [guestGame, registered],
      [registeredGame, guest],
    ] as const) {
      const response = await getGameAction({
        params: { gameId: game.id },
        request: new Request(`http://local/api/games/${game.id}`, {
          headers: { Cookie: intruder.cookie },
        }),
      } as never);
      expect(response.status).toBe(404);
      expect(await response.json()).not.toHaveProperty('solution');
      expect((await guess(game.id, intruder.cookie, game.secretCode.colors)).status).toBe(404);
    }
    for (const cookie of ['', `${guest.cookie}tampered`]) {
      expect(
        (
          await getGameAction({
            params: { gameId: guestGame.id },
            request: new Request('http://local', { headers: { Cookie: cookie } }),
          } as never)
        ).status
      ).toBe(401);
      expect((await guess(guestGame.id, cookie, guestGame.secretCode.colors)).status).toBe(401);
    }

    const statistics = await new PrismaLeaderboardRepository().registeredWins();
    expect(statistics.filter((entry) => createdPlayerIds.includes(entry.playerId))).toEqual(
      expect.arrayContaining([
        { playerId: registered.id, wins: 1, totalGuesses: 2 },
        { playerId: tied.id, wins: 1, totalGuesses: 2 },
        { playerId: efficient.id, wins: 1, totalGuesses: 1 },
      ])
    );
    expect(
      statistics.some((entry) => entry.playerId === guest.id || entry.playerId === otherGuest.id)
    ).toBe(false);
    const response = await leaderboardLoader();
    const body = await response.json();
    const alias = (id: string) =>
      `Joueur ${createHash('sha256').update(id).digest('hex').slice(0, 16)}`;
    const ranked = body.entries.filter((entry: { displayName: string }) =>
      [registered, tied, efficient].some((player) => entry.displayName === alias(player.id))
    );
    const tieOrder = [registered.id, tied.id].sort();
    expect(ranked.map((entry: { displayName: string }) => entry.displayName)).toEqual([
      alias(efficient.id),
      ...tieOrder.map(alias),
    ]);
    expect(JSON.stringify(body)).not.toContain('@');
    expect(JSON.stringify(body)).not.toContain(guest.id);
    expect(JSON.stringify(body)).not.toContain(alias(guest.id));
    expect(JSON.stringify(body)).not.toContain('secretCode');
    expect(JSON.stringify(body)).not.toContain('solution');
  });
});
