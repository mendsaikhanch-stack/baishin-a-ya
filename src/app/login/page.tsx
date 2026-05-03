"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { error: e } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (e) throw e;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-8 mt-12 space-y-4">
      <h1 className="text-2xl font-bold">Нэвтрэх</h1>
      <p className="text-sm text-gray-600">
        Имэйл хаягаа оруулбал танд magic link явуулна.
      </p>

      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          Имэйлээ шалгана уу. Линкийг дарж нэвтэрнэ.
        </div>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="та@example.com"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={loading || !email.trim()}
            className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Илгээж байна..." : "Magic link авах"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
