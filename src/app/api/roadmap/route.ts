import { NextRequest, NextResponse } from "next/server";
import { generateRoadmap, generateChecklist } from "@/lib/engine";
import type { QuestionnaireInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuestionnaireInput;

    const roadmap = generateRoadmap(body);
    const checklist = generateChecklist(body);

    return NextResponse.json({ roadmap, checklist });
  } catch {
    return NextResponse.json(
      { error: "Алдаа гарлаа" },
      { status: 500 }
    );
  }
}
