import type { BibleChapter, BibleVerse } from "@/lib/bible/client";

const BASE_URL = "https://esbiblia.net/api";

export const ESBIBLIA_VERSIONS = [
  { code: "rv1960", apiCode: "RVR1960", name: "Reina Valera 1960" },
  { code: "jer", apiCode: "JER", name: "Biblia de Jerusalén" },
] as const;

const BOOK_IDS: Record<string, string> = {
  genesis: "GEN", exodo: "EXO", levitico: "LEV", numeros: "NUM", deuteronomio: "DEU",
  josue: "JOS", jueces: "JDG", rut: "RUT", "1-samuel": "1SA", "2-samuel": "2SA",
  "1-reyes": "1KI", "2-reyes": "2KI", "1-cronicas": "1CH", "2-cronicas": "2CH",
  esdras: "EZR", nehemias: "NEH", ester: "EST", job: "JOB", salmos: "PSA",
  proverbios: "PRO", eclesiastes: "ECC", cantares: "SNG", isaias: "ISA", jeremias: "JER",
  lamentaciones: "LAM", ezequiel: "EZK", daniel: "DAN", oseas: "HOS", joel: "JOL",
  amos: "AMO", abdias: "OBA", jonas: "JON", miqueas: "MIC", nahum: "NAM",
  habacuc: "HAB", sofonias: "ZEP", hageo: "HAG", zacarias: "ZEC", malaquias: "MAL",
  mateo: "MAT", marcos: "MRK", lucas: "LUK", juan: "JHN", hechos: "ACT",
  romanos: "ROM", "1-corintios": "1CO", "2-corintios": "2CO", galatas: "GAL",
  efesios: "EPH", filipenses: "PHP", colosenses: "COL", "1-tesalonicenses": "1TH",
  "2-tesalonicenses": "2TH", "1-timoteo": "1TI", "2-timoteo": "2TI", tito: "TIT",
  filemon: "PHM", hebreos: "HEB", santiago: "JAS", "1-pedro": "1PE", "2-pedro": "2PE",
  "1-juan": "1JN", "2-juan": "2JN", "3-juan": "3JN", judas: "JUD", apocalipsis: "REV",
};

function versionToApiCode(version: string): string | null {
  return ESBIBLIA_VERSIONS.find((item) => item.code === version)?.apiCode ?? null;
}

function normalizeVerse(item: unknown): BibleVerse | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const number = Number(row.verse ?? row.number ?? row.verse_number);
  const text = row.text ?? row.verse_text ?? row.content;
  if (!Number.isInteger(number) || typeof text !== "string" || !text.trim()) return null;
  return { number, verse: text.trim() };
}

export async function getBibleChapterFromEsBiblia(
  version: string,
  bookSlug: string,
  chapter: number
): Promise<BibleChapter | null> {
  const apiVersion = versionToApiCode(version);
  const bookId = BOOK_IDS[bookSlug];
  if (!apiVersion || !bookId || !Number.isInteger(chapter) || chapter < 1) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/books/${bookId}/${chapter}/?v=${encodeURIComponent(apiVersion)}`,
      {
        next: { revalidate: 86400 },
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return null;
    const payload = await response.json() as unknown;

    let rawVerses: unknown[] = [];
    if (Array.isArray(payload)) rawVerses = payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.verses)) rawVerses = obj.verses;
      else if (Array.isArray(obj.results)) rawVerses = obj.results;
      else if (obj.data && typeof obj.data === "object") {
        const data = obj.data as Record<string, unknown>;
        if (Array.isArray(data.verses)) rawVerses = data.verses;
        else if (Array.isArray(data.results)) rawVerses = data.results;
      }
    }

    const vers = rawVerses.map(normalizeVerse).filter((verse): verse is BibleVerse => verse !== null);
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
