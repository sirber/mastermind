import type { LoaderFunctionArgs } from 'react-router';
import { GameNotFoundError } from '../domain/game/errors/GameNotFoundError';
import { getGame } from '../api/gameHandlers';
import { playerIdFromRequest } from '../api/playerSession';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const playerId = playerIdFromRequest(request);
  if (!playerId) return Response.json({ error: 'Sign in required' }, { status: 401 });

  try {
    return Response.json(await getGame.handle(params.gameId ?? '', playerId));
  } catch (error) {
    if (error instanceof GameNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
