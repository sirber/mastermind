FROM oven/bun:1.3.13-alpine AS development-dependencies-env
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile && chown -R 1000:1000 /usr/src/app/node_modules

FROM oven/bun:1.3.13-alpine AS production-dependencies-env
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.13-alpine AS build-env
WORKDIR /usr/src/app
COPY --from=development-dependencies-env /usr/src/app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.3.13-alpine
WORKDIR /usr/src/app
COPY --chown=bun:bun package.json bun.lock ./
COPY --chown=bun:bun --from=production-dependencies-env /usr/src/app/node_modules ./node_modules
COPY --chown=bun:bun --from=build-env /usr/src/app/build ./build
RUN chown bun:bun /usr/src/app
USER bun
CMD ["bun", "run", "start"]
