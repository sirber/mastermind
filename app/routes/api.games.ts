import type { ActionFunctionArgs } from 'react-router';
import { startGame } from '../api/gameHandlers';
import { playerIdFromRequest } from '../api/playerSession';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST')
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const playerId = playerIdFromRequest(request);
  if (!playerId) return Response.json({ error: 'Sign in required' }, { status: 401 });

  const gameId = await startGame.handle(playerId);
  return Response.json({ gameId }, { status: 201 });
}
