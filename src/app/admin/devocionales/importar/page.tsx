import type { Metadata } from "next";
import Link from "next/link";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Importar devocionales" };

export default function ImportDevotionalsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/devocionales" className="text-sm font-semibold text-anil-600">
          ← Devocionales
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-anil-800">
          Importar un mes de devocionales
        </h1>
        <p className="mt-2 leading-relaxed text-tinta-suave">
          Pega aquí el Markdown generado con Gemini (u otra IA) siguiendo la plantilla del
          equipo. Verás una vista previa antes de publicar nada — nada se guarda hasta que
          confirmes.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
