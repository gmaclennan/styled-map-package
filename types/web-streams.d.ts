/**
 * Augment the global ReadableStream interface to include Node.js 18+ async
 * iteration methods, making it compatible with `import('node:stream/web').ReadableStream`.
 */
interface ReadableStream<R = any> {
  values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>
  [Symbol.asyncIterator](): AsyncIterableIterator<R>
}
