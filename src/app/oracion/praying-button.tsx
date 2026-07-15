"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markPraying } from "./actions";
import { t } from "@/lib/i18n/es";

export function PrayingButton({ prayerId, isLoggedIn }: { prayerId: string; isLoggedIn: boolean }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link href="/auth/login" className="text-sm font-semibold text-anil-600">
        🙏 {t.prayer.praying}
      </Link>
    );
  }

  return (
    <button
      onClick={() => startTransition(async () => { await markPraying(prayerId); setDone(true); })}
      disabled={pending || done}
      className="rounded-full bg-anil-50 px-4 py-2 text-sm font-semibold text-anil-800 hover:bg-anil-100 disabled:opacity-70"
    >
      🙏 {done ? "Orando ✓" : t.prayer.praying}
    </button>
  );
}
