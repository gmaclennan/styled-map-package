import { describe, test } from 'vitest'

import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import {
  getFormatFromMimeType,
  getTileFormatFromBuffer,
  getTileFormatFromStream,
} from '../../lib/utils/file-formats.js'

describe('getTileFormatFromBuffer', () => {
  test('detects PNG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    assert.equal(getTileFormatFromBuffer(buf), 'png')
  })
  test('detects JPG', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
    assert.equal(getTileFormatFromBuffer(buf), 'jpg')
  })
  test('detects WebP', () => {
    const buf = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ])
    assert.equal(getTileFormatFromBuffer(buf), 'webp')
  })
  test('detects gzip as mvt', () => {
    const buf = Buffer.from([0x1f, 0x8b, 0x08, 0x00])
    assert.equal(getTileFormatFromBuffer(buf), 'mvt')
  })
  test('throws for unknown first byte', () => {
    const buf = Buffer.from([0x00, 0x00, 0x00])
    assert.throws(() => getTileFormatFromBuffer(buf), /Unknown file type/)
  })
  test('throws for wrong signature after matching first byte', () => {
    // First byte matches PNG (0x89) but rest doesn't match
    const buf = Buffer.from([0x89, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    assert.throws(() => getTileFormatFromBuffer(buf), /Unknown file type/)
  })
})

describe('getTileFormatFromStream', () => {
  test('detects format from stream', async () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const padding = Buffer.alloc(16 * 1024 - buf.length)
    const stream = Readable.from(Buffer.concat([buf, padding]))
    const [format, outputStream] = await getTileFormatFromStream(stream)
    assert.equal(format, 'png')
    assert(outputStream instanceof Readable)
  })
})

describe('getFormatFromMimeType', () => {
  test('image/png returns png', () => {
    assert.equal(getFormatFromMimeType('image/png'), 'png')
  })
  test('image/jpeg returns jpg', () => {
    assert.equal(getFormatFromMimeType('image/jpeg'), 'jpg')
  })
  test('image/webp returns webp', () => {
    assert.equal(getFormatFromMimeType('image/webp'), 'webp')
  })
  test('application/x-protobuf returns mvt', () => {
    assert.equal(getFormatFromMimeType('application/x-protobuf'), 'mvt')
  })
  test('application/vnd.mapbox-vector-tile returns mvt', () => {
    assert.equal(
      getFormatFromMimeType('application/vnd.mapbox-vector-tile'),
      'mvt',
    )
  })
  test('throws for unsupported MIME type', () => {
    assert.throws(
      () => getFormatFromMimeType('text/html'),
      /Unsupported MIME type/,
    )
  })
})
