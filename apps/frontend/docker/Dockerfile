# =============================================================================
# Stage 1: BUILD
# =============================================================================
FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# =============================================================================
# Stage 2: PRODUCTION
# =============================================================================
FROM nginx:alpine AS production

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
