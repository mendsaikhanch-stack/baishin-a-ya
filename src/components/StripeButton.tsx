"use client";

import { useState } from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
  /** When user is not logged in, redirect them here first. */
  loginRedirect?: string;
};

export default function StripeButton({
  className,
  children,
  loginRedirect = "/login?next=/pricing",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = loginRedirect;
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe checkout URL not returned");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={go}
        disabled={loading}
        className={
          className ??
          "w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
        }
      >
        {loading ? "Шилжүүлж байна..." : children ?? "Pro захиалах"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
