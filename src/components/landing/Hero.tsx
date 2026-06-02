import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

// Hero photo: free Unsplash license (modern architect home at dusk) — public/hero-house.jpg
export default function Hero() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Decorative colourful blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 -right-16 h-80 w-80 rounded-full bg-accent-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-success-100/60 blur-3xl"
      />

      <div className="container-app relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Газар сонголтоос түлхүүр гардуулалт хүртэл
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6">
              Байшингаа алдаагүй,{" "}
              <span className="relative inline-block text-brand-600">
                төсөвтөө багтаан
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent-200/70 rounded-full"
                />
              </span>{" "}
              барь
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Хэдэн сая ₮ хэрэгтэй, аль үе шатанд ямар эрсдэл байгаа, дараа нь
              юу хийх ёстой вэ — таны газар, төсөв, бэлэн байдалд тулгуурласан
              бодит төлөвлөгөөг 10 минутад аваарай.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
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
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
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

          {/* ── Right: visual ── */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Glow ring behind the photo */}
            <div
              aria-hidden
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-400/30 via-transparent to-accent-300/40 blur-2xl"
            />

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
              <Image
                src="/hero-house.jpg"
                alt="Орчин үеийн хувийн байшин"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {/* subtle gradient for text legibility on overlapping cards */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
              />
            </div>

            {/* Floating glass card — top left */}
            <div className="absolute -left-3 top-6 sm:-left-6 sm:top-10 rounded-2xl bg-white/80 backdrop-blur-md px-4 py-3 shadow-xl ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold leading-none text-gray-900">
                    10 минут
                  </div>
                  <div className="text-xs text-gray-500">төлөвлөгөө бэлэн</div>
                </div>
              </div>
            </div>

            {/* Floating glass card — bottom right */}
            <div className="absolute -right-3 bottom-6 sm:-right-6 sm:bottom-10 rounded-2xl bg-white/80 backdrop-blur-md px-4 py-3 shadow-xl ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold leading-none text-gray-900">
                    Амьд AI
                  </div>
                  <div className="text-xs text-gray-500">зөвлөгч хажууд</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
