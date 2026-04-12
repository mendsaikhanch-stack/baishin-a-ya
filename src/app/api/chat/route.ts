import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Та Монголд хувийн байшин барихыг хүссэн хүмүүст туслах зөвлөгч юм.

ЧУХАЛ ДҮРМҮҮД:
- Зөвхөн ерөнхий мэдээлэл, зөвлөгөө өгнө
- Мэргэжлийн архитектор, инженерийг орлохгүй гэдгийг заавал дурдана
- Бүтээцийн тооцоо, инженерийн нарийвчилсан зөвлөгөө ӨГӨХГҮЙ
- Аюулгүй байдалтай холбоотой асуудалд мэргэжилтэнд хандахыг зөвлөнө
- Монгол хэлээр хариулна
- Энгийн, ойлгомжтой хэлээр бичнэ
- Хэрэгтэй үед мэргэжилтэнтэй зөвлөлдөхийг зөвлөнө`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Асуулт бичнэ үү" },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback: return a helpful static response for MVP
      return NextResponse.json({
        response: getMVPResponse(message),
      });
    }

    // Real AI integration
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `Хэрэглэгчийн мэдээлэл: ${context || "байхгүй"}`,
          },
          { role: "user", content: message },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        response: getMVPResponse(message),
      });
    }

    const data = await response.json();
    return NextResponse.json({
      response: data.choices[0].message.content,
    });
  } catch {
    return NextResponse.json(
      { error: "Алдаа гарлаа" },
      { status: 500 }
    );
  }
}

function getMVPResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("суурь")) {
    return "Суурийн сонголт газрын нөхцөлөөс хамаарна. Монголд хөлдөлтийн гүнийг (1.5-2.5м) заавал харгалзана. ⚠️ Суурийн тооцоог заавал бүтээцийн инженерээр хийлгэнэ үү.";
  }
  if (lower.includes("материал") || lower.includes("тоосго") || lower.includes("блок")) {
    return "Тоосго — бат бөх, дулаалга сайн. Блок — хурдан, хямд. Каркас — хөнгөн, хурдан. Сонголт нь төсөв, бүс нутгаас хамаарна. ⚠️ Архитектортой зөвлөлдөөрэй.";
  }
  if (lower.includes("төсөв") || lower.includes("зардал") || lower.includes("үнэ")) {
    return "1м²-д ойролцоогоор 800,000-2,000,000₮. Нийт төсвийн 10-15%-ийг нөөцөд үлдээгээрэй. ⚠️ Нарийн тооцоог мэргэжлийн төсөвчнөөр гаргуулаарай.";
  }
  if (lower.includes("зээл") || lower.includes("банк")) {
    return "Зээлийн сарын төлбөр орлогын 30%-аас хэтрэхгүй байх. Олон банкнаас үнийн санал авч харьцуулаарай. ⚠️ Санхүүгийн зөвлөгч авахыг зөвлөж байна.";
  }

  return "Байшин барилгатай холбоотой асуултандаа хариулт авахыг хүсвэл илүү нарийвчилсан асуулт асуугаарай. Жишээ: суурийн сонголт, материалын харьцуулалт, төсвийн зөвлөгөө гэх мэт. ⚠️ Энэ бол ерөнхий мэдээлэл бөгөөд мэргэжлийн зөвлөгөөг орлохгүй.";
}
