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

/**
 * Espera mínima antes de confirmar una acción del servidor.
 * Una respuesta *instantánea* en un formulario puede sentirse sospechosa
 * ("¿de verdad se guardó?"); un pequeño respiro (usado junto al estado de
 * carga que ya existe) da más confianza de que la acción se procesó de
 * verdad. Se usa dentro de Server Actions, nunca alarga la app en sí.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
