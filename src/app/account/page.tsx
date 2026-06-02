import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import DeleteAccount from "@/components/account/DeleteAccount";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("plan, daily_estimates, current_period_end, daily_reset_at")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  const dailyUsed = profile?.daily_reset_at === new Date().toISOString().slice(0, 10)
    ? profile?.daily_estimates ?? 0
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Хэрэглэгчийн хуудас</h1>

      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Имэйл</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Багц</span>
          <span className="font-medium uppercase">{plan}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Өнөөдөр ашигласан тооцоо</span>
          <span className="font-medium">
            {dailyUsed}
            {plan === "free" && " / 3"}
          </span>
        </div>
        {profile?.current_period_end && plan === "pro" && (
          <div className="flex justify-between">
            <span className="text-gray-600">Дараагийн төлбөр</span>
            <span className="font-medium">
              {new Date(profile.current_period_end).toLocaleDateString("mn-MN")}
            </span>
          </div>
        )}
      </div>

      {plan === "free" && (
        <Link
          href="/pricing"
          className="block w-full text-center bg-brand-600 text-white py-3 rounded-lg font-semibold"
        >
          Pro руу шилжих
        </Link>
      )}

      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          Гарах
        </button>
      </form>

      <div className="pt-2 border-t border-gray-200">
        <DeleteAccount />
      </div>

      <p className="text-center text-xs text-gray-400 pt-2">
        <Link href="/privacy" className="underline">
          Нууцлалын бодлого
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline">
          Үйлчилгээний нөхцөл
        </Link>
      </p>
    </div>
  );
}
