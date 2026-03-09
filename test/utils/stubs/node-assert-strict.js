/**
 * Browser stub for node:assert/strict.
 * Implements the subset used in write-read.js.
 */

function assert(value, message) {
  if (!value) throw new Error(message || 'Assertion failed')
}

assert.equal = function equal(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new Error(message || `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
  }
}

assert.deepEqual = function deepEqual(actual, expected, message) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) {
    throw new Error(message || `Expected ${a} to deep equal ${b}`)
  }
}

assert.deepStrictEqual = assert.deepEqual

assert.rejects = async function rejects(fn, opts) {
  let error
  try {
    await fn()
  } catch (e) {
    error = e
  }
  if (!error) throw new Error('Expected function to reject')
  if (opts && opts.message instanceof RegExp && !opts.message.test(error.message)) {
    throw new Error(`Expected error message to match ${opts.message}, got: ${error.message}`)
  }
  return error
}

export default assert
