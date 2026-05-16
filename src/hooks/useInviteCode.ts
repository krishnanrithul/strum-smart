import { supabase } from "@/integrations/supabase/client";

export async function redeemInviteCode(code: string, studentId: string): Promise<void> {
  const { data: invite, error: findErr } = await (supabase as any)
    .from("invite_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (findErr || !invite) throw new Error("Invalid code");

  const { error: profileErr } = await (supabase as any)
    .from("profiles")
    .update({ teacher_id: invite.teacher_id })
    .eq("id", studentId);

  if (profileErr) throw profileErr;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createInviteCode(teacherId: string): Promise<string> {
  const code = generateCode();
  const { error } = await supabase
    .from("invite_codes")
    .insert({ code, teacher_id: teacherId });
  if (error) throw error;
  return code;
}

export async function getExistingInviteCode(teacherId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from("invite_codes")
    .select("code")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.code ?? null;
}
