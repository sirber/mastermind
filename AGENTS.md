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
- The React app provides a Mastermind game UI and email-only player sign-in.
- Games are associated with their creating player and require that player's signed session.
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
