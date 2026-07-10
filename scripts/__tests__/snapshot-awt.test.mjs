import { describe, expect, it } from 'vitest';
import { snapshotComparisonHash } from '../snapshot-awt.mjs';

describe('snapshotComparisonHash', () => {
  it('ignores last_update recursively and object key order', () => {
    const previous = {
      pilots: [
        {
          civlid: 123,
          name: 'Pilot',
          last_update: '2026-06-12T05:57:48.601789',
        },
      ],
      state: 'closed',
    };
    const next = {
      state: 'closed',
      pilots: [
        {
          last_update: '2026-06-19T11:51:41.288732',
          name: 'Pilot',
          civlid: 123,
        },
      ],
    };

    expect(snapshotComparisonHash(previous)).toBe(snapshotComparisonHash(next));
  });

  it('detects meaningful nested changes', () => {
    const previous = { judges: [{ level: 'trainee' }] };
    const next = { judges: [{ level: 'certified' }] };

    expect(snapshotComparisonHash(previous)).not.toBe(
      snapshotComparisonHash(next),
    );
  });
});
