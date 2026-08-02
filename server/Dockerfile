# Build context: server/
#   docker build -t coinup-api -f server/Dockerfile server
#   fly deploy --config server/fly.toml

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV PAYMENTS_MODE=mock
ENV CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://bryanxbt.github.io

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm install tsx --no-save

EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]
