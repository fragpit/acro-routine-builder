import { describe, expect, it } from 'vitest';
import { decodeShareLink, encodeShareLink } from '../program-share';
import type { Program } from '../../rules/types';

const SAMPLE_PROGRAM: Program = {
  awtMode: false,
  runs: [
    {
      id: 'r1',
      tricks: [
        { id: 't1', manoeuvreId: 'sat', side: 'R', selectedBonuses: ['twisted'] },
        { id: 't2', manoeuvreId: 'twister', side: 'L', selectedBonuses: [] },
      ],
    },
    { id: 'r2', tricks: [] },
  ],
  repeatAfterRuns: 2,
  defaultBonuses: [],
};

describe('encodeShareLink / decodeShareLink', () => {
  it('round-trips a program through the encoded URL', () => {
    const url = encodeShareLink(SAMPLE_PROGRAM, 'fixture');
    const idx = url.indexOf('#');
    expect(idx).toBeGreaterThan(0);
    const { program, name } = decodeShareLink(url.slice(idx));
    expect(program).toEqual(SAMPLE_PROGRAM);
    expect(name).toBe('fixture');
  });

  it('builds a URL with /builder#p=v1. shape', () => {
    const url = encodeShareLink(SAMPLE_PROGRAM, null);
    expect(url).toMatch(/\/builder#p=v1\.[A-Za-z0-9_+\-$]/);
  });

  it('decodes the raw payload form (no # or p= prefix)', () => {
    const url = encodeShareLink(SAMPLE_PROGRAM, null);
    const payload = url.slice(url.indexOf('#p=') + '#p='.length);
    expect(decodeShareLink(payload).program).toEqual(SAMPLE_PROGRAM);
  });

  it('decodes the hash without the # character', () => {
    const url = encodeShareLink(SAMPLE_PROGRAM, null);
    const inner = url.slice(url.indexOf('#') + 1);
    expect(decodeShareLink(inner).program).toEqual(SAMPLE_PROGRAM);
  });

  it('rejects an empty hash', () => {
    expect(() => decodeShareLink('')).toThrow(/empty/i);
    expect(() => decodeShareLink('#')).toThrow(/empty/i);
    expect(() => decodeShareLink('#p=')).toThrow(/empty/i);
  });

  it('rejects an unknown version tag', () => {
    expect(() => decodeShareLink('#p=v999.abc')).toThrow(/version/i);
  });

  it('rejects a malformed payload with no version separator', () => {
    expect(() => decodeShareLink('#p=abc')).toThrow(/malformed/i);
  });

  it('rejects garbled compressed bytes', () => {
    expect(() => decodeShareLink('#p=v1.!!!notvalid!!!')).toThrow();
  });
});
