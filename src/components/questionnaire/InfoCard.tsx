"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoSection = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  intro?: string;
  sections: InfoSection[];
  defaultOpen?: boolean;
};

export default function InfoCard({
  eyebrow = "Эхлээд мэдэх ёстой",
  title,
  intro,
  sections,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/60 to-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
              {eyebrow}
            </p>
            <h2 className="text-[15px] font-bold text-gray-900 leading-snug">
              {title}
            </h2>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4">
          {intro && (
            <p className="text-sm text-gray-600 leading-relaxed">{intro}</p>
          )}

          <div className="grid gap-3">
            {sections.map((s) => (
              <div
                key={s.title}
                className="flex gap-3 rounded-xl bg-white border border-gray-100 p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Уншсаны дараа доорх асуултуудад хариулна уу — таны сонголтыг бид
            цаашдын зөвлөгөөнд ашиглана.
          </p>
        </div>
      )}
    </section>
  );
}
