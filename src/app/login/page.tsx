"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const RECENT_KEY = "bosgo:recent-emails";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(email: string) {
  if (typeof window === "undefined") return;
  const cur = loadRecent().filter((e) => e !== email);
  cur.unshift(email);
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, MAX_RECENT)));
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const list = loadRecent();
    setRecent(list);
    if (list[0]) setEmail(list[0]);
  }, []);

  function getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  async function sendCode(targetEmail?: string) {
    const value = (targetEmail ?? email).trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: e } = await supabase.auth.signInWithOtp({
        email: value,
        options: { shouldCreateUser: true },
      });
      if (e) throw e;
      saveRecent(value);
      setEmail(value);
      setRecent(loadRecent());
      setStage("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: e } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (e) throw e;
      router.push("/account");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Код буруу байна.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-8 mt-12 space-y-4">
      <h1 className="text-2xl font-bold">Нэвтрэх</h1>

      {stage === "email" && (
        <>
          {recent.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Сүүлд ашигласан:</p>
              <div className="space-y-1">
                {recent.map((e) => (
                  <button
                    key={e}
                    onClick={() => sendCode(e)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded hover:bg-brand-50 hover:border-brand-200 transition-colors text-sm flex items-center justify-between"
                  >
                    <span className="truncate">{e}</span>
                    <span className="text-xs text-brand-600 ml-2">
                      Код авах →
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">эсвэл</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            {recent.length > 0
              ? "Өөр имэйл хаяг ашиглах:"
              : "Имэйл хаягаа оруулбал 6-оронтой код илгээнэ."}
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="та@example.com"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && sendCode()}
            autoFocus={recent.length === 0}
          />
          <button
            onClick={() => sendCode()}
            disabled={loading || !email.trim()}
            className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Илгээж байна..." : "Код авах"}
          </button>
        </>
      )}

      {stage === "code" && (
        <>
          <p className="text-sm text-gray-600">
            <b>{email}</b> хаягт ирсэн 6–8 оронтой кодоо оруулна уу.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            placeholder="123456"
            className="w-full border border-gray-300 rounded px-3 py-2 text-center text-lg tracking-widest focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            autoFocus
          />
          <button
            onClick={verifyCode}
            disabled={loading || !code.trim()}
            className="w-full bg-brand-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Шалгаж байна..." : "Нэвтрэх"}
          </button>
          <button
            onClick={() => {
              setStage("email");
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-gray-500 underline"
          >
            Имэйл солих
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
