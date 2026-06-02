"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

const CONFIRM_WORD = "УСТГАХ";

export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Устгаж чадсангүй. Дахин оролдоно уу.");
      }
      // Account gone — leave the authenticated area.
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-sm text-red-600 hover:text-red-700 py-2"
      >
        Бүртгэлээ бүрмөсөн устгах
      </button>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-red-700 leading-relaxed">
          Энэ үйлдэл буцаагдахгүй. Таны бүртгэл болон холбогдох мэдээлэл бүрмөсөн
          устана. Баталгаажуулахын тулд{" "}
          <strong>{CONFIRM_WORD}</strong> гэж бичнэ үү.
        </p>
      </div>

      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={CONFIRM_WORD}
        className="w-full px-3 py-2 rounded-lg border-2 border-red-200 bg-white text-sm outline-none focus:border-red-400"
      />

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm("");
            setError(null);
          }}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white"
        >
          Болих
        </button>
        <button
          type="button"
          disabled={confirm !== CONFIRM_WORD || busy}
          onClick={handleDelete}
          className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Устгах
        </button>
      </div>
    </div>
  );
}
