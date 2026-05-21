FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG VITE_API_URL
ARG EXPO_PUBLIC_API_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY services/api/package.json services/api/package.json

RUN npm install

COPY apps ./apps
COPY services ./services
COPY scripts ./scripts
COPY android-apk ./android-apk

RUN npm run build:web

FROM caddy:2.10-alpine

COPY deploy/hostinger/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
