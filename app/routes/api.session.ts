import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { InvalidEmailError } from '../domain/player/errors/InvalidEmailError';
import { clearPlayerSessionCookie, createPlayerSessionCookie, playerIdFromRequest } from '../api/playerSession';
import { getPlayerById, loginWithEmail } from '../api/playerHandlers';

export async function loader({ request }: LoaderFunctionArgs) {
  const playerId = playerIdFromRequest(request);
  if (!playerId) return Response.json({ error: 'Sign in required' }, { status: 401 });

  const player = await getPlayerById(playerId);
  if (!player) {
    return Response.json(
      { error: 'Sign in required' },
      { status: 401, headers: { 'Set-Cookie': clearPlayerSessionCookie() } }
    );
  }

  return Response.json({ player: { id: player.id, email: player.email.value } });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'DELETE') {
    return Response.json(
      { success: true },
      { headers: { 'Set-Cookie': clearPlayerSessionCookie() } }
    );
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || !('email' in body) || typeof body.email !== 'string') {
    return Response.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const player = await loginWithEmail.handle(body.email);
    return Response.json(
      { player: { id: player.id, email: player.email.value } },
      { headers: { 'Set-Cookie': createPlayerSessionCookie(player.id) } }
    );
  } catch (error) {
    if (error instanceof InvalidEmailError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
