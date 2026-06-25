import { shouldUseDedicatedNameRow } from '../trick-name-layout';

describe('shouldUseDedicatedNameRow', () => {
  it.each([
    {
      description: 'keeps a fully visible name inline',
      fullNameWidth: 120,
      minimumInlineWidth: 100,
      availableWidth: 130,
      expected: false,
    },
    {
      description: 'keeps an acceptably long truncated name inline',
      fullNameWidth: 180,
      minimumInlineWidth: 100,
      availableWidth: 120,
      expected: false,
    },
    {
      description: 'moves a severely truncated name to its own row',
      fullNameWidth: 180,
      minimumInlineWidth: 100,
      availableWidth: 80,
      expected: true,
    },
  ])('$description', ({ fullNameWidth, minimumInlineWidth, availableWidth, expected }) => {
    expect(
      shouldUseDedicatedNameRow(fullNameWidth, minimumInlineWidth, availableWidth),
    ).toBe(expected);
  });
});
