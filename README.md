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

No Windows PowerShell, faça o equivalente com `Copy-Item`.

### 2. Subir backend e banco

```bash
docker compose up --build
```

Serviços esperados:

- API: `http://localhost:3333/api`
- Swagger: `http://localhost:3333/docs`
- PostgreSQL: `localhost:5432`

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

## Observações

- O projeto foi estruturado como base escalável e organizada para evolução rápida.
- O app mobile e o painel admin possuem fallback local para facilitar demonstração visual mesmo sem backend ativo.
- O backend foi pensado para ser o contrato principal de produção.
