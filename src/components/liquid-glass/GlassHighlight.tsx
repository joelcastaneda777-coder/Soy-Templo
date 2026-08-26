/**
 * Capa de brillo superior-izquierdo, independiente de la superficie.
 * Simula el reflejo de luz sobre un material de vidrio real.
 * Se usa sola o dentro de GlassSurface (que ya la incluye por defecto).
 */
export function GlassHighlight({ className }: { className?: string }) {
  return <span className={`glass-highlight ${className ?? ""}`} aria-hidden />;
}
