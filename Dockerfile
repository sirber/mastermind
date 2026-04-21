FROM oven/bun:1.3.13-alpine AS development-dependencies-env
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.13-alpine AS production-dependencies-env
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.13-alpine AS build-env
WORKDIR /usr/src/app
COPY --from=development-dependencies-env /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1.3.13-alpine
WORKDIR /usr/src/app
COPY package.json bun.lock ./
COPY --from=production-dependencies-env /usr/src/app/node_modules ./node_modules
COPY --from=build-env /usr/src/app/build ./build
CMD ["bun", "run", "start"]