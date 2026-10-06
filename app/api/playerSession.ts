import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'mastermind_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

interface SessionPayload {
  playerId: string;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  return secret;
}

function signature(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function cookieAttributes(maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function createPlayerSessionCookie(playerId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      playerId,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    } satisfies SessionPayload)
  ).toString('base64url');
  return `${COOKIE_NAME}=${payload}.${signature(payload)}; ${cookieAttributes(
    SESSION_DURATION_SECONDS
  )}`;
}

export function clearPlayerSessionCookie(): string {
  return `${COOKIE_NAME}=; ${cookieAttributes(0)}`;
}

export function playerIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  const cookie = cookieHeader
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;

  const token = cookie.slice(COOKIE_NAME.length + 1);
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const suppliedSignature = Buffer.from(token.slice(separator + 1), 'base64url');
  const expectedSignature = Buffer.from(signature(payload), 'base64url');
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    ) as Partial<SessionPayload>;
    if (
      typeof session.playerId !== 'string' ||
      session.playerId.length === 0 ||
      typeof session.expiresAt !== 'number' ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return session.playerId;
  } catch {
    return null;
  }
}
