// ============================================================
// Үнэгүй PDF export — хэрэглэгчийн ОДООГИЙН төлөвлөгөөг тайлан болгож татна.
// Захиалга, төлбөр, хадгалалт шаардахгүй (stateless). Хариултаа өөрчлөх
// болгонд шинэ, тухайн агшны байдалд тохирсон тайлан гаргаж болно.
// ============================================================

import { NextResponse } from "next/server";
import { renderReportPDF } from "@/lib/report-pdf";
import { runAssessment } from "@/lib/engine";
import type { QuestionnaireInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "bad_request" },
      { status: 400 },
    );
  }

  const questionnaire = (body as { questionnaire?: unknown })?.questionnaire;
  if (!questionnaire || typeof questionnaire !== "object") {
    return NextResponse.json(
      { error: "questionnaire required.", code: "no_questionnaire" },
      { status: 400 },
    );
  }

  // Серверт дахин тооцоолно — клиентийн илгээсэн дүнд бус, эх мэдээлэлд найдна.
  let assessment;
  try {
    assessment = runAssessment(questionnaire as QuestionnaireInput);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report/pdf] runAssessment failed:", e);
    }
    return NextResponse.json(
      {
        error: "Мэдээлэл дутуу тул тайлан гаргаж чадсангүй.",
        code: "assessment_failed",
      },
      { status: 400 },
    );
  }

  let pdf: Buffer;
  try {
    pdf = await renderReportPDF({
      // order_code/tier/price байхгүй → "Хувийн төлөвлөгөөний тайлан" горим
      created_at: new Date().toISOString(),
      project_snapshot: {
        questionnaire: questionnaire as Partial<QuestionnaireInput>,
        assessment,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report/pdf] render failed:", e);
    }
    return NextResponse.json(
      { error: "Тайлан үүсгэхэд алдаа гарлаа.", code: "render_failed" },
      { status: 500 },
    );
  }

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="baishin-tolovlogoo.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
