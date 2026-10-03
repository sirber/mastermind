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

Run `just dev` to start the application and PostgreSQL in Docker. The app container generates
the Prisma client on startup. Apply the database migration with
`docker compose exec app bunx prisma migrate deploy`, then open `http://localhost:5173`.
The game API is available at `POST /api/games`, `GET /api/games/:gameId`, and
`POST /api/games/:gameId/guesses`.
