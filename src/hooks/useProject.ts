"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  QuestionnaireInput,
  AssessmentResult,
  ChatMessage,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

interface ProjectState {
  // Hydration guard — true after Zustand persist has rehydrated from localStorage
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Questionnaire
  questionnaire: Partial<QuestionnaireInput>;
  currentStep: number;
  setField: <K extends keyof QuestionnaireInput>(
    key: K,
    value: QuestionnaireInput[K]
  ) => void;
  setStep: (step: number) => void;
  resetQuestionnaire: () => void;

  // Assessment
  assessment: AssessmentResult | null;
  setAssessment: (result: AssessmentResult) => void;

  // Checklist progress (item id -> completed)
  checklistProgress: Record<string, boolean>;
  toggleChecklistItem: (id: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (role: "user" | "assistant", content: string) => void;
  clearChat: () => void;

  // Project
  projectId: string;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      questionnaire: {},
      currentStep: 0,
      assessment: null,
      checklistProgress: {},
      chatMessages: [],
      projectId: generateId(),

      setField: (key, value) =>
        set((state) => ({
          questionnaire: { ...state.questionnaire, [key]: value },
        })),

      setStep: (step) => set({ currentStep: step }),

      resetQuestionnaire: () =>
        set({ questionnaire: {}, currentStep: 0, assessment: null }),

      setAssessment: (result) => set({ assessment: result }),

      toggleChecklistItem: (id) =>
        set((state) => ({
          checklistProgress: {
            ...state.checklistProgress,
            [id]: !state.checklistProgress[id],
          },
        })),

      addChatMessage: (role, content) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            { id: generateId(), project_id: state.projectId, role, content, created_at: new Date().toISOString() },
          ],
        })),

      clearChat: () => set({ chatMessages: [] }),

      resetProject: () =>
        set({
          questionnaire: {},
          currentStep: 0,
          assessment: null,
          checklistProgress: {},
          chatMessages: [],
          projectId: generateId(),
        }),
    }),
    {
      name: "baishin-project",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
