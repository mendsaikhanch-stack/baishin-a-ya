// ============================================================
// PDF generation + storage pipeline (server-only)
// Захиалгад зориулсан PDF үүсгэж, Supabase Storage-руу upload хийгээд,
// report_orders.pdf_path, pdf_generated_at талбаруудыг шинэчилнэ.
// /api/admin/orders/[code]/pdf болон /status хоёр route нэгэн зэрэг
// ашиглана.
// ============================================================

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderReportPDF, type ReportInput } from "@/lib/report-pdf";

export const REPORT_BUCKET = "report-pdfs";

export type PdfPipelineResult =
  | {
      ok: true;
      pdf_path: string;
      pdf_generated_at: string;
      size_bytes: number;
    }
  | { ok: false; error: string; code: PdfPipelineErrorCode };

export type PdfPipelineErrorCode =
  | "render_error"
  | "storage_error"
  | "db_error";

export type PdfOrderInput = {
  order_code: string;
  tier: ReportInput["tier"];
  price_mnt: number;
  created_at: string;
  project_snapshot: ReportInput["project_snapshot"];
};

export async function generateAndStoreReportPDF(
  supabase: SupabaseClient,
  order: PdfOrderInput,
): Promise<PdfPipelineResult> {
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderReportPDF({
      order_code: order.order_code,
      tier: order.tier,
      price_mnt: order.price_mnt,
      created_at: order.created_at,
      project_snapshot: order.project_snapshot,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report-pdf-pipeline] render error:", e);
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Render failed.",
      code: "render_error",
    };
  }

  const path = `${order.order_code}.pdf`;
  const { error: uploadErr } = await supabase.storage
    .from(REPORT_BUCKET)
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report-pdf-pipeline] upload error:", uploadErr);
    }
    return {
      ok: false,
      error: uploadErr.message,
      code: "storage_error",
    };
  }

  const generatedAt = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("report_orders")
    .update({ pdf_path: path, pdf_generated_at: generatedAt })
    .eq("order_code", order.order_code);

  if (updateErr) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report-pdf-pipeline] db update error:", updateErr);
    }
    return {
      ok: false,
      error: updateErr.message,
      code: "db_error",
    };
  }

  return {
    ok: true,
    pdf_path: path,
    pdf_generated_at: generatedAt,
    size_bytes: pdfBuffer.length,
  };
}
