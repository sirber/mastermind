import { beforeEach, describe, expect, it, vi } from 'vitest';
import { action, loader } from './api.session';
import { getPlayerById, loginWithEmail } from '../api/playerHandlers';
import { InvalidEmailError } from '../domain/player/errors/InvalidEmailError';

vi.mock('../api/playerHandlers', () => ({
  loginWithEmail: { handle: vi.fn() },
  getPlayerById: vi.fn(),
}));

vi.mock('../api/playerSession', () => ({
  createPlayerSessionCookie: vi.fn(() => 'mastermind_session=signed'),
  clearPlayerSessionCookie: vi.fn(() => 'mastermind_session=; Max-Age=0'),
  playerIdFromRequest: vi.fn(() => null),
}));

describe('/api/session', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates or resumes an identity using normalized email and sets a session cookie', async () => {
    vi.mocked(loginWithEmail.handle).mockResolvedValue({
      id: 'player-1',
      email: { value: 'alice@example.com', toString: () => 'alice@example.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await action({
      request: new Request('http://local/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'Alice@Example.com' }),
      }),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('mastermind_session=signed');
    await expect(response.json()).resolves.toEqual({
      player: { id: 'player-1', email: 'alice@example.com' },
    });
    expect(loginWithEmail.handle).toHaveBeenCalledWith('Alice@Example.com');
  });

  it('rejects invalid email addresses', async () => {
    vi.mocked(loginWithEmail.handle).mockRejectedValue(new InvalidEmailError());
    const response = await action({
      request: new Request('http://local/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid' }),
      }),
    } as never);

    expect(response.status).toBe(400);
  });

  it('returns 401 when there is no signed-in player', async () => {
    const response = await loader({ request: new Request('http://local/api/session') } as never);
    expect(response.status).toBe(401);
  });

  it('returns the current player profile for a valid session', async () => {
    const { playerIdFromRequest } = await import('../api/playerSession');
    vi.mocked(playerIdFromRequest).mockReturnValueOnce('player-1');
    vi.mocked(getPlayerById).mockResolvedValueOnce({
      id: 'player-1',
      email: { value: 'alice@example.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await loader({ request: new Request('http://local/api/session') } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      player: { id: 'player-1', email: 'alice@example.com' },
    });
  });

  it('clears the signed session cookie when logging out', async () => {
    const response = await action({
      request: new Request('http://local/api/session', { method: 'DELETE' }),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});
