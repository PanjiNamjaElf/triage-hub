FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npm run db:generate

COPY . .

# Remove dev dependencies not needed in production.
# Prisma CLI is retained for migration deployments.
RUN rm -rf node_modules/nodemon \
    && npm cache clean --force \
    && rm -rf /tmp/* /root/.npm

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/src ./src/
COPY --from=builder /app/package*.json ./

EXPOSE 4000

# Run migrations and start server.
CMD ["sh", "-c", "npm run db:migrate && node src/index.js"]
