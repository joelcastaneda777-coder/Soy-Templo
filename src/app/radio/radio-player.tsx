"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/es";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "playing" | "error";

export function RadioPlayer({
  streamUrl,
  stationName,
}: {
  streamUrl: string | null;
  stationName: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  if (!streamUrl) {
    return <EmptyState title={t.radio.unavailable} />;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (status === "playing") {
      audio.pause();
      setStatus("idle");
      return;
    }

    setStatus("loading");
    // El elemento <audio> no trae `src` en el HTML: se asigna aquí para no
    // abrir la conexión de streaming hasta que la persona decide escuchar.
    if (!audio.src) audio.src = streamUrl!;
    audio.play().catch(() => setStatus("error"));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: stationName, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <Card className="flex flex-col items-center gap-6 py-10 text-center">
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setStatus("playing")}
        onWaiting={() => setStatus("loading")}
        onError={() => setStatus("error")}
      />

      {status === "playing" ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-error/10 px-4 py-1.5 text-sm font-semibold text-error">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-error opacity-60" />
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
          </span>
          {t.radio.live}
        </span>
      ) : null}

      <button
        onClick={toggle}
        aria-label={status === "playing" ? t.radio.pause : t.radio.play}
        className={cn(
          "flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95",
          status === "error" ? "bg-error" : "bg-anil-600 hover:bg-anil-800"
        )}
      >
        {status === "loading" ? (
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-hidden />
        ) : status === "playing" ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      <p className="min-h-5 text-sm text-tinta-suave">
        {status === "loading" ? t.radio.loading : null}
        {status === "error" ? <span className="text-error">{t.radio.error}</span> : null}
        {status === "idle" ? t.radio.play : null}
      </p>

      <button onClick={share} className="text-sm font-semibold text-anil-600">
        {t.radio.share}
      </button>
    </Card>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
