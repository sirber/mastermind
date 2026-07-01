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
- Active task list lives in [`TODO.md`](C:/Users/sirbe/projects/mastermind/TODO.md).

## What Is Already Present

- App scaffold is in place.
- Prisma is configured.
- Basic data models exist:
  - `Player`
  - `Game`
  - `GamePlayer`
- The React app currently still shows the default welcome screen.
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
