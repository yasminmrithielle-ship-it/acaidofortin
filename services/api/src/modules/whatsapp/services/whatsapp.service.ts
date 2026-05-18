import { env } from "../../../config/env";

type BotResponse = {
  connected?: boolean;
  status?: string;
  phone?: string;
  phoneNumber?: string;
  accountName?: string;
  profileName?: string;
  qrCodeDataUrl?: string;
  qrCode?: string;
  qr?: string;
  qrcode?: string;
  updatedAt?: string;
  lastUpdatedAt?: string;
  error?: string;
  message?: string;
};

function buildBotUrl(path: string) {
  return `${env.WHATSAPP_BOT_URL!.replace(/\/$/, "")}${path}`;
}

function normalizeQrCode(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("data:image")) return value;
  return `data:image/png;base64,${value}`;
}

async function readBotStatus() {
  const response = await fetch(buildBotUrl("/session"), {
    headers: env.WHATSAPP_BOT_SECRET
      ? {
          "x-fortin-secret": env.WHATSAPP_BOT_SECRET
        }
      : undefined
  });

  if (!response.ok) {
    throw new Error(`WhatsApp bot respondeu ${response.status}`);
  }

  return response.json() as Promise<BotResponse>;
}

export const whatsappService = {
  async getConnection() {
    if (!env.WHATSAPP_BOT_URL) {
      return {
        configured: false,
        connected: false,
        status: "unconfigured",
        botUrl: null,
        phone: null,
        accountName: null,
        qrCodeDataUrl: null,
        lastUpdatedAt: null,
        lastError: "WHATSAPP_BOT_URL nao configurada.",
        instructions: [
          "Configure WHATSAPP_BOT_URL e, se necessario, WHATSAPP_BOT_SECRET na API.",
          "Aponte para o servico que gera a sessao e o QR Code do WhatsApp.",
          "Depois atualize esta tela para escanear e conectar."
        ]
      };
    }

    try {
      const payload = await readBotStatus();

      return {
        configured: true,
        connected: Boolean(payload.connected),
        status: payload.status ?? (payload.connected ? "connected" : "awaiting_qr"),
        botUrl: env.WHATSAPP_BOT_URL,
        phone: payload.phoneNumber ?? payload.phone ?? null,
        accountName: payload.accountName ?? payload.profileName ?? null,
        qrCodeDataUrl: normalizeQrCode(payload.qrCodeDataUrl ?? payload.qrCode ?? payload.qr ?? payload.qrcode),
        lastUpdatedAt: payload.lastUpdatedAt ?? payload.updatedAt ?? new Date().toISOString(),
        lastError: payload.error ?? null,
        instructions: payload.connected
          ? [
              "WhatsApp conectado com sucesso.",
              "Os pedidos e atualizacoes de status podem ser enviados pelo bot."
            ]
          : [
              "Escaneie o QR Code com o WhatsApp do numero da loja.",
              "Mantenha esta tela aberta e atualize se um novo QR Code for gerado."
            ]
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        status: "offline",
        botUrl: env.WHATSAPP_BOT_URL,
        phone: null,
        accountName: null,
        qrCodeDataUrl: null,
        lastUpdatedAt: new Date().toISOString(),
        lastError: error instanceof Error ? error.message : "Falha ao consultar o bot do WhatsApp.",
        instructions: [
          "Verifique se o servico do bot esta online.",
          "Confirme se a rota /session existe e retorna o QR Code ou o status de conexao."
        ]
      };
    }
  }
};
