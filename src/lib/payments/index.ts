import type { PaymentProvider } from "./provider";
import { mockProvider } from "./mock-provider";

const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  // wompi: wompiProvider,  // futuro
  // stripe: stripeProvider, // futuro
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  const provider = providers[name];
  if (!provider) throw new Error(`Proveedor de pagos no configurado: ${name}`);
  return provider;
}
