export const MIN_INLINE_NAME_CHARACTERS = 15;

/** Returns whether a truncated trick name needs its own wrapped row. */
export function shouldUseDedicatedNameRow(
  fullNameWidth: number,
  minimumInlineWidth: number,
  availableWidth: number,
): boolean {
  return fullNameWidth > availableWidth && minimumInlineWidth > availableWidth;
}
