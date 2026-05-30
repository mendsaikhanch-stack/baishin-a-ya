// ============================================================
// Байшин А-Я — Report PDF generator (server-only).
// React-PDF ашиглаж захиалгын тайланг рендерлэнэ.
// Mongolian Cyrillic дэмжсэн Roboto-г Google Fonts CDN-ээс татна.
// ============================================================

import "server-only";
import React from "react";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { DISCLAIMER_TEXT, BUDGET_RANGES } from "@/lib/constants";
import { TIER_LABELS, type OrderTier } from "@/lib/orders";
import { buildProjectPreview, formatMnt } from "@/lib/estimate-preview";
import type {
  QuestionnaireInput,
  AssessmentResult,
  BudgetRange,
} from "@/lib/types";

// ── Font registration ──
// MVP стратеги: Google Fonts CDN-ээс хамаарахгүй. Хэрэв `public/fonts/`
// доор Cyrillic дэмжсэн TTF файл байвал ашиглана; үгүй бол React-PDF-ийн
// default Helvetica-руу унаж, Cyrillic үсэг бөмбөг шиг харагдах эрсдэлтэй.
//
// Production-д ажиллуулахын тулд дараах файлуудыг тавь:
//   public/fonts/NotoSans-Regular.ttf
//   public/fonts/NotoSans-Bold.ttf
// (NotoSans-г https://fonts.google.com/noto/specimen/Noto+Sans-аас татаж
// Subset (Cyrillic) орсон TTF-ийг сонгож хадгална.)
//
// Эдгээр файлууд репорт дотор хадгалагдаагүй учир аудиторын дараа admin
// тус тусын font файлыг нэмж commit хийх ёстой.
const FONT_DIR = resolve(process.cwd(), "public/fonts");
const REGULAR_PATH = resolve(FONT_DIR, "NotoSans-Regular.ttf");
const BOLD_PATH = resolve(FONT_DIR, "NotoSans-Bold.ttf");

let FONT_FAMILY: string | undefined;
try {
  if (existsSync(REGULAR_PATH) && existsSync(BOLD_PATH)) {
    Font.register({
      family: "ReportFont",
      fonts: [
        { src: REGULAR_PATH, fontWeight: 400 },
        { src: BOLD_PATH, fontWeight: 700 },
      ],
    });
    FONT_FAMILY = "ReportFont";
  } else {
    console.warn(
      `[report-pdf] Local Cyrillic font not found.\n` +
        `  Expected: ${REGULAR_PATH}\n` +
        `            ${BOLD_PATH}\n` +
        `  Falling back to Helvetica — Mongolian Cyrillic may render incorrectly.\n` +
        `  Place NotoSans TTFs (Cyrillic subset) at public/fonts/ to fix.`,
    );
  }
} catch (e) {
  console.warn("[report-pdf] Font registration failed:", e);
}

// ── Styles ──
const COLORS = {
  text: "#1f2937",
  muted: "#6b7280",
  faint: "#9ca3af",
  brand: "#2563eb",
  amber: "#92400e",
  amberBg: "#fef3c7",
  amberBorder: "#fcd34d",
  border: "#e5e7eb",
  bg: "#f9fafb",
};

const styles = StyleSheet.create({
  page: {
    // Local font байвал л хэрэглэнэ — байхгүй үед React-PDF-ийн default
    // (Helvetica)-руу унаж байгуулагдсан string биш undefined байх ёстой.
    ...(FONT_FAMILY ? { fontFamily: FONT_FAMILY } : {}),
    padding: 40,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.text,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: COLORS.muted },
  orderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 10,
  },
  metaItem: { flexDirection: "column" },
  metaLabel: { color: COLORS.faint, fontSize: 8, marginBottom: 2 },
  metaValue: { color: COLORS.text, fontWeight: 700 },

  disclaimer: {
    backgroundColor: COLORS.amberBg,
    borderLeft: `3pt solid ${COLORS.amberBorder}`,
    padding: 10,
    marginBottom: 18,
    fontSize: 9,
    color: COLORS.amber,
    lineHeight: 1.5,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 8,
    color: COLORS.text,
  },
  sectionIntro: { fontSize: 9, color: COLORS.muted, marginBottom: 6 },

  table: {
    borderTop: `0.5pt solid ${COLORS.border}`,
    borderLeft: `0.5pt solid ${COLORS.border}`,
  },
  row: {
    flexDirection: "row",
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  cellLabel: {
    width: "35%",
    padding: 6,
    backgroundColor: COLORS.bg,
    borderRight: `0.5pt solid ${COLORS.border}`,
    fontSize: 9,
    color: COLORS.muted,
  },
  cellValue: {
    width: "65%",
    padding: 6,
    borderRight: `0.5pt solid ${COLORS.border}`,
    fontSize: 10,
  },

  bullet: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletNum: {
    width: 18,
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 10,
  },
  bulletBody: { flex: 1, fontSize: 10 },
  bulletTitle: { fontWeight: 700, marginBottom: 1 },
  bulletDesc: { color: COLORS.muted, fontSize: 9, lineHeight: 1.4 },

  riskBadge: {
    fontSize: 8,
    fontWeight: 700,
    color: "#dc2626",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    padding: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
  },
  scoreNum: {
    fontSize: 32,
    fontWeight: 700,
    color: COLORS.brand,
    marginRight: 14,
  },
  scoreLabel: { flex: 1 },
  scoreLabelTitle: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  scoreLabelSub: { fontSize: 9, color: COLORS.muted },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.faint,
    borderTop: `0.5pt solid ${COLORS.border}`,
    paddingTop: 6,
  },
});

// ── Static professional questions checklist (MVP placeholder) ──
const PRO_QUESTIONS: { type: string; questions: string[] }[] = [
  {
    type: "Архитектортой ярилцахдаа",
    questions: [
      "Зураг төсөл хийх хугацаа болон үнэ хэд вэ?",
      "Барилгын зөвшөөрөл авах ажилд хэрхэн туслах вэ?",
      "Манай гэр бүлийн хэрэгцээнд тохирох планировк хийж өгөх үү?",
      "3D визуал болон intermediate review хэдэн удаа хийх вэ?",
      "Гүйцэтгэлийн шатанд supervision хийх үү?",
    ],
  },
  {
    type: "Бүтээцийн инженертэй",
    questions: [
      "Хөрсний шинжилгээ хийсэн үү? Хийгээгүй бол хэн дээр явах ёстой вэ?",
      "Манай газрын нөхцөлд тохирох суурийн төрөл аль вэ?",
      "Газар хөдлөлтийн бүсээс хамаарч ямар нэмэлт design шаардлагатай вэ?",
      "Дулааны изоляц, ус тусгаарлалт зөв хийгдсэнийг хэн шалгах вэ?",
    ],
  },
  {
    type: "Гүйцэтгэгчтэй гэрээ хийхдээ",
    questions: [
      "Төлбөрийн график ямар байх вэ? (Жнь. 10-20-30-30-10)",
      "Материалын өөрчлөлт орох тохиолдолд үнэ хэрхэн тооцох вэ?",
      "Хугацаа сунах эрсдэлд тогтоосон шийдэх арга байна уу?",
      "Дуусгасны дараа баталгаа хэдэн жил үргэлжлэх вэ?",
      "Subcontractor ашиглах уу? Хэн нар вэ?",
    ],
  },
];

// ── Public API ──
export type ReportInput = {
  /** Захиалгаас үүсгэсэн бол захиалгын код. Үнэгүй export бол хоосон. */
  order_code?: string;
  tier?: OrderTier;
  price_mnt?: number;
  created_at: string;
  project_snapshot: {
    questionnaire?: Partial<QuestionnaireInput>;
    assessment?: AssessmentResult;
  } | null;
};

export async function renderReportPDF(input: ReportInput): Promise<Buffer> {
  return renderToBuffer(<ReportDocument {...input} />);
}

// ── Document component ──
function ReportDocument(props: ReportInput) {
  const { order_code, tier, price_mnt, created_at, project_snapshot } = props;
  const q = project_snapshot?.questionnaire ?? {};
  const a = project_snapshot?.assessment;

  // Захиалгаас үүсгэсэн эсэх (үгүй бол хэрэглэгчийн үнэгүй export)
  const isOrder = !!order_code;
  const tierLabel = tier ? TIER_LABELS[tier] : undefined;
  const footerCode = order_code ?? "Хувийн төлөвлөгөө";

  const createdLabel = (() => {
    try {
      return new Date(created_at).toLocaleDateString("mn-MN");
    } catch {
      return created_at;
    }
  })();

  return (
    <Document>
      {/* ═══ Page 1 — Summary ═══ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Байшин А-Я — Төлөвлөлтийн тайлан</Text>
          <Text style={styles.subtitle}>
            {isOrder
              ? `Захиалга #${order_code} · ${tierLabel} · ₮${(price_mnt ?? 0).toLocaleString("mn-MN")}`
              : `Хувийн төлөвлөгөөний тайлан · ${createdLabel}`}
          </Text>
          <View style={styles.orderMeta}>
            {isOrder && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>ЗАХИАЛГЫН КОД</Text>
                <Text style={styles.metaValue}>{order_code}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ОГНОО</Text>
              <Text style={styles.metaValue}>{createdLabel}</Text>
            </View>
            {isOrder && tierLabel && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>БАГЦ</Text>
                <Text style={styles.metaValue}>{tierLabel}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text>{DISCLAIMER_TEXT}</Text>
        </View>

        <ProjectSummarySection q={q} />
        {a && <ReadinessSection a={a} />}
        <ProjectTypeBudgetSection q={q} a={a} />
        {a && <RisksSection a={a} />}
        {a && <NextActionsSection a={a} />}

        <PageFooter code={footerCode} pageLabel="1 / 3" />
      </Page>

      {/* ═══ Page 2 — Roadmap + Checklist ═══ */}
      <Page size="A4" style={styles.page}>
        {a && <RoadmapSection a={a} />}
        {a && <ChecklistSection a={a} />}
        <PageFooter code={footerCode} pageLabel="2 / 3" />
      </Page>

      {/* ═══ Page 3 — Pro questions + Disclaimer ═══ */}
      <Page size="A4" style={styles.page}>
        <ProQuestionsSection />
        <View style={[styles.disclaimer, { marginTop: 20 }]}>
          <Text>{DISCLAIMER_TEXT}</Text>
        </View>
        <PageFooter code={footerCode} pageLabel="3 / 3" />
      </Page>
    </Document>
  );
}

// ── Sections ──
function ProjectSummarySection({ q }: { q: Partial<QuestionnaireInput> }) {
  const rows: [string, string | undefined][] = [
    ["Байршил", q.location],
    [
      "Хот/Хөдөө",
      q.urbanOrRural === "urban"
        ? "Хот, суурин газар"
        : q.urbanOrRural === "rural"
          ? "Хөдөө, орон нутаг"
          : undefined,
    ],
    [
      "Газартай эсэх",
      q.landOwned === "yes"
        ? "Газартай"
        : q.landOwned === "no"
          ? "Газаргүй"
          : undefined,
    ],
    [
      "Газрын гадаргуу",
      q.landSlope === "flat"
        ? "Тэгш"
        : q.landSlope === "slight"
          ? "Бага налуу"
          : q.landSlope === "steep"
            ? "Их налуу"
            : q.landSlope === "unknown"
              ? "Тодорхойгүй"
              : undefined,
    ],
    ["Талбай", q.houseSize ? `${q.houseSize} м²` : undefined],
    ["Давхар", q.floors ? `${q.floors} давхар` : undefined],
    [
      "Материал",
      q.preferredMaterial === "brick"
        ? "Тоосго"
        : q.preferredMaterial === "block"
          ? "Блок"
          : q.preferredMaterial === "frame"
            ? "Каркас"
            : q.preferredMaterial === "sip"
              ? "SIP панел"
              : q.preferredMaterial === "unsure"
                ? "Шийдээгүй"
                : undefined,
    ],
    ["Гэр бүл", q.familySize ? `${q.familySize} хүн` : undefined],
    [
      "Зориулалт",
      q.residenceType === "primary"
        ? "Байнгын"
        : q.residenceType === "vacation"
          ? "Зуслан"
          : undefined,
    ],
  ];
  const filled = rows.filter(([, v]) => v);
  if (filled.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>1. Төслийн товч мэдээлэл</Text>
      <View style={styles.table}>
        {filled.map(([k, v]) => (
          <View style={styles.row} key={k}>
            <Text style={styles.cellLabel}>{k}</Text>
            <Text style={styles.cellValue}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReadinessSection({ a }: { a: AssessmentResult }) {
  const labelText: Record<string, string> = {
    not_ready: "Бэлэн биш",
    early: "Эхний шат",
    preparing: "Бэлтгэж байна",
    almost: "Бараг бэлэн",
    ready: "Бэлэн",
  };
  return (
    <View>
      <Text style={styles.sectionTitle}>2. Бэлэн байдлын үнэлгээ</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreNum}>{a.readinessScore}</Text>
        <View style={styles.scoreLabel}>
          <Text style={styles.scoreLabelTitle}>
            {labelText[a.readinessLabel] ?? a.readinessLabel}
          </Text>
          <Text style={styles.scoreLabelSub}>
            100-аас {a.readinessScore} оноо
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProjectTypeBudgetSection({
  q,
  a,
}: {
  q: Partial<QuestionnaireInput>;
  a?: AssessmentResult;
}) {
  const trackLabels: Record<string, string> = {
    land_first: "Газар бэлтгэлээс эхлэх",
    finance_first: "Санхүүгийн бэлтгэлээс эхлэх",
    material_research: "Материал судлахаас эхлэх",
    planning: "Төлөвлөлтөөс эхлэх",
    execution: "Гүйцэтгэлийн шатанд шилжих",
  };

  // /results-тэй ижил helper — нэг эх үүсвэрээс
  const preview = buildProjectPreview(q);
  const projectType = preview?.projectTypeLabel ?? "Тодорхой биш";
  const estimatedBudget = preview
    ? `${formatMnt(preview.budgetMin)} – ${formatMnt(preview.budgetMax)} (баримжаа)`
    : "Тодорхой биш";
  const userBudget =
    q.budgetRange && q.budgetRange !== "unknown"
      ? BUDGET_RANGES[q.budgetRange as BudgetRange]?.label
      : null;
  const durationLabel = preview
    ? `${preview.durationMonthsMin}–${preview.durationMonthsMax} сар`
    : null;

  return (
    <View>
      <Text style={styles.sectionTitle}>3. Төслийн төрөл, төсөв (баримжаа)</Text>
      <Text style={styles.sectionIntro}>
        Доорх тоонууд нь анхны баримжаа. Албан ёсны төсөв биш — мэргэжлийн
        төсөвчинтэй нягтлаарай.
      </Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Төслийн төрөл</Text>
          <Text style={styles.cellValue}>{projectType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Тооцоолсон төсвийн муж</Text>
          <Text style={styles.cellValue}>{estimatedBudget}</Text>
        </View>
        {userBudget && (
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Таны зорилт</Text>
            <Text style={styles.cellValue}>{userBudget}</Text>
          </View>
        )}
        {durationLabel && (
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Тооцоолсон хугацаа</Text>
            <Text style={styles.cellValue}>{durationLabel}</Text>
          </View>
        )}
        {a && (
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Санал болгож буй зам</Text>
            <Text style={styles.cellValue}>
              {trackLabels[a.recommendedTrack] ?? a.recommendedTrack}
            </Text>
          </View>
        )}
      </View>
      {a && a.budgetNotes.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {a.budgetNotes.map((note, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletNum}>•</Text>
              <Text style={styles.bulletBody}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RisksSection({ a }: { a: AssessmentResult }) {
  if (a.topRisks.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>4. Гол эрсдэлүүд</Text>
      {a.topRisks.map((risk, i) => (
        <View key={risk.id} style={styles.bullet}>
          <Text style={styles.bulletNum}>{i + 1}.</Text>
          <View style={styles.bulletBody}>
            <Text style={styles.bulletTitle}>
              {risk.title}{" "}
              <Text style={styles.riskBadge}>
                [{risk.level === "high" ? "ӨНДӨР" : risk.level === "medium" ? "ДУНД" : "БАГА"}]
              </Text>
            </Text>
            <Text style={styles.bulletDesc}>{risk.description}</Text>
            <Text style={[styles.bulletDesc, { marginTop: 2 }]}>
              Зөвлөгөө: {risk.suggestion}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function NextActionsSection({ a }: { a: AssessmentResult }) {
  if (a.nextSteps.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>5. Дараагийн алхмууд</Text>
      {a.nextSteps.map((step) => (
        <View key={step.id} style={styles.bullet}>
          <Text style={styles.bulletNum}>{step.order}.</Text>
          <View style={styles.bulletBody}>
            <Text style={styles.bulletTitle}>{step.title}</Text>
            <Text style={styles.bulletDesc}>{step.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function RoadmapSection({ a }: { a: AssessmentResult }) {
  if (a.roadmapPhases.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>
        6. {a.roadmapPhases.length}-шаттай төлөвлөгөө
      </Text>
      <Text style={styles.sectionIntro}>
        Шат бүрд багтсан даалгавруудыг checklist хэсгээс харна уу.
      </Text>
      {a.roadmapPhases.map((phase) => (
        <View key={phase.id} style={styles.bullet}>
          <Text style={styles.bulletNum}>{phase.phase}.</Text>
          <View style={styles.bulletBody}>
            <Text style={styles.bulletTitle}>{phase.title}</Text>
            <Text style={styles.bulletDesc}>
              {phase.description} ({phase.estimatedDuration} ·{" "}
              {phase.tasks.length} даалгавар
              {phase.expertNeeded && phase.expertType
                ? ` · ${phase.expertType}`
                : ""}
              )
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ChecklistSection({ a }: { a: AssessmentResult }) {
  if (a.checklistItems.length === 0) return null;
  const byCategory = a.checklistItems.reduce<
    Record<string, typeof a.checklistItems>
  >((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.sectionTitle}>
        7. Шалгах хуудас ({a.checklistItems.length} даалгавар)
      </Text>
      {Object.entries(byCategory).map(([category, items]) => (
        <View key={category} style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            {category}
          </Text>
          {items.map((it) => (
            <View key={it.id} style={styles.bullet}>
              <Text style={[styles.bulletNum, { color: COLORS.faint }]}>□</Text>
              <Text style={styles.bulletBody}>{it.title}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function ProQuestionsSection() {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        8. Мэргэжилтнээс асуух чухал асуултууд
      </Text>
      <Text style={styles.sectionIntro}>
        Эдгээр асуултуудыг урьдчилан бэлдсэн байх нь алдаагаа танихад тусална.
      </Text>
      {PRO_QUESTIONS.map((block) => (
        <View key={block.type} style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            {block.type}
          </Text>
          {block.questions.map((q, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={[styles.bulletNum, { color: COLORS.faint }]}>•</Text>
              <Text style={styles.bulletBody}>{q}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PageFooter({
  code,
  pageLabel,
}: {
  code: string;
  pageLabel: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <Text>Байшин А-Я · {code}</Text>
      <Text>{pageLabel}</Text>
    </View>
  );
}
