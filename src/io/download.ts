/**
 * Sanitize a filename base so it is safe to use as a Blob download name, then
 * append the given extension. Falls back to "program" if the cleaned base is
 * empty.
 */
export function safeFileName(base: string, ext: string): string {
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return `${cleaned || 'program'}.${ext}`;
}

/**
 * Trigger a browser download of `content` as a Blob under `filename` with the
 * given MIME type. Uses a synthetic anchor element and revokes the object URL
 * after click.
 */
export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
