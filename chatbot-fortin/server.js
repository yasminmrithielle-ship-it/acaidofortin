const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const port = Number(process.env.PORT || 3001);
const botSecret = process.env.WHATSAPP_BOT_SECRET || "";

app.use(express.json({ limit: "2mb" }));

const state = {
  configured: true,
  connected: false,
  status: "iniciando",
  phoneNumber: null,
  accountName: null,
  qrCodeDataUrl: null,
  updatedAt: new Date().toISOString(),
  error: null
};

function touchState(patch) {
  Object.assign(state, patch, {
    updatedAt: new Date().toISOString()
  });
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `${digits}@c.us`;
}

function ensureAuthorized(request, response, next) {
  if (!botSecret) {
    next();
    return;
  }

  if (request.headers["x-fortin-secret"] !== botSecret) {
    response.status(401).json({ message: "Nao autorizado." });
    return;
  }

  next();
}

function clearSessionLocks() {
  const sessionDir = "/app/sessions/session";
  const lockFiles = [
    "SingletonLock",
    "SingletonSocket",
    "SingletonCookie"
  ];

  for (const filename of lockFiles) {
    const filePath = path.join(sessionDir, filename);
    try {
      fs.rmSync(filePath, { force: true });
    } catch (_error) {
      // Ignora locks inexistentes ou ja liberados.
    }
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function formatItems(order) {
  return (order.items || [])
    .map((item) => `- ${item.quantity}x ${item.productName}`)
    .join("\n");
}

function formatAddress(order) {
  if (!order.address) {
    return "Endereco nao informado";
  }

  const reference = order.address.referencePoint ? ` - Ref: ${order.address.referencePoint}` : "";
  return `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}/${order.address.state}${reference}`;
}

function buildOrderMessage(order) {
  return [
    `Novo pedido ${order.code}`,
    `Cliente: ${order.customer?.name || "Cliente"}`,
    `Pagamento: ${order.paymentMethod} - ${order.paymentStatus}`,
    `Total: ${formatMoney(order.total)}`,
    `Itens:\n${formatItems(order)}`,
    `Entrega: ${formatAddress(order)}`
  ].join("\n\n");
}

function buildStatusMessage(order) {
  return [
    `Atualizacao do pedido ${order.code}`,
    `Status: ${order.statusLabel || order.status}`,
    `Pagamento: ${order.paymentMethod} - ${order.paymentStatus}`,
    `Total: ${formatMoney(order.total)}`
  ].join("\n\n");
}

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "/app/sessions"
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  }
});

client.on("qr", async (qr) => {
  const qrCodeDataUrl = await QRCode.toDataURL(qr);
  touchState({
    connected: false,
    status: "aguardando_qr",
    qrCodeDataUrl,
    error: null
  });
});

client.on("ready", () => {
  touchState({
    connected: true,
    status: "conectado",
    qrCodeDataUrl: null,
    phoneNumber: client.info?.wid?.user || null,
    accountName: client.info?.pushname || null,
    error: null
  });
});

client.on("authenticated", () => {
  touchState({
    status: "autenticado",
    error: null
  });
});

client.on("auth_failure", (message) => {
  touchState({
    connected: false,
    status: "falha_autenticacao",
    error: message || "Falha ao autenticar no WhatsApp."
  });
});

client.on("disconnected", (reason) => {
  touchState({
    connected: false,
    status: "desconectado",
    qrCodeDataUrl: null,
    error: String(reason || "Sessao desconectada.")
  });
  setTimeout(() => {
    client.initialize().catch(() => undefined);
  }, 5000);
});

clearSessionLocks();

client.initialize().catch((error) => {
  touchState({
    connected: false,
    status: "erro_inicializacao",
    error: error instanceof Error ? error.message : "Falha ao iniciar o cliente do WhatsApp."
  });
});

app.get("/health", (_request, response) => {
  response.json({
    name: "Fortin Chatbot",
    status: "ok",
    whatsapp: state.status,
    connected: state.connected,
    timestamp: new Date().toISOString()
  });
});

app.get("/session", ensureAuthorized, (_request, response) => {
  response.json({
    connected: state.connected,
    status: state.status,
    phoneNumber: state.phoneNumber,
    accountName: state.accountName,
    qrCodeDataUrl: state.qrCodeDataUrl,
    lastUpdatedAt: state.updatedAt,
    error: state.error
  });
});

app.post("/send-order", ensureAuthorized, async (request, response) => {
  if (!state.connected) {
    response.status(409).json({ message: "WhatsApp ainda nao conectado." });
    return;
  }

  const phone = normalizePhone(request.body?.phone);
  if (!phone) {
    response.status(400).json({ message: "Telefone invalido." });
    return;
  }

  await client.sendMessage(phone, buildOrderMessage(request.body.order || {}));
  response.json({ delivered: true });
});

app.post("/send-status", ensureAuthorized, async (request, response) => {
  if (!state.connected) {
    response.status(409).json({ message: "WhatsApp ainda nao conectado." });
    return;
  }

  const phone = normalizePhone(request.body?.phone);
  if (!phone) {
    response.status(400).json({ message: "Telefone invalido." });
    return;
  }

  await client.sendMessage(phone, buildStatusMessage(request.body.order || {}));
  response.json({ delivered: true });
});

app.listen(port, () => {
  console.log(`Fortin Chatbot ouvindo na porta ${port}`);
});
