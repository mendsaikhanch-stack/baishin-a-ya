import { FileText, BarChart3, Map } from "lucide-react";

const STEPS = [
  {
    step: 1,
    icon: FileText,
    title: "Асуулга бөглөх",
    description: "Газар, төсөв, хугацаа зэрэг мэдээллээ оруулна.",
  },
  {
    step: 2,
    icon: BarChart3,
    title: "Үр дүн авах",
    description: "Бэлэн байдлын оноо, эрсдэл, зөвлөмж авна.",
  },
  {
    step: 3,
    icon: Map,
    title: "Төлөвлөгөөгөө дагах",
    description: "Хувийн төлөвлөгөө, шалгах хуудсаар ахиц дэвшлээ хянана.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-gray-50">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Хэрхэн ажилладаг вэ?
          </h2>
          <p className="text-gray-600">3 энгийн алхамаар эхэлнэ</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-brand-200" />

            {STEPS.map((step) => (
              <div key={step.step} className="text-center relative">
                {/* Step number */}
                <div className="w-24 h-24 rounded-full bg-white border-2 border-brand-200 flex items-center justify-center mx-auto mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-brand-600" />
                  </div>
                </div>

                {/* Step badge */}
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold mb-3">
                  {step.step}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
