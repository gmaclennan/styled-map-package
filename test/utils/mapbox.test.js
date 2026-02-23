import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import {
  isMapboxURL,
  normalizeGlyphsURL,
  normalizeSourceURL,
  normalizeSpriteURL,
  normalizeStyleURL,
  normalizeTileURL,
} from '../../lib/utils/mapbox.js'

describe('isMapboxURL', () => {
  test('returns true for mapbox:// URLs', () => {
    assert.equal(isMapboxURL('mapbox://styles/user/style'), true)
  })
  test('returns false for https:// URLs', () => {
    assert.equal(isMapboxURL('https://example.com'), false)
  })
  test('returns false for empty string', () => {
    assert.equal(isMapboxURL(''), false)
  })
})

describe('normalizeStyleURL', () => {
  test('returns non-mapbox URL unchanged', () => {
    const url = 'https://example.com/style.json'
    assert.equal(normalizeStyleURL(url, 'pk.test'), url)
  })
  test('expands mapbox:// style URL', () => {
    const url = normalizeStyleURL(
      'mapbox://styles/user/style-id',
      'pk.testtoken',
    )
    assert(url.includes('api.mapbox.com'))
    assert(url.includes('/styles/v1'))
    assert(url.includes('access_token=pk.testtoken'))
  })
  test('throws without access token for mapbox URL', () => {
    assert.throws(
      () => normalizeStyleURL('mapbox://styles/user/style'),
      /access token/,
    )
  })
})

describe('normalizeGlyphsURL', () => {
  test('returns non-mapbox URL unchanged', () => {
    const url = 'https://example.com/fonts/{fontstack}/{range}.pbf'
    assert.equal(normalizeGlyphsURL(url, 'pk.test'), url)
  })
  test('expands mapbox:// glyph URL', () => {
    const url = normalizeGlyphsURL(
      'mapbox://fonts/user/{fontstack}/{range}.pbf',
      'pk.testtoken',
    )
    assert(url.includes('/fonts/v1'))
  })
})

describe('normalizeSourceURL', () => {
  test('returns non-mapbox URL unchanged', () => {
    const url = 'https://example.com/source.json'
    assert.equal(normalizeSourceURL(url, 'pk.test'), url)
  })
  test('expands mapbox:// source URL', () => {
    const url = normalizeSourceURL(
      'mapbox://mapbox.mapbox-terrain-v2',
      'pk.testtoken',
    )
    assert(url.includes('/v4/'))
    assert(url.includes('secure'))
  })
})

describe('normalizeSpriteURL', () => {
  test('non-mapbox URL appends format and extension', () => {
    const url = normalizeSpriteURL('https://example.com/sprite', '@2x', '.png')
    assert.equal(url, 'https://example.com/sprite@2x.png')
  })
  test('non-mapbox URL with empty format', () => {
    const url = normalizeSpriteURL('https://example.com/sprite', '', '.json')
    assert.equal(url, 'https://example.com/sprite.json')
  })
  test('mapbox URL is expanded', () => {
    const url = normalizeSpriteURL(
      'mapbox://sprites/user/style',
      '',
      '.png',
      'pk.testtoken',
    )
    assert(url.includes('/styles/v1'))
    assert(url.includes('/sprite'))
  })
})

describe('normalizeTileURL', () => {
  test('returns tileURL unchanged for non-mapbox source', () => {
    const tileURL = 'https://example.com/tiles/0/0/0.pbf'
    assert.equal(normalizeTileURL(tileURL, 'https://example.com'), tileURL)
  })
  test('returns tileURL unchanged when sourceURL is empty', () => {
    const tileURL = 'https://example.com/tiles/0/0/0.pbf'
    assert.equal(normalizeTileURL(tileURL, ''), tileURL)
  })
})

describe('access token validation', () => {
  test('rejects secret tokens', () => {
    assert.throws(
      () => normalizeStyleURL('mapbox://styles/user/style', 'sk.secret'),
      /public access token/,
    )
  })
})
