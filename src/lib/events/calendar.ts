export const EVENT_TIME_ZONE = "America/El_Salvador";

export function dateKeyFromIso(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export function todayInElSalvador() {
  return dateKeyFromIso(new Date().toISOString());
}

export function monthRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error("Mes inválido");
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  return {
    start: `${month}-01T00:00:00-06:00`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00-06:00`,
  };
}

export function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("es-SV", { timeZone: EVENT_TIME_ZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function formatEventTime(iso: string) {
  return new Intl.DateTimeFormat("es-SV", { timeZone: EVENT_TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

export function isoToLocalInput(iso?: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}
