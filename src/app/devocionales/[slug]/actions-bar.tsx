"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/es";

export function DevotionalActions({
  devotionalId,
  slug,
  title,
  isLoggedIn,
  initialRead = false,
  initialSaved = false,
}: {
  devotionalId: string;
  slug: string;
  title: string;
  isLoggedIn: boolean;
  initialRead?: boolean;
  initialSaved?: boolean;
}) {
  const [isRead, setIsRead] = useState(initialRead);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // El usuario puede cancelar el diálogo nativo sin que sea un error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("No pudimos copiar el enlace.");
    }
  }

  function markRead() {
    if (isRead) return;

    startTransition(async () => {
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("devotional_reads")
        .upsert({ user_id: user.id, devotional_id: devotionalId });

      if (error) setError(t.common.error);
      else setIsRead(true);
    });
  }

  function toggleSaved() {
    startTransition(async () => {
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const request = isSaved
        ? supabase
            .from("devotional_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("devotional_id", devotionalId)
        : supabase
            .from("devotional_favorites")
            .upsert({ user_id: user.id, devotional_id: devotionalId });

      const { error } = await request;
      if (error) setError(t.common.error);
      else setIsSaved((current) => !current);
    });
  }

  return (
    <div className="space-y-2 border-t border-manta pt-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={share}>{t.devotional.share}</Button>
        {isLoggedIn ? (
          <>
            <Button variant="secondary" onClick={toggleSaved} disabled={pending}>
              {isSaved ? <>Guardado <span className="animate-check-pop">✓</span></> : t.devotional.save}
            </Button>
            <Button onClick={markRead} disabled={pending || isRead}>
              {isRead ? <>{t.devotional.read} <span className="animate-check-pop">✓</span></> : t.devotional.markRead}
            </Button>
          </>
        ) : (
          <Link
            href={`/auth/login?next=${encodeURIComponent(`/devocionales/${slug}`)}`}
            className="self-center text-sm font-semibold text-anil-600"
          >
            {t.auth.login} para guardar tu progreso
          </Link>
        )}
      </div>
      {isSaved ? (
        <p className="text-xs text-tinta-suave">Toca “Guardado” otra vez para quitarlo de tus favoritos.</p>
      ) : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
