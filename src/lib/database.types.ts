/**
 * Este archivo es un marcador de posición.
 * Genera los tipos reales a partir de tu esquema de Supabase con:
 *
 *   npx supabase login
 *   npx supabase link --project-ref TU-PROJECT-REF
 *   npm run db:types
 *
 * Esto sobrescribirá este archivo con los tipos exactos de todas las
 * tablas, vistas y funciones definidas en supabase/migrations/.
 * Mientras tanto, los clientes de Supabase funcionan sin tipos estrictos.
 */
export type Database = Record<string, unknown>;
