import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-app">
        <div className="gradient-brand rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Байшингаа барих төлөвлөгөөгөө эхлүүлэх
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
            Үнэгүй бэлэн байдлын шалгалт хийж, эхний алхмуудаа мэдэж аваарай.
          </p>
          <Link
            href="/questionnaire"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-lg"
          >
            Одоо эхлэх
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
