/**
 * Capa de pagos desacoplada. La app nunca recibe datos de tarjeta.
 * Cada proveedor crea su checkout alojado y normaliza sus webhooks.
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
  referenceId?: string;
  donationId?: string;
  providerCaptureId?: string;
  status: "completed" | "failed" | "refunded";
  grossAmountCents?: number;
  feeAmountCents?: number;
  netAmountCents?: number;
  settledAt?: string;
  rawPayload: unknown;
};

export interface PaymentProvider {
  readonly name: string;
  readonly configured: boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Verifica autenticidad y normaliza el webhook. null = evento irrelevante. */
  parseWebhook(body: string, headers: Headers): Promise<WebhookEvent | null>;
}
