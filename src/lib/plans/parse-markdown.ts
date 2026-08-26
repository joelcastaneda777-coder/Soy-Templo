export type ParsedPlanLesson = {
  position: number;
  title: string;
  bibleReading: string;
  explanation: string;
  questions: string[];
  activity: string;
  prayer: string;
};

export type ParsedPlan = {
  name: string;
  slug: string;
  description: string;
  durationDays: number;
  level: "beginner" | "intermediate" | "advanced";
  topic: string;
  lessons: ParsedPlanLesson[];
};

export type ParsePlansResult = { plans: ParsedPlan[]; issues: string[] };

function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function join(lines: string[]) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function parseLessonBody(body: string) {
  let bibleReading = "";
  const explanationLines: string[] = [];
  const activityLines: string[] = [];
  const prayerLines: string[] = [];
  const questions: string[] = [];
  let section: "explanation" | "questions" | "activity" | "prayer" | null = null;

  for (const line of body.split("\n")) {
    const reading = line.match(/^\*\*Lectura:\*\*\s*(.*)$/i);
    if (reading) { bibleReading = reading[1]?.trim() ?? ""; section = null; continue; }
    if (/^\*\*Explicación:\*\*\s*$/i.test(line)) { section = "explanation"; continue; }
    if (/^\*\*Preguntas:\*\*\s*$/i.test(line)) { section = "questions"; continue; }
    if (/^\*\*Actividad:\*\*\s*$/i.test(line)) { section = "activity"; continue; }
    if (/^\*\*Oración:\*\*\s*$/i.test(line)) { section = "prayer"; continue; }

    if (section === "questions") {
      const item = line.match(/^\s*-\s+(.+)/);
      if (item?.[1]) questions.push(item[1].trim());
    } else if (section === "explanation") explanationLines.push(line);
    else if (section === "activity") activityLines.push(line);
    else if (section === "prayer") prayerLines.push(line);
  }

  return {
    bibleReading,
    explanation: join(explanationLines),
    questions,
    activity: join(activityLines),
    prayer: join(prayerLines),
  };
}

export function parsePlansMarkdown(markdown: string): ParsePlansResult {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const planChunks = normalized.split(/^# PLAN:\s*/m).slice(1);
  const plans: ParsedPlan[] = [];
  const issues: string[] = [];

  for (const chunk of planChunks) {
    const [firstLine = "", ...rest] = chunk.split("\n");
    const name = firstLine.trim();
    const body = rest.join("\n");
    if (!name) continue;

    const description = body.match(/^\*\*Descripción:\*\*\s*(.+)$/mi)?.[1]?.trim() ?? "";
    const durationRaw = body.match(/^\*\*Duración:\*\*\s*(\d+)/mi)?.[1];
    const levelRaw = body.match(/^\*\*Nivel:\*\*\s*(.+)$/mi)?.[1]?.trim().toLowerCase() ?? "principiante";
    const topic = body.match(/^\*\*Tema:\*\*\s*(.+)$/mi)?.[1]?.trim() ?? "Estudio bíblico";
    const level = levelRaw.startsWith("av") ? "advanced" : levelRaw.startsWith("inter") ? "intermediate" : "beginner";
    const lessonChunks = body.split(/^## LECCIÓN\s+(\d+):\s*/mi).slice(1);
    const lessons: ParsedPlanLesson[] = [];

    for (let i = 0; i < lessonChunks.length; i += 2) {
      const position = Number(lessonChunks[i]);
      const lessonChunk = lessonChunks[i + 1] ?? "";
      const [lessonTitle = "", ...lessonRest] = lessonChunk.split("\n");
      const parsedLesson = parseLessonBody(lessonRest.join("\n"));

      if (!position || !lessonTitle.trim() || !parsedLesson.bibleReading || !parsedLesson.explanation) {
        issues.push(`${name}: la lección ${position || "?"} está incompleta.`);
        continue;
      }

      lessons.push({ position, title: lessonTitle.trim(), ...parsedLesson });
    }

    const durationDays = Number(durationRaw ?? lessons.length);
    if (!description || !durationDays || lessons.length === 0) {
      issues.push(`${name}: faltan descripción, duración o lecciones válidas.`);
      continue;
    }
    if (durationDays !== lessons.length) {
      issues.push(`${name}: duración ${durationDays}, pero se encontraron ${lessons.length} lecciones.`);
      continue;
    }

    plans.push({ name, slug: slugify(name), description, durationDays, level, topic, lessons });
  }

  if (planChunks.length === 0 && markdown.trim()) issues.push('No se encontró ningún encabezado con el formato "# PLAN: Nombre".');
  return { plans, issues };
}
