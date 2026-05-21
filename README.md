# Açaí do Fortin

Aplicativo full stack de delivery premium para açaí, com foco em catálogo personalizado, fidelização, promoções e operação administrativa.

## Stack

- Mobile: React Native + Expo
- Admin web: React + Vite
- API: Node.js + Express
- Banco: PostgreSQL
- ORM: Prisma
- Auth: JWT
- Upload: Cloudinary
- Realtime: Socket.IO
- Infra: Docker Compose

## Estrutura

```text
.
├── apps
│   ├── admin        # painel administrativo web responsivo
│   └── mobile       # app cliente em Expo
├── services
│   └── api          # API REST com Prisma/PostgreSQL
├── docker-compose.yml
└── README.md
```

## Entregas desta base

- App mobile com:
  - login/cadastro
  - login social preparado para Google/Apple
  - home premium com banners
  - catálogo com busca e filtros
  - montagem personalizada do açaí
  - carrinho com cupom e métodos de pagamento
  - pedidos com rastreamento básico em tempo real
  - favoritos
  - fidelidade
  - perfil, notificações e WhatsApp
  - cache local e dark mode
- Painel admin com:
  - login administrativo
  - dashboard com métricas
  - gestão de pedidos
  - cadastro rápido de produtos e categorias
  - clientes
  - promoções, cupons e banners
  - relatórios
- Backend com:
  - arquitetura modular em MVC + services
  - autenticação JWT
  - Prisma + PostgreSQL
  - módulos REST organizados
  - validação com Zod
  - upload preparado para Cloudinary
  - cache em memória
  - logs com Pino
  - documentação OpenAPI via Swagger
  - Socket.IO para atualização de pedidos

## Modelagem principal

O schema Prisma contempla:

- `users`
- `addresses`
- `categories`
- `products`
- `orders`
- `order_items`
- `payments`
- `coupons`
- `reviews`
- `notifications`
- `loyalty_accounts`
- `loyalty_entries`
- `favorites`
- `banners`

## Como rodar

### 1. Configurar ambiente

Copie os exemplos:

- `cp .env.example .env`
- `cp services/api/.env.example services/api/.env`
- `cp apps/mobile/.env.example apps/mobile/.env`
- `cp apps/admin/.env.example apps/admin/.env`

No Windows PowerShell, faca o equivalente com `Copy-Item`.

### 2. Subir toda a stack em Docker

```bash
docker compose up --build
```

Serviços esperados:

- API: `http://localhost:3333/api`
- Swagger: `http://localhost:3333/docs`
- PostgreSQL: `localhost:5432`
- Chatbot/WhatsApp: `http://localhost:3001/health`

Essa stack sobe:

- `postgres`: banco principal do sistema em volume persistente
- `api`: backend Express + Prisma apontando para o Postgres do Docker
- `chatbot`: servico do WhatsApp com sessao persistida em volume
- `tunnel`: URL publica HTTPS temporaria para expor a API do Docker

O chatbot expoe a rota `/session`, usada pelo painel admin para mostrar o QR Code e o estado da conexao.

Para descobrir a URL publica do backend:

```bash
docker logs fortin-tunnel
```

Depois de obter a URL, configure:

- `EXPO_PUBLIC_API_URL=https://.../api`
- `VITE_API_URL=https://.../api`

e rode novamente o build/deploy do frontend para o app e o painel publicados usarem a API online.

### 3. Rodar frontend mobile

```bash
npm install
npm run mobile
```

### 4. Rodar painel admin

Em outro terminal:

```bash
npm run admin
```

## Scripts úteis

```bash
npm run api
npm run mobile
npm run admin
npm run build
npm run build:web
npm run docker:up
npm run prisma:generate
npm run prisma:migrate
npm run prisma:push
npm run prisma:seed
```

## Credenciais demo

- Admin:
  - e-mail: `admin@fortin.com`
  - senha: `Admin@123`
- Cliente:
  - e-mail: `cliente@fortin.com`
  - senha: `Cliente@123`

## Módulos da API

- `auth`
- `banners`
- `categories`
- `products`
- `coupons`
- `orders`
- `customers`
- `dashboard`
- `notifications`
- `loyalty`
- `reviews`
- `uploads`

## Integrações preparadas

As bases de integração já estão previstas no código, mas exigem credenciais/configuração real para produção:

- Cloudinary
- Google Login
- Apple Login
- push notifications
- gateway de cartão
- PIX provider
- sessao real do WhatsApp Web no container `chatbot`

## Observações

- O projeto foi estruturado como base escalável e organizada para evolução rápida.
- O app mobile e o painel admin possuem fallback local para facilitar demonstração visual mesmo sem backend ativo.
- O backend foi pensado para ser o contrato principal de produção.
## Deploy na Hostinger VPS

Para publicar a aplicacao completa na Hostinger, use VPS. Hospedagem compartilhada serve apenas para frontend estatico e nao cobre a API Node, PostgreSQL e o chatbot com Chromium.

### Arquivos de deploy

- `docker-compose.hostinger.yml`
- `deploy/hostinger/Dockerfile`
- `deploy/hostinger/Caddyfile`
- `.env.hostinger.example`

### Passos

1. Copie `.env.hostinger.example` para `.env.hostinger`.
2. Preencha `APP_DOMAIN` com o dominio final, por exemplo `acai.seudominio.com`.
3. Defina senhas fortes em `POSTGRES_PASSWORD`, `JWT_SECRET` e `WHATSAPP_BOT_SECRET`.
4. Aponte o DNS do dominio para o IP da VPS.
5. Na VPS, rode:

```bash
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
```

Ou use o script:

```bash
npm run docker:hostinger
```

### O que essa configuracao faz

- publica o frontend cliente em `/`
- publica o painel admin em `/admin`
- publica a API em `/api`
- publica o Swagger em `/docs`
- emite HTTPS automaticamente via Caddy
- mantem `postgres` e `chatbot` acessiveis apenas dentro da rede Docker

### Observacoes de producao

- O build web usa `https://APP_DOMAIN/api` automaticamente.
- O `FRONTEND_ORIGIN` da API passa a ser `https://APP_DOMAIN`.
- O container `tunnel` nao e usado na Hostinger.
- Se voce quiser usar apenas o site estatico em hospedagem compartilhada, rode `npm run build:web` e publique a pasta `dist`, mas a API e o WhatsApp ficarao de fora.
