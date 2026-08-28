"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
export async function markNotificationRead(formData:FormData){const id=z.string().uuid().parse(formData.get("id"));const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);revalidatePath("/notificaciones");revalidatePath("/mas");}
export async function markAllNotificationsRead(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);revalidatePath("/notificaciones");revalidatePath("/mas");}
