import { describe, expect, it } from 'vitest';
import {
  extractPilots,
  mapBaseTrickName,
  mapBonusName,
  mapCompetitionToProgram,
  mapFlightToRun,
} from '../awt-mapping';
import type {
  AwtCompetitionWithResults,
  AwtFlight,
  AwtUniqueTrick,
} from '../awt-api';

function trick(partial: Partial<AwtUniqueTrick> & { base_trick: string }): AwtUniqueTrick {
  return {
    name: partial.name ?? partial.base_trick,
    acronym: partial.acronym,
    base_trick: partial.base_trick,
    uniqueness: partial.uniqueness ?? [],
    bonus_types: partial.bonus_types ?? [],
    bonuses: partial.bonuses ?? [],
    technical_coefficient: partial.technical_coefficient,
    bonus: partial.bonus,
  };
}

describe('mapBaseTrickName', () => {
  it('accepts common spelling variants', () => {
    expect(mapBaseTrickName('Misty to Helicopter')).toBe('misty_to_helicopter');
    expect(mapBaseTrickName('Misty To Helicopter')).toBe('misty_to_helicopter');
    expect(mapBaseTrickName('misty to helicopter')).toBe('misty_to_helicopter');
    expect(mapBaseTrickName('  Misty   to   Helicopter  ')).toBe('misty_to_helicopter');
  });

  it('handles AWT orthographic quirks that differ from ARB', () => {
    expect(mapBaseTrickName('Rythmic SAT')).toBe('rhythmic_sat');
    expect(mapBaseTrickName('Rhythmic SAT')).toBe('rhythmic_sat');
    expect(mapBaseTrickName('Anti-Rythmic SAT')).toBe('anti_rhythmic_sat');
    expect(mapBaseTrickName('Anti-Rhythmic SAT')).toBe('anti_rhythmic_sat');
    expect(mapBaseTrickName('Mac Twist to SAT')).toBe('mactwist_to_sat');
  });

  it('returns null for unknown tricks', () => {
    expect(mapBaseTrickName('Unknown Trick')).toBeNull();
    expect(mapBaseTrickName('')).toBeNull();
  });
});

describe('mapBonusName', () => {
  it('maps known AWT bonus names to ARB ids', () => {
    expect(mapBonusName('twisted')).toBe('twisted');
    expect(mapBonusName('Twisted')).toBe('twisted');
    expect(mapBonusName('twisted exit')).toBe('twisted_exit');
    expect(mapBonusName('full twisted')).toBe('full_twisted');
    expect(mapBonusName('double flip')).toBe('double_flip');
    expect(mapBonusName('to twisted SAT')).toBe('to_twisted_sat');
  });

  it('returns null for unknown bonuses', () => {
    expect(mapBonusName('wing-touch')).toBeNull();
    expect(mapBonusName('nonsense')).toBeNull();
  });
});

describe('mapFlightToRun', () => {
  it('transforms a real AWT flight with direction and bonuses', () => {
    const flight: AwtFlight = {
      tricks: [
        trick({
          name: 'twisted left Misty to Helicopter reverse',
          base_trick: 'Misty to Helicopter',
          uniqueness: ['left'],
          bonus_types: ['twist', 'reverse'],
          bonuses: [
            { name: 'twisted', bonus: 3 },
            { name: 'reverse', bonus: 3 },
          ],
        }),
        trick({
          name: 'right Helicopter to SAT Reverse',
          base_trick: 'Helicopter to SAT',
          uniqueness: ['right'],
          bonus_types: ['reverse'],
          bonuses: [{ name: 'reverse', bonus: 4 }],
        }),
      ],
    };
    const { run, unmapped } = mapFlightToRun(flight, 0);
    expect(unmapped).toEqual([]);
    expect(run.tricks).toHaveLength(2);
    expect(run.tricks[0]).toMatchObject({
      manoeuvreId: 'misty_to_helicopter',
      side: 'L',
      selectedBonuses: ['twisted', 'reverse'],
    });
    expect(run.tricks[1]).toMatchObject({
      manoeuvreId: 'helicopter_to_sat',
      side: 'R',
      selectedBonuses: ['reverse'],
    });
  });

  it('forces side=null for noSide manoeuvres even if direction supplied', () => {
    const flight: AwtFlight = {
      tricks: [
        trick({
          base_trick: 'Tail Slide',
          uniqueness: ['left'],
          bonuses: [{ name: 'twisted', bonus: 6 }],
        }),
      ],
    };
    const { run } = mapFlightToRun(flight, 0);
    expect(run.tricks[0]).toMatchObject({
      manoeuvreId: 'tail_slide',
      side: null,
      selectedBonuses: ['twisted'],
    });
  });

  it('flags unknown tricks without dropping the rest of the run', () => {
    const flight: AwtFlight = {
      tricks: [
        trick({ base_trick: 'SAT', uniqueness: ['left'], bonuses: [] }),
        trick({ base_trick: 'Martian Spiral', uniqueness: [], bonuses: [] }),
        trick({ base_trick: 'Cowboy', uniqueness: ['right'], bonuses: [] }),
      ],
    };
    const { run, unmapped } = mapFlightToRun(flight, 2);
    expect(run.tricks.map((t) => t.manoeuvreId)).toEqual(['sat', 'cowboy']);
    expect(unmapped).toHaveLength(1);
    expect(unmapped[0]).toMatchObject({
      runIndex: 2,
      trickIndex: 1,
      reason: 'unknown-manoeuvre',
    });
  });

  it('drops bonuses that are not available on the target manoeuvre', () => {
    const flight: AwtFlight = {
      tricks: [
        trick({
          base_trick: 'SAT',
          uniqueness: ['left'],
          bonuses: [
            { name: 'twisted', bonus: 2.5 },
            { name: 'flip', bonus: 5 },
          ],
        }),
      ],
    };
    const { run, unmapped } = mapFlightToRun(flight, 0);
    expect(run.tricks[0].selectedBonuses).toEqual(['twisted']);
    expect(unmapped).toHaveLength(1);
    expect(unmapped[0]).toMatchObject({ reason: 'unknown-bonus' });
    expect(unmapped[0].details).toContain('flip');
  });
});

describe('extractPilots / mapCompetitionToProgram', () => {
  const sampleFlight = (civlid: number, name: string): AwtFlight => ({
    pilot: { civlid, name },
    tricks: [
      trick({
        base_trick: 'SAT',
        uniqueness: ['left'],
        bonuses: [{ name: 'twisted', bonus: 2.5 }],
      }),
      trick({
        base_trick: 'Tumbling',
        uniqueness: ['right'],
        bonuses: [{ name: 'twisted', bonus: 3.5 }],
      }),
    ],
  });

  const competition: AwtCompetitionWithResults = {
    _id: 'test-comp',
    name: 'Test Comp',
    code: 'test-comp',
    type: 'solo',
    state: 'closed',
    start_date: '2025-01-01',
    end_date: '2025-01-02',
    seasons: ['awt-2025'],
    results: {
      runs_results: [
        {
          results: {
            overall: [sampleFlight(1, 'Alice'), sampleFlight(2, 'Bob')],
          },
        },
        {
          results: {
            overall: [sampleFlight(2, 'Bob'), sampleFlight(1, 'Alice')],
          },
        },
      ],
    },
  };

  it('extractPilots dedupes pilots across runs and counts participation', () => {
    const pilots = extractPilots(competition);
    expect(pilots).toHaveLength(2);
    expect(pilots.map((p) => p.name).sort()).toEqual(['Alice', 'Bob']);
    expect(pilots.find((p) => p.name === 'Alice')?.runCount).toBe(2);
  });

  it('mapCompetitionToProgram assembles all runs for a pilot in AWQ mode', () => {
    const mapped = mapCompetitionToProgram(competition, 1);
    expect(mapped.pilotName).toBe('Alice');
    expect(mapped.program.awtMode).toBe(false);
    expect(mapped.program.runs).toHaveLength(2);
    expect(mapped.program.runs[0].tricks.map((t) => t.manoeuvreId)).toEqual(['sat', 'tumbling']);
    expect(mapped.unmapped).toEqual([]);
  });

  it('extracts accuracy: overall score + judges-mark averages rounded to 10s', () => {
    const accComp: AwtCompetitionWithResults = {
      ...competition,
      results: {
        runs_results: [
          {
            results: {
              overall: [
                {
                  pilot: { civlid: 1, name: 'Alice' },
                  tricks: [],
                  final_marks: {
                    judges_mark: { technical: 8.4, choreography: 7.7 },
                  },
                },
              ],
            },
          },
          {
            results: {
              overall: [
                {
                  pilot: { civlid: 1, name: 'Alice' },
                  tricks: [],
                  final_marks: {
                    judges_mark: { technical: 7.8, choreography: 6.1 },
                  },
                },
              ],
            },
          },
          {
            results: {
              overall: [
                {
                  pilot: { civlid: 1, name: 'Alice' },
                  tricks: [],
                  did_not_start: true,
                  final_marks: {
                    judges_mark: { technical: 0, choreography: 0 },
                  },
                },
              ],
            },
          },
        ],
        results: {
          overall: [
            { pilot: { civlid: 1, name: 'Alice' }, score: 24.123 },
            { pilot: { civlid: 2, name: 'Bob' }, score: 18.5 },
          ],
        },
      },
    };
    const mapped = mapCompetitionToProgram(accComp, 1);
    // Averages skip did_not_start: T avg = (8.4+7.8)/2 = 8.1 -> 81 -> 80
    // C avg = (7.7+6.1)/2 = 6.9 -> 69 -> 70
    expect(mapped.accuracy.runsUsed).toBe(2);
    expect(mapped.accuracy.judgeTechAvg).toBeCloseTo(8.1, 3);
    expect(mapped.accuracy.judgeChoreoAvg).toBeCloseTo(6.9, 3);
    expect(mapped.accuracy.tq).toBe(80);
    expect(mapped.accuracy.cq).toBe(70);
    expect(mapped.accuracy.overallScore).toBe(24.123);
  });

  it('returns null accuracy when no judges marks are published', () => {
    const noMarksComp: AwtCompetitionWithResults = {
      ...competition,
      results: {
        runs_results: [
          {
            results: {
              overall: [{ pilot: { civlid: 1, name: 'Alice' }, tricks: [] }],
            },
          },
        ],
      },
    };
    const mapped = mapCompetitionToProgram(noMarksComp, 1);
    expect(mapped.accuracy.tq).toBeNull();
    expect(mapped.accuracy.cq).toBeNull();
    expect(mapped.accuracy.overallScore).toBeNull();
    expect(mapped.accuracy.runsUsed).toBe(0);
  });

  it('mapCompetitionToProgram leaves empty runs for missing pilot and did_not_start', () => {
    const dnsComp: AwtCompetitionWithResults = {
      ...competition,
      seasons: ['awq-2025'],
      results: {
        runs_results: [
          {
            results: {
              overall: [
                { pilot: { civlid: 7, name: 'Charlie' }, tricks: [], did_not_start: true },
              ],
            },
          },
          { results: { overall: [] } },
        ],
      },
    };
    const mapped = mapCompetitionToProgram(dnsComp, 7);
    expect(mapped.program.awtMode).toBe(false);
    expect(mapped.program.runs).toHaveLength(2);
    expect(mapped.program.runs[0].tricks).toEqual([]);
    expect(mapped.program.runs[1].tricks).toEqual([]);
    expect(mapped.pilotName).toBe('Charlie');
  });
});
