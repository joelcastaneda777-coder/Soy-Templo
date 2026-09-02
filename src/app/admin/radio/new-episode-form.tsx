"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createRadioEpisode } from "./actions";

type ProgramOption = { id: string; name: string };

type Props = { programs: ProgramOption[] };

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function uploadWithProgress(file: File, path: string, token: string, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!baseUrl || !apiKey) return reject(new Error("Supabase no está configurado en el navegador."));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/storage/v1/object/radio-archive/${encodeURI(path)}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("La carga del audio se interrumpió."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body?.message || body?.error || "No se pudo subir el audio."));
        } catch {
          reject(new Error("No se pudo subir el audio."));
        }
      }
    };
    xhr.send(file);
  });
}

export function NewEpisodeForm({ programs }: Props) {
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("audioFile") as File | null;
    const externalUrl = String(formData.get("sourceUrl") || "").trim();
    const programId = String(formData.get("programId") || "");

    if ((!file || !file.size) && !externalUrl) {
      setError("Selecciona un archivo de audio o pega una URL HTTPS.");
      return;
    }

    if (file?.size && file.size > 100 * 1024 * 1024) {
      setError("El archivo supera el límite actual de 100 MB por episodio.");
      return;
    }

    setPending(true);
    setProgress(0);
    setError(null);
    setMessage(null);

    let uploadedPath: string | null = null;
    const supabase = createClient();

    try {
      if (file?.size) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

        const cleanName = safeFileName(file.name) || "episodio.mp3";
        uploadedPath = `${programId}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;
        await uploadWithProgress(file, uploadedPath, session.access_token, setProgress);
        formData.set("audioPath", uploadedPath);
        formData.set("sourceUrl", "");
      }

      formData.delete("audioFile");
      await createRadioEpisode(formData);
      setProgress(100);
      setMessage("Episodio guardado correctamente.");
      form.reset();
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("radio-archive").remove([uploadedPath]).catch(() => undefined);
      }
      setError(err instanceof Error ? err.message : "No se pudo guardar el episodio.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[var(--radius-card)] border border-manta bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-display text-xl font-semibold text-anil-800">Nuevo episodio</h2>
        <p className="mt-1 text-xs text-tinta-suave">Sube el MP3/AAC directamente al archivo privado de Radio o utiliza una URL HTTPS externa.</p>
      </div>

      <label className="block text-sm font-medium">Programa
        <select name="programId" required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3">
          <option value="">Seleccionar…</option>
          {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Título<input name="title" required maxLength={180} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
      <label className="block text-sm font-medium">Descripción<textarea name="description" maxLength={1600} rows={3} className="mt-1 w-full rounded-xl border border-manta p-3" /></label>

      <div className="rounded-2xl border border-dashed border-anil-200 bg-anil-50/40 p-4">
        <label className="block text-sm font-semibold text-anil-900">Archivo de audio
          <input name="audioFile" type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/webm,.mp3,.m4a,.aac,.ogg,.webm" className="mt-2 block w-full text-sm" />
        </label>
        <p className="mt-2 text-xs text-tinta-suave">Recomendado: MP3 96–128 kbps para mensajes hablados. Límite actual: 100 MB.</p>
        {pending && progress > 0 ? (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-anil-100"><div className="h-full rounded-full bg-anil-600 transition-[width]" style={{ width: `${progress}%` }} /></div>
            <p className="mt-1 text-right text-xs font-semibold text-anil-700">{progress}%</p>
          </div>
        ) : null}
      </div>

      <label className="block text-sm font-medium">O URL HTTPS del audio<input name="sourceUrl" type="url" placeholder="https://..." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Duración (min)<input name="durationMinutes" type="number" min="0" max="1440" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
        <label className="text-sm font-medium">Acceso<select name="accessTier" defaultValue="free" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="free">Gratis</option><option value="plus">Soy Templo+</option></select></label>
        <label className="text-sm font-medium">Estado<select name="status" defaultValue="draft" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
      </div>

      {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-error">{error}</p> : null}
      {message ? <p className="rounded-xl bg-anil-50 p-3 text-sm font-medium text-anil-800">{message}</p> : null}
      <button disabled={!programs.length || pending} className="min-h-11 rounded-full bg-anil-600 px-5 font-semibold text-white disabled:opacity-50">{pending ? (progress ? `Subiendo ${progress}%…` : "Guardando…") : "Subir y guardar episodio"}</button>
    </form>
  );
}
