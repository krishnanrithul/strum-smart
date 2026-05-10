import { supabase } from "@/integrations/supabase/client";

export async function redeemInviteCode(code: string, studentId: string): Promise<void> {
  const { data: invite, error: findErr } = await (supabase as any)
    .from("invite_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .is("used_at", null)
    .single();

  if (findErr || !invite) throw new Error("Invalid or already used code");

  await (supabase as any)
    .from("invite_codes")
    .update({ used_at: new Date().toISOString(), used_by: studentId })
    .eq("id", invite.id);

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