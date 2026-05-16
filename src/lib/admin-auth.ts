// ============================================================
// Admin auth — Supabase auth + ADMIN_EMAIL гэсэн одоо байгаа pattern-ыг
// нэгтгэсэн helper. `/api/admin/recalibrate`-ийн inline кодоос гаргасан.
// ============================================================

import "server-only";
import { createClient } from "@/lib/supabase-server";

export type AdminCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "unauthenticated" | "not_admin"; status: 401 | 403 };

export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated", status: 401 };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return { ok: false, reason: "not_admin", status: 403 };
  }

  return { ok: true, email: user.email };
}
