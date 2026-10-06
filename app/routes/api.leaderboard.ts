import { getLeaderboard } from '../api/leaderboardHandlers';

export async function loader() {
  return Response.json(
    { entries: await getLeaderboard.handle() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
