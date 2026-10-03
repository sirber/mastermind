import type { ActionFunctionArgs } from 'react-router';
import { GameError } from '../domain/game/errors/GameError';
import { GameNotFoundError } from '../domain/game/errors/GameNotFoundError';
import { parseGuess } from '../api/parseGuess';
import { submitGuess } from '../api/gameHandlers';

export async function action({ request, params }: ActionFunctionArgs) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const guess = parseGuess(body);
  if (!guess) {
    return Response.json({ error: 'Guess must contain four valid colors' }, { status: 400 });
  }

  try {
    return Response.json(await submitGuess.handle({ gameId: params.gameId ?? '', guess }));
  } catch (error) {
    if (error instanceof GameNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof GameError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
