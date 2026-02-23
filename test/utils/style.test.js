import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import {
  assertTileJSON,
  isInlinedSource,
  mapFontStacks,
  replaceFontStacks,
  validateStyle,
} from '../../lib/utils/style.js'

describe('replaceFontStacks', () => {
  test('replaces with matching font', () => {
    /** @type {any} */
    const style = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'label',
          type: 'symbol',
          source: 'test',
          layout: {
            'text-font': ['literal', ['Open Sans Bold', 'Arial']],
          },
        },
      ],
    }
    replaceFontStacks(style, ['Open Sans Bold'])
    assert.deepEqual(style.layers[0].layout['text-font'], [
      'literal',
      ['Open Sans Bold'],
    ])
  })

  test('falls back to first available font', () => {
    /** @type {any} */
    const style = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'label',
          type: 'symbol',
          source: 'test',
          layout: {
            'text-font': ['literal', ['Unknown Font']],
          },
        },
      ],
    }
    replaceFontStacks(style, ['Fallback Font'])
    assert.deepEqual(style.layers[0].layout['text-font'], [
      'literal',
      ['Fallback Font'],
    ])
  })

  test('does not modify layers without text-font', () => {
    /** @type {any} */
    const style = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'fill',
          type: 'fill',
          source: 'test',
        },
      ],
    }
    replaceFontStacks(style, ['Font'])
    assert(!('layout' in style.layers[0]))
  })
})

describe('mapFontStacks', () => {
  test('handles plain array value', () => {
    /** @type {any[]} */
    const layers = [
      {
        id: 'label',
        type: 'symbol',
        source: 'test',
        layout: {
          'text-font': ['Font A', 'Font B'],
        },
      },
    ]
    /** @type {any[]} */
    const result = mapFontStacks(layers, (stack) => [stack[0]])
    assert.deepEqual(result[0].layout['text-font'], ['Font A'])
  })

  test('handles nested expression', () => {
    /** @type {any[]} */
    const layers = [
      {
        id: 'label',
        type: 'symbol',
        source: 'test',
        layout: {
          'text-font': [
            'case',
            ['==', ['get', 'type'], 'bold'],
            ['literal', ['Bold Font']],
            ['literal', ['Regular Font']],
          ],
        },
      },
    ]
    /** @type {any[]} */
    const result = mapFontStacks(layers, () => ['Mapped'])
    // Both literal arrays should be mapped
    assert.deepEqual(result[0].layout['text-font'][2], ['literal', ['Mapped']])
    assert.deepEqual(result[0].layout['text-font'][3], ['literal', ['Mapped']])
  })
})

describe('assertTileJSON', () => {
  test('valid TileJSON passes', () => {
    assert.doesNotThrow(() =>
      assertTileJSON({ tiles: ['https://example.com/{z}/{x}/{y}.pbf'] }),
    )
  })
  test('non-object throws', () => {
    assert.throws(() => assertTileJSON(null), /Invalid TileJSON/)
    assert.throws(() => assertTileJSON('string'), /Invalid TileJSON/)
  })
  test('missing tiles throws', () => {
    assert.throws(() => assertTileJSON({}), /missing or invalid tiles/)
  })
  test('empty tiles array throws', () => {
    assert.throws(
      () => assertTileJSON({ tiles: [] }),
      /missing or invalid tiles/,
    )
  })
  test('non-string tiles throws', () => {
    assert.throws(
      () => assertTileJSON({ tiles: [123] }),
      /missing or invalid tiles/,
    )
  })
})

describe('validateStyle', () => {
  test('valid style returns true', () => {
    const style = {
      version: 8,
      sources: {},
      layers: [],
    }
    assert.equal(validateStyle(style), true)
    assert.deepEqual(validateStyle.errors, [])
  })
  test('invalid style returns false', () => {
    assert.equal(validateStyle({}), false)
    assert(validateStyle.errors.length > 0)
  })
})

describe('isInlinedSource', () => {
  test('geojson with object data is inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      }),
      true,
    )
  })
  test('geojson with URL data is not inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'geojson',
        data: 'https://example.com/data.geojson',
      }),
      false,
    )
  })
  test('vector with tiles is inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'vector',
        tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      }),
      true,
    )
  })
  test('vector without tiles is not inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'vector',
        url: 'https://example.com/tilejson.json',
      }),
      false,
    )
  })
  test('raster with tiles is inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'raster',
        tiles: ['https://example.com/{z}/{x}/{y}.png'],
        tileSize: 256,
      }),
      true,
    )
  })
  test('image source is treated as inlined', () => {
    assert.equal(
      isInlinedSource({
        type: 'image',
        url: 'https://example.com/image.png',
        coordinates: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      }),
      true,
    )
  })
})
