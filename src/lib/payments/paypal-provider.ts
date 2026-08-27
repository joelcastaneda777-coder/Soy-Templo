import type { CheckoutInput, PaymentProvider, WebhookEvent } from "./provider";

type PayPalCapture = {
  id?: string;
  status?: string;
  update_time?: string;
  custom_id?: string;
  invoice_id?: string;
  amount?: { value?: string; currency_code?: string };
  seller_receivable_breakdown?: {
    gross_amount?: { value?: string };
    paypal_fee?: { value?: string };
    net_amount?: { value?: string };
  };
  supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
};

type PayPalOrder = {
  id?: string;
  status?: string;
  links?: Array<{ href?: string; rel?: string; method?: string }>;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: { captures?: PayPalCapture[] };
  }>;
};

function baseUrl() {
  return process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function config() {
  return {
    clientId: process.env.PAYPAL_CLIENT_ID ?? "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? "",
  };
}

export function isPayPalConfigured() {
  const c = config();
  return Boolean(c.clientId && c.clientSecret && c.webhookId);
}

async function accessToken() {
  const { clientId, clientSecret } = config();
  if (!clientId || !clientSecret) throw new Error("PayPal no está configurado");

  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "No se pudo autenticar con PayPal");
  return data.access_token;
}

function cents(value?: string) {
  if (!value) return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : undefined;
}

function normalizeCapture(capture: PayPalCapture, rawPayload: unknown): WebhookEvent {
  const breakdown = capture.seller_receivable_breakdown;
  return {
    referenceId: capture.supplementary_data?.related_ids?.order_id,
    donationId: capture.custom_id || capture.invoice_id,
    providerCaptureId: capture.id,
    status: capture.status === "COMPLETED" ? "completed" : "failed",
    grossAmountCents: cents(breakdown?.gross_amount?.value ?? capture.amount?.value),
    feeAmountCents: cents(breakdown?.paypal_fee?.value),
    netAmountCents: cents(breakdown?.net_amount?.value),
    settledAt: capture.update_time,
    rawPayload,
  };
}

export async function capturePayPalOrder(orderId: string): Promise<WebhookEvent> {
  const token = await accessToken();
  const response = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "PayPal-Request-Id": `soy-templo-capture-${orderId}`,
    },
    body: "{}",
    cache: "no-store",
  });
  const data = (await response.json()) as PayPalOrder & { message?: string };
  if (!response.ok) throw new Error(data.message || "No se pudo confirmar el pago en PayPal");
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) throw new Error("PayPal no devolvió una captura de pago");
  const normalized = normalizeCapture(capture, data);
  normalized.referenceId = normalized.referenceId ?? data.id ?? orderId;
  normalized.donationId = normalized.donationId ?? data.purchase_units?.[0]?.custom_id;
  return normalized;
}

async function verifyWebhook(body: string, headers: Headers) {
  const { webhookId } = config();
  if (!webhookId) throw new Error("Webhook de PayPal no configurado");
  const required = {
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
  };
  if (Object.values(required).some((value) => !value)) throw new Error("Cabeceras de PayPal incompletas");

  const token = await accessToken();
  const response = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...required, webhook_id: webhookId, webhook_event: JSON.parse(body) }),
    cache: "no-store",
  });
  const data = (await response.json()) as { verification_status?: string };
  if (!response.ok || data.verification_status !== "SUCCESS") throw new Error("Firma PayPal inválida");
}

export const paypalProvider: PaymentProvider = {
  name: "paypal",
  get configured() {
    return isPayPalConfigured();
  },

  async createCheckout(input: CheckoutInput) {
    if (!isPayPalConfigured()) return { ok: false, error: "Las donaciones por PayPal todavía no están activadas." };
    try {
      const token = await accessToken();
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
      if (!siteUrl) return { ok: false, error: "Falta configurar la URL pública de Soy Templo." };
      const value = (input.amountCents / 100).toFixed(2);
      const response = await fetch(`${baseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          "PayPal-Request-Id": `soy-templo-donation-${input.donationId}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: "Soy Templo",
                landing_page: "LOGIN",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
                return_url: `${siteUrl}/api/payments/paypal/return`,
                cancel_url: `${siteUrl}/donar?cancelled=1`,
              },
            },
          },
          purchase_units: [{
            custom_id: input.donationId,
            description: `Donación Soy Templo · ${input.categorySlug}`.slice(0, 127),
            amount: { currency_code: input.currency, value },
          }],
        }),
        cache: "no-store",
      });
      const data = (await response.json()) as PayPalOrder & { message?: string };
      const approveUrl = data.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
      if (!response.ok || !data.id || !approveUrl) {
        return { ok: false, error: data.message || "PayPal no pudo iniciar la donación." };
      }
      return { ok: true, referenceId: data.id, redirectUrl: approveUrl };
    } catch {
      return { ok: false, error: "No pudimos conectar con PayPal. Intenta nuevamente." };
    }
  },

  async parseWebhook(body, headers) {
    await verifyWebhook(body, headers);
    const event = JSON.parse(body) as { event_type?: string; resource?: PayPalCapture & { order_id?: string } };
    const resource = event.resource ?? {};
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") return normalizeCapture(resource, event);
    if (event.event_type === "PAYMENT.CAPTURE.DENIED") return { ...normalizeCapture(resource, event), status: "failed" };
    if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      return {
        referenceId: resource.supplementary_data?.related_ids?.order_id,
        donationId: resource.custom_id || resource.invoice_id,
        providerCaptureId: resource.supplementary_data?.related_ids?.capture_id,
        status: "refunded",
        rawPayload: event,
      };
    }
    if (event.event_type === "CHECKOUT.PAYMENT-APPROVAL.REVERSED") {
      return { referenceId: resource.order_id, status: "failed", rawPayload: event };
    }
    return null;
  },
};
