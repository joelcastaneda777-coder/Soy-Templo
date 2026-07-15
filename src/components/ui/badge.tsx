import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "anil" | "balsamo" | "cirio" | "neutral";

const tones: Record<Tone, string> = {
  anil: "bg-anil-100 text-anil-800",
  balsamo: "bg-balsamo-100 text-balsamo-700",
  cirio: "bg-cirio-100 text-cirio-600",
  neutral: "bg-manta text-tinta-suave",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
