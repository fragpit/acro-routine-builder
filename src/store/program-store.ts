import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlacedTrick, Program, Run, Side, Violation } from '../rules/types';
import { DEFAULT_RUNS } from '../data/competition-types';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { validateProgram } from '../rules/engine';

let idCounter = 0;
const nextId = () => `id_${Date.now()}_${++idCounter}`;

function emptyRun(): Run {
  return { id: nextId(), tricks: [] };
}

interface ProgramState {
  program: Program;
  violations: Violation[];
  selectedTrickId: string | null;
  currentName: string | null;
  savedPrograms: Record<string, Program>;
  setAwtMode: (on: boolean) => void;
  setRunCount: (n: number) => void;
  setRepeatAfterRuns: (n: number) => void;
  addTrick: (runIndex: number, manoeuvreId: string, atIndex?: number) => void;
  removeTrick: (trickId: string) => void;
  moveTrick: (trickId: string, toRunIndex: number, toIndex: number) => void;
  setTrickSide: (trickId: string, side: Side | null) => void;
  toggleBonus: (trickId: string, bonusId: string) => void;
  selectTrick: (trickId: string | null) => void;
  resetRun: (runIndex: number) => void;
  resetProgram: () => void;
  saveProgramAs: (name: string) => void;
  loadSavedProgram: (name: string) => void;
  deleteSavedProgram: (name: string) => void;
  newProgram: () => void;
}

function recompute(program: Program): Violation[] {
  return validateProgram(program);
}

function findTrick(program: Program, trickId: string): { runIndex: number; trickIndex: number } | null {
  for (let r = 0; r < program.runs.length; r++) {
    const i = program.runs[r].tricks.findIndex((t) => t.id === trickId);
    if (i >= 0) return { runIndex: r, trickIndex: i };
  }
  return null;
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set) => ({
  program: {
    awtMode: false,
    runs: Array.from({ length: DEFAULT_RUNS }, () => emptyRun()),
    repeatAfterRuns: 0,
  },
  violations: [],
  selectedTrickId: null,
  currentName: null,
  savedPrograms: {},

  saveProgramAs: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return state;
      const snapshot: Program = JSON.parse(JSON.stringify(state.program));
      return {
        savedPrograms: { ...state.savedPrograms, [trimmed]: snapshot },
        currentName: trimmed,
      };
    }),

  loadSavedProgram: (name) =>
    set((state) => {
      const saved = state.savedPrograms[name];
      if (!saved) return state;
      const program: Program = JSON.parse(JSON.stringify(saved));
      return {
        program,
        violations: recompute(program),
        currentName: name,
        selectedTrickId: null,
      };
    }),

  deleteSavedProgram: (name) =>
    set((state) => {
      if (!(name in state.savedPrograms)) return state;
      const next = { ...state.savedPrograms };
      delete next[name];
      return {
        savedPrograms: next,
        currentName: state.currentName === name ? null : state.currentName,
      };
    }),

  newProgram: () =>
    set(() => {
      const program: Program = {
        awtMode: false,
        runs: Array.from({ length: DEFAULT_RUNS }, () => emptyRun()),
        repeatAfterRuns: 0,
      };
      return {
        program,
        violations: recompute(program),
        currentName: null,
        selectedTrickId: null,
      };
    }),

  setAwtMode: (on) =>
    set((state) => {
      const program = { ...state.program, awtMode: on };
      return { program, violations: recompute(program) };
    }),

  setRunCount: (n) =>
    set((state) => {
      const current = state.program.runs;
      let runs: Run[];
      if (n > current.length) {
        runs = [...current, ...Array.from({ length: n - current.length }, () => emptyRun())];
      } else {
        runs = current.slice(0, n);
      }
      const program = { ...state.program, runs };
      return { program, violations: recompute(program) };
    }),

  setRepeatAfterRuns: (n) =>
    set((state) => {
      const program = { ...state.program, repeatAfterRuns: n };
      return { program, violations: recompute(program) };
    }),

  addTrick: (runIndex, manoeuvreId, atIndex) =>
    set((state) => {
      const runs = state.program.runs.map((r, i) => {
        if (i !== runIndex) return r;
        const tricks = [...r.tricks];
        const newTrick: PlacedTrick = {
          id: nextId(),
          manoeuvreId,
          side: MANOEUVRES_BY_ID[manoeuvreId]?.noSide ? null : 'L',
          selectedBonuses: [],
        };
        tricks.splice(atIndex ?? tricks.length, 0, newTrick);
        return { ...r, tricks };
      });
      const program = { ...state.program, runs };
      return { program, violations: recompute(program) };
    }),

  removeTrick: (trickId) =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({
        ...r,
        tricks: r.tricks.filter((t) => t.id !== trickId),
      }));
      const program = { ...state.program, runs };
      return { program, violations: recompute(program), selectedTrickId: state.selectedTrickId === trickId ? null : state.selectedTrickId };
    }),

  moveTrick: (trickId, toRunIndex, toIndex) =>
    set((state) => {
      const loc = findTrick(state.program, trickId);
      if (!loc) return state;
      const trick = state.program.runs[loc.runIndex].tricks[loc.trickIndex];
      const runs = state.program.runs.map((r, i) => {
        if (i === loc.runIndex) {
          return { ...r, tricks: r.tricks.filter((t) => t.id !== trickId) };
        }
        return r;
      });
      const target = runs[toRunIndex];
      const targetTricks = [...target.tricks];
      let insertAt = toIndex;
      if (loc.runIndex === toRunIndex && loc.trickIndex < toIndex) insertAt = toIndex - 1;
      targetTricks.splice(Math.min(insertAt, targetTricks.length), 0, trick);
      runs[toRunIndex] = { ...target, tricks: targetTricks };
      const program = { ...state.program, runs };
      return { program, violations: recompute(program) };
    }),

  setTrickSide: (trickId, side) =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({
        ...r,
        tricks: r.tricks.map((t) => (t.id === trickId ? { ...t, side } : t)),
      }));
      const program = { ...state.program, runs };
      return { program, violations: recompute(program) };
    }),

  toggleBonus: (trickId, bonusId) =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({
        ...r,
        tricks: r.tricks.map((t) => {
          if (t.id !== trickId) return t;
          const has = t.selectedBonuses.includes(bonusId);
          return {
            ...t,
            selectedBonuses: has
              ? t.selectedBonuses.filter((b) => b !== bonusId)
              : [...t.selectedBonuses, bonusId],
          };
        }),
      }));
      const program = { ...state.program, runs };
      return { program, violations: recompute(program) };
    }),

  selectTrick: (trickId) => set({ selectedTrickId: trickId }),

  resetRun: (runIndex) =>
    set((state) => {
      const runs = state.program.runs.map((r, i) => (i === runIndex ? { ...r, tricks: [] } : r));
      const program = { ...state.program, runs };
      return { program, violations: recompute(program), selectedTrickId: null };
    }),

  resetProgram: () =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({ ...r, tricks: [] }));
      const program = { ...state.program, runs };
      return { program, violations: recompute(program), selectedTrickId: null };
    }),
    }),
    {
      name: 'apc_program',
      partialize: (state) => ({
        program: state.program,
        savedPrograms: state.savedPrograms,
        currentName: state.currentName,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const run of state.program.runs) {
          for (const t of run.tricks) {
            const m = MANOEUVRES_BY_ID[t.manoeuvreId];
            if (m && !m.noSide && t.side === null) t.side = 'L';
          }
        }
        state.violations = recompute(state.program);
      },
    },
  ),
);
