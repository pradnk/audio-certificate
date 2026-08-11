/**
 * Builds the filename a family actually sees when the MP3 lands in their chat.
 *
 * Unicode letters are kept rather than stripped to ASCII: a student whose name
 * is written in Kannada should get a file named in Kannada, and every platform
 * this touches handles UTF-8 filenames. Only characters that are genuinely
 * unsafe in a path or URL are removed.
 */
export function certificateFileBase(eventName: string, studentName: string): string {
  const part = (value: string) =>
    value
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');

  const base = [part(eventName), part(studentName)].filter(Boolean).join('-');
  // Leave room for the extension and a Blob random suffix.
  return (base || 'certificate').slice(0, 100);
}
