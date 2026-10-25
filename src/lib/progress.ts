import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressState = {
  done: Record<string, boolean>;
  saved: Record<string, boolean>;
  quiz: Record<string, boolean>;
  lastLectureId: string | null;
  lastSegmentId: string | null;
  toggleSegment: (id: string) => void;
  markMany: (ids: string[], value: boolean) => void;
  visit: (lectureId: string, segmentId?: string) => void;
  toggleSaved: (id: string) => void;
  toggleQuiz: (id: string) => void;
  reset: () => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      done: {},
      saved: {},
      quiz: {},
      lastLectureId: null,
      lastSegmentId: null,
      toggleSegment: (id) =>
        set((s) => {
          const next = { ...s.done };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { done: next };
        }),
      markMany: (ids, value) =>
        set((s) => {
          const next = { ...s.done };
          for (const id of ids) {
            if (value) next[id] = true;
            else delete next[id];
          }
          return { done: next };
        }),
      visit: (lectureId, segmentId) =>
        set({
          lastLectureId: lectureId,
          lastSegmentId: segmentId ?? null,
        }),
      toggleSaved: (id) =>
        set((s) => {
          const next = { ...s.saved };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { saved: next };
        }),
      toggleQuiz: (id) =>
        set((s) => {
          const next = { ...s.quiz };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { quiz: next };
        }),
      reset: () =>
        set({ done: {}, saved: {}, quiz: {}, lastLectureId: null, lastSegmentId: null }),
    }),
    { name: "cs336-atlas-progress" },
  ),
);

export function countDone(ids: string[], done: Record<string, boolean>) {
  return ids.filter((id) => done[id]).length;
}
