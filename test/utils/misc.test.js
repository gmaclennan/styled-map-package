import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import { clone, hasOwn, noop } from '../../lib/utils/misc.js'

describe('clone', () => {
  test('deep clones an object', () => {
    const obj = { a: { b: 1 }, c: [1, 2, 3] }
    const cloned = clone(obj)
    assert.deepEqual(cloned, obj)
    assert.notEqual(cloned, obj)
    assert.notEqual(cloned.a, obj.a)
  })
  test('removes undefined properties', () => {
    const obj = { a: 1, b: undefined }
    const cloned = clone(obj)
    assert.equal(cloned.a, 1)
    assert(!('b' in cloned))
  })
})

describe('noop', () => {
  test('returns undefined', () => {
    assert.equal(noop(), undefined)
  })
})

describe('hasOwn', () => {
  test('returns true for own property', () => {
    assert.equal(hasOwn({ a: 1 }, 'a'), true)
  })
  test('returns false for inherited property', () => {
    assert.equal(hasOwn({}, 'toString'), false)
  })
  test('returns false for missing property', () => {
    assert.equal(hasOwn({ a: 1 }, 'b'), false)
  })
})
