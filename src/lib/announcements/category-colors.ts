/**
 * Colores por categoría de anuncio, repartidos alrededor del círculo
 * cromático para que cada tipo de actividad se distinga de un vistazo
 * en el calendario (inspirado en calendarios tipo "renewal days").
 *
 * No confundir con los tonos de marca (verde) del resto de la app —
 * esto es intencionalmente más vívido y variado, solo para esta vista.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  general: "#38BDF8", // celeste
  jovenes: "#818CF8", // índigo
  ninos: "#FDE047", // amarillo
  mujeres: "#F472B6", // rosa
  hombres: "#FB923C", // naranja
  discipulado: "#A78BFA", // violeta
  servicio: "#34D399", // esmeralda
  creativo: "#FB7185", // coral
  especiales: "#F59E0B", // ámbar
};

export const DEFAULT_CATEGORY_COLOR = "#9CA3AF"; // gris neutro, por si aparece una categoría nueva

export function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
}
