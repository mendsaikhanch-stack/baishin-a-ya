import type { EstimateOutput } from "@/lib/estimator/types";

const fmt = (n: number) => n.toLocaleString("mn-MN");

type Props = {
  result: EstimateOutput;
  showMargins?: boolean;
};

export default function ResultCard({ result, showMargins = true }: Props) {
  return (
    <div className="space-y-4 max-w-md mx-auto bg-white rounded-xl border p-5">
      <h3 className="text-lg font-bold text-gray-900">Урьдчилсан тооцоо</h3>

      <Row label="Үнэ (1 м²)">
        {fmt(result.price_per_m2.min)} – {fmt(result.price_per_m2.max)} ₮
      </Row>
      <Row label="Нийт үнэ" emphasis>
        {fmt(result.price_total.min)} – {fmt(result.price_total.max)} ₮
      </Row>

      {showMargins && result.price_total_with_margin && (
        <Row label="Margin-тэй (profit + contingency + VAT)" emphasis>
          {fmt(result.price_total_with_margin.min)} –{" "}
          {fmt(result.price_total_with_margin.max)} ₮
        </Row>
      )}

      <Row label="Хугацаа">
        {result.duration_months.min} – {result.duration_months.max} сар
      </Row>

      {result.season_applied.multiplier !== 1.0 && (
        <Row label={`Улирал (${result.season_applied.season})`}>
          x{result.season_applied.multiplier.toFixed(2)}
        </Row>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Гол материалууд
        </h4>
        <ul className="space-y-1.5 text-sm">
          {result.materials_top5.map((m) => (
            <li
              key={m.name}
              className="flex justify-between gap-2 text-gray-700"
            >
              <span>
                {m.name}{" "}
                <span className="text-gray-400">
                  ({(m.share * 100).toFixed(0)}%)
                </span>
              </span>
              <span className="text-gray-500">
                {fmt(m.cost.min)} – {fmt(m.cost.max)} ₮
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        ⚠️ Урьдчилсан төлөвлөлтийн тооцоо. Газрын төлөв, инженерийн систем,
        зөвшөөрлийн төлбөр багтаагүй. Албан тооцоог мэргэжилтнээр баталгаажуулна.
      </p>
    </div>
  );
}

function Row({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={
          emphasis ? "font-semibold text-gray-900" : "text-gray-800"
        }
      >
        {children}
      </span>
    </div>
  );
}
