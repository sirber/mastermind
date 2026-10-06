[windows]
set shell := ['powershell.exe', '-NoLogo', '-NoProfile', '-Command']
set default-list := true

# Prefer Docker Compose, but fall back to Podman when Docker is unavailable.
compose := shell('if (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue) { "docker compose" } else { "podman compose" }')

# Start the app and print a URL reachable from the host.
dev:
    @{{compose}} up --build -d
    @if (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue) { Write-Output "open http://localhost:5173" } else { $line = podman machine ssh podman-machine-default ip -4 -o addr show eth0 | Select-String "inet "; $ip = ($line.ToString() -split '\s+')[3].Split('/')[0]; Write-Output "open http://$($ip):5173" }

# Stop and remove containers, networks and volumes.
down:
    @{{compose}} down -v

# Install Bun dependencies inside the `app` service.
install:
    @{{compose}} run --rm app bun install

# Follow logs from all services.
logs:
    @{{compose}} logs -f

# Open a shell in the `app` service.
cli:
    @{{compose}} exec app sh

# Run quality checks inside the `app` service.
quality:
    @{{compose}} run --rm app sh -c "bun run quality 2>&1 | grep -v 'envFile.*deprecated' || true"

# Run tests inside the `app` service.
test:
    @{{compose}} run --rm app bun run test

# Run database-backed API integration tests against the Compose PostgreSQL service.
test-integration:
    @{{compose}} run --rm app sh -c "bunx prisma generate && bunx prisma migrate deploy && bun run test:integration"

# Run linter inside the `app` service.
lint:
    @{{compose}} run --rm app bun run lint:check

# Run linter fix inside the `app` service.
lint-fix:
    @{{compose}} run --rm app bun run lint

# Open a psql shell connected to the `db` service as user `dev` and database `devdb`.
psql:
    @{{compose}} exec db psql -U dev -d devdb

# Apply migrations in CI / production (non-interactive).
prisma-migrate:
    @{{compose}} run --rm app bunx prisma migrate deploy

# Run the interactive development migration flow (creates new migration files).
prisma-migrate-dev:
    @{{compose}} run --rm app bunx prisma migrate dev

# Push Prisma schema to the database (no migration files created).
prisma-push:
    @{{compose}} run --rm app bunx prisma db push

# Open Prisma Studio in your browser (runs inside the `app` service).
prisma-studio:
    @{{compose}} run --rm app bunx prisma studio --browser

# Generate the Prisma client.
prisma-generate:
    @{{compose}} run --rm app bunx prisma generate

# Format the Prisma schema file (`prisma/schema.prisma`).
prisma-format:
    @{{compose}} run --rm app bunx prisma format
