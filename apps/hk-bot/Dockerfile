# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /workspace
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.workspace.json ./
COPY packages ./packages
COPY apps/hk-bot ./apps/hk-bot
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @openkotor/hk-bot build

FROM base AS runtime
WORKDIR /workspace
COPY --from=deps /workspace/package.json ./package.json
COPY --from=deps /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=deps /workspace/tsconfig.workspace.json ./tsconfig.workspace.json
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=deps /workspace/apps/hk-bot ./apps/hk-bot

CMD ["node", "apps/hk-bot/dist/main.js"]
