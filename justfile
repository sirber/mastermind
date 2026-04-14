set shell := ['bash', '-cu']

default:
    @just --list

dev:
    @docker compose up --build -d
    @echo "open http://localhost:5173"

down:
    @docker compose down -v

install:
    @docker compose run --rm app npm ci

logs:
    @docker compose logs -f

cli:
    @docker compose exec app bash

quality:
    @docker compose run --rm app npm run quality

lint:
    @docker compose run --rm app npm run lint

lint-fix:
    @docker compose run --rm app npm run lint:fix

psql:
    @docker compose exec db psql -U dev -d devdb