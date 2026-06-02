import { WifiOff } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Офлайн — БОСГО" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          Интернэт холболт алга
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          Та одоогоор офлайн байна. Холболтоо шалгаад дахин оролдоно уу.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        >
          Дахин ачаалах
        </Link>
      </div>
    </div>
  );
}
