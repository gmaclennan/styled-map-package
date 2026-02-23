import { describe, test } from 'vitest'

import assert from 'node:assert/strict'

import {
  getQuadkey,
  getTileUrl,
  MAX_BOUNDS,
  tileToBBox,
  unionBBox,
} from '../../lib/utils/geo.js'

describe('tileToBBox', () => {
  test('z=0 covers the whole world', () => {
    const bbox = tileToBBox({ x: 0, y: 0, z: 0 })
    assert.equal(bbox[0], -180)
    assert.equal(bbox[2], 180)
    // Latitude should be close to spherical mercator max
    assert(bbox[1] < -85)
    assert(bbox[3] > 85)
  })

  test('z=1 quadrant covers half the world in lon', () => {
    const bbox = tileToBBox({ x: 0, y: 0, z: 1 })
    assert.equal(bbox[0], -180)
    assert.equal(bbox[2], 0)
    assert(bbox[3] > 85)
  })
})

describe('getQuadkey', () => {
  test('z=0 returns empty string', () => {
    assert.equal(getQuadkey({ x: 0, y: 0, z: 0 }), '')
  })
  test('z=1 tiles return single digit', () => {
    assert.equal(getQuadkey({ x: 0, y: 0, z: 1 }), '0')
    assert.equal(getQuadkey({ x: 1, y: 0, z: 1 }), '1')
    assert.equal(getQuadkey({ x: 0, y: 1, z: 1 }), '2')
    assert.equal(getQuadkey({ x: 1, y: 1, z: 1 }), '3')
  })
  test('z=2 tile returns two digits', () => {
    assert.equal(getQuadkey({ x: 3, y: 3, z: 2 }), '33')
  })
})

describe('getTileUrl', () => {
  test('xyz scheme replaces {z}/{x}/{y}', () => {
    const url = getTileUrl(['https://tiles/{z}/{x}/{y}.mvt'], {
      x: 1,
      y: 2,
      z: 3,
    })
    assert.equal(url, 'https://tiles/3/1/2.mvt')
  })

  test('tms scheme flips y coordinate', () => {
    const url = getTileUrl(['https://tiles/{z}/{x}/{y}.mvt'], {
      x: 0,
      y: 0,
      z: 1,
      scheme: 'tms',
    })
    // At z=1, tms y for y=0 = 2^1 - 0 - 1 = 1
    assert.equal(url, 'https://tiles/1/0/1.mvt')
  })

  test('replaces {quadkey}', () => {
    const url = getTileUrl(['https://tiles/{quadkey}'], {
      x: 1,
      y: 0,
      z: 1,
    })
    assert.equal(url, 'https://tiles/1')
  })

  test('replaces {prefix}', () => {
    const url = getTileUrl(['https://tiles/{prefix}/{z}/{x}/{y}'], {
      x: 0,
      y: 0,
      z: 0,
    })
    assert.equal(url, 'https://tiles/00/0/0/0')
  })

  test('cycles through multiple URLs', () => {
    const urls = ['https://a/{z}/{x}/{y}', 'https://b/{z}/{x}/{y}']
    const urlA = getTileUrl(urls, { x: 0, y: 0, z: 0 })
    const urlB = getTileUrl(urls, { x: 1, y: 0, z: 0 })
    assert.equal(urlA, 'https://a/0/0/0')
    assert.equal(urlB, 'https://b/0/1/0')
  })
})

describe('unionBBox', () => {
  test('union of two bboxes', () => {
    const result = unionBBox([
      [-10, -20, 10, 20],
      [-5, -30, 15, 10],
    ])
    assert.deepEqual(result, [-10, -30, 15, 20])
  })
  test('union of identical bboxes returns same bbox', () => {
    const bbox = /** @type {import('../../lib/utils/geo.js').BBox} */ ([
      -10, -20, 10, 20,
    ])
    const result = unionBBox([bbox, bbox])
    assert.deepEqual(result, [-10, -20, 10, 20])
  })
})

describe('MAX_BOUNDS', () => {
  test('is the expected spherical mercator bounds', () => {
    assert.deepEqual(MAX_BOUNDS, [-180, -85.051129, 180, 85.051129])
  })
})
