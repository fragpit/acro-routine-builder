import { detectTouchInput } from '../useHasTouchInput';

describe('detectTouchInput', () => {
  it.each([
    { maxTouchPoints: 5, hasCoarsePointer: false, expected: true },
    { maxTouchPoints: 0, hasCoarsePointer: true, expected: true },
    { maxTouchPoints: 0, hasCoarsePointer: false, expected: false },
  ])(
    'returns $expected for maxTouchPoints=$maxTouchPoints and coarsePointer=$hasCoarsePointer',
    ({ maxTouchPoints, hasCoarsePointer, expected }) => {
      expect(detectTouchInput(maxTouchPoints, hasCoarsePointer)).toBe(expected);
    },
  );
});
