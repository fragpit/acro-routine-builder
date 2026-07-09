import { describe, it, expect } from 'vitest';
import { MANOEUVRES, MANOEUVRES_BY_ID } from '../manoeuvres';

describe('MANOEUVRES integrity', () => {
  it('every mutualExclusions bonus id exists in availableBonuses of the same trick', () => {
    const offenders: string[] = [];
    for (const m of MANOEUVRES) {
      const bonusIds = new Set(m.availableBonuses.map((b) => b.id));
      for (const tuple of m.mutualExclusions) {
        for (const id of tuple) {
          if (!bonusIds.has(id)) {
            offenders.push(`${m.id}: '${id}' not in availableBonuses`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every flipped bonus excludes every other bonus on the same trick', () => {
    const offenders: string[] = [];
    for (const m of MANOEUVRES) {
      const flippedBonusIds = m.availableBonuses
        .filter((b) => b.countsAs === 'flipped')
        .map((b) => b.id);

      for (const flippedId of flippedBonusIds) {
        for (const bonus of m.availableBonuses) {
          if (bonus.id === flippedId) continue;
          const excluded = m.mutualExclusions.some(
            (group) => group.includes(flippedId) && group.includes(bonus.id),
          );
          if (!excluded) {
            offenders.push(`${m.id}: '${flippedId}' does not exclude '${bonus.id}'`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every forbiddenConnectionTo target is a known manoeuvre id', () => {
    const offenders: string[] = [];
    for (const m of MANOEUVRES) {
      for (const target of m.forbiddenConnectionTo) {
        if (!MANOEUVRES_BY_ID[target]) {
          offenders.push(`${m.id}: forbidden target '${target}' is unknown`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
