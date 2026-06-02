"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useState } from "react";
import t from "@/i18n/mn";

export default function RoadmapPage() {
  const router = useRouter();
  const { assessment } = useProjectStore();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  useEffect(() => {
    if (!assessment) {
      router.push("/questionnaire");
    }
  }, [assessment, router]);

  if (!assessment) return null;

  const { roadmapPhases } = assessment;

  return (
    <div className="min-h-screen py-8">
      <div className="container-app max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t.roadmap.title}
          </h1>
          <p className="text-gray-500">{t.roadmap.subtitle}</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Энэ төлөвлөгөө нь ерөнхий чиглүүлэг бөгөөд мэргэжилтний зөвлөгөөг
            орлохгүй.
          </span>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {roadmapPhases.map((phase, index) => {
            const isExpanded = expandedPhase === phase.id;
            const isLast = index === roadmapPhases.length - 1;

            return (
              <div key={phase.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200" />
                )}

                {/* Phase card */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedPhase(isExpanded ? null : phase.id)
                    }
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Phase number */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                        phase.status === "completed"
                          ? "bg-success-100 text-success-600"
                          : phase.status === "active"
                            ? "bg-brand-100 text-brand-600"
                            : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {phase.status === "completed" ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        phase.phase
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {phase.title}
                        </h3>
                        {phase.expertNeeded && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            Мэргэжилтэн
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {phase.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {phase.estimatedDuration}
                        </span>
                        <span>
                          {phase.tasks.length} даалгавар
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform flex-shrink-0",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Expanded tasks */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-[600px]" : "max-h-0"
                    )}
                  >
                    <div className="border-t px-5 pb-5 pt-3">
                      {phase.expertNeeded && phase.expertType && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg mb-3 text-sm text-amber-800">
                          <Users className="w-4 h-4" />
                          <span>
                            Хэрэгтэй мэргэжилтэн: <strong>{phase.expertType}</strong>
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {phase.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-success-500 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {task.title}
                                </span>
                                {task.requiresExpert && (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/checklist"
            className="flex-1 text-center py-3 px-6 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            Шалгах хуудас руу очих
          </Link>
          <Link
            href="/results"
            className="flex-1 text-center py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Үр дүн рүү буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
