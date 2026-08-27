"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/es";

export function DevotionalActions({
  devotionalId,
  title,
  isLoggedIn,
}: {
  devotionalId: string;
  title: string;
  isLoggedIn: boolean;
}) {
  const [isRead, setIsRead] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function share() {
    const url = window.location.href;
    // Compartir nativo (funciona también dentro de Capacitor)
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelado por el usuario */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function markRead() {
    startTransition(async () => {
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

  function save() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("devotional_favorites")
        .upsert({ user_id: user.id, devotional_id: devotionalId });
      if (error) setError(t.common.error);
      else setIsSaved(true);
    });
  }

  return (
    <div className="space-y-2 border-t border-manta pt-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={share}>{t.devotional.share}</Button>
        {isLoggedIn ? (
          <>
            <Button variant="secondary" onClick={save} disabled={pending || isSaved}>
              {isSaved ? <>Guardado <span className="animate-check-pop">✓</span></> : t.devotional.save}
            </Button>
            <Button onClick={markRead} disabled={pending || isRead}>
              {isRead ? <>{t.devotional.read} <span className="animate-check-pop">✓</span></> : t.devotional.markRead}
            </Button>
          </>
        ) : (
          <Link href="/auth/login" className="self-center text-sm font-semibold text-anil-600">
            {t.auth.login} para guardar tu progreso
          </Link>
        )}
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
