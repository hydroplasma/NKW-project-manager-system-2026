FROM node:22-bookworm-slim

WORKDIR /app

ENV TZ=Asia/Bangkok \
    NEXT_TELEMETRY_DISABLED=1 \
    SQLITE_DATABASE_URL=file:../data/namkham.db

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global pnpm@11.25.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .

# A seeded demo database allows the initial published build to render sample content.
# Container-local SQLite is ephemeral; do not use this deployment for durable real data.
RUN mkdir -p /app/data \
    && pnpm db:deploy \
    && pnpm db:seed \
    && pnpm build \
    && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 3000

# Next.js reads PORT when supplied by the container platform; defaults to 3000.
CMD ["sh", "-c", "pnpm db:deploy && exec pnpm start"]
