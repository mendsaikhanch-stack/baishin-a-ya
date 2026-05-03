// ============================================================
// Байшин А-Я — Core Type Definitions
// ============================================================

// --- Questionnaire Input Types ---

export type YesNoMaybe = "yes" | "no" | "maybe";
export type YesNo = "yes" | "no";
export type UrbanRural = "urban" | "rural";
export type LandSlope = "flat" | "slight" | "steep" | "unknown";
export type FloorCount = 1 | 2;
export type BuildMode = "self" | "hire" | "mixed";
export type ResidenceType = "primary" | "vacation";
export type PreferredMaterial = "brick" | "block" | "frame" | "sip" | "unsure";
export type PlannedStartTime =
  | "this_spring"
  | "this_summer"
  | "this_autumn"
  | "this_winter"
  | "next_year"
  | "unknown";
export type CurrentStage =
  | "thinking"
  | "planning"
  | "land_selection"
  | "design"
  | "budgeting"
  | "ready";
export type BudgetRange =
  | "under_50m"
  | "50m_80m"
  | "80m_120m"
  | "120m_180m"
  | "180m_250m"
  | "over_250m"
  | "unknown";

export interface QuestionnaireInput {
  landOwned: YesNo;
  location: string;
  urbanOrRural: UrbanRural;
  landSlope: LandSlope;
  houseSize: number; // m²
  floors: FloorCount;
  budgetRange: BudgetRange;
  loanStatus: YesNoMaybe;
  plannedStartTime: PlannedStartTime;
  preferredMaterial: PreferredMaterial;
  buildMode: BuildMode;
  familySize: number;
  residenceType: ResidenceType;
  currentStage: CurrentStage;
  /**
   * Хэрэглэгчийн ажлын одоогийн төлөв байдлыг чөлөөт текстээр.
   * Жишээ: "Суурь цутгасан, хана 60% өрсөн, дээвэргүй".
   * Заавал биш — Chat AI энэ контекстийг ашиглан илүү тохиромжтой
   * зөвлөгөө өгөхөд хэрэглэнэ.
   */
  currentStageDescription?: string;
}

// --- Assessment Output Types ---

export type ReadinessLabel = "not_ready" | "early" | "preparing" | "almost" | "ready";
export type RiskLevel = "low" | "medium" | "high";
export type RecommendedTrack =
  | "land_first"
  | "finance_first"
  | "material_research"
  | "planning"
  | "execution";

export interface Risk {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  suggestion: string;
}

export interface NextStep {
  id: string;
  order: number;
  title: string;
  description: string;
  actionable: boolean;
}

export interface RoadmapPhase {
  id: string;
  phase: number;
  title: string;
  description: string;
  tasks: RoadmapTask[];
  estimatedDuration: string;
  status: "pending" | "active" | "completed";
  expertNeeded: boolean;
  expertType?: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiresExpert: boolean;
}

export interface ChecklistItem {
  id: string;
  phase: number;
  category: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface ExpertSuggestion {
  id: string;
  type: string;
  title: string;
  reason: string;
  timing: string;
  priority: "required" | "recommended" | "optional";
}

export interface AssessmentResult {
  readinessScore: number;
  readinessLabel: ReadinessLabel;
  topRisks: Risk[];
  nextSteps: NextStep[];
  recommendedTrack: RecommendedTrack;
  roadmapPhases: RoadmapPhase[];
  checklistItems: ChecklistItem[];
  expertSuggestions: ExpertSuggestion[];
  budgetNotes: string[];
  disclaimer: string;
}

// --- Database Model Types ---

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  plan: "free" | "paid" | "premium";
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  questionnaire: QuestionnaireInput;
  assessment?: AssessmentResult;
  status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ContentArticle {
  id: string;
  category: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  language: "mn" | "en";
  published: boolean;
  order: number;
}

export interface ExpertCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  when_needed: string;
}

export interface Referral {
  id: string;
  category_id: string;
  name: string;
  description: string;
  contact: string;
  location: string;
  verified: boolean;
}
