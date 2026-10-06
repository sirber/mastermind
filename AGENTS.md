# AGENTS.md

This file is the canonical handoff note for this repository.

## When Starting a New Conversation

Read this file first before making changes or giving recommendations.

## Project State

- Mastermind game project.
- Stack:
  - Bun
  - React Router
  - React Bootstrap
  - Prisma
  - PostgreSQL
- Core project requirements live in [`README.md`](C:/Users/sirbe/projects/mastermind/README.md).
- The working task list was removed after its actionable items were implemented.

## What Is Already Present

- App scaffold is in place.
- Prisma is configured.
- Basic data models exist:
  - `Player`
  - `Game`
  - `GamePlayer`
- The React Bootstrap app offers optional email sign-in or immediate anonymous guest play.
- Guests are persisted `Player` records with null email and server-generated UUIDs. Email
  players retain their normalized unique email. Both use the unchanged signed session cookie.
- Games are associated with their creating player through `GamePlayer` and require that player's
  signed session; cross-player reads/writes return 404. Invalid/absent cookies return 401.
- `PlayAsGuestCommandHandler` creates guest identities. POST `/api/session` accepts `{ guest: true }`
  or `{ email }`; a valid existing session is retained when guest play is requested again.
- Guest games are never transferred to email accounts. Cookie loss/logout/30-day expiry loses
  guest access; no automated guest cleanup is implemented.
- Public GET `/api/leaderboard` uses `PrismaLeaderboardRepository` and `GetLeaderboardQueryHandler`.
  Only persisted `won` games for non-null-email players count: wins descending, average winning
  attempts ascending, player ID lexicographically ascending; sequential ranks. Stable hashed-ID
  aliases hide emails and IDs. No game secrets are loaded for ranking.
- Home's `Leaderboard` Bootstrap component loads ranking on demand and refreshes an open panel
  after a win; loading/empty/error/retry states are tested.
- Migration `20261005210000_allow_guest_players` only drops email NOT NULL; existing data,
  unique email index, game ownership and registered cookies remain valid. Apply before guest play
  and regenerate Prisma types.
- Email sign-in remains development-only and unverified; use verified mailbox ownership before
  production authorization. Keep `SESSION_SECRET` private (32+ characters).
- Tooling exists for:
  - dev
  - test
  - lint
  - quality
  - Prisma commands

## Working Rules

- Keep business logic out of React routes.
- Prefer small increments.
- Use TDD for new behavior.
- Make the command handlers the entry point for game actions.

## Coding Style

- One class per file.
- Use meaningful file names that match the class/type name.
- Group domain code by type: entities/, valueObjects/, contracts/, errors/, services/.
- No barrel/index files - import directly from source files.
