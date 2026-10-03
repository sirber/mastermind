# TODO

This file is the working task list for the Mastermind project.

## Completed: First Playable Vertical Slice

- Domain rules and unit tests for `SubmitGuess`
- `StartGame` and `SubmitGuess` command handlers
- Persistent game state in PostgreSQL through Prisma
- API routes to start a game, read public state, and submit a guess
- Minimal French UI with feedback and attempt tracking
- Command handler and API route tests

## Follow-up Work

### Domain

- Consider stronger runtime validation for persisted game data
- Add player identity and associate games with players when authentication is introduced
- Add database-backed API integration tests
