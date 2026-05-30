import Link from "next/link";
import Image from "next/image";
import { DISCLAIMER_TEXT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-3">
              <Image
                src="/logo.png"
                alt="БОСГО"
                width={1052}
                height={327}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Монголд хувийн байшин барихыг хүссэн хүн бүрт зориулсан алхам
              алхмаар төлөвлөлтийн туслах.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Холбоосууд</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/knowledge" className="text-sm text-gray-500 hover:text-brand-600">Мэдлэгийн сан</Link>
              <Link href="/experts" className="text-sm text-gray-500 hover:text-brand-600">Мэргэжилтнүүд</Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-brand-600">Үнийн санал</Link>
              <Link href="/questionnaire" className="text-sm text-gray-500 hover:text-brand-600">Шалгалт эхлэх</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Бусад</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#" className="text-sm text-gray-500 hover:text-brand-600">Нууцлалын бодлого</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-brand-600">Үйлчилгээний нөхцөл</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-brand-600">Холбоо барих</Link>
            </nav>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            ⚠️ {DISCLAIMER_TEXT}
          </p>
          <p className="text-xs text-gray-400">
            © 2026 БОСГО. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
