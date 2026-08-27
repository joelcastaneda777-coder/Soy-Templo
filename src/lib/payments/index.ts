import type { PaymentProvider } from "./provider";
import { mockProvider } from "./mock-provider";
import { paypalProvider } from "./paypal-provider";
import { disabledProvider } from "./disabled-provider";

const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  paypal: paypalProvider,
  disabled: disabledProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const defaultName = process.env.NODE_ENV === "development" ? "mock" : "disabled";
  const name = process.env.PAYMENT_PROVIDER ?? defaultName;
  return providers[name] ?? disabledProvider;
}

export function paymentProviderStatus() {
  const provider = getPaymentProvider();
  return { name: provider.name, configured: provider.configured };
}
