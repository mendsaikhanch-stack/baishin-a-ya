"use client";

import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Shield, Loader2 } from "lucide-react";
import t from "@/i18n/mn";

// MVP: Local AI simulation. Replace with real API call when ready.
async function getAIResponse(
  message: string,
  context: string
): Promise<string> {
  // In production, this calls /api/chat
  // For MVP, return helpful canned responses
  const lowerMsg = message.toLowerCase();

  await new Promise((r) => setTimeout(r, 1000)); // simulate delay

  if (lowerMsg.includes("суурь") || lowerMsg.includes("foundation")) {
    return "Суурийн сонголт газрын нөхцөлөөс ихээхэн хамаарна. Монголын хөлдүү бүсэд суурийг хөлдөлтийн гүнээс (1.5-2.5м) доош цутгах шаардлагатай. Тэгш газарт ленточный суурь, налуу газарт шонгон суурь тохиромжтой байдаг. ⚠️ Суурийн тооцоог заавал бүтээцийн инженерээр хийлгэнэ үү.";
  }

  if (lowerMsg.includes("материал") || lowerMsg.includes("тоосго") || lowerMsg.includes("блок")) {
    return "Монголд түгээмэл материалууд:\n\n• **Тоосго** — бат бөх, дулаалга сайн, үнэ дундаж\n• **Блок** — хурдан, хямд, дулаалга шаардлагатай\n• **Каркас (мод)** — хурдан барих, хөнгөн, дулаалга чухал\n• **SIP панел** — орчин үеийн, дулаалга маш сайн, үнэ өндөр\n\nМатериалын сонголт нь төсөв, бүс нутаг, цаг улирлаас хамаарна. Мэргэжлийн архитектортой зөвлөлдөхийг зөвлөж байна.";
  }

  if (lowerMsg.includes("төсөв") || lowerMsg.includes("зардал") || lowerMsg.includes("мөнгө") || lowerMsg.includes("үнэ")) {
    return "Байшингийн зардал олон хүчин зүйлээс хамаарна:\n\n• Газрын үнэ: Байршлаас хамаарч маш өөр\n• Барилга: 1м²-д ойролцоогоор 800,000-2,000,000₮\n• Инженерийн систем: Нийт зардлын 15-25%\n• Дотоод засал: Нийт зардлын 20-30%\n\nНийт төсвийн 10-15%-ийг нөөцөд заавал үлдээгээрэй. ⚠️ Нарийн тооцоог мэргэжлийн төсөвчнөөр гаргуулаарай.";
  }

  if (lowerMsg.includes("зээл") || lowerMsg.includes("банк")) {
    return "Орон сууцны зээлийн зөвлөгөө:\n\n• Зээлийн сарын төлбөр орлогын 30%-аас хэтрэхгүй байх\n• Урьдчилгаа төлбөр ихэвчлэн 20-30%\n• Хүү жилийн 12-18% (банкнаас хамаарна)\n• Зээлийн хугацаа 10-20 жил\n\nОлон банкнаас үнийн санал авч харьцуулаарай. ⚠️ Санхүүгийн зөвлөгч авахыг зөвлөж байна.";
  }

  if (lowerMsg.includes("өвөл") || lowerMsg.includes("хавар") || lowerMsg.includes("улирал") || lowerMsg.includes("хугацаа")) {
    return "Монголын цаг уурт барилгын улирал чухал:\n\n• **Хавар (4-5 сар)**: Суурь цутгахад хамгийн тохиромжтой\n• **Зун (6-8 сар)**: Хана, дээврийн ажилд тохиромжтой\n• **Намар (9-10 сар)**: Дотоод засал хийхэд тохиромжтой\n• **Өвөл (-30°C)**: Бетоны ажил хийхэд тохиромжгүй\n\nСуурийн ажлыг хавар/зунд эхлүүлж, өвлийг дотоод заслын ажилд зарцуулахыг зөвлөж байна.";
  }

  return "Таны асуултыг хүлээн авлаа. Байшин барилгатай холбоотой дараах сэдвүүдээр тусалж чадна:\n\n• Суурийн сонголт\n• Материалын харьцуулалт\n• Төсвийн төлөвлөлт\n• Улирлын зөвлөмж\n• Зээлийн мэдээлэл\n• Барилгын ерөнхий зөвлөгөө\n\nИлүү нарийвчилсан асуулт асуугаарай! ⚠️ Энэ бол ерөнхий мэдээлэл бөгөөд мэргэжлийн зөвлөгөөг орлохгүй.";
}

export default function ChatPage() {
  const { chatMessages, addChatMessage, questionnaire } = useProjectStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addChatMessage("user", userMessage);
    setIsLoading(true);

    try {
      const context = JSON.stringify(questionnaire);
      const response = await getAIResponse(userMessage, context);
      addChatMessage("assistant", response);
    } catch {
      addChatMessage(
        "assistant",
        "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу."
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-600" />
            {t.chat.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t.chat.subtitle}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-800">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{t.chat.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">
                Байшин барилгатай холбоотой асуултаа асуугаарай
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "Суурийн сонголт",
                  "Материалын харьцуулалт",
                  "Төсвийн зөвлөгөө",
                  "Улирлын зөвлөмж",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion + " гэж юу вэ?");
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-brand-50 hover:border-brand-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                {t.chat.thinking}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chat.placeholder}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-3 rounded-xl transition-colors",
                input.trim() && !isLoading
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 text-gray-300"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
