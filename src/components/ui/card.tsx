import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[--radius-card] border border-manta bg-white p-5 shadow-sm dark:bg-manta",
        className
      )}
      {...props}
    />
  );
}
