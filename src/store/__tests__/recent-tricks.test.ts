import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_RECENT_TRICKS, loadRecentTricks, pushRecentTrick } from '../recent-tricks';
import { STORAGE_KEYS } from '../storage-keys';

describe('recent tricks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the 10 most recent unique tricks', () => {
    const ids = [
      'tail_slide',
      'sat',
      'wingovers',
      'asymetric_spiral',
      'looping',
      'asymetric_sat',
      'stall',
      'misty_flip',
      'x_chopper',
      'mac_twist',
    ];

    const recent = ids.reduce<string[]>((prev, id) => pushRecentTrick(prev, id), []);

    expect(MAX_RECENT_TRICKS).toBe(10);
    expect(recent).toHaveLength(10);
    expect(recent).toEqual([...ids].reverse());
    expect(loadRecentTricks()).toEqual(recent);
  });

  it('deduplicates before applying the cap', () => {
    const prev = [
      'sat',
      'wingovers',
      'asymetric_spiral',
      'looping',
      'asymetric_sat',
      'stall',
      'misty_flip',
      'x_chopper',
      'mac_twist',
      'helicopter',
    ];

    expect(pushRecentTrick(prev, 'wingovers')).toEqual([
      'wingovers',
      'sat',
      'asymetric_spiral',
      'looping',
      'asymetric_sat',
      'stall',
      'misty_flip',
      'x_chopper',
      'mac_twist',
      'helicopter',
    ]);
  });

  it('drops entries past the cap and ignores unknown stored ids', () => {
    const ids = [
      'tail_slide',
      'sat',
      'wingovers',
      'asymetric_spiral',
      'looping',
      'asymetric_sat',
      'stall',
      'misty_flip',
      'x_chopper',
      'mac_twist',
      'helicopter',
    ];

    const recent = ids.reduce<string[]>((prev, id) => pushRecentTrick(prev, id), []);

    expect(recent).toHaveLength(10);
    expect(recent).not.toContain('tail_slide');

    localStorage.setItem(STORAGE_KEYS.recentTricks, JSON.stringify(['sat', 'unknown_trick']));
    expect(loadRecentTricks()).toEqual(['sat']);
  });
});
