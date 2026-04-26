/**
 * Centralised localStorage keys used across the app. Keep string values stable
 * - they are the persisted-state contract with every user's browser.
 */
export const STORAGE_KEYS = Object.freeze({
  program: 'arb_program',
  recentTricks: 'arb.recent-tricks',
  theme: 'arb_theme',
  awtApiCache: 'arb.awt-api-cache',
});
