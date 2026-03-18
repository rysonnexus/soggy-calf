FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ── Development stage ─────────────────────────────────────────────────────────
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
# Generate Prisma client
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ── Production stage ──────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "start"]
