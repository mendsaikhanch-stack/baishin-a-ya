import { NextRequest, NextResponse } from "next/server";
import { runAssessment } from "@/lib/engine";
import type { QuestionnaireInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuestionnaireInput;

    // Basic validation
    if (!body.landOwned || !body.houseSize || !body.currentStage) {
      return NextResponse.json(
        { error: "Шаардлагатай талбаруудыг бөглөнө үү" },
        { status: 400 }
      );
    }

    const result = runAssessment(body);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 }
    );
  }
}
