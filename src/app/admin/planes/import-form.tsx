"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { parsePlansMarkdown } from "@/lib/plans/parse-markdown";
import { importPlans, type ImportPlansState } from "./actions";

export function PlanImportForm() {
  const [markdown, setMarkdown] = useState("");
  const [result, setResult] = useState<ImportPlansState | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parsePlansMarkdown(markdown), [markdown]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => { setMarkdown(String(reader.result ?? "")); setResult(null); };
    reader.readAsText(file, "utf-8");
  }

  function confirmImport() {
    setResult(null);
    startTransition(async () => {
      const res = await importPlans(parsed.plans);
      setResult(res);
      if (res.ok) setMarkdown("");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-anil-800">Importar planes desde Markdown</h2>
          <p className="mt-1 text-sm text-tinta-suave">Puedes pegar varios planes completos en un solo archivo. Usa <strong>Acceso: premium</strong> para Soy Templo+; si lo omites será gratuito.</p>
        </div>
        <div>
          <input ref={inputRef} type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
          <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()}>Subir archivo .md</Button>
        </div>
      </div>

      <Textarea value={markdown} onChange={(e) => { setMarkdown(e.target.value); setResult(null); }} className="min-h-80 font-mono text-sm" placeholder="# PLAN: Nombre del plan\n\n**Descripción:** ...\n**Duración:** 5 días\n**Nivel:** intermedio\n**Tema:** ...\n**Acceso:** premium\n\n## LECCIÓN 1: ..." />

      {markdown.trim() ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-balsamo-100 px-3 py-1 font-semibold text-balsamo-700">{parsed.plans.length} planes válidos</span>
            <span className="rounded-full bg-cirio-100 px-3 py-1 font-semibold text-cirio-600">{parsed.issues.length} problemas</span>
          </div>
          {parsed.plans.map((plan) => (
            <div key={plan.slug} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{plan.name}</strong>
                <span className="text-xs text-tinta-suave">{plan.durationDays} lecciones · {plan.level}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-tinta-suave">{plan.topic}</span>
                {plan.accessTier === "plus" ? (
                  <span className="rounded-full bg-anil-600 px-2.5 py-1 text-xs font-semibold text-white">Soy Templo+</span>
                ) : (
                  <span className="rounded-full bg-manta px-2.5 py-1 text-xs font-semibold text-tinta-suave">Gratis</span>
                )}
              </div>
            </div>
          ))}
          {parsed.issues.length ? <ul className="rounded-[var(--radius-card)] border border-cirio-500/40 bg-cirio-100/60 p-4 text-sm">{parsed.issues.map((issue, i) => <li key={i}>• {issue}</li>)}</ul> : null}
        </div>
      ) : null}

      {result?.error ? <p role="alert" className="text-sm text-error">{result.error}</p> : null}
      {result?.ok ? <p role="status" className="text-sm font-semibold text-balsamo-700">Se importaron {result.imported} planes correctamente.</p> : null}
      <Button type="button" onClick={confirmImport} disabled={pending || parsed.plans.length === 0 || parsed.issues.length > 0} className="w-full sm:w-auto">{pending ? "Importando…" : `Importar ${parsed.plans.length || ""} planes`}</Button>
    </div>
  );
}
