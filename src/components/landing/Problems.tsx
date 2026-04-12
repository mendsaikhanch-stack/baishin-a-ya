import { HelpCircle } from "lucide-react";

const PROBLEMS = [
  "Хаанаас эхлэхээ мэдэхгүй",
  "Төсвөө зөв тооцоолж чадахгүй",
  "Материал, суурь, хугацаа — юу сонгохоо мэдэхгүй",
  "Олон хүнээс зөрүүтэй зөвлөгөө авдаг",
  "Үнэтэй алдаа гаргахаас айдаг",
  "Дараагийн алхам юу болохыг мэдэхгүй",
];

export default function Problems() {
  return (
    <section className="section-padding bg-white">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Байшин барих гэж буй хүмүүсийн нийтлэг бэрхшээл
          </h2>
          <p className="text-gray-500">
            Эдгээр нь бараг хүн бүрт тохиолддог — та ганцаараа биш.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEMS.map((problem) => (
            <div
              key={problem}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
