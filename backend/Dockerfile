FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Run migrations and start server.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]

EXPOSE 4000
