import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { GlassHighlight } from "./GlassHighlight";
import type { GlassVariant } from "./GlassSurface";

export function GlassButton({
  variant = "regular",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: GlassVariant }) {
  return (
    <button
      data-variant={variant}
      data-interactive="true"
      className={cn(
        "glass-surface relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold",
        className
      )}
      {...props}
    >
      <GlassHighlight />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
