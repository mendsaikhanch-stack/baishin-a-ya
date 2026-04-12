// ============================================================
// Main Assessment Engine — Combines all sub-engines
// ============================================================

import type { QuestionnaireInput, AssessmentResult } from "@/lib/types";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { calculateReadinessScore } from "./readiness";
import { assessRisks } from "./risks";
import {
  determineTrack,
  generateNextSteps,
  suggestExperts,
  generateBudgetNotes,
} from "./recommendations";
import { generateRoadmap, generateChecklist } from "./roadmap";

export function runAssessment(input: QuestionnaireInput): AssessmentResult {
  const { score, label } = calculateReadinessScore(input);

  return {
    readinessScore: score,
    readinessLabel: label,
    topRisks: assessRisks(input),
    nextSteps: generateNextSteps(input),
    recommendedTrack: determineTrack(input),
    roadmapPhases: generateRoadmap(input),
    checklistItems: generateChecklist(input),
    expertSuggestions: suggestExperts(input),
    budgetNotes: generateBudgetNotes(input),
    disclaimer: DISCLAIMER_TEXT,
  };
}

export {
  calculateReadinessScore,
  assessRisks,
  determineTrack,
  generateNextSteps,
  suggestExperts,
  generateBudgetNotes,
  generateRoadmap,
  generateChecklist,
};
