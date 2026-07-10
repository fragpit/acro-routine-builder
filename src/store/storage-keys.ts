/**
 * Centralised localStorage keys used across the app. Keep string values stable
 * - they are the persisted-state contract with every user's browser.
 */
export const STORAGE_KEYS = Object.freeze({
  newsLastSeen: 'arb.news-last-seen',
  program: 'arb_program',
  paletteCollapsed: 'arb.palette-collapsed',
  recentTricks: 'arb.recent-tricks',
  theme: 'arb_theme',
});
