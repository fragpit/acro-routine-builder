import { describe, expect, it } from 'vitest';
import type { Program } from '../../rules/types';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { placedTrick, run } from '../../rules/validators/__tests__/helpers';
import { programTechnicalQuality, runTechnicalMark } from '../technical-marks';

function program(...runs: Program['runs']): Program {
  return {
    awtMode: false,
    runs,
    repeatAfterRuns: 4,
    defaultBonuses: [],
    technicalMarksByManoeuvreId: {},
    notes: '',
  };
}

describe('technical marks', () => {
  it('returns the average technical quality across placed tricks', () => {
    const p = program(run(placedTrick('sat'), placedTrick('stall')));

    expect(
      programTechnicalQuality(
        p,
        MANOEUVRES_BY_ID,
        { sat: 10 },
        { technical: 50, choreo: 100 },
      ),
    ).toBe(75);
  });

  it('rounds the average technical quality to one decimal place', () => {
    const p = program(
      run(placedTrick('sat'), placedTrick('stall'), placedTrick('wingovers')),
    );

    expect(
      programTechnicalQuality(
        p,
        MANOEUVRES_BY_ID,
        { sat: 10 },
        { technical: 60, choreo: 100 },
      ),
    ).toBe(73.3);
  });

  it('keeps unset tricks on the supplied Tq default when custom marks change the average', () => {
    const p = program(run(placedTrick('sat'), placedTrick('stall')));

    expect(
      programTechnicalQuality(
        p,
        MANOEUVRES_BY_ID,
        { sat: 9 },
        { technical: 80, choreo: 100 },
      ),
    ).toBe(85);
  });

  it('ignores hard scoring-ineligible tricks', () => {
    const p = program(
      run(
        placedTrick('rhythmic_sat'),
        placedTrick('esfera'),
        placedTrick('mac_twist_to_tumbling'),
      ),
    );

    expect(
      programTechnicalQuality(
        p,
        MANOEUVRES_BY_ID,
        {
          rhythmic_sat: 10,
          esfera: 8,
          mac_twist_to_tumbling: 0,
        },
        { technical: 50, choreo: 100 },
      ),
    ).toBe(90);
  });

  it('includes bonus-limit extras in technical marks', () => {
    const r = run(
      placedTrick('sat', { selectedBonuses: ['twisted'] }),
      placedTrick('misty_flip', { selectedBonuses: ['twisted'] }),
      placedTrick('helicopter', { selectedBonuses: ['twisted'] }),
      placedTrick('asymetric_sat', { selectedBonuses: ['twisted'] }),
      placedTrick('mac_twist', { selectedBonuses: ['twisted'] }),
      placedTrick('looping', { selectedBonuses: ['twisted'] }),
    );
    const p = program(r);
    const marks = { looping: 10 };
    const quality = { technical: 50, choreo: 100 };

    expect(
      runTechnicalMark(r, MANOEUVRES_BY_ID, marks, quality),
    ).toBeCloseTo((5 * 5 + 10) / 6, 5);
    expect(
      programTechnicalQuality(p, MANOEUVRES_BY_ID, marks, quality),
    ).toBe(58.3);
  });
});
