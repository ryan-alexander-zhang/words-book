# syntax=docker/dockerfile:1.7
FROM node:20-bullseye-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN corepack enable

# 关键点：先不跑 postinstall
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --ignore-scripts; \
    elif [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile --ignore-scripts; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-scripts; \
    else npm install --ignore-scripts; fi

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 如果你确实使用 Prisma 且仓库里有 prisma/schema.prisma
# 建议显式跑一次，避免依赖 postinstall 的隐式行为
RUN npx prisma generate

RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN useradd -m nextjs
USER nextjs

# COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
