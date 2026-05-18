FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN npx prisma generate && npm run build && chmod +x /app/docker-entrypoint.sh

EXPOSE 3333

CMD ["sh", "/app/docker-entrypoint.sh"]
