import { Landmark } from "lucide-react";

/**
 * Supported bank apps strip — reassures users they can transfer from whatever
 * bank app they already use. Rendered as plain name chips for now.
 *
 * TO ADD REAL LOGOS LATER: drop official files at public/bank-logos/<slug>.png
 * (or .svg) and swap the chip body for <img src={`/bank-logos/${b.slug}.png`} …>.
 * The slugs below are the stable keys to name those files by. Prefer QPay's
 * official invoice-API logos / brand kit so the marks stay accurate.
 */
const BANKS: { slug: string; name: string; dot: string }[] = [
  { slug: "khan", name: "Хаан банк", dot: "bg-green-500" },
  { slug: "golomt", name: "Голомт банк", dot: "bg-blue-600" },
  { slug: "tdb", name: "Худалдаа хөгжлийн банк", dot: "bg-sky-700" },
  { slug: "state", name: "Төрийн банк", dot: "bg-amber-500" },
  { slug: "xac", name: "Хас банк", dot: "bg-orange-500" },
  { slug: "mbank", name: "М банк", dot: "bg-rose-500" },
  { slug: "bogd", name: "Богд банк", dot: "bg-indigo-500" },
  { slug: "capitron", name: "Капитрон банк", dot: "bg-red-500" },
  { slug: "nibank", name: "Үндэсний хөрөнгө оруулалтын банк", dot: "bg-teal-600" },
  { slug: "chinggis", name: "Чингис Хаан банк", dot: "bg-purple-600" },
  { slug: "transbank", name: "Тээвэр хөгжлийн банк", dot: "bg-cyan-600" },
  { slug: "ard", name: "Ард Апп", dot: "bg-fuchsia-600" },
  { slug: "most", name: "MostMoney", dot: "bg-emerald-600" },
  { slug: "toki", name: "Toki", dot: "bg-violet-600" },
];

export default function BankApps({
  title = "Аль ч банкны аппаас шилжүүлж болно",
}: {
  title?: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Landmark className="w-4 h-4 text-gray-400" />
        <p className="text-xs font-medium text-gray-500">{title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {BANKS.map((b) => (
          <span
            key={b.slug}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
          >
            <span className={`h-2 w-2 rounded-full ${b.dot}`} />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}
