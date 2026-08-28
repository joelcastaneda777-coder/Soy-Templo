import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignPushForm } from "./campaign-push-form";
import { TestPushForm } from "./test-push-form";

export const metadata: Metadata = { title: "Notificaciones · Panel" };
type DeviceRow = { device_name: string | null; last_seen_at: string };
type StatsRow = { total_devices: number; users_with_push: number; recent_devices: number };

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((row) => row.role === "admin" || row.role === "superadmin")) return <p className="rounded-2xl border border-manta p-5 text-sm">Esta sección está reservada a administradores.</p>;

  const [categoriesResult, keyResult, statsResult, mineResult] = await Promise.all([
    supabase.from("donation_categories").select("slug,name").eq("is_active", true).order("name"),
    supabase.rpc("get_push_vapid_public_key"),
    supabase.rpc("get_push_admin_stats"),
    supabase.from("push_subscriptions").select("device_name,last_seen_at").eq("user_id", user.id).order("last_seen_at", { ascending: false }),
  ]);

  const configured = !keyResult.error && typeof keyResult.data === "string" && keyResult.data.length > 0;
  const stats = ((statsResult.data ?? []) as StatsRow[])[0] ?? { total_devices: 0, users_with_push: 0, recent_devices: 0 };
  const mine = (mineResult.data ?? []) as DeviceRow[];

  return <div className="max-w-3xl space-y-7">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Sistema</p><h1 className="font-display text-3xl font-semibold text-anil-800">Centro de notificaciones</h1><p className="mt-2 text-sm text-tinta-suave">Estado del push web, dispositivos registrados y herramientas de prueba. Nunca se muestran endpoints ni claves del navegador.</p></div>
    <section className="grid gap-3 sm:grid-cols-3"><Card><p className="text-xs text-tinta-suave">Push web</p><div className="mt-2"><Badge tone={configured ? "balsamo" : "cirio"}>{configured ? "Configurado" : "Pendiente"}</Badge></div></Card><Card><p className="text-xs text-tinta-suave">Dispositivos</p><p className="mt-1 font-display text-3xl font-semibold">{stats.total_devices}</p><p className="text-xs text-tinta-suave">{stats.recent_devices} activos últimos 7 días</p></Card><Card><p className="text-xs text-tinta-suave">Usuarios con push</p><p className="mt-1 font-display text-3xl font-semibold">{stats.users_with_push}</p></Card></section>
    <Card><h2 className="font-display text-xl font-semibold text-anil-800">Prueba de mi dispositivo</h2><p className="mt-2 text-sm text-tinta-suave">Tu cuenta tiene {mine.length} {mine.length === 1 ? "dispositivo registrado" : "dispositivos registrados"}. Envía una prueba solo a tus propios dispositivos.</p>{mine.length ? <div className="my-3 flex flex-wrap gap-2">{mine.map((row, index) => <Badge key={`${row.last_seen_at}-${index}`}>{row.device_name || "Dispositivo"}</Badge>)}</div> : null}<div className="mt-4"><TestPushForm /></div></Card>
    {!configured ? <div className="rounded-2xl border border-cirio-200 bg-cirio-50 p-4 text-sm text-anil-900">El centro interno funciona, pero todavía falta la configuración segura del servicio push.</div> : null}
    <Card><h2 className="font-display text-xl font-semibold text-anil-800">Campañas de donación</h2><p className="mt-2 mb-4 text-sm text-tinta-suave">Envía un aviso a quienes hayan activado la categoría Campañas de donación. Esta acción queda limitada a admin/superadmin.</p><CampaignPushForm categories={categoriesResult.data ?? []} /></Card>
  </div>;
}
