import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import { ENOENT, isFileNotThereError } from '../../lib/utils/errors.js'

describe('ENOENT', () => {
  test('has code ENOENT', () => {
    const err = new ENOENT('/some/path')
    assert.equal(err.code, 'ENOENT')
  })
  test('message contains the path', () => {
    const err = new ENOENT('/some/path')
    assert(err.message.includes('/some/path'))
  })
  test('is an instance of Error', () => {
    const err = new ENOENT('/some/path')
    assert(err instanceof Error)
  })
  test('has path property', () => {
    const err = new ENOENT('/some/path')
    assert.equal(err.path, '/some/path')
  })
})

describe('isFileNotThereError', () => {
  test('returns true for ENOENT code', () => {
    const err = Object.assign(new Error('test'), { code: 'ENOENT' })
    assert.equal(isFileNotThereError(err), true)
  })
  test('returns true for EPERM code', () => {
    const err = Object.assign(new Error('test'), { code: 'EPERM' })
    assert.equal(isFileNotThereError(err), true)
  })
  test('returns false for other error codes', () => {
    const err = Object.assign(new Error('test'), { code: 'EACCES' })
    assert.equal(isFileNotThereError(err), false)
  })
  test('returns false for non-Error objects', () => {
    assert.equal(isFileNotThereError('string'), false)
    assert.equal(isFileNotThereError(null), false)
  })
})
