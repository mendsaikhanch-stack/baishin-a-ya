// ============================================================
// Readiness Scoring Engine
// Calculates how ready a user is to start building
// Score: 0-100, broken into weighted categories
// ============================================================

import type {
  QuestionnaireInput,
  ReadinessLabel,
} from "@/lib/types";
import { BUDGET_RANGES, COST_PER_SQM } from "@/lib/constants";

interface ScoreBreakdown {
  land: number;        // max 20
  budget: number;      // max 20
  timeline: number;    // max 15
  planning: number;    // max 15
  material: number;    // max 10
  management: number;  // max 10
  clarity: number;     // max 10
}

export function calculateReadinessScore(input: QuestionnaireInput): {
  score: number;
  label: ReadinessLabel;
  breakdown: ScoreBreakdown;
} {
  const breakdown: ScoreBreakdown = {
    land: scoreLand(input),
    budget: scoreBudget(input),
    timeline: scoreTimeline(input),
    planning: scorePlanning(input),
    material: scoreMaterial(input),
    management: scoreManagement(input),
    clarity: scoreClarity(input),
  };

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const label = getReadinessLabel(score);

  return { score, label, breakdown };
}

function scoreLand(input: QuestionnaireInput): number {
  // Max 20 points
  if (input.landOwned === "no") return 0;
  let score = 12; // has land
  if (input.location) score += 4;
  if (input.landSlope !== "unknown") score += 4;
  return score;
}

function scoreBudget(input: QuestionnaireInput): number {
  // Max 20 points
  if (input.budgetRange === "unknown") return 2;

  const budgetInfo = BUDGET_RANGES[input.budgetRange];
  const estimatedCost = input.houseSize * COST_PER_SQM.standard;

  let score = 10; // has a defined budget

  // Check if budget is realistic for the house size
  if (budgetInfo.max >= estimatedCost) {
    score += 8; // budget seems sufficient
  } else if (budgetInfo.max >= estimatedCost * 0.7) {
    score += 4; // budget is tight but possible
  }

  // Loan clarity
  if (input.loanStatus !== "maybe") score += 2;

  return Math.min(score, 20);
}

function scoreTimeline(input: QuestionnaireInput): number {
  // Max 15 points
  if (input.plannedStartTime === "unknown") return 3;

  let score = 8;

  // Bonus for realistic timing
  const goodTiming = ["this_spring", "this_summer", "next_year"];
  if (goodTiming.includes(input.plannedStartTime)) {
    score += 5;
  } else {
    score += 2; // winter/autumn starts are harder
  }

  // Having more lead time is better
  if (input.plannedStartTime === "next_year") score += 2;

  return Math.min(score, 15);
}

function scorePlanning(input: QuestionnaireInput): number {
  // Max 15 points based on current stage
  const stageScores: Record<string, number> = {
    thinking: 3,
    planning: 6,
    land_selection: 8,
    design: 10,
    budgeting: 12,
    ready: 15,
  };
  return stageScores[input.currentStage] || 3;
}

function scoreMaterial(input: QuestionnaireInput): number {
  // Max 10 points
  if (input.preferredMaterial === "unsure") return 2;
  return 8; // has a preference, which is a start
}

function scoreManagement(input: QuestionnaireInput): number {
  // Max 10 points
  // Hiring a team is generally safer for first-timers
  if (input.buildMode === "hire") return 10;
  if (input.buildMode === "mixed") return 7;
  return 4; // self-managing is riskier for non-experts
}

function scoreClarity(input: QuestionnaireInput): number {
  // Max 10 points — how well-defined are the inputs?
  let score = 0;
  if (input.houseSize > 0) score += 3;
  if (input.familySize > 0) score += 2;
  if (input.residenceType) score += 2;
  if (input.urbanOrRural) score += 3;
  return Math.min(score, 10);
}

function getReadinessLabel(score: number): ReadinessLabel {
  if (score >= 80) return "ready";
  if (score >= 65) return "almost";
  if (score >= 45) return "preparing";
  if (score >= 25) return "early";
  return "not_ready";
}
