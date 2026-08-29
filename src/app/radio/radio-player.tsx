"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "playing" | "error";
type ShowInfo = { name: string; host?: string | null; schedule?: string | null; coverUrl?: string | null; isLive?: boolean } | null;

export function RadioPlayer({
  streamUrl,
  stationName,
  hasBackgroundAccess,
  currentShow,
  nextShow,
}: {
  streamUrl: string | null;
  stationName: string;
  hasBackgroundAccess: boolean;
  currentShow?: ShowInfo;
  nextShow?: ShowInfo;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [backgroundLocked, setBackgroundLocked] = useState(false);
  const playing = status === "playing";

  useEffect(() => {
    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!document.hidden || hasBackgroundAccess || !audio || audio.paused) return;
      audio.pause();
      setStatus("idle");
      setBackgroundLocked(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hasBackgroundAccess]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !hasBackgroundAccess) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentShow?.name || stationName,
      artist: currentShow?.host || "Soy Templo",
      album: "Radio en vivo",
    });
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [currentShow, hasBackgroundAccess, stationName]);

  function toggle() {
    if (!streamUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    setBackgroundLocked(false);
    if (playing) {
      audio.pause();
      return;
    }
    setStatus("loading");
    if (!audio.src) audio.src = streamUrl;
    audio.play().catch(() => setStatus("error"));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: currentShow?.name || stationName, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <section className="radio-console relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d0d] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:p-7">
      <audio ref={audioRef} preload="none" onPlaying={() => setStatus("playing")} onWaiting={() => setStatus("loading")} onPause={() => setStatus("idle")} onError={() => setStatus("error")} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(113,250,185,.12),transparent_35%)]" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-white/60">
          <span className={cn("h-2 w-2 rounded-full", playing ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.9)]" : "bg-white/25")} />
          Soy Templo Radio
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/60">24/7</span>
      </div>

      <div className="relative z-10 mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-500/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-red-300">En vivo</span>
            {currentShow?.isLive ? <span className="text-xs font-semibold text-emerald-300">Programa especial</span> : null}
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">{currentShow?.name || stationName}</h1>
          {currentShow?.host ? <p className="mt-2 text-sm text-white/65">Con {currentShow.host}</p> : null}
          {currentShow?.schedule ? <p className="mt-1 text-xs font-medium uppercase tracking-[.12em] text-white/40">{currentShow.schedule}</p> : null}

          <div className="mt-6 flex h-10 items-end gap-1" aria-hidden>
            {Array.from({ length: 34 }).map((_, index) => (
              <span key={index} className={cn("radio-bar w-1 rounded-full bg-white/45", playing && "radio-bar-active")} style={{ height: `${18 + ((index * 17) % 28)}%`, animationDelay: `${index * 45}ms` }} />
            ))}
          </div>
        </div>

        <button onClick={toggle} disabled={!streamUrl} aria-label={playing ? "Pausar radio" : "Reproducir radio"} className="radio-dial group relative mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(145deg,#171d1d,#090c0c)] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_24px_50px_rgba(0,0,0,.5)] transition-transform active:scale-[.98] disabled:opacity-50 sm:h-52 sm:w-52">
          <span className="absolute inset-4 rounded-full border border-white/5" />
          <span className={cn("absolute inset-0 rounded-full border-[12px] border-transparent transition-all", playing && "shadow-[0_0_45px_rgba(52,211,153,.16)]")} />
          <span className="absolute top-5 h-9 w-1 rounded-full bg-white/85 shadow-[0_0_12px_rgba(255,255,255,.5)]" />
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-xl transition group-hover:bg-white/10">
            {status === "loading" ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : playing ? <PauseIcon /> : <PlayIcon />}
          </span>
        </button>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2">
        {nextShow ? <div className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Después</p><p className="mt-1 font-semibold text-white/85">{nextShow.name}</p>{nextShow.schedule ? <p className="mt-1 text-xs text-white/45">{nextShow.schedule}</p> : null}</div> : <div className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Programación continua</p><p className="mt-1 text-sm text-white/65">Música, mensajes y anuncios de Soy Templo.</p></div>}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Segundo plano</p><p className="mt-1 text-sm text-white/65">{hasBackgroundAccess ? "Activo con Soy Templo+" : "Disponible con Soy Templo+"}</p></div><Link href="/plus" className="text-xs font-bold text-emerald-300">Ver +</Link></div>
      </div>

      {backgroundLocked ? <p className="relative z-10 mt-4 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-white/55">La reproducción se pausó al salir de la app. La escucha en segundo plano forma parte de Soy Templo+.</p> : null}
      {status === "error" ? <p className="relative z-10 mt-4 text-sm font-semibold text-red-300">No pudimos conectar con la señal. Intenta de nuevo.</p> : null}
      {!streamUrl ? <p className="relative z-10 mt-4 text-sm text-white/55">La URL del stream todavía no está configurada en el panel.</p> : null}

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs">
        <Link href="/radio/programas" className="font-semibold text-white/70 hover:text-white">Explorar programas →</Link>
        <button onClick={share} className="font-semibold text-white/45 hover:text-white">Compartir</button>
      </div>
    </section>
  );
}

function PlayIcon() { return <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>; }
function PauseIcon() { return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>; }
