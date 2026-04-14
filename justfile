set shell := ['bash', '-cu']

# Show available tasks.
default:
    @just --list

# Start the app (dev) via docker-compose and print the URL.
dev:
    @docker compose up --build -d
    @echo "open http://localhost:5173"

# Stop and remove containers, networks and volumes.
down:
    @docker compose down -v

# Install node dependencies inside the `app` service.
install:
    @docker compose run --rm app npm i

# Follow logs from all services.
logs:
    @docker compose logs -f

# Open a shell in the `app` service.
cli:
    @docker compose exec app bash

# Run quality checks inside the `app` service.
quality:
    @docker compose run --rm app npm run quality

# Run tests inside the `app` service.
test:
    @docker compose run --rm app npm test

# Run linter inside the `app` service.
lint:
    @docker compose run --rm app npm run lint

# Run linter fix inside the `app` service.
lint-fix:
    @docker compose run --rm app npm run lint:fix

# Open a psql shell connected to the `db` service as user `dev` and database `devdb`.
psql:
    @docker compose exec db psql -U dev -d devdb

# Apply migrations in CI / production (non-interactive).
prisma-migrate:
    @docker compose run --rm app npx prisma migrate deploy

# Run the interactive development migration flow (creates new migration files).
prisma-migrate-dev:
    @docker compose run --rm app npx prisma migrate dev

# Push Prisma schema to the database (no migration files created).
prisma-push:
    @docker compose run --rm app npx prisma db push

# Open Prisma Studio in your browser (runs inside the `app` service).
prisma-studio:
    @docker compose run --rm app npx prisma studio --browser

# Generate the Prisma client.
prisma-generate:
    @docker compose run --rm app npx prisma generate

# Format the Prisma schema file (`prisma/schema.prisma`).
prisma-format:
    @docker compose run --rm app npx prisma format