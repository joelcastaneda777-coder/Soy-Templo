"use client";

import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => void;
};

/**
 * Igual que `next/link`, pero envuelve la navegación con la API nativa
 * `View Transitions` del navegador para un cruce suave entre pantallas
 * (sin librerías nuevas). En navegadores sin soporte (o con
 * `prefers-reduced-motion`), simplemente navega normal — no hay fallback
 * que mantener a mano.
 */
export function TransitionLink({
  href,
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // abrir en pestaña nueva, etc.
    e.preventDefault();

    const doc = document as DocumentWithViewTransition;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
