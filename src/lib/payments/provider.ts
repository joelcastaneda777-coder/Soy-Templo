/**
 * Capa de pagos desacoplada.
 * La app nunca toca datos de tarjetas: cada proveedor certificado (Wompi,
 * Stripe, PayPal, etc.) implementa esta interfaz y aloja su propio checkout.
 * Cambiar de proveedor = registrar otra implementación, sin tocar la UI.
 */

export type CheckoutInput = {
  donationId: string;
  amountCents: number;
  currency: string;
  categorySlug: string;
  donorEmail?: string;
};

export type CheckoutResult =
  | { ok: true; referenceId: string; redirectUrl: string }
  | { ok: false; error: string };

export type WebhookEvent = {
  referenceId: string;
  status: "completed" | "failed" | "refunded";
  rawPayload: unknown;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Verifica firma y normaliza el evento del webhook. Lanza si es inválido. */
  parseWebhook(body: string, signature: string | null): Promise<WebhookEvent>;
}
