"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  LogIn,
} from "lucide-react";
import { CATEGORY_META, type GuideCategory } from "@/content/guide-articles";

type Draft = {
  id: string;
  slug: string;
  subcategory: string | null;
  title: string;
  summary: string | null;
  content: string;
  created_at: string;
};

type Question = {
  id: string;
  question: string;
  created_at: string;
  processed_at: string | null;
};

type Data = {
  drafts: Draft[];
  questions: Question[];
  unprocessedCount: number;
};

function catTitle(sub: string | null): string {
  if (sub && sub in CATEGORY_META) return CATEGORY_META[sub as GuideCategory].title;
  return "Ангилалгүй";
}

export default function AdminKnowledgePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<"unauthenticated" | "not_admin" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/knowledge", { cache: "no-store" });
      if (res.status === 401) return setAuthError("unauthenticated");
      if (res.status === 403) return setAuthError("not_admin");
      const json = (await res.json()) as Data;
      setData(json);
    } catch {
      setNotice("Ачаалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "publish" | "reject") {
    if (action === "reject" && !confirm("Энэ ноорогийг устгах уу?")) return;
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setNotice(`Алдаа: ${j.error ?? res.status}`);
      } else {
        setNotice(action === "publish" ? "Нийтэллээ ✓" : "Устгалаа");
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function runEnrich() {
    setRunning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/knowledge/run", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(`Enrichment алдаа: ${j.error ?? res.status}`);
      } else {
        setNotice(
          `Enrichment дууслаа — ${j.questionsConsidered ?? 0} асуулт шинжилж ${j.draftsCreated ?? 0} ноорог үүсгэв.${j.note ? " " + j.note : ""}`,
        );
        await load();
      }
    } finally {
      setRunning(false);
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-8 max-w-sm text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            {authError === "unauthenticated" ? "Нэвтрэх шаардлагатай" : "Хандах эрхгүй"}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {authError === "unauthenticated"
              ? "Админаар нэвтэрнэ үү."
              : "Энэ хуудас зөвхөн админд нээлттэй."}
          </p>
          <Link
            href="/login?next=/admin/knowledge"
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700"
          >
            <LogIn className="w-4 h-4" /> Нэвтрэх
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Мэдлэгийн сан — хяналт</h1>
            <p className="text-sm text-gray-500">
              AI-ийн боловсруулсан ноорогийг шалгаж нийтэл.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 text-sm border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Сэргээх
            </button>
            <button
              onClick={runEnrich}
              disabled={running}
              className="inline-flex items-center gap-1.5 text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Шинэчлэл ажиллуулах
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-4 text-sm bg-brand-50 text-brand-800 border border-brand-100 rounded-lg px-3 py-2">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Ачааллаж байна…
          </div>
        ) : (
          <>
            {/* Drafts */}
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Хүлээгдэж буй ноорог ({data?.drafts.length ?? 0})
            </h2>
            {data && data.drafts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-500 mb-8">
                Хүлээгдэж буй ноорог алга. Асуулт хангалттай хуримтлагдсаны дараа
                «Шинэчлэл ажиллуулах» товчийг дар.
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {data?.drafts.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-100 card-shadow p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {catTitle(d.subcategory)}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 mt-1.5">
                          {d.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{d.summary}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => act(d.id, "publish")}
                          disabled={busyId === d.id}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === d.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Нийтлэх
                        </button>
                        <button
                          onClick={() => act(d.id, "reject")}
                          disabled={busyId === d.id}
                          className="inline-flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Устгах
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      className="text-[11px] text-brand-600 mt-2 hover:underline"
                    >
                      {expanded === d.id ? "Агуулга нуух" : "Бүтэн агуулга харах"}
                    </button>
                    {expanded === d.id && (
                      <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-80 overflow-auto">
                        {d.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Questions */}
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Сүүлийн асуултууд
              <span className="text-xs font-normal text-gray-400">
                ({data?.unprocessedCount ?? 0} боловсруулаагүй)
              </span>
            </h2>
            {data && data.questions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-500">
                Одоогоор бүртгэгдсэн асуулт алга. Хэрэглэгчид AI зөвлөгчтэй
                ярилцаж эхэлмэгц энд хуримтлагдана.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                {data?.questions.map((q) => (
                  <div key={q.id} className="px-4 py-2.5 flex items-start gap-2">
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        q.processed_at ? "bg-gray-300" : "bg-amber-400"
                      }`}
                    />
                    <p className="text-sm text-gray-700">{q.question}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-6 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Ноорог нь зөвхөн нийтэлсний дараа хэрэглэгч болон AI зөвлөгчид
              харагдана. Барилгын зөвлөгөөг нийтлэхээсээ өмнө шалга.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
