import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlacedTrick, Program, Run, Side, Violation } from '../rules/types';
import { DEFAULT_RUNS } from '../data/competition-types';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { validateProgram } from '../rules/engine';

let idCounter = 0;
const nextId = () => `id_${Date.now()}_${++idCounter}`;

const HISTORY_LIMIT = 100;

function emptyRun(): Run {
  return { id: nextId(), tricks: [] };
}

interface ProgramState {
  program: Program;
  violations: Violation[];
  selectedTrickId: string | null;
  currentName: string | null;
  savedPrograms: Record<string, Program>;
  past: Program[];
  future: Program[];
  setAwtMode: (on: boolean) => void;
  setRunCount: (n: number) => void;
  setRepeatAfterRuns: (n: number) => void;
  setDefaultBonuses: (bonuses: string[]) => void;
  addTrick: (runIndex: number, manoeuvreId: string, atIndex?: number) => void;
  removeTrick: (trickId: string) => void;
  moveTrick: (trickId: string, toRunIndex: number, toIndex: number) => void;
  copyTrick: (trickId: string, toRunIndex: number, toIndex: number) => void;
  setTrickSide: (trickId: string, side: Side | null) => void;
  toggleBonus: (trickId: string, bonusId: string) => void;
  selectTrick: (trickId: string | null) => void;
  resetRun: (runIndex: number) => void;
  resetProgram: () => void;
  saveProgramAs: (name: string) => void;
  loadSavedProgram: (name: string) => void;
  deleteSavedProgram: (name: string) => void;
  newProgram: () => void;
  importProgram: (program: Program, name: string | null) => void;
  undo: () => void;
  redo: () => void;
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

function pushHistory(past: Program[], prev: Program): Program[] {
  const next = past.length >= HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT + 1) : past.slice();
  next.push(prev);
  return next;
}

type HistoryPatch = {
  program: Program;
  violations: Violation[];
  past: Program[];
  future: Program[];
};

function commit(state: { program: Program; past: Program[] }, nextProgram: Program): HistoryPatch {
  return {
    program: nextProgram,
    violations: recompute(nextProgram),
    past: pushHistory(state.past, state.program),
    future: [],
  };
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set) => ({
  program: {
    awtMode: false,
    runs: Array.from({ length: DEFAULT_RUNS }, () => emptyRun()),
    repeatAfterRuns: DEFAULT_RUNS,
    defaultBonuses: [],
  },
  violations: [],
  selectedTrickId: null,
  currentName: null,
  savedPrograms: {},
  past: [],
  future: [],

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
      if (!Array.isArray(program.defaultBonuses)) program.defaultBonuses = [];
      return {
        ...commit(state, program),
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
    set((state) => {
      const program: Program = {
        awtMode: false,
        runs: Array.from({ length: DEFAULT_RUNS }, () => emptyRun()),
        repeatAfterRuns: DEFAULT_RUNS,
        defaultBonuses: [],
      };
      return {
        ...commit(state, program),
        currentName: null,
        selectedTrickId: null,
      };
    }),

  importProgram: (program, name) =>
    set((state) => {
      const cloned: Program = JSON.parse(JSON.stringify(program));
      if (!Array.isArray(cloned.defaultBonuses)) cloned.defaultBonuses = [];
      return {
        ...commit(state, cloned),
        currentName: name,
        selectedTrickId: null,
      };
    }),

  setAwtMode: (on) =>
    set((state) => commit(state, { ...state.program, awtMode: on })),

  setRunCount: (n) =>
    set((state) => {
      const current = state.program.runs;
      let runs: Run[];
      if (n > current.length) {
        runs = [...current, ...Array.from({ length: n - current.length }, () => emptyRun())];
      } else {
        runs = current.slice(0, n);
      }
      return commit(state, { ...state.program, runs });
    }),

  setRepeatAfterRuns: (n) =>
    set((state) => commit(state, { ...state.program, repeatAfterRuns: n })),

  setDefaultBonuses: (bonuses) =>
    set((state) => commit(state, { ...state.program, defaultBonuses: bonuses })),

  addTrick: (runIndex, manoeuvreId, atIndex) =>
    set((state) => {
      const manoeuvre = MANOEUVRES_BY_ID[manoeuvreId];
      const defaults = state.program.defaultBonuses ?? [];
      const available = new Set(manoeuvre?.availableBonuses.map((b) => b.id) ?? []);
      const applied: string[] = [];
      for (const id of defaults) {
        if (!available.has(id)) continue;
        const conflicts = (manoeuvre?.mutualExclusions ?? []).some(
          (group) => group.includes(id) && group.some((g) => applied.includes(g)),
        );
        if (!conflicts) applied.push(id);
      }
      const runs = state.program.runs.map((r, i) => {
        if (i !== runIndex) return r;
        const tricks = [...r.tricks];
        const newTrick: PlacedTrick = {
          id: nextId(),
          manoeuvreId,
          side: manoeuvre?.noSide ? null : 'L',
          selectedBonuses: applied,
        };
        tricks.splice(atIndex ?? tricks.length, 0, newTrick);
        return { ...r, tricks };
      });
      return commit(state, { ...state.program, runs });
    }),

  removeTrick: (trickId) =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({
        ...r,
        tricks: r.tricks.filter((t) => t.id !== trickId),
      }));
      return {
        ...commit(state, { ...state.program, runs }),
        selectedTrickId: state.selectedTrickId === trickId ? null : state.selectedTrickId,
      };
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
      return commit(state, { ...state.program, runs });
    }),

  copyTrick: (trickId, toRunIndex, toIndex) =>
    set((state) => {
      const loc = findTrick(state.program, trickId);
      if (!loc) return state;
      const source = state.program.runs[loc.runIndex].tricks[loc.trickIndex];
      const copy: PlacedTrick = {
        id: nextId(),
        manoeuvreId: source.manoeuvreId,
        side: source.side,
        selectedBonuses: [...source.selectedBonuses],
      };
      const runs = state.program.runs.map((r, i) => {
        if (i !== toRunIndex) return r;
        const tricks = [...r.tricks];
        tricks.splice(Math.min(toIndex, tricks.length), 0, copy);
        return { ...r, tricks };
      });
      return commit(state, { ...state.program, runs });
    }),

  setTrickSide: (trickId, side) =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({
        ...r,
        tricks: r.tricks.map((t) => (t.id === trickId ? { ...t, side } : t)),
      }));
      return commit(state, { ...state.program, runs });
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
      return commit(state, { ...state.program, runs });
    }),

  selectTrick: (trickId) => set({ selectedTrickId: trickId }),

  resetRun: (runIndex) =>
    set((state) => {
      const runs = state.program.runs.map((r, i) => (i === runIndex ? { ...r, tricks: [] } : r));
      return { ...commit(state, { ...state.program, runs }), selectedTrickId: null };
    }),

  resetProgram: () =>
    set((state) => {
      const runs = state.program.runs.map((r) => ({ ...r, tricks: [] }));
      return { ...commit(state, { ...state.program, runs }), selectedTrickId: null };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        program: prev,
        violations: recompute(prev),
        past: state.past.slice(0, -1),
        future: [...state.future, state.program],
        selectedTrickId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[state.future.length - 1];
      return {
        program: next,
        violations: recompute(next),
        past: [...state.past, state.program],
        future: state.future.slice(0, -1),
        selectedTrickId: null,
      };
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
        if (!Array.isArray(state.program.defaultBonuses)) {
          state.program.defaultBonuses = [];
        }
        for (const saved of Object.values(state.savedPrograms)) {
          if (!Array.isArray(saved.defaultBonuses)) saved.defaultBonuses = [];
        }
        for (const run of state.program.runs) {
          for (const t of run.tricks) {
            const m = MANOEUVRES_BY_ID[t.manoeuvreId];
            if (m && !m.noSide && t.side === null) t.side = 'L';
          }
        }
        state.past = [];
        state.future = [];
        state.violations = recompute(state.program);
      },
    },
  ),
);
