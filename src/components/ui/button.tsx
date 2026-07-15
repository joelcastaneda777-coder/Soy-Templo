import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-anil-600 text-white hover:bg-anil-800",
  secondary: "bg-balsamo-500 text-white hover:bg-balsamo-700",
  accent: "bg-cirio-500 text-white hover:bg-cirio-600",
  ghost: "bg-transparent text-anil-600 hover:bg-anil-50",
  danger: "bg-error text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        // min-h-12: objetivo táctil adecuado (WCAG 2.5.8)
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6",
        "text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
