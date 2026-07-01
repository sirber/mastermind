# TODO

This file is the working task list for the Mastermind project.

## Current Gaps

- No Mastermind domain rules yet.
- No command handler layer yet.
- No API endpoints yet.
- No real game flow in the UI yet.
- No game-specific tests yet.

## Next Vertical Slice

Implement one playable slice end to end:

1. write failing tests for `SubmitGuess`
2. implement the domain logic
3. add the command handler
4. expose the API route
5. wire a minimal UI

## Suggested Breakdown

### Domain

- define `Game`
- define `SecretCode`
- define `Guess`
- define feedback/result rules
- define win and lose conditions

### Application

- create `StartGame` command handler
- create `SubmitGuess` command handler
- keep business logic out of React routes

### API

- create a route to start a game
- create a route to submit a guess
- create a route to read game state

### UI

- create a simple start-game screen
- create a guess input form
- display feedback for each guess
- display game status

### Tests

- add domain unit tests
- add command handler tests
- add route or API integration tests

