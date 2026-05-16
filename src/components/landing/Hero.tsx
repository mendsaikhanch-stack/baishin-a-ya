import Link from "next/link";
import { ArrowRight, Shield, CheckCircle, TrendingUp } from "lucide-react";

export default function Hero() {
  return (
    <section className="gradient-hero">
      <div className="container-app py-16 sm:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Газар сонголтоос түлхүүр гардуулалт хүртэлх гарын авлага
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Байшингаа алдаагүй,{" "}
            <span className="text-brand-600">төсөвтөө багтаан</span> барь
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
            Хэдэн сая ₮ хэрэгтэй, аль үе шатанд ямар эрсдэл байгаа, дараа нь
            юу хийх ёстой вэ — таны газар, төсөв, бэлэн байдалд тулгуурласан
            бодит төлөвлөгөөг 10 минутад аваарай.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/questionnaire"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25 text-lg"
            >
              Үнэгүй шалгалт эхлэх
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-600 font-medium hover:text-brand-600 transition-colors"
            >
              Хэрхэн ажилладаг вэ?
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              Андуурахгүй
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              Алдаа багасна
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success-500" />
              Мөнгө хэмнэнэ
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
