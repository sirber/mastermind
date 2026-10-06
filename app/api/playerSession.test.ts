import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlayerSessionCookie,
  createPlayerSessionCookie,
  playerIdFromRequest,
} from './playerSession';

const originalSecret = process.env.SESSION_SECRET;

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-only-session-secret-with-at-least-32-characters';
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
});

describe('player sessions', () => {
  it('signs a player session in an HttpOnly, same-site cookie', () => {
    const cookie = createPlayerSessionCookie('player-1');
    const request = new Request('http://local', { headers: { Cookie: cookie.split(';')[0] } });

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(playerIdFromRequest(request)).toBe('player-1');
  });

  it('rejects tampered and absent cookies', () => {
    const cookie = createPlayerSessionCookie('player-1').split(';')[0];
    const lastCharacter = cookie.at(-1);
    const tamperedCookie = `${cookie.slice(0, -1)}${lastCharacter === 'A' ? 'B' : 'A'}`;

    expect(
      playerIdFromRequest(new Request('http://local', { headers: { Cookie: tamperedCookie } }))
    ).toBeNull();
    expect(playerIdFromRequest(new Request('http://local'))).toBeNull();
  });

  it('expires a session cookie on logout', () => {
    expect(clearPlayerSessionCookie()).toContain('Max-Age=0');
  });
});
