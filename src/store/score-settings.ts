import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type ScoreDistribution,
  DEFAULT_DISTRIBUTION,
} from '../scoring/final-score';

interface ScoreSettingsState {
  distribution: ScoreDistribution;
  setDistribution: (d: ScoreDistribution) => void;
}

export const useScoreSettings = create<ScoreSettingsState>()(
  persist(
    (set) => ({
      distribution: { ...DEFAULT_DISTRIBUTION },
      setDistribution: (d) => set({ distribution: d }),
    }),
    {
      name: 'arb_score_settings',
      partialize: (s) => ({ distribution: s.distribution }),
    },
  ),
);
