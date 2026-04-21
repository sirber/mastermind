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

# Install Bun dependencies inside the `app` service.
install:
    @docker compose run --rm app bun install

# Follow logs from all services.
logs:
    @docker compose logs -f

# Open a shell in the `app` service.
cli:
    @docker compose exec app sh

# Run quality checks inside the `app` service.
quality:
    @docker compose run --rm app bun run quality

# Run tests inside the `app` service.
test:
    @docker compose run --rm app bun run test

# Run linter inside the `app` service.
lint:
    @docker compose run --rm app bun run lint:check

# Run linter fix inside the `app` service.
lint-fix:
    @docker compose run --rm app bun run lint

# Open a psql shell connected to the `db` service as user `dev` and database `devdb`.
psql:
    @docker compose exec db psql -U dev -d devdb

# Apply migrations in CI / production (non-interactive).
prisma-migrate:
    @docker compose run --rm app bunx prisma migrate deploy

# Run the interactive development migration flow (creates new migration files).
prisma-migrate-dev:
    @docker compose run --rm app bunx prisma migrate dev

# Push Prisma schema to the database (no migration files created).
prisma-push:
    @docker compose run --rm app bunx prisma db push

# Open Prisma Studio in your browser (runs inside the `app` service).
prisma-studio:
    @docker compose run --rm app bunx prisma studio --browser

# Generate the Prisma client.
prisma-generate:
    @docker compose run --rm app bunx prisma generate

# Format the Prisma schema file (`prisma/schema.prisma`).
prisma-format:
    @docker compose run --rm app bunx prisma format