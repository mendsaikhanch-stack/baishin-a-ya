"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Энэ апп архитекторыг орлох уу?",
    a: "Үгүй. Энэ нь зөвхөн төлөвлөлтийн туслах бөгөөд мэргэжлийн архитектор, инженерийг орлохгүй. Бид хэзээ мэргэжилтэнтэй холбогдох хэрэгтэйг зөвлөнө.",
  },
  {
    q: "Үнэгүй хувилбар юу өгдөг вэ?",
    a: "Бэлэн байдлын шалгалт, ерөнхий зөвлөмж, товч үр дүн. Бүрэн төлөвлөгөө, шалгах хуудас, AI зөвлөгч зэрэг нь төлбөртэй.",
  },
  {
    q: "Хэн ашиглаж болох вэ?",
    a: "Монголд хувийн байшин барихыг хүссэн хүн бүр. Мэргэжлийн бус хүмүүст зориулсан энгийн, ойлгомжтой хэлээр бичигдсэн.",
  },
  {
    q: "Миний мэдээлэл хадгалагдах уу?",
    a: "Таны мэдээлэл зөвхөн таны төлөвлөгөө гаргахад ашиглагдана. Гуравдагч этгээдтэй хуваалцахгүй.",
  },
  {
    q: "Энэ аппыг хөдөө орон нутагт ашиглаж болох уу?",
    a: "Тийм. Хот болон хөдөөд аль алинд нь ашиглаж болно. Газрын нөхцөл, бүс нутгийг харгалзан зөвлөмж өгнө.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section-padding bg-white">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Түгээмэл асуултууд
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openIndex === i ? "max-h-40 pb-5" : "max-h-0"
                )}
              >
                <p className="px-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
