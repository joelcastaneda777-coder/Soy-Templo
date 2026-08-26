/**
 * Parser del formato Markdown para devocionales mensuales.
 *
 * Diseñado para que el equipo de comunicaciones pueda generar un mes completo
 * con una IA (Gemini, ChatGPT, Claude, etc.) y pegarlo directamente en
 * /admin/devocionales/importar sin tocar código ni SQL.
 */

export type ParsedDevotional = {
  date: string;
  title: string;
  slug: string;
  bibleReading: string;
  keyVerse: string;
  reflection: string;
  application: string;
  questions: string[];
  closingPrayer: string;
};

export type ParseIssue = { date: string; title: string; message: string };

export type ParseOptions = {
  month?: number;
  year?: number;
};

export type ParseResult = {
  devotionals: ParsedDevotional[];
  issues: ParseIssue[];
};

// Acepta ## o ###, fechas explícitas y "Día N" con :, -, – o —.
const HEADER_DATE_RE = /^#{2,3}\s+(\d{4}-\d{2}-\d{2})\s*(?:—|–|-|:)\s*(.+?)\s*$/;
const HEADER_DAY_RE = /^#{2,3}\s+D[ií]a\s+(\d{1,3})\s*(?:[:—–-])\s*(.+?)\s*$/i;

// Tolera etiquetas comunes producidas por distintas IAs.
const READING_RE = /^\*{0,2}(?:Lectura(?:\s+b[ií]blica)?|Texto(?:\s+b[ií]blico)?):\*{0,2}\s*(.*)$/i;
const VERSE_RE = /^\*{0,2}(?:Vers[íi]culo(?:\s+clave)?|Texto\s+clave):\*{0,2}\s*(.*)$/i;
const REFLECTION_RE = /^\*{0,2}(?:Reflexi[óo]n|Devocional|Meditaci[óo]n):\*{0,2}\s*(.*)$/i;
const APPLICATION_RE = /^\*{0,2}(?:Aplicaci[óo]n|Aplicaci[óo]n\s+pr[áa]ctica):\*{0,2}\s*(.*)$/i;
const QUESTIONS_RE = /^\*{0,2}(?:Preguntas|Preguntas\s+de\s+reflexi[óo]n):\*{0,2}\s*$/i;
const PRAYER_RE = /^\*{0,2}(?:Oraci[óo]n|Oraci[óo]n\s+final|Oraci[óo]n\s+de\s+cierre):\*{0,2}\s*(.*)$/i;
const QUESTION_ITEM_RE = /^\s*[-*]\s+(.+)$/;
const BLOCKQUOTE_RE = /^>\s*(.*)$/;

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function stripEmphasis(input: string): string {
  return input.trim().replace(/^\*+/, "").replace(/\*+$/, "").trim();
}

function joinParagraphs(lines: string[]): string {
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveDateFromDay(day: number, month: number, year: number): string | null {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const iso = `${year}-${mm}-${dd}`;
  const test = new Date(`${iso}T00:00:00Z`);
  const valid =
    test.getUTCFullYear() === year && test.getUTCMonth() === month - 1 && test.getUTCDate() === day;
  return valid ? iso : null;
}

export function parseDevotionalsMarkdown(markdown: string, options: ParseOptions = {}): ParseResult {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const devotionals: ParsedDevotional[] = [];
  const issues: ParseIssue[] = [];
  const seenSlugs = new Set<string>();

  let blockOpen = false;
  let explicitDate: string | null = null;
  let dayNumber: number | null = null;
  let blockTitle = "";
  let reading = "";
  let verse = "";
  let awaitingVerseQuote = false;
  const reflectionLines: string[] = [];
  const applicationLines: string[] = [];
  const prayerLines: string[] = [];
  const questions: string[] = [];
  let current: "reflection" | "application" | "prayer" | "questions" | null = null;

  function resetBlock() {
    blockOpen = false;
    explicitDate = null;
    dayNumber = null;
    blockTitle = "";
    reading = "";
    verse = "";
    awaitingVerseQuote = false;
    reflectionLines.length = 0;
    applicationLines.length = 0;
    prayerLines.length = 0;
    questions.length = 0;
    current = null;
  }

  function flush() {
    if (!blockOpen) return;

    const title = blockTitle.trim();
    let date: string | null = explicitDate;

    if (date === null && dayNumber !== null) {
      if (options.month && options.year) {
        date = resolveDateFromDay(dayNumber, options.month, options.year);
        if (date === null) {
          issues.push({ date: `Día ${dayNumber}`, title, message: `El día ${dayNumber} no existe en el mes/año seleccionado.` });
          resetBlock();
          return;
        }
      } else {
        issues.push({
          date: `Día ${dayNumber}`,
          title,
          message: 'Este archivo usa "Día N" en vez de fechas — selecciona el mes y el año arriba para calcularlas.',
        });
        resetBlock();
        return;
      }
    }

    if (date === null) {
      resetBlock();
      return;
    }

    const reflection = joinParagraphs(reflectionLines);
    const application = joinParagraphs(applicationLines);
    const closingPrayer = joinParagraphs(prayerLines);

    const missing: string[] = [];
    if (!title) missing.push("Título");
    if (!reading.trim()) missing.push("Lectura");
    if (!verse.trim()) missing.push("Versículo clave");
    if (!reflection) missing.push("Reflexión");
    if (!closingPrayer) missing.push("Oración");

    if (missing.length > 0) {
      issues.push({ date, title, message: `Faltan campos: ${missing.join(", ")}.` });
    } else {
      const slug = `${date}-${slugify(title)}`;
      if (seenSlugs.has(slug)) {
        issues.push({ date, title, message: "Fecha y título duplicados en este archivo." });
      } else {
        seenSlugs.add(slug);
        devotionals.push({
          date,
          title,
          slug,
          bibleReading: reading.trim(),
          keyVerse: verse.trim(),
          reflection,
          application,
          questions: [...questions],
          closingPrayer,
        });
      }
    }

    resetBlock();
  }

  for (const line of lines) {
    const dateHeaderMatch = line.match(HEADER_DATE_RE);
    if (dateHeaderMatch) {
      flush();
      blockOpen = true;
      explicitDate = dateHeaderMatch[1] ?? null;
      blockTitle = dateHeaderMatch[2] ?? "";
      continue;
    }

    const dayHeaderMatch = line.match(HEADER_DAY_RE);
    if (dayHeaderMatch) {
      flush();
      blockOpen = true;
      dayNumber = Number(dayHeaderMatch[1] ?? "0");
      blockTitle = dayHeaderMatch[2] ?? "";
      continue;
    }

    if (!blockOpen) continue;

    if (line.trim() === "---") {
      current = null;
      awaitingVerseQuote = false;
      continue;
    }

    const readingMatch = line.match(READING_RE);
    if (readingMatch) {
      reading = stripEmphasis(readingMatch[1] ?? "");
      current = null;
      awaitingVerseQuote = true;
      continue;
    }

    if (awaitingVerseQuote && !verse.trim()) {
      const quoteMatch = line.match(BLOCKQUOTE_RE);
      if (quoteMatch) {
        verse = stripEmphasis(quoteMatch[1] ?? "");
        continue;
      }
      if (line.trim() !== "") awaitingVerseQuote = false;
    }

    const verseMatch = line.match(VERSE_RE);
    if (verseMatch) {
      verse = stripEmphasis(verseMatch[1] ?? "");
      current = null;
      awaitingVerseQuote = false;
      continue;
    }

    const reflectionMatch = line.match(REFLECTION_RE);
    if (reflectionMatch) {
      current = "reflection";
      awaitingVerseQuote = false;
      if (reflectionMatch[1]) reflectionLines.push(stripEmphasis(reflectionMatch[1]));
      continue;
    }

    const applicationMatch = line.match(APPLICATION_RE);
    if (applicationMatch) {
      current = "application";
      awaitingVerseQuote = false;
      if (applicationMatch[1]) applicationLines.push(stripEmphasis(applicationMatch[1]));
      continue;
    }

    if (line.match(QUESTIONS_RE)) {
      current = "questions";
      awaitingVerseQuote = false;
      continue;
    }

    const prayerMatch = line.match(PRAYER_RE);
    if (prayerMatch) {
      current = "prayer";
      awaitingVerseQuote = false;
      if (prayerMatch[1]) prayerLines.push(stripEmphasis(prayerMatch[1]));
      continue;
    }

    if (current === "questions") {
      const q = line.match(QUESTION_ITEM_RE);
      if (q?.[1]) questions.push(stripEmphasis(q[1]));
      continue;
    }

    if (current === "reflection") reflectionLines.push(stripEmphasis(line));
    else if (current === "application") applicationLines.push(stripEmphasis(line));
    else if (current === "prayer") prayerLines.push(stripEmphasis(line));
  }

  flush();
  return { devotionals, issues };
}
