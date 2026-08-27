import type { BibleChapter, BibleVerse } from "@/lib/bible/client";

const BASE_URL = "https://esbiblia.net/api";

/**
 * Versiones verificadas extremo a extremo contra el endpoint vivo de esBiblia.
 * RVR1960 fue retirada del servicio. JER sigue apareciendo en /versions/,
 * pero actualmente no entrega capítulos, por lo que no se ofrece en la UI.
 */
export const ESBIBLIA_VERSIONS = [
  { code: "rvr1909", apiCode: "rvr", name: "Reina Valera 1909" },
  { code: "rva", apiCode: "rva", name: "Reina Valera Actualizada" },
] as const;

export const DEFAULT_ESBIBLIA_VERSION = "rvr1909";

function versionToApiCode(version: string): string | null {
  return ESBIBLIA_VERSIONS.find((item) => item.code === version)?.apiCode ?? null;
}

function normalizeBookKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ProviderBook = {
  id: string;
  name: string;
};

function extractProviderBooks(payload: unknown): ProviderBook[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const raw = Array.isArray(obj.books)
    ? obj.books
    : Array.isArray(obj.results)
      ? obj.results
      : [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.name !== "string") return null;
      return { id: row.id, name: row.name };
    })
    .filter((item): item is ProviderBook => item !== null);
}

async function resolveProviderBookId(bookSlug: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/books/`, {
      next: { revalidate: 86400 },
      headers: {
        Accept: "application/json",
        "User-Agent": "SoyTemplo/1.0",
      },
    });

    if (!response.ok) return null;
    const books = extractProviderBooks((await response.json()) as unknown);
    return books.find((book) => normalizeBookKey(book.name) === bookSlug)?.id ?? null;
  } catch {
    return null;
  }
}

function normalizeVerse(item: unknown, fallbackNumber: number): BibleVerse | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;

  const rawNumber =
    row.verse_number ??
    row.number ??
    (typeof row.verse === "number" ? row.verse : fallbackNumber);
  const number = Number(rawNumber);

  const text =
    row.text ??
    row.verse_text ??
    row.content ??
    (typeof row.verse === "string" ? row.verse : null);

  if (!Number.isInteger(number) || typeof text !== "string" || !text.trim()) return null;
  return { number, verse: text.trim() };
}

function normalizeVerseCollection(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).map(([key, raw]) => {
    if (typeof raw === "string") {
      return { verse_number: Number(key), text: raw };
    }
    if (raw && typeof raw === "object") {
      return { verse_number: Number(key), ...(raw as Record<string, unknown>) };
    }
    return raw;
  });
}

function extractVerses(payload: unknown): BibleVerse[] {
  let rawVerses: unknown[] = [];

  if (Array.isArray(payload)) {
    rawVerses = payload;
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    rawVerses = normalizeVerseCollection(obj.verses);

    if (!rawVerses.length) rawVerses = normalizeVerseCollection(obj.vers);
    if (!rawVerses.length) rawVerses = normalizeVerseCollection(obj.results);

    if (!rawVerses.length && obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      rawVerses = normalizeVerseCollection(data.verses);
      if (!rawVerses.length) rawVerses = normalizeVerseCollection(data.vers);
      if (!rawVerses.length) rawVerses = normalizeVerseCollection(data.results);
    }
  }

  return rawVerses
    .map((item, index) => normalizeVerse(item, index + 1))
    .filter((verse): verse is BibleVerse => verse !== null);
}

export function isEsBibliaVersion(version: string): boolean {
  return ESBIBLIA_VERSIONS.some((item) => item.code === version);
}

export async function getBibleChapterFromEsBiblia(
  version: string,
  bookSlug: string,
  chapter: number
): Promise<BibleChapter | null> {
  const apiVersion = versionToApiCode(version);
  if (!apiVersion || !Number.isInteger(chapter) || chapter < 1) return null;

  const bookId = await resolveProviderBookId(bookSlug);
  if (!bookId) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/view/${encodeURIComponent(bookId)}/${chapter}/?v=${encodeURIComponent(apiVersion)}`,
      {
        next: { revalidate: 86400 },
        headers: {
          Accept: "application/json",
          "User-Agent": "SoyTemplo/1.0",
        },
      }
    );

    if (!response.ok) return null;
    const vers = extractVerses((await response.json()) as unknown);
    if (!vers.length) return null;

    return {
      name: bookSlug,
      chapter,
      num_chapters: 0,
      testament: "",
      vers,
    };
  } catch {
    return null;
  }
}
