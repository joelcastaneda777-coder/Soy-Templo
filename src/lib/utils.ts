import { t } from "@/lib/i18n/es";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Saludo según la hora local de El Salvador. */
export function greetingByHour(date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("es-SV", {
      hour: "numeric", hour12: false, timeZone: "America/El_Salvador",
    }).format(date)
  );
  if (hour < 12) return t.greeting.morning;
  if (hour < 18) return t.greeting.afternoon;
  return t.greeting.evening;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "long", timeZone: "America/El_Salvador", ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-SV", {
    timeStyle: "short", timeZone: "America/El_Salvador",
  }).format(new Date(iso));
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("es-SV", { style: "currency", currency }).format(cents / 100);
}
