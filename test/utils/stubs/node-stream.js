/**
 * Browser stub for node:stream.
 * Only Readable.toWeb() is referenced in lib/writer.js, but it is never called
 * when running in a browser (no Node.js Readable streams exist there).
 */
export class Readable {
  static toWeb() {
    throw new Error('Readable.toWeb() is not available in the browser')
  }
}
