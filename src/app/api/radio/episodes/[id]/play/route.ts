import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Episodio inválido" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_radio_episode_source", { target_episode: id }).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Audio no disponible para esta cuenta" }, { status: 403 });

  if (data.external_url) return NextResponse.json({ url: data.external_url }, { headers: { "Cache-Control": "private, no-store" } });
  if (!data.audio_path) return NextResponse.json({ error: "Este episodio todavía no tiene audio" }, { status: 404 });

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signed, error: signedError } = await service.storage.from("radio-archive").createSignedUrl(data.audio_path, 300);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "No pudimos preparar el audio" }, { status: 500 });
  return NextResponse.json({ url: signed.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
