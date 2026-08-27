import type { PaymentProvider } from "./provider";

export const disabledProvider: PaymentProvider = {
  name: "disabled",
  configured: false,
  async createCheckout() {
    return { ok: false, error: "Las donaciones en línea se activarán cuando la cuenta institucional de PayPal quede configurada." };
  },
  async parseWebhook() {
    throw new Error("Proveedor de pagos desactivado");
  },
};
