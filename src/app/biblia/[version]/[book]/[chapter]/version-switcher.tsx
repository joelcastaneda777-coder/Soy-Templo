"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { BIBLE_VERSIONS } from "@/lib/bible/client";

export function VersionSwitcher({
  currentVersion,
  bookSlug,
  chapter,
}: {
  currentVersion: string;
  bookSlug: string;
  chapter: number;
}) {
  const router = useRouter();

  return (
    <Select
      aria-label="Versión de la Biblia"
      value={currentVersion}
      onChange={(e) => router.push(`/biblia/${e.target.value}/${bookSlug}/${chapter}`)}
      className="w-auto min-h-10 py-1 text-sm"
    >
      {BIBLE_VERSIONS.map((v) => (
        <option key={v.code} value={v.code}>{v.name}</option>
      ))}
    </Select>
  );
}
