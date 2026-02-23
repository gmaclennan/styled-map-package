import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import {
  getContentType,
  getGlyphFilename,
  getResourceType,
  getSpriteFilename,
  getSpriteUri,
  getTileFilename,
  getTileUri,
  replaceVariables,
} from '../../lib/utils/templates.js'

describe('getResourceType', () => {
  test('returns "style" for style.json', () => {
    assert.equal(getResourceType('style.json'), 'style')
  })
  test('returns "tile" for tile paths', () => {
    assert.equal(getResourceType('s/0/1/2/3.mvt.gz'), 'tile')
  })
  test('returns "sprite" for sprite paths', () => {
    assert.equal(getResourceType('sprites/default/sprite.png'), 'sprite')
  })
  test('returns "glyph" for glyph paths', () => {
    assert.equal(getResourceType('fonts/Open%20Sans/0-255.pbf.gz'), 'glyph')
  })
  test('throws for unknown paths', () => {
    assert.throws(
      () => getResourceType('unknown/path'),
      /Unknown resource type/,
    )
  })
})

describe('getContentType', () => {
  test('returns correct type for .json', () => {
    assert.equal(
      getContentType('style.json'),
      'application/json; charset=utf-8',
    )
  })
  test('returns correct type for .pbf.gz', () => {
    assert.equal(
      getContentType('fonts/Open%20Sans/0-255.pbf.gz'),
      'application/x-protobuf',
    )
  })
  test('returns correct type for .pbf', () => {
    assert.equal(getContentType('test.pbf'), 'application/x-protobuf')
  })
  test('returns correct type for .png', () => {
    assert.equal(getContentType('sprite.png'), 'image/png')
  })
  test('returns correct type for .jpg', () => {
    assert.equal(getContentType('tile.jpg'), 'image/jpeg')
  })
  test('returns correct type for .webp', () => {
    assert.equal(getContentType('tile.webp'), 'image/webp')
  })
  test('returns correct type for .mvt.gz', () => {
    assert.equal(
      getContentType('s/0/0/0/0.mvt.gz'),
      'application/vnd.mapbox-vector-tile',
    )
  })
  test('returns correct type for .mvt', () => {
    assert.equal(
      getContentType('s/0/0/0/0.mvt'),
      'application/vnd.mapbox-vector-tile',
    )
  })
  test('throws for unknown extension', () => {
    assert.throws(() => getContentType('file.xyz'), /Unknown content type/)
  })
})

describe('getTileFilename', () => {
  test('mvt tiles get .gz extension', () => {
    assert.equal(
      getTileFilename({ sourceId: '0', z: 1, x: 2, y: 3, format: 'mvt' }),
      's/0/1/2/3.mvt.gz',
    )
  })
  test('png tiles have no .gz extension', () => {
    assert.equal(
      getTileFilename({ sourceId: '0', z: 0, x: 0, y: 0, format: 'png' }),
      's/0/0/0/0.png',
    )
  })
  test('jpg tiles have no .gz extension', () => {
    assert.equal(
      getTileFilename({ sourceId: 'a', z: 5, x: 10, y: 20, format: 'jpg' }),
      's/a/5/10/20.jpg',
    )
  })
  test('webp tiles have no .gz extension', () => {
    assert.equal(
      getTileFilename({ sourceId: '1', z: 3, x: 4, y: 5, format: 'webp' }),
      's/1/3/4/5.webp',
    )
  })
})

describe('getSpriteFilename', () => {
  test('1x pixel ratio has no suffix', () => {
    assert.equal(
      getSpriteFilename({ id: 'default', pixelRatio: 1, ext: '.png' }),
      'sprites/default/sprite.png',
    )
  })
  test('2x pixel ratio has @2x suffix', () => {
    assert.equal(
      getSpriteFilename({ id: 'default', pixelRatio: 2, ext: '.png' }),
      'sprites/default/sprite@2x.png',
    )
  })
  test('.json extension works', () => {
    assert.equal(
      getSpriteFilename({ id: 'roadsigns', pixelRatio: 1, ext: '.json' }),
      'sprites/roadsigns/sprite.json',
    )
  })
})

describe('getGlyphFilename', () => {
  test('constructs correct path', () => {
    assert.equal(
      getGlyphFilename({ fontstack: 'Open Sans', range: '0-255' }),
      'fonts/Open Sans/0-255.pbf.gz',
    )
  })
})

describe('getSpriteUri', () => {
  test('default id', () => {
    assert.equal(getSpriteUri(), 'smp://maps.v1/sprites/default/sprite')
  })
  test('custom id', () => {
    assert.equal(
      getSpriteUri('roadsigns'),
      'smp://maps.v1/sprites/roadsigns/sprite',
    )
  })
})

describe('getTileUri', () => {
  test('mvt format includes {z}/{x}/{y} placeholders', () => {
    const uri = getTileUri({ sourceId: '0', format: 'mvt' })
    assert.equal(uri, 'smp://maps.v1/s/0/{z}/{x}/{y}.mvt.gz')
  })
  test('png format', () => {
    const uri = getTileUri({ sourceId: 'a', format: 'png' })
    assert.equal(uri, 'smp://maps.v1/s/a/{z}/{x}/{y}.png')
  })
})

describe('replaceVariables', () => {
  test('replaces known variables', () => {
    assert.equal(replaceVariables('{a}/{b}', { a: 'x', b: 'y' }), 'x/y')
  })
  test('leaves unknown variables unchanged', () => {
    assert.equal(replaceVariables('{a}/{b}', { a: 'x' }), 'x/{b}')
  })
  test('handles numeric values', () => {
    assert.equal(replaceVariables('{z}/{x}/{y}', { z: 1, x: 2, y: 3 }), '1/2/3')
  })
  test('empty template returns empty string', () => {
    assert.equal(replaceVariables('', {}), '')
  })
})
