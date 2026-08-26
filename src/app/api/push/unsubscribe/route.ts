import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ endpoint: z.string().url() });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta el endpoint de la suscripción." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    return NextResponse.json({ error: "No se pudo cancelar la suscripción." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
