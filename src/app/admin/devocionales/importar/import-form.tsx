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
  // Por defecto, el mes siguiente al actual — lo normal es cargar el próximo mes con anticipación.
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

export function ImportForm() {
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<ImportState | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ month, year }, setTarget] = useState(defaultTarget);

  const parsed = useMemo(
    () => parseDevotionalsMarkdown(markdown, { month, year }),
    [markdown, month, year]
  );
  const hasContent = markdown.trim().length > 0;
  const usesDayNumbers = /^##\s+D[ií]a\s+\d/im.test(markdown);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setMarkdown(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  }

  function confirmImport() {
    setResult(null);
    startTransition(async () => {
      const res = await importDevotionals(parsed.devotionals);
      setResult(res);
      if (res.ok) setMarkdown("");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mes de publicación" htmlFor="target-month">
          <Select
            id="target-month"
            value={month}
            onChange={(e) => setTarget((t) => ({ ...t, month: Number(e.target.value) }))}
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
            onChange={(e) => setTarget((t) => ({ ...t, year: Number(e.target.value) }))}
          >
            {[year - 1, year, year + 1, year + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="text-xs text-tinta-suave">
        Este mes y año solo se usan para calcular la fecha cuando el archivo dice
        &quot;Día 1&quot;, &quot;Día 2&quot;, etc. en vez de una fecha exacta
        {usesDayNumbers ? " — y tu archivo actual sí los necesita." : "."}
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Subir archivo .md
            </Button>
          </div>
        </div>
        <Textarea
          id="markdown"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={"## 2026-01-01 — Un nuevo comienzo\n\n**Lectura:** Génesis 1:1-5\n\n**Versículo clave:** ...\n\n**Reflexión:**\n..."}
          className="min-h-64 font-mono text-sm"
        />
      </div>

      {hasContent ? (
        <section aria-live="polite" className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-balsamo-100 px-3 py-1 text-sm font-semibold text-balsamo-700">
              {parsed.devotionals.length} listos para publicar
            </span>
            {parsed.issues.length > 0 ? (
              <span className="rounded-full bg-cirio-100 px-3 py-1 text-sm font-semibold text-cirio-600">
                {parsed.issues.length} con problemas
              </span>
            ) : null}
          </div>

          {parsed.devotionals.length > 0 ? (
            <div className="overflow-x-auto rounded-[--radius-card] border border-manta">
              <table className="w-full text-left text-sm">
                <thead className="bg-manta text-tinta-suave">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Fecha</th>
                    <th className="px-4 py-2 font-semibold">Título</th>
                    <th className="px-4 py-2 font-semibold">Lectura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-manta">
                  {parsed.devotionals.map((d) => (
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
            <ul className="space-y-1 rounded-[--radius-card] border border-cirio-500/40 bg-cirio-100/60 p-4 text-sm">
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
        <p role="status" className="rounded-[--radius-card] bg-balsamo-100 p-4 text-sm font-semibold text-balsamo-700">
          ¡Listo! Se publicaron {result.imported} devocionales.
        </p>
      ) : null}

      <Button
        type="button"
        onClick={confirmImport}
        disabled={pending || parsed.devotionals.length === 0}
        className="w-full sm:w-auto"
      >
        {pending ? "Publicando…" : `Confirmar e importar ${parsed.devotionals.length || ""} devocionales`}
      </Button>
    </div>
  );
}
