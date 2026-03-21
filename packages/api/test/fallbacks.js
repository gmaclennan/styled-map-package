import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import { emptyTileFallback, emptyGlyphFallback } from '../lib/fallbacks.js'

describe('emptyTileFallback', () => {
  test('returns empty gzipped MVT for vector source', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: {
          type: 'vector',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}.mvt.gz'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 14,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(
      response.headers.get('content-type'),
      'application/vnd.mapbox-vector-tile',
    )
    assert.equal(response.headers.get('content-encoding'), 'gzip')
    assert(
      Number(response.headers.get('content-length')) > 0,
      'has content-length',
    )
    assert.equal(
      response.headers.get('cache-control'),
      'public, max-age=604800',
    )
  })

  test('returns empty PNG for raster PNG source', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: {
          type: 'raster',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}.png'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 10,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/png')
    assert.equal(response.headers.get('content-encoding'), null)
    assert(
      Number(response.headers.get('content-length')) > 0,
      'has content-length',
    )
  })

  test('returns empty WebP for raster WebP source', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: {
          type: 'raster',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}.webp'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 10,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/webp')
    assert.equal(response.headers.get('content-encoding'), null)
  })

  test('returns empty PNG for raster JPEG source (no transparent JPEG)', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: {
          type: 'raster',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}.jpg'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 10,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/png')
  })

  test('returns 404 when tile format cannot be detected', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: /** @type {any} */ ({
          type: 'raster',
          // No tiles property — format detection fails
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 10,
        }),
      },
    )
    assert.equal(response.status, 404)
  })

  test('detects mvt format from .pbf.gz extension', () => {
    const response = emptyTileFallback(
      { x: 1, y: 2, z: 3 },
      {
        sourceId: 'test',
        source: {
          type: 'vector',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}.pbf.gz'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 14,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(
      response.headers.get('content-type'),
      'application/vnd.mapbox-vector-tile',
    )
    assert.equal(response.headers.get('content-encoding'), 'gzip')
  })

  test('falls back to mvt for vector source with no tile URL extension match', () => {
    const response = emptyTileFallback(
      { x: 0, y: 0, z: 0 },
      {
        sourceId: 'test',
        source: {
          type: 'vector',
          tiles: ['http://example.com/tiles/{z}/{x}/{y}'],
          bounds: [-180, -85, 180, 85],
          minzoom: 0,
          maxzoom: 14,
        },
      },
    )
    assert.equal(response.status, 200)
    assert.equal(
      response.headers.get('content-type'),
      'application/vnd.mapbox-vector-tile',
    )
  })
})

describe('emptyGlyphFallback', () => {
  test('returns a valid gzipped PBF response', () => {
    const response = emptyGlyphFallback('Open Sans Regular', '0-255')
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/x-protobuf')
    assert.equal(response.headers.get('content-encoding'), 'gzip')
    assert(
      Number(response.headers.get('content-length')) > 0,
      'has content-length',
    )
    assert.equal(
      response.headers.get('cache-control'),
      'public, max-age=604800',
    )
  })

  test('returns same response structure for any fontstack and range', () => {
    const response1 = emptyGlyphFallback('Font A', '0-255')
    const response2 = emptyGlyphFallback('Font B', '256-511')
    assert.equal(response1.status, response2.status)
    assert.equal(
      response1.headers.get('content-type'),
      response2.headers.get('content-type'),
    )
    assert.equal(
      response1.headers.get('content-length'),
      response2.headers.get('content-length'),
    )
  })
})
