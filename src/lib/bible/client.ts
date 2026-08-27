/**
 * Cliente de lectura bíblica.
 *
 * La lista de libros se mantiene localmente para que /biblia no dependa
 * de la disponibilidad de un servicio externo. El texto de cada capítulo
 * se consulta en bible-api.deno.dev.
 */

const BASE_URL = "https://bible-api.deno.dev/api";

export type BibleVersion = { code: string; name: string };

export const BIBLE_VERSIONS: BibleVersion[] = [
  { code: "rv1960", name: "Reina Valera 1960" },
  { code: "nvi", name: "Nueva Versión Internacional" },
  { code: "dhh", name: "Dios Habla Hoy" },
];

export const DEFAULT_BIBLE_VERSION = "rv1960";

export type BibleBook = {
  name: string;
  abrev: string;
  chapters: number;
  testament: "Antiguo Testamento" | "Nuevo Testamento";
};

export type BibleVerse = {
  number: number;
  verse: string;
};

export type BibleChapter = {
  name: string;
  chapter: number;
  num_chapters: number;
  testament: string;
  vers: BibleVerse[];
};

const BIBLE_BOOKS: BibleBook[] = [
  { name: "Génesis", abrev: "GN", chapters: 50, testament: "Antiguo Testamento" },
  { name: "Éxodo", abrev: "EX", chapters: 40, testament: "Antiguo Testamento" },
  { name: "Levítico", abrev: "LV", chapters: 27, testament: "Antiguo Testamento" },
  { name: "Números", abrev: "NM", chapters: 36, testament: "Antiguo Testamento" },
  { name: "Deuteronomio", abrev: "DT", chapters: 34, testament: "Antiguo Testamento" },
  { name: "Josué", abrev: "JOS", chapters: 24, testament: "Antiguo Testamento" },
  { name: "Jueces", abrev: "JUE", chapters: 21, testament: "Antiguo Testamento" },
  { name: "Rut", abrev: "RT", chapters: 4, testament: "Antiguo Testamento" },
  { name: "1 Samuel", abrev: "1S", chapters: 31, testament: "Antiguo Testamento" },
  { name: "2 Samuel", abrev: "2S", chapters: 24, testament: "Antiguo Testamento" },
  { name: "1 Reyes", abrev: "1R", chapters: 22, testament: "Antiguo Testamento" },
  { name: "2 Reyes", abrev: "2R", chapters: 25, testament: "Antiguo Testamento" },
  { name: "1 Crónicas", abrev: "1CR", chapters: 29, testament: "Antiguo Testamento" },
  { name: "2 Crónicas", abrev: "2CR", chapters: 36, testament: "Antiguo Testamento" },
  { name: "Esdras", abrev: "ESD", chapters: 10, testament: "Antiguo Testamento" },
  { name: "Nehemías", abrev: "NEH", chapters: 13, testament: "Antiguo Testamento" },
  { name: "Ester", abrev: "EST", chapters: 10, testament: "Antiguo Testamento" },
  { name: "Job", abrev: "JOB", chapters: 42, testament: "Antiguo Testamento" },
  { name: "Salmos", abrev: "SAL", chapters: 150, testament: "Antiguo Testamento" },
  { name: "Proverbios", abrev: "PR", chapters: 31, testament: "Antiguo Testamento" },
  { name: "Eclesiastés", abrev: "EC", chapters: 12, testament: "Antiguo Testamento" },
  { name: "Cantares", abrev: "CNT", chapters: 8, testament: "Antiguo Testamento" },
  { name: "Isaías", abrev: "IS", chapters: 66, testament: "Antiguo Testamento" },
  { name: "Jeremías", abrev: "JER", chapters: 52, testament: "Antiguo Testamento" },
  { name: "Lamentaciones", abrev: "LM", chapters: 5, testament: "Antiguo Testamento" },
  { name: "Ezequiel", abrev: "EZ", chapters: 48, testament: "Antiguo Testamento" },
  { name: "Daniel", abrev: "DN", chapters: 12, testament: "Antiguo Testamento" },
  { name: "Oseas", abrev: "OS", chapters: 14, testament: "Antiguo Testamento" },
  { name: "Joel", abrev: "JL", chapters: 3, testament: "Antiguo Testamento" },
  { name: "Amós", abrev: "AM", chapters: 9, testament: "Antiguo Testamento" },
  { name: "Abdías", abrev: "ABD", chapters: 1, testament: "Antiguo Testamento" },
  { name: "Jonás", abrev: "JON", chapters: 4, testament: "Antiguo Testamento" },
  { name: "Miqueas", abrev: "MI", chapters: 7, testament: "Antiguo Testamento" },
  { name: "Nahúm", abrev: "NAH", chapters: 3, testament: "Antiguo Testamento" },
  { name: "Habacuc", abrev: "HAB", chapters: 3, testament: "Antiguo Testamento" },
  { name: "Sofonías", abrev: "SOF", chapters: 3, testament: "Antiguo Testamento" },
  { name: "Hageo", abrev: "HAG", chapters: 2, testament: "Antiguo Testamento" },
  { name: "Zacarías", abrev: "ZAC", chapters: 14, testament: "Antiguo Testamento" },
  { name: "Malaquías", abrev: "MAL", chapters: 4, testament: "Antiguo Testamento" },
  { name: "Mateo", abrev: "MT", chapters: 28, testament: "Nuevo Testamento" },
  { name: "Marcos", abrev: "MR", chapters: 16, testament: "Nuevo Testamento" },
  { name: "Lucas", abrev: "LC", chapters: 24, testament: "Nuevo Testamento" },
  { name: "Juan", abrev: "JN", chapters: 21, testament: "Nuevo Testamento" },
  { name: "Hechos", abrev: "HCH", chapters: 28, testament: "Nuevo Testamento" },
  { name: "Romanos", abrev: "RO", chapters: 16, testament: "Nuevo Testamento" },
  { name: "1 Corintios", abrev: "1CO", chapters: 16, testament: "Nuevo Testamento" },
  { name: "2 Corintios", abrev: "2CO", chapters: 13, testament: "Nuevo Testamento" },
  { name: "Gálatas", abrev: "GA", chapters: 6, testament: "Nuevo Testamento" },
  { name: "Efesios", abrev: "EF", chapters: 6, testament: "Nuevo Testamento" },
  { name: "Filipenses", abrev: "FIL", chapters: 4, testament: "Nuevo Testamento" },
  { name: "Colosenses", abrev: "COL", chapters: 4, testament: "Nuevo Testamento" },
  { name: "1 Tesalonicenses", abrev: "1TS", chapters: 5, testament: "Nuevo Testamento" },
  { name: "2 Tesalonicenses", abrev: "2TS", chapters: 3, testament: "Nuevo Testamento" },
  { name: "1 Timoteo", abrev: "1TI", chapters: 6, testament: "Nuevo Testamento" },
  { name: "2 Timoteo", abrev: "2TI", chapters: 4, testament: "Nuevo Testamento" },
  { name: "Tito", abrev: "TIT", chapters: 3, testament: "Nuevo Testamento" },
  { name: "Filemón", abrev: "FLM", chapters: 1, testament: "Nuevo Testamento" },
  { name: "Hebreos", abrev: "HE", chapters: 13, testament: "Nuevo Testamento" },
  { name: "Santiago", abrev: "STG", chapters: 5, testament: "Nuevo Testamento" },
  { name: "1 Pedro", abrev: "1P", chapters: 5, testament: "Nuevo Testamento" },
  { name: "2 Pedro", abrev: "2P", chapters: 3, testament: "Nuevo Testamento" },
  { name: "1 Juan", abrev: "1JN", chapters: 5, testament: "Nuevo Testamento" },
  { name: "2 Juan", abrev: "2JN", chapters: 1, testament: "Nuevo Testamento" },
  { name: "3 Juan", abrev: "3JN", chapters: 1, testament: "Nuevo Testamento" },
  { name: "Judas", abrev: "JUD", chapters: 1, testament: "Nuevo Testamento" },
  { name: "Apocalipsis", abrev: "AP", chapters: 22, testament: "Nuevo Testamento" },
];

function isValidVersion(version: string): boolean {
  return BIBLE_VERSIONS.some((v) => v.code === version);
}

/** Lista canónica de 66 libros. No hace llamadas de red. */
export async function getBibleBooks(): Promise<BibleBook[]> {
  return BIBLE_BOOKS;
}

/** Un capítulo completo con sus versículos, en la versión indicada. */
export async function getBibleChapter(
  version: string,
  book: string,
  chapter: number
): Promise<BibleChapter | null> {
  if (!isValidVersion(version) || !Number.isInteger(chapter) || chapter < 1) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/read/${version}/${encodeURIComponent(book)}/${chapter}`,
      {
        next: { revalidate: 86400 },
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as Partial<BibleChapter>;
    if (!Array.isArray(data.vers)) return null;

    return data as BibleChapter;
  } catch {
    return null;
  }
}

export function slugifyBookName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}
