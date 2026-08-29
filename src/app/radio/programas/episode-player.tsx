"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function EpisodePlayer({ episodeId }: { episodeId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.src = "";
    };
  }, []);

  function wireAudio(audio: HTMLAudioElement) {
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
    audio.onloadedmetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.ondurationchange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onended = () => { setState("idle"); setCurrentTime(0); };
    audio.onpause = () => setState((value) => value === "error" ? value : "idle");
    audio.onplaying = () => setState("playing");
    audio.onerror = () => setState("error");
  }

  async function ensureAudio() {
    if (audioRef.current?.src) return audioRef.current;
    const response = await fetch(`/api/radio/episodes/${episodeId}/play`, { cache: "no-store" });
    if (!response.ok) throw new Error("No disponible");
    const payload = await response.json() as { url?: string };
    if (!payload.url) throw new Error("Sin fuente");
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    wireAudio(audio);
    audio.src = payload.url;
    return audio;
  }

  async function toggle() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }
    setState("loading");
    try {
      const audio = await ensureAudio();
      await audio.play();
    } catch {
      setState("error");
    }
  }

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = Math.max(0, Math.min(value, Number.isFinite(audio.duration) ? audio.duration : value));
    setCurrentTime(audio.currentTime);
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + seconds);
  }

  return (
    <div className="radio-glass mt-4 rounded-[1.7rem] p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => skip(-15)} disabled={!audioRef.current} aria-label="Retroceder 15 segundos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/65 transition hover:bg-white/10 disabled:opacity-30">−15</button>
        <button onClick={toggle} disabled={state === "loading"} aria-label={state === "playing" ? "Pausar" : "Reproducir"} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#07100f] shadow-[0_8px_24px_rgba(0,0,0,.24)] transition active:scale-95 disabled:opacity-60">
          {state === "loading" ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : state === "playing" ? <span className="text-lg font-black">Ⅱ</span> : <span className="ml-0.5 text-lg">▶</span>}
        </button>
        <button onClick={() => skip(15)} disabled={!audioRef.current} aria-label="Adelantar 15 segundos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/65 transition hover:bg-white/10 disabled:opacity-30">+15</button>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-white/35"><span>{formatTime(currentTime)}</span><span>{duration ? formatTime(duration) : "—:—"}</span></div>
          <input type="range" min="0" max={duration || 1} step="1" value={Math.min(currentTime, duration || 1)} onChange={(event) => seekTo(Number(event.target.value))} disabled={!duration} aria-label="Posición del audio" className="h-1.5 w-full cursor-pointer accent-emerald-300 disabled:opacity-30" />
        </div>
      </div>
      {state === "error" ? <p className="mt-3 text-xs font-medium text-red-300">Audio no disponible en este momento.</p> : null}
    </div>
  );
}
