import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { test } from 'vitest'
import { ZipReader } from '@gmaclennan/zip-reader'
import { BufferSource } from '@gmaclennan/zip-reader/buffer-source'

import assert from 'node:assert'

import { download, Reader } from '../lib/index.js'
import { streamToBuffer } from './utils/stream-consumers.js'

const TEST_MAP_STYLE = 'https://demotiles.maplibre.org/style.json'
const TEST_MAP_AREA = /** @type {const} */ ([5.956, 45.818, 10.492, 47.808]) // Switzerland

test('Everything written can be read', async () => {
  const smpReadStream = download({
    styleUrl: TEST_MAP_STYLE,
    bbox: [...TEST_MAP_AREA],
    maxzoom: 5,
  })
  const smpBuf = await streamToBuffer(smpReadStream)
  const zip = await ZipReader.from(new BufferSource(smpBuf))
  const reader = new Reader(zip)
  const smpStyle = await reader.getStyle()
  assert.deepEqual(validateStyleMin(smpStyle), [], 'Style is valid')
})
