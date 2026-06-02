import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Нууцлалын бодлого — БОСГО",
  description:
    "БОСГО таны мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай.",
};

// NOTE: Энэ бол ерөнхий загвар. Албан ёсоор нийтлэхээс өмнө хуульчаар
// хянуулна уу. Сүүлд шинэчилсэн огноог гараар шинэчилнэ.
const UPDATED = "2026 оны 6-р сар";
const CONTACT = "geregekiosk@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-10">
      <article className="max-w-2xl mx-auto px-4 prose-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Нууцлалын бодлого
        </h1>
        <p className="text-xs text-gray-400 mb-6">
          Сүүлд шинэчилсэн: {UPDATED}
        </p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <p>
              БОСГО (&laquo;бид&raquo;) нь Монголд хувийн байшин барих
              төлөвлөлтөд туслах үйлчилгээ юм. Энэхүү бодлого нь таны мэдээллийг
              хэрхэн цуглуулж, ашиглаж, хамгаалдгийг тайлбарлана.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              1. Бид ямар мэдээлэл цуглуулдаг вэ?
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Төслийн мэдээлэл:</strong> асуумжид оруулсан газар,
                төсөв, талбай, сонголтууд (төлөвлөгөө гаргахад).
              </li>
              <li>
                <strong>Чат асуултууд:</strong> AI зөвлөгчид тавьсан асуултын
                текст (үйлчилгээг сайжруулах, мэдлэгийн санг баяжуулах).
              </li>
              <li>
                <strong>Холбоо барих мэдээлэл:</strong> захиалга үүсгэхэд
                оруулсан нэр, утас, и-мэйл (сонголттой).
              </li>
              <li>
                <strong>Төлбөрийн баталгаажуулалт:</strong> банкны шилжүүлгийн
                гүйлгээний дэлгэрэнгүйг та өөрөө оруулна.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              2. Мэдээллийг хэрхэн ашигладаг вэ?
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Танд тохирсон төлөвлөгөө, зөвлөгөө боловсруулах.</li>
              <li>Захиалга, төлбөрийг баталгаажуулах, хандалт нээх.</li>
              <li>Үйлчилгээ, мэдлэгийн сангаа сайжруулах.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              3. Гуравдагч талууд
            </h2>
            <p>
              Үйлчилгээг ажиллуулахад дараах үйлчилгээ үзүүлэгчдийг ашигладаг:
              үүлэн дэд бүтэц, өгөгдлийн сан (Supabase), AI загвар нийлүүлэгчид
              (асуулт боловсруулахад). Бид таны мэдээллийг зар сурталчилгааны
              зорилгоор зардаггүй.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              4. Хадгалалт ба хамгаалалт
            </h2>
            <p>
              Мэдээллийг үйлчилгээний зорилгод шаардлагатай хугацаанд хадгална.
              Бид мэдээллийг хамгаалахад үндэслэлтэй техникийн арга хэмжээ авдаг
              боловч интернэтээр дамжуулах аливаа дамжуулалт 100% аюулгүй гэдгийг
              баталгаажуулж чадахгүй.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              5. Таны эрх
            </h2>
            <p>
              Та өөрийн мэдээлэлд хандах, засах, эсвэл устгуулах хүсэлт гаргах
              эрхтэй. Бүртгэлээ устгахыг хүсвэл{" "}
              <Link href="/account" className="text-brand-600 underline">
                Бүртгэл
              </Link>{" "}
              хэсгээс эсвэл доорх хаягаар хандана уу.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              6. Холбоо барих
            </h2>
            <p>
              Асуулт, хүсэлт байвал:{" "}
              <a href={`mailto:${CONTACT}`} className="text-brand-600 underline">
                {CONTACT}
              </a>
            </p>
          </section>

          <section className="border-t border-gray-200 pt-4 text-xs text-gray-400">
            Энэ нь үйлчилгээний ерөнхий тайлбар бөгөөд хуулийн зөвлөгөөг
            орлохгүй.
          </section>
        </div>

        <div className="mt-8">
          <Link href="/terms" className="text-sm text-brand-600 underline">
            Үйлчилгээний нөхцөл →
          </Link>
        </div>
      </article>
    </div>
  );
}
