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
    const levelRaw = (body.match(/^\*\*Nivel:\*\*\s*(.+)$/mi)?.[1]?.trim().toLowerCase() ?? "beginner");
    const topic = body.match(/^\*\*Tema:\*\*\s*(.+)$/mi)?.[1]?.trim() ?? "Estudio bíblico";
    const level = levelRaw.startsWith("av") ? "advanced" : levelRaw.startsWith("inter") ? "intermediate" : "beginner";
    const lessonChunks = body.split(/^## LECCIÓN\s+(\d+):\s*/mi).slice(1);
    const lessons: ParsedPlanLesson[] = [];

    for (let i = 0; i < lessonChunks.length; i += 2) {
      const position = Number(lessonChunks[i]);
      const lessonChunk = lessonChunks[i + 1] ?? "";
      const [lessonTitle = "", ...lessonRest] = lessonChunk.split("\n");
      const lessonBody = lessonRest.join("\n");
      const bibleReading = lessonBody.match(/^\*\*Lectura:\*\*\s*(.+)$/mi)?.[1]?.trim() ?? "";
      const explanation = lessonBody.match(/^\*\*Explicación:\*\*\s*\n([\s\S]*?)(?=^\*\*(?:Preguntas|Actividad|Oración):\*\*|^## |^# PLAN:|\Z)/mi)?.[1]?.trim() ?? "";
      const questionsBlock = lessonBody.match(/^\*\*Preguntas:\*\*\s*\n([\s\S]*?)(?=^\*\*(?:Actividad|Oración):\*\*|^## |^# PLAN:|\Z)/mi)?.[1] ?? "";
      const questions = questionsBlock.split("\n").map((line) => line.match(/^\s*-\s+(.+)/)?.[1]?.trim()).filter(Boolean) as string[];
      const activity = lessonBody.match(/^\*\*Actividad:\*\*\s*([\s\S]*?)(?=^\*\*Oración:\*\*|^## |^# PLAN:|\Z)/mi)?.[1]?.trim() ?? "";
      const prayer = lessonBody.match(/^\*\*Oración:\*\*\s*([\s\S]*?)(?=^## |^# PLAN:|\Z)/mi)?.[1]?.trim() ?? "";

      if (!position || !lessonTitle.trim() || !bibleReading || !explanation) {
        issues.push(`${name}: la lección ${position || "?"} está incompleta.`);
        continue;
      }
      lessons.push({ position, title: lessonTitle.trim(), bibleReading, explanation, questions, activity, prayer });
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
