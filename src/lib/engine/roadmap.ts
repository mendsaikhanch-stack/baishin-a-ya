// ============================================================
// Roadmap Generator
// Creates a personalized phased roadmap and checklist
// based on user's situation and recommended track
// ============================================================

import type {
  QuestionnaireInput,
  RoadmapPhase,
  ChecklistItem,
  RecommendedTrack,
} from "@/lib/types";
import { determineTrack } from "./recommendations";

export function generateRoadmap(input: QuestionnaireInput): RoadmapPhase[] {
  const track = determineTrack(input);
  const phases: RoadmapPhase[] = [];
  let phaseNum = 1;

  // Phase 1 depends on track
  if (track === "land_first") {
    phases.push({
      id: `phase_${phaseNum}`,
      phase: phaseNum++,
      title: "Газар бэлтгэл",
      description: "Газар олох, шалгуулах, бүртгүүлэх",
      estimatedDuration: "1-3 сар",
      status: "active",
      expertNeeded: true,
      expertType: "Хуульч, геодезист",
      tasks: [
        { id: "t1_1", title: "Байршил, бүс нутаг судлах", description: "Барих хүссэн бүс нутгийн газрын үнэ, дэд бүтцийг судлах", completed: false, requiresExpert: false },
        { id: "t1_2", title: "Газрын зар, санал цуглуулах", description: "Зарын сайт, танил талаар газрын саналуудыг судлах", completed: false, requiresExpert: false },
        { id: "t1_3", title: "Газрын эрхийн бичиг шалгах", description: "Газрын эрхийн бичиг, кадастрын мэдээллийг шалгуулах", completed: false, requiresExpert: true },
        { id: "t1_4", title: "Газар худалдан авах / эзэмших", description: "Гэрээ байгуулж, газрыг бүртгүүлэх", completed: false, requiresExpert: true },
      ],
    });
  } else if (track === "finance_first") {
    phases.push({
      id: `phase_${phaseNum}`,
      phase: phaseNum++,
      title: "Санхүүгийн бэлтгэл",
      description: "Төсөв тодорхойлох, санхүүгийн эх үүсвэр бэлдэх",
      estimatedDuration: "2-4 долоо хоног",
      status: "active",
      expertNeeded: true,
      expertType: "Санхүүгийн зөвлөгч",
      tasks: [
        { id: "t1_1", title: "Нийт зардлыг тооцоолох", description: "Газар, барилга, засал, инженерийн системийн зардлыг нэгтгэх", completed: false, requiresExpert: false },
        { id: "t1_2", title: "Хадгаламж, нөөцийг тодорхойлох", description: "Одоо байгаа мөнгөн нөөцөө тооцоолох", completed: false, requiresExpert: false },
        { id: "t1_3", title: "Зээлийн боломж судлах", description: "Банкны зээлийн нөхцөл, хүүг харьцуулах", completed: false, requiresExpert: true },
        { id: "t1_4", title: "Төсвийн төлөвлөгөө гаргах", description: "Шат шатаар хэдий хэдэн мөнгө хэрэгтэйг төлөвлөх", completed: false, requiresExpert: false },
      ],
    });
  }

  // Planning phase — common to all
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Төлөвлөлт ба зураг төсөл",
    description: "Архитектортой зураг төсөл хийлгэх, зөвшөөрөл авах",
    estimatedDuration: "1-3 сар",
    status: input.currentStage === "design" ? "active" : "pending",
    expertNeeded: true,
    expertType: "Архитектор, бүтээцийн инженер",
    tasks: [
      { id: `t${phaseNum}_1`, title: "Архитектор сонгох", description: "Мэргэжлийн архитектортой уулзаж, хамтран ажиллах гэрээ байгуулах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_2`, title: "Зураг төсөл хийлгэх", description: "Байшингийн зураг, давхрын план, фасад зэргийг хийлгэх", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_3`, title: "Бүтээцийн тооцоо", description: "Суурь, хана, дээврийн бүтээцийн тооцоог инженерээр хийлгэх", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_4`, title: "Барилгын зөвшөөрөл авах", description: "Холбогдох байгууллагаас барилгын зөвшөөрөл авах", completed: false, requiresExpert: true },
    ],
  });

  // Pre-construction phase
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Барилгын бэлтгэл",
    description: "Материал, ажилчин, хуваарь бэлдэх",
    estimatedDuration: "2-4 долоо хоног",
    status: "pending",
    expertNeeded: false,
    tasks: [
      { id: `t${phaseNum}_1`, title: "Материал судлах, захиалах", description: "Суурь материалуудыг үнэ харьцуулж захиалах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_2`, title: "Гүйцэтгэгч / ажилчид олох", description: input.buildMode === "hire" ? "Гүйцэтгэгч компани сонгож гэрээ байгуулах" : "Ажилчдыг олж, ажлын нөхцлийг тохирох", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_3`, title: "Барилгын хуваарь гаргах", description: "Шат бүрийн хугацааг тодорхойлсон хуваарь гаргах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_4`, title: "Газрыг бэлдэх", description: "Газрын тэгшилгээ, хашаа, түр байр бэлдэх", completed: false, requiresExpert: false },
    ],
  });

  // Construction phase 1: Foundation
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Суурь барилга",
    description: "Суурь шуудуу малтах, суурь цутгах",
    estimatedDuration: "2-4 долоо хоног",
    status: "pending",
    expertNeeded: true,
    expertType: "Бүтээцийн инженер",
    tasks: [
      { id: `t${phaseNum}_1`, title: "Суурийн шуудуу малтах", description: "Зургийн дагуу суурийн шуудуу малтах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_2`, title: "Арматур угсрах", description: "Суурийн арматурыг зургийн дагуу угсрах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_3`, title: "Суурь цутгах", description: "Бетон цутгаж, арчилгаа хийх", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_4`, title: "Ус тусгаарлалт хийх", description: "Суурийн гадна талд ус тусгаарлалт хийх", completed: false, requiresExpert: false },
    ],
  });

  // Construction phase 2: Walls & Roof
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Хана ба дээвэр",
    description: "Хана босгох, дээвэр тавих",
    estimatedDuration: "1-3 сар",
    status: "pending",
    expertNeeded: true,
    expertType: "Барилгачид",
    tasks: [
      { id: `t${phaseNum}_1`, title: "Хана босгох", description: `${input.preferredMaterial === "unsure" ? "Сонгосон материалаар" : input.preferredMaterial === "brick" ? "Тоосгоор" : input.preferredMaterial === "block" ? "Блокоор" : "Каркасаар"} хана босгох`, completed: false, requiresExpert: false },
      { id: `t${phaseNum}_2`, title: "Цонх, хаалга суурилуулах", description: "Цонх, хаалганы нүхийг бэлдэж суурилуулах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_3`, title: "Дээврийн бүтээц", description: "Дээврийн модон бүтээцийг угсрах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_4`, title: "Дээврийн материал тавих", description: "Дээврийн төмөр, дулаалга тавих", completed: false, requiresExpert: false },
    ],
  });

  // Engineering systems
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Инженерийн систем",
    description: "Цахилгаан, сантехник, халаалт",
    estimatedDuration: "3-6 долоо хоног",
    status: "pending",
    expertNeeded: true,
    expertType: "Цахилгаанчин, сантехникч",
    tasks: [
      { id: `t${phaseNum}_1`, title: "Цахилгааны утас суурилуулах", description: "Цахилгааны шугамыг зургийн дагуу татах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_2`, title: "Сантехник суурилуулах", description: "Усны ба ариутгах татуургын шугам татах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_3`, title: "Халаалтын систем", description: "Халаалтын системийг суурилуулах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_4`, title: "Агааржуулалт", description: "Агааржуулалтын системийг бэлдэх", completed: false, requiresExpert: false },
    ],
  });

  // Interior finishing
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Дотоод засал",
    description: "Шал, хана, тааз, угаалгын өрөө, гал тогоо",
    estimatedDuration: "1-3 сар",
    status: "pending",
    expertNeeded: false,
    tasks: [
      { id: `t${phaseNum}_1`, title: "Шаваас, будаг", description: "Хана, тааз шаваасдаж будах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_2`, title: "Шалны ажил", description: "Шалны материал (хавтан, модон шал гэх мэт) тавих", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_3`, title: "Угаалгын өрөө, гал тогоо", description: "Угаалгын өрөө, гал тогооны тоног төхөөрөмж суурилуулах", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_4`, title: "Хаалга, цонхны засал", description: "Дотор хаалга, цонхны хүрээг засах", completed: false, requiresExpert: false },
    ],
  });

  // Final phase
  phases.push({
    id: `phase_${phaseNum}`,
    phase: phaseNum++,
    title: "Эцсийн шат",
    description: "Гадна засал, хашаа, шалгалт, нүүлгэлт",
    estimatedDuration: "2-4 долоо хоног",
    status: "pending",
    expertNeeded: false,
    tasks: [
      { id: `t${phaseNum}_1`, title: "Гадна засал", description: "Гадна хана, фасадын засал хийх", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_2`, title: "Хашаа, гадна тохижилт", description: "Хашаа, зам, ногоон байгууламж хийх", completed: false, requiresExpert: false },
      { id: `t${phaseNum}_3`, title: "Эцсийн шалгалт", description: "Бүх системийг шалгаж, ашиглалтад хүлээн авах", completed: false, requiresExpert: true },
      { id: `t${phaseNum}_4`, title: "Нүүлгэлт", description: "Тавилга, тоног төхөөрөмж байрлуулж нүүх", completed: false, requiresExpert: false },
    ],
  });

  return phases;
}

export function generateChecklist(input: QuestionnaireInput): ChecklistItem[] {
  const roadmap = generateRoadmap(input);
  const items: ChecklistItem[] = [];
  let order = 1;

  for (const phase of roadmap) {
    for (const task of phase.tasks) {
      items.push({
        id: task.id,
        phase: phase.phase,
        category: phase.title,
        title: task.title,
        description: task.description,
        completed: false,
        order: order++,
      });
    }
  }

  return items;
}
