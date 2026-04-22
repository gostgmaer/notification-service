FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/channels/sms/providers ./src/channels/sms/providers
COPY --from=builder /app/src/channels/sms/models ./src/channels/sms/models
COPY --from=builder /app/src/channels/sms/services/templateEngine.js ./src/channels/sms/services/templateEngine.js
COPY --from=builder /app/src/channels/sms/validators ./src/channels/sms/validators
COPY --from=builder /app/src/channels/email/templates ./src/channels/email/templates
COPY --from=builder /app/src/shared/utils ./src/shared/utils

EXPOSE 4000

CMD ["node", "dist/main"]
