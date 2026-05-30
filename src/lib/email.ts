// ============================================================
// Resend email integration (server-only).
// Захиалгын төлвийн шилжилт дээр хэрэглэгчид мэдэгдэл явуулна.
// RESEND_API_KEY тохируулагдаагүй бол no-op (алдаа гаргахгүй) —
// dev/preview-д email явахгүй боловч flow тасарахгүй.
// ============================================================

import "server-only";
import { Resend } from "resend";
import { TIER_LABELS, type OrderTier } from "@/lib/orders";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) resendInstance = new Resend(key);
  return resendInstance;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "БОСГО <noreply@bosgo.mn>";
}

function orderUrl(order_code: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/orders/${order_code}`;
}

export type EmailResult =
  | { sent: true; id: string }
  | {
      sent: false;
      reason: "no_config" | "no_recipient" | "send_failed";
      error?: string;
    };

type OrderEmailInput = {
  order_code: string;
  customer_email: string | null;
  customer_name: string | null;
  tier: OrderTier;
  price_mnt: number;
};

// ── HTML утс ясгах (XSS-аас сэргийлэх) ──
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greeting(name: string | null): string {
  return name ? `${escapeHtml(name)} та` : "Сайн байна уу";
}

// ────────────────────────────────────────────
// 1. Захиалга үүсэх / төлбөр хүлээж авсан
// ────────────────────────────────────────────
export async function sendOrderPaidEmail(
  o: OrderEmailInput,
): Promise<EmailResult> {
  if (!o.customer_email) {
    return { sent: false, reason: "no_recipient" };
  }
  const resend = getResend();
  if (!resend) return { sent: false, reason: "no_config" };

  const url = orderUrl(o.order_code);
  const subject = `Төлбөр баталгаажлаа · ${o.order_code}`;
  const tier = TIER_LABELS[o.tier];
  const price = `₮${o.price_mnt.toLocaleString("mn-MN")}`;

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2937; line-height:1.6; max-width:560px; margin:0 auto; padding:24px;">
  <h1 style="font-size:20px; margin:0 0 16px;">Төлбөр баталгаажлаа</h1>
  <p>${greeting(o.customer_name)}, <strong>${escapeHtml(o.order_code)}</strong> захиалгын төлбөрийг бид хүлээн авлаа.</p>
  <table cellpadding="6" style="border-collapse:collapse; margin:16px 0; width:100%;">
    <tr><td style="color:#6b7280;">Багц:</td><td><strong>${escapeHtml(tier)}</strong></td></tr>
    <tr><td style="color:#6b7280;">Дүн:</td><td><strong>${price}</strong></td></tr>
    <tr><td style="color:#6b7280;">Захиалгын код:</td><td><code style="background:#f3f4f6; padding:2px 6px; border-radius:4px;">${escapeHtml(o.order_code)}</code></td></tr>
  </table>
  <p>Манай баг тайланг тань удахгүй бэлдэж дуусаад нэг ажлын өдрийн дотор танд илгээнэ. Захиалгын төлөвөө доорх линкээр хянаж болно.</p>
  <p><a href="${url}" style="display:inline-block; background:#2563eb; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600;">Захиалга харах</a></p>
  <p style="font-size:13px; color:#6b7280; margin-top:32px; border-top:1px solid #e5e7eb; padding-top:16px;">
    Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин, архитектор, барилгын инженерийн дүгнэлтийг орлохгүй. Зөвхөн эхний шатны төлөвлөлт, төсвийн баримжаа, эрсдэл ойлгох, ажлын дараалал гаргах зориулалттай.
  </p>
</body></html>`;

  const text = `Төлбөр баталгаажлаа · ${o.order_code}

${o.customer_name ? `${o.customer_name} та` : "Сайн байна уу"},

${o.order_code} захиалгын төлбөрийг бид хүлээн авлаа.

  Багц: ${tier}
  Дүн:  ${price}

Тайланг бэлэн болмогц танд email-ээр илгээнэ.
Захиалгын төлөвөө дараах хаягаас хянаж болно:
${url}
`;

  try {
    const res = await resend.emails.send({
      from: fromAddress(),
      to: [o.customer_email],
      subject,
      html,
      text,
    });
    if (res.error) {
      return { sent: false, reason: "send_failed", error: res.error.message };
    }
    return { sent: true, id: res.data?.id ?? "" };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[email/paid] send error:", e);
    }
    return {
      sent: false,
      reason: "send_failed",
      error: e instanceof Error ? e.message : "Unknown",
    };
  }
}

// ────────────────────────────────────────────
// 2. PDF тайлан бэлэн / захиалга нээгдсэн
// ────────────────────────────────────────────
export async function sendOrderUnlockedEmail(
  o: OrderEmailInput,
): Promise<EmailResult> {
  if (!o.customer_email) {
    return { sent: false, reason: "no_recipient" };
  }
  const resend = getResend();
  if (!resend) return { sent: false, reason: "no_config" };

  const url = orderUrl(o.order_code);
  const subject = `Таны тайлан бэлэн боллоо · ${o.order_code}`;
  const tier = TIER_LABELS[o.tier];

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2937; line-height:1.6; max-width:560px; margin:0 auto; padding:24px;">
  <h1 style="font-size:20px; margin:0 0 16px;">Тайлан бэлэн боллоо 🎉</h1>
  <p>${greeting(o.customer_name)}, <strong>${escapeHtml(o.order_code)}</strong> захиалгын PDF тайланг бид бэлэн болголоо.</p>
  <p><strong>Багц:</strong> ${escapeHtml(tier)}</p>
  <p>Тайлангаа татаж авахын тулд доорх товчоор захиалгын хуудас руу ороод <strong>«Тайлан татах»</strong> товчийг дарна уу. Хэдэн ч удаа татаж болно.</p>
  <p><a href="${url}" style="display:inline-block; background:#16a34a; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">Тайлан татах</a></p>
  <p style="font-size:13px; color:#6b7280;">Эсвэл хөтөч дээр энэ хаягийг шууд оруулна уу:<br/><a href="${url}" style="color:#2563eb;">${escapeHtml(url)}</a></p>
  <p style="font-size:13px; color:#6b7280; margin-top:32px; border-top:1px solid #e5e7eb; padding-top:16px;">
    Энэхүү тайлан нь инженерийн зураг төсөл, мэргэжлийн төсөвчин, архитектор, барилгын инженерийн дүгнэлтийг орлохгүй. Зөвхөн эхний шатны төлөвлөлт, төсвийн баримжаа, эрсдэл ойлгох, ажлын дараалал гаргах зориулалттай.
  </p>
</body></html>`;

  const text = `Тайлан бэлэн боллоо · ${o.order_code}

${o.customer_name ? `${o.customer_name} та` : "Сайн байна уу"},

${o.order_code} захиалгын PDF тайланг бид бэлэн болголоо.

Багц: ${tier}

Тайлангаа татахын тулд доорх хаяг руу ороод «Тайлан татах» товчийг дарна уу:
${url}
`;

  try {
    const res = await resend.emails.send({
      from: fromAddress(),
      to: [o.customer_email],
      subject,
      html,
      text,
    });
    if (res.error) {
      return { sent: false, reason: "send_failed", error: res.error.message };
    }
    return { sent: true, id: res.data?.id ?? "" };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[email/unlocked] send error:", e);
    }
    return {
      sent: false,
      reason: "send_failed",
      error: e instanceof Error ? e.message : "Unknown",
    };
  }
}
