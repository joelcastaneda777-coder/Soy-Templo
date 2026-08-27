"use client";

import { useRef, useState } from "react";

export function EpisodePlayer({ episodeId }: { episodeId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  async function toggle() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setState("idle");
      return;
    }

    setState("loading");
    try {
      const response = await fetch(`/api/radio/episodes/${episodeId}/play`, { cache: "no-store" });
      if (!response.ok) throw new Error("No disponible");
      const payload = await response.json() as { url?: string };
      if (!payload.url) throw new Error("Sin fuente");
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      if (audio.src !== payload.url) audio.src = payload.url;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("error");
      await audio.play();
      setState("playing");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button onClick={toggle} disabled={state === "loading"} className="min-h-10 rounded-full bg-anil-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
        {state === "loading" ? "Cargando…" : state === "playing" ? "Pausar" : "Escuchar"}
      </button>
      {state === "error" ? <span className="text-xs text-error">Audio no disponible en este momento.</span> : null}
    </div>
  );
}
