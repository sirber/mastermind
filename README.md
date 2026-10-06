# Mastermind Game

The goal here is to explore coding with AI. [A friend](https://github.com/yvoyer/mastermind) will be doing the same, but with different technologies.

## Host Dependencies

- [Just](https://github.com/casey/just)
- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/engine/install/)

## Software Stack

- [Bun JS](https://bun.sh/)
- [React Router](https://reactrouter.com/)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [Prisma ORM](https://www.prisma.io/orm)
- [PostgreSQL 18](https://www.postgresql.org/)

## UI

The French interface uses React Bootstrap components with direct component imports and
Bootstrap 5 CSS, loaded once by the root layout. Home, project resources, loading states,
and error pages share this UI stack. Custom CSS is limited to game branding, responsive
board sizing, color pions, and feedback pegs; Tailwind is not required or configured.
The game history retains its semantic ordered list, and sign-in preserves accessible
labels, keyboard navigation, and email focus on session resolution and browser activation.

## Specifications

- Must provide an API
- Must use a command handler
- Must use [TDD](https://en.wikipedia.org/wiki/Test-driven_development)
- Must be structured as [DDD](https://www.geeksforgeeks.org/system-design/domain-driven-design-ddd/)
- Must provide a front-end
- Must provide tests

## Development Environment

- Visual Studio Code
- GitHub CoPilot w/ GPT 5-mini

## Run the Game

Run `just dev` to start the application and PostgreSQL with Docker Compose (or Podman Compose if
Docker is unavailable). The app container generates the Prisma client on startup. Apply the
database migration with `just prisma-migrate`, then open `http://localhost:5173`.
The game API is available at `POST /api/games`, `GET /api/games/:gameId`, and
`POST /api/games/:gameId/guesses`.

The home page offers **Jouer sans e-mail** (starts a guest game immediately) and optional email
sign-in. Both identities are persisted players, and both use the same signed, HttpOnly,
SameSite=Lax, 30-day session cookie (Secure in production). Guests have a server-generated UUID
and no email. Only games associated with the signed player through `GamePlayer` can be read or
played; other players receive 404 and absent/invalid sessions receive 401. Existing registered
sessions remain valid. Requesting guest play while already signed in preserves that identity.

Guest access depends on retaining the cookie in the same browser; logout, cookie deletion, or
expiry loses access. Sign out to switch to email sign-in. Guest games are **not** transferred to
an email account and guest wins never become leaderboard wins. There is no guest cleanup policy
yet. Email sign-in resumes the player associated with the normalized email.

This development email sign-in does not verify
mailbox ownership; configure a verified email link/code flow before using email identity for
production authorization. Set `SESSION_SECRET` to a private value of at least 32 characters in
production. Session APIs are `POST /api/session` to sign in, `GET /api/session` to check the current
player, and `DELETE /api/session` to sign out. POST accepts `{ "email": "you@example.com" }` or
`{ "guest": true }`; client-provided player IDs are ignored. The private session profile returns
`{ "player": { "id": "...", "email": null } }` for guests (email string for registered players).

## Leaderboard

`GET /api/leaderboard` is public and returns `{ "entries": [...] }` without caching. The home
page's React Bootstrap **Classement** panel loads it on demand, supports refresh, and automatically
refreshes an open panel when a game is won. It includes loading, empty, and error states.

Ranking uses all persisted games with `status = 'won'` associated with registered players
(`Player.email IS NOT NULL`):

1. Total wins, descending.
2. Average `attemptsUsed` across those wins only, ascending (unrounded for ranking).
3. Player ID, lexicographically ascending, to break exact ties deterministically.

Ranks are sequential (1, 2, 3…), not shared. Losses, unfinished games, guests, and players with
zero wins are excluded. Historical registered wins are included. Entries contain only `rank`,
`displayName`, `wins`, and `averageGuesses`; the UI displays averages to two decimal places.
Public names are stable `Joueur <16 hex characters>` aliases derived from SHA-256 of the random
player ID, **not** the email. The API does not expose player IDs, emails, game IDs, or secret codes.
An owner's existing private completed-game view still reveals its solution as before.

## Migration and Validation

Apply pending migrations with `just prisma-migrate` before using guest play, and regenerate the
Prisma client with `just prisma-generate` outside the normal app startup. The guest migration only
drops the NOT NULL constraint on email; it retains existing players, email uniqueness, game
associations, and game history. PostgreSQL allows multiple null emails under that unique index.
No schema reset, data rewrite, or placeholder guest email is required.

Run `just test` for unit and route tests. Run `just test-integration` for database-backed API tests;
it applies pending migrations to the Compose database before testing. Integration tests cover
guest/registered persistence, signed-session isolation, guest exclusion, scoring ties, and
exclusion of lost/unfinished games. Local checks: `bun run test`, `bun run typecheck`,
`bun run lint:check`, and `bun run build`.
