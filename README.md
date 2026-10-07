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

Email-only sign-in is intentionally retained. It does **not** verify mailbox ownership:
anyone who knows an email can sign in as that player and access their games. This is an unresolved
development-only authorization limitation, not a production authentication mechanism. No magic
links or external provider have been introduced. Set `SESSION_SECRET` to a private value of at least 32 characters in
production. Session APIs are `POST /api/session` to sign in, `GET /api/session` to check the current
player, and `DELETE /api/session` to sign out. POST accepts `{ "email": "you@example.com" }` or
`{ "guest": true }`; client-provided player IDs are ignored. The private session profile returns
`{ "player": { "id": "...", "email": null } }` for guests (email string for registered players).

## Leaderboard

`GET /api/leaderboard` is public and returns `{ "entries": [...] }` for the **top 100** players,
without caching. The home
page's React Bootstrap **Classement** panel loads it on demand, supports refresh, and automatically
refreshes an open panel when a game is won. It includes loading, empty, and error states.

Ranking uses all persisted games with `status = 'won'` associated with registered players
(`Player.email IS NOT NULL`):

1. Total wins, descending.
2. Average `attemptsUsed` across those wins only, ascending (unrounded for ranking).
3. Player ID, lexicographically ascending, to break exact ties deterministically.

PostgreSQL aggregates and sorts the complete eligible history **before** applying a parameterized
`LIMIT 100`; player-ID ordering uses `COLLATE "C"`. Exact SQL averages determine ordering, not
rounded JavaScript averages. Only the bounded statistics are loaded into application memory.
This bounds the response and application work, not the aggregate database scan; further caching
or materialized statistics may be needed at production scale.

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

The additive `20261005220000_add_game_version` migration adds `Game.version` with a non-null
default of zero. It preserves existing histories, ownership, IDs and sessions. Deploy this
migration and regenerate the client before running the updated server; stop old server instances
that still perform unversioned writes during rollout. Saves atomically match the loaded version
and increment it; a stale or deleted game raises a conflict and guess submission returns HTTP 409.
Reload the game before retrying; guesses are not automatically retried or silently overwritten.
Version metadata remains internal and is not exposed in the game view.

Persisted histories and domain writes are validated against recomputed feedback, attempt counts,
and status. A winning guess can only be final; won/lost/in-progress/abandoned statuses must agree
with the history. Corrupted persisted games are rejected, not silently repaired. Domain history
copies submitted guesses and feedback, and mapping copies JSON arrays and timestamps; the domain
interface is still mutable, rather than a fully encapsulated aggregate.

Logout clears local identity and game state only after a successful server response. HTTP,
non-JSON gateway, and network failures display an error and preserve the local game for retry.
Network failure can occur after the server clears its cookie; a later request may then require
sign-in again.

Run `just test` for unit and route tests. Run `just test-integration` for database-backed API tests;
it applies pending migrations to the Compose database before testing. Integration tests cover
guest/registered persistence, signed-session isolation, guest exclusion, scoring ties, and
exclusion of lost/unfinished games. Local checks: `bun run test`, `bun run typecheck`,
`bun run lint:check`, and `bun run build`.

`just quality` runs typecheck, TypeScript-aware lint (including hook rules), and a read-only
Prettier check. It does not run lint/format fixes or suppress errors; PowerShell explicitly returns
the original native exit code. The Docker/Podman fallback remains unchanged. Formatting compares
canonical LF text **in memory**, so Windows Git autocrlf checkouts do not cause false failures;
real whitespace/style differences still fail. Generated/build output and ignored files are
excluded. Typecheck may regenerate ignored React Router types, but checks do not rewrite source.

The final production image runs as `bun` (UID 1000), with its working directory, dependencies,
package metadata and built output owned by `bun`. The Compose development target remains separate.

## Deferred Production Hardening

- Email ownership verification remains unresolved by explicit design; do not expose this sign-in
  as secure production authorization.
- No reliable cross-instance rate limiting or creation quotas are implemented. Public leaderboard
  traffic, anonymous identity creation, and game creation can be abused. Production needs a trusted
  proxy/IP policy and shared limiter or atomic database quotas; an in-memory per-process limiter
  would be bypassable on restart or multiple instances and would give false assurance.
- Guest retention/cleanup, leaderboard caching/materialization, and full aggregate encapsulation
  remain deferred. No large home-UI refactor was necessary for these fixes.
