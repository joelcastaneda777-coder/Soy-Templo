/**
 * Cliente para la Biblia en línea.
 *
 * Usa bible-api.deno.dev, un servicio gratuito y sin necesidad de clave
 * (https://docs-bible-api.netlify.app/). Es un proyecto comunitario, no
 * una fuente oficial de las sociedades bíblicas — funciona bien para una
 * app de este tamaño, pero si más adelante se necesita una licencia
 * formal, esta es la única capa que habría que reemplazar.
 *
 * Solo lectura: no comparamos versiones, cada persona elige la suya y lee.
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
  testament: string;
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

function isValidVersion(version: string): boolean {
  return BIBLE_VERSIONS.some((v) => v.code === version);
}

/** Lista completa de libros (no depende de la versión). */
export async function getBibleBooks(): Promise<BibleBook[]> {
  const res = await fetch(`${BASE_URL}/books`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("No se pudo cargar la lista de libros de la Biblia.");
  return res.json();
}

/** Un capítulo completo con sus versículos, en la versión indicada. */
export async function getBibleChapter(
  version: string,
  book: string,
  chapter: number
): Promise<BibleChapter | null> {
  if (!isValidVersion(version)) return null;
  const res = await fetch(
    `${BASE_URL}/read/${version}/${encodeURIComponent(book)}/${chapter}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export function slugifyBookName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
