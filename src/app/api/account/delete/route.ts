import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Permanently delete the signed-in user's account and profile data.
 * Required for App Store / Play Store account-deletion compliance.
 */
export async function POST() {
  // 1) Identify the caller from their own session (cookie-based).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 2) Service-role client to remove data + auth record (bypasses RLS).
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "server_not_configured" },
      { status: 500 },
    );
  }

  try {
    // Remove the profile row (best-effort; ignore if table/row absent).
    await admin.from("users").delete().eq("id", user.id);

    // Remove the auth account itself.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    // Clear the local session.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, code: "delete_failed" },
      { status: 500 },
    );
  }
}
