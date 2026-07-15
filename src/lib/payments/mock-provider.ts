import crypto from "node:crypto";
import type { PaymentProvider, WebhookEvent } from "./provider";

/**
 * Proveedor simulado para desarrollo.
 * Genera una referencia única y "aprueba" el pago en una página interna.
 * Sustituir por un proveedor real implementando la misma interfaz.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckout(input) {
    const referenceId = `MOCK-${crypto.randomUUID()}`;
    return {
      ok: true,
      referenceId,
      redirectUrl: `/donar/gracias?ref=${encodeURIComponent(referenceId)}&donation=${input.donationId}`,
    };
  },

  async parseWebhook(body, signature): Promise<WebhookEvent> {
    const expected = crypto
      .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET ?? "")
      .update(body)
      .digest("hex");
    if (!signature || signature !== expected) {
      throw new Error("Firma de webhook inválida");
    }
    const parsed = JSON.parse(body) as { referenceId: string; status: WebhookEvent["status"] };
    return { referenceId: parsed.referenceId, status: parsed.status, rawPayload: parsed };
  },
};
