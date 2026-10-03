import type { LoaderFunctionArgs } from 'react-router';
import { GameNotFoundError } from '../domain/game/errors/GameNotFoundError';
import { getGame } from '../api/gameHandlers';

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    return Response.json(await getGame.handle(params.gameId ?? ''));
  } catch (error) {
    if (error instanceof GameNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
