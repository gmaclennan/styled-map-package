import { createHash } from 'node:crypto'

/**
 * A web TransformStream that calculates a digest of the data passing through
 * it. Implements ReadableWritablePair for use with pipeThrough().
 */
export class DigestStream {
  #hash
  #transform

  /** @param {string} algorithm */
  constructor(algorithm) {
    this.#hash = createHash(algorithm)
    this.#transform = new TransformStream({
      transform: (chunk, controller) => {
        this.#hash.update(chunk)
        controller.enqueue(chunk)
      },
    })
  }

  get readable() {
    return this.#transform.readable
  }

  get writable() {
    return this.#transform.writable
  }

  /**
   * Calculates the digest of all data passed through the stream.
   *
   * Must be called after the stream has been fully consumed.
   *
   * @param {import('node:crypto').BinaryToTextEncoding} [encoding]
   */
  digest(encoding = 'binary') {
    return this.#hash.digest(encoding)
  }
}
