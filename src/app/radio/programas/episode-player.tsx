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
    <div className="mt-4 flex items-center gap-3">
      <button onClick={toggle} disabled={state === "loading"} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-xs font-bold text-white shadow-sm backdrop-blur-xl transition hover:bg-white/15 active:scale-[.98] disabled:opacity-60">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#07100f]">{state === "loading" ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" /> : state === "playing" ? "Ⅱ" : "▶"}</span>
        {state === "loading" ? "Cargando…" : state === "playing" ? "Pausar" : "Escuchar"}
      </button>
      {state === "error" ? <span className="text-xs text-red-300">Audio no disponible.</span> : null}
    </div>
  );
}
