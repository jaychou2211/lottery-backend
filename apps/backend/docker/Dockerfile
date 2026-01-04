# =============================================================================
# Stage 1: BASE
# =============================================================================
FROM node:22-bookworm-slim AS base

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

ENV PNPM_HOME=/usr/local/bin

RUN apt-get update \
    && apt-get -y --no-install-recommends install \
        dumb-init \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Stage 2: DEPENDENCIES
# =============================================================================
FROM base AS dependencies

WORKDIR /home/node/apps

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 3: BUILD
# =============================================================================
FROM base AS build

WORKDIR /home/node/apps

COPY --from=dependencies /home/node/apps/node_modules ./node_modules
COPY . .

RUN pnpm build \
    && pnpm prune --prod --ignore-scripts

# =============================================================================
# Stage 4: DEPLOY
# =============================================================================
FROM node:22-bookworm-slim AS deploy

RUN apt-get update \
    && apt-get -y --no-install-recommends install \
        dumb-init \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/apps

COPY --from=build /home/node/apps/dist ./dist
COPY --from=build /home/node/apps/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3000

CMD ["dumb-init", "node", "dist/src/main.js"]
