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

Players sign in with an email address at the home page. This development sign-in does not verify
mailbox ownership; configure a verified email link/code flow before using email identity for
production authorization. Set `SESSION_SECRET` to a private value of at least 32 characters in
production. Session APIs are `POST /api/session` to sign in, `GET /api/session` to check the current
player, and `DELETE /api/session` to sign out.

Run `just test` for unit and route tests. Run `just test-integration` for database-backed API tests;
it applies pending migrations to the Compose database before testing.
