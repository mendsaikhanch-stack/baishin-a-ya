"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { CheckSquare, Square, Shield } from "lucide-react";
import t from "@/i18n/mn";

export default function ChecklistPage() {
  const router = useRouter();
  const { assessment, checklistProgress, toggleChecklistItem } =
    useProjectStore();

  useEffect(() => {
    if (!assessment) {
      router.push("/questionnaire");
    }
  }, [assessment, router]);

  const checklistItems = assessment?.checklistItems ?? [];

  // Group by phase category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof checklistItems> = {};
    for (const item of checklistItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [checklistItems]);

  if (!assessment) return null;

  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(
    (item) => checklistProgress[item.id]
  ).length;
  const progressPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.checklist.title}
          </h1>
          <p className="text-gray-500">{t.checklist.subtitle}</p>
        </div>

        {/* Progress overview */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              {t.checklist.progress}
            </h2>
            <span className="text-sm text-gray-500">
              {completedItems} {t.checklist.completed} / {totalItems}{" "}
              {t.checklist.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={cn(
                "h-3 rounded-full transition-all duration-300",
                progressPercent >= 80
                  ? "bg-success-500"
                  : progressPercent >= 40
                    ? "bg-brand-500"
                    : "bg-warning-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progressPercent}% дууссан</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Энэ шалгах хуудас нь ерөнхий зааварчилгаа. Нарийвчлалыг мэргэжилтнээс лавлана уу.
          </span>
        </div>

        {/* Checklist groups */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const categoryCompleted = items.filter(
              (item) => checklistProgress[item.id]
            ).length;

            return (
              <div
                key={category}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <span className="text-xs text-gray-500">
                    {categoryCompleted}/{items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const isCompleted = checklistProgress[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCompleted
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            )}
                          >
                            {item.title}
                          </span>
                          <p
                            className={cn(
                              "text-xs mt-0.5",
                              isCompleted ? "text-gray-300" : "text-gray-500"
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/chat"
            className="flex-1 text-center py-3 px-6 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            AI туслахтай ярилцах
          </Link>
          <Link
            href="/roadmap"
            className="flex-1 text-center py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Төлөвлөгөө харах
          </Link>
        </div>
      </div>
    </div>
  );
}
