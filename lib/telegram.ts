// Server-only — never import from client components.
// Sends a fire-and-forget message to a Telegram bot.
// If TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are missing the call is silently
// skipped so the store keeps working without the integration configured.

export interface TelegramOrderPayload {
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  note?: string | null;
  items: { name: string; size: string | null; colorName: string | null; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
}

function formatPrice(cents: number): string {
  return `${Math.round(cents / 100).toLocaleString("fr-DZ")} DA`;
}

function buildMessage(p: TelegramOrderPayload): string {
  const itemLines = p.items
    .map((it) => {
      const variant = [it.size, it.colorName].filter(Boolean).join(" / ");
      const label = variant ? `${it.name} (${variant})` : it.name;
      return `  • ${label} × ${it.quantity} — ${formatPrice(it.unitPriceCents * it.quantity)}`;
    })
    .join("\n");

  const address = [p.wilaya, p.commune, p.address].filter(Boolean).join(", ");

  return [
    `🛒 *Nouvelle commande — ${p.orderNumber}*`,
    ``,
    `👤 *Client :* ${p.customerName}`,
    `📞 *Téléphone :* ${p.phone}`,
    `📍 *Adresse :* ${address}`,
    p.note ? `📝 *Note :* ${p.note}` : null,
    ``,
    `🧾 *Articles :*`,
    itemLines,
    ``,
    `💰 *Total : ${formatPrice(p.subtotalCents)}*`,
    ``,
    `📦 Paiement à la livraison`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function sendOrderNotification(
  payload: TelegramOrderPayload
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(payload),
        parse_mode: "Markdown",
      }),
    });
  } catch {
    // Non-fatal — order is already saved; log and continue.
    console.error("[telegram] Failed to send order notification");
  }
}
