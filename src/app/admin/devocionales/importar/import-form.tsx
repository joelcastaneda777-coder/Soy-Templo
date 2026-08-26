"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Field } from "@/components/ui/input";
import { parseDevotionalsMarkdown } from "@/lib/devotionals/parse-markdown";
import { importDevotionals, type ImportState } from "./actions";
import { formatDate } from "@/lib/utils";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function defaultTarget() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function buildTemplate(month: number, year: number) {
  const total = daysInMonth(month, year);
  const monthName = MONTHS[month - 1] ?? `Mes ${month}`;
  const blocks = Array.from({ length: total }, (_, index) => {
    const day = index + 1;
    return `## Día ${day}: Título del devocional\n\n**Lectura:** Libro 1:1-5\n\n**Versículo clave:** “Texto del versículo” (Libro 1:1)\n\n**Reflexión:**\nEscribe aquí la reflexión del día.\n\n**Aplicación:**\nEscribe aquí una aplicación práctica.\n\n**Preguntas:**\n- ¿Qué puedo aprender hoy?\n\n**Oración:**\nEscribe aquí la oración final.\n\n---`;
  });

  return `# Devocionales — ${monthName} ${year}\n\n${blocks.join("\n\n")}\n`;
}

export function ImportForm() {
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<ImportState | null>(null);
  const [pending, startTransition] = useTransition();
  const [allowPartial, setAllowPartial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ month, year }, setTarget] = useState(defaultTarget);

  const parsed = useMemo(
    () => parseDevotionalsMarkdown(markdown, { month, year }),
    [markdown, month, year]
  );

  const hasContent = markdown.trim().length > 0;
  const usesDayNumbers = /^#{2,3}\s+D[ií]a\s+\d/im.test(markdown);
  const expectedDays = daysInMonth(month, year);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

  const selectedDevotionals = useMemo(
    () => parsed.devotionals.filter((devotional) => devotional.date.startsWith(monthPrefix)),
    [parsed.devotionals, monthPrefix]
  );

  const coverage = useMemo(() => {
    const days = new Set<number>();

    for (const devotional of selectedDevotionals) {
      const day = Number(devotional.date.slice(-2));
      if (day >= 1 && day <= expectedDays) days.add(day);
    }

    const missingDays = Array.from({ length: expectedDays }, (_, i) => i + 1).filter((day) => !days.has(day));
    const outsideSelectedMonth = parsed.devotionals.length - selectedDevotionals.length;
    return { days, missingDays, outsideSelectedMonth };
  }, [parsed.devotionals.length, selectedDevotionals, expectedDays]);

  const isCompleteMonth = coverage.days.size === expectedDays && parsed.issues.length === 0;
  const canImport = selectedDevotionals.length > 0 && (isCompleteMonth || allowPartial);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result ?? ""));
      setResult(null);
      setAllowPartial(false);
    };
    reader.readAsText(file, "utf-8");
  }

  function downloadTemplate() {
    const content = buildTemplate(month, year);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `devocionales-${year}-${String(month).padStart(2, "0")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function confirmImport() {
    if (!canImport) return;
    setResult(null);
    startTransition(async () => {
      const res = await importDevotionals(selectedDevotionals);
      setResult(res);
      if (res.ok) {
        setMarkdown("");
        setAllowPartial(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mes de publicación" htmlFor="target-month">
          <Select
            id="target-month"
            value={month}
            onChange={(e) => {
              setTarget((t) => ({ ...t, month: Number(e.target.value) }));
              setAllowPartial(false);
            }}
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Año" htmlFor="target-year">
          <Select
            id="target-year"
            value={year}
            onChange={(e) => {
              setTarget((t) => ({ ...t, year: Number(e.target.value) }));
              setAllowPartial(false);
            }}
          >
            {[year - 1, year, year + 1, year + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-manta bg-manta/40 p-4">
        <div>
          <p className="text-sm font-semibold">Plantilla mensual</p>
          <p className="mt-1 text-xs text-tinta-suave">
            Genera los {expectedDays} días de {MONTHS[month - 1]} con el formato que el importador reconoce.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={downloadTemplate}>
          Descargar plantilla .md
        </Button>
      </div>

      <p className="text-xs text-tinta-suave">
        El mes y año se usan para convertir encabezados como &quot;Día 1&quot; en fechas reales
        {usesDayNumbers ? " — y tu archivo actual usa ese formato." : ". También puedes usar fechas YYYY-MM-DD."}
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="markdown" className="text-sm font-semibold">
            Contenido en Markdown
          </label>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Subir archivo .md
            </Button>
          </div>
        </div>
        <Textarea
          id="markdown"
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value);
            setResult(null);
            setAllowPartial(false);
          }}
          placeholder={"## Día 1: Un nuevo comienzo\n\n**Lectura:** Génesis 1:1-5\n\n**Versículo clave:** ...\n\n**Reflexión:**\n...\n\n**Oración:**\n..."}
          className="min-h-64 font-mono text-sm"
        />
      </div>

      {hasContent ? (
        <section aria-live="polite" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-card)] border border-manta p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Cobertura</p>
              <p className="mt-1 text-xl font-semibold text-anil-800">{coverage.days.size}/{expectedDays}</p>
              <p className="text-xs text-tinta-suave">días de {MONTHS[month - 1]}</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-manta p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Válidos</p>
              <p className="mt-1 text-xl font-semibold text-balsamo-700">{selectedDevotionals.length}</p>
              <p className="text-xs text-tinta-suave">del mes seleccionado</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-manta p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Problemas</p>
              <p className="mt-1 text-xl font-semibold text-cirio-600">{parsed.issues.length}</p>
              <p className="text-xs text-tinta-suave">requieren revisión</p>
            </div>
          </div>

          {isCompleteMonth ? (
            <p className="rounded-[var(--radius-card)] bg-balsamo-100 p-4 text-sm font-semibold text-balsamo-700">
              Mes completo: los {expectedDays} días están listos para publicar.
            </p>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-cirio-500/40 bg-cirio-100/60 p-4 text-sm">
              <p className="font-semibold">Esta carga no contiene el mes completo.</p>
              {coverage.missingDays.length > 0 ? (
                <p className="mt-1 text-tinta-suave">
                  Días faltantes: {coverage.missingDays.join(", ")}.
                </p>
              ) : null}
              {coverage.outsideSelectedMonth > 0 ? (
                <p className="mt-1 text-tinta-suave">
                  Se ignorarán {coverage.outsideSelectedMonth} devocional(es) cuya fecha está fuera de {MONTHS[month - 1]} {year}.
                </p>
              ) : null}
              <label className="mt-3 flex items-start gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={allowPartial}
                  onChange={(e) => setAllowPartial(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Importar solo los {selectedDevotionals.length} devocionales válidos de {MONTHS[month - 1]}.
                  Úsalo, por ejemplo, para completar únicamente los días restantes de un mes.
                </span>
              </label>
            </div>
          )}

          {selectedDevotionals.length > 0 ? (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-manta">
              <table className="w-full text-left text-sm">
                <thead className="bg-manta text-tinta-suave">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Fecha</th>
                    <th className="px-4 py-2 font-semibold">Título</th>
                    <th className="px-4 py-2 font-semibold">Lectura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-manta">
                  {selectedDevotionals.map((d) => (
                    <tr key={d.slug}>
                      <td className="whitespace-nowrap px-4 py-2">{formatDate(`${d.date}T12:00:00`)}</td>
                      <td className="px-4 py-2">{d.title}</td>
                      <td className="px-4 py-2 text-balsamo-700">{d.bibleReading}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {parsed.issues.length > 0 ? (
            <ul className="space-y-1 rounded-[var(--radius-card)] border border-cirio-500/40 bg-cirio-100/60 p-4 text-sm">
              {parsed.issues.map((issue, i) => (
                <li key={i}>
                  <strong>{issue.date || "?"}</strong> — {issue.title || "(sin título)"}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {result?.error ? <p role="alert" className="text-sm text-error">{result.error}</p> : null}
      {result?.ok ? (
        <p role="status" className="rounded-[var(--radius-card)] bg-balsamo-100 p-4 text-sm font-semibold text-balsamo-700">
          ¡Listo! Se publicaron {result.imported} devocionales.
        </p>
      ) : null}

      <Button
        type="button"
        onClick={confirmImport}
        disabled={pending || !canImport}
        className="w-full sm:w-auto"
      >
        {pending ? "Publicando…" : isCompleteMonth
          ? `Publicar mes completo (${selectedDevotionals.length})`
          : `Importar ${selectedDevotionals.length || ""} devocionales`}
      </Button>
    </div>
  );
}
