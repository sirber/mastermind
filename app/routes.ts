import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/games', 'routes/api.games.ts'),
  route('api/games/:gameId', 'routes/api.games.$gameId.ts'),
  route('api/games/:gameId/guesses', 'routes/api.games.$gameId.guesses.ts'),
] satisfies RouteConfig;
