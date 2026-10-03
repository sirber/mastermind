import type { ActionFunctionArgs } from 'react-router';
import { startGame } from '../api/gameHandlers';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST')
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const gameId = await startGame.handle();
  return Response.json({ gameId }, { status: 201 });
}
