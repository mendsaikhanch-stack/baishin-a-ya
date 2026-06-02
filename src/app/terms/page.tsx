import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл — БОСГО",
  description: "БОСГО үйлчилгээг ашиглах нөхцөл.",
};

// NOTE: Ерөнхий загвар. Албан ёсоор нийтлэхээс өмнө хуульчаар хянуулна уу.
const UPDATED = "2026 оны 6-р сар";
const CONTACT = "geregekiosk@gmail.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-10">
      <article className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Үйлчилгээний нөхцөл
        </h1>
        <p className="text-xs text-gray-400 mb-6">
          Сүүлд шинэчилсэн: {UPDATED}
        </p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              1. Үйлчилгээний тухай
            </h2>
            <p>
              БОСГО нь барилгын төлөвлөлтөд туслах мэдээлэл, тооцоолол, AI
              зөвлөгөө өгдөг. Энэ нь <strong>мэргэжлийн инженер, архитектор,
              төсөвчний дүгнэлтийг орлохгүй</strong>. Гаргасан тоо, зөвлөмж нь
              урьдчилсан төлөвлөлтийн зориулалттай.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              2. Хариуцлагын хязгаарлалт
            </h2>
            <p>
              Үйлчилгээгээр өгсөн мэдээлэлд тулгуурлан гаргасан шийдвэрийн үр
              дагаврыг хэрэглэгч өөрөө хариуцна. Бид бодит барилгын зардал, чанар,
              хугацааны зөрүүг хариуцахгүй. Чухал шийдвэрийн өмнө мэргэжилтнээс
              лавлахыг зөвлөж байна.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              3. Төлбөр ба хандалт
            </h2>
            <p>
              Төлбөртэй багцуудын төлбөрийг банкны шилжүүлгээр хүлээн авна.
              Төлбөр баталгаажсаны дараа холбогдох хандалт нээгдэнэ. Сар бүрийн
              захиалга нь зарласан хугацааны хандалтыг олгоно.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              4. Зохистой хэрэглээ
            </h2>
            <p>
              Үйлчилгээг хууль бус зорилгоор ашиглах, систем рүү халдах, бусдын
              эрхийг зөрчихийг хориглоно. Эдгээрийг зөрчвөл хандалтыг хязгаарлаж
              болно.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              5. Өөрчлөлт
            </h2>
            <p>
              Бид энэхүү нөхцөлийг шинэчлэх эрхтэй. Чухал өөрчлөлтийг үйлчилгээ
              дотор мэдэгдэнэ.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              6. Холбоо барих
            </h2>
            <p>
              Асуулт байвал:{" "}
              <a href={`mailto:${CONTACT}`} className="text-brand-600 underline">
                {CONTACT}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/privacy" className="text-sm text-brand-600 underline">
            Нууцлалын бодлого →
          </Link>
        </div>
      </article>
    </div>
  );
}
