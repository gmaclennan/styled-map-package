import { IttyRouter } from 'itty-router/IttyRouter'
import { StatusError } from 'itty-router/StatusError'
import { createResponse } from 'itty-router/createResponse'

import { isFileNotThereError } from './utils/errors.js'
import { GLYPH_URI, URI_BASE } from './utils/templates.js'

/** @import { Resource, Reader } from './reader.js' */
/** @import {IRequestStrict, RequestLike} from 'itty-router' */

/** @typedef {Pick<Reader, keyof Reader>} ReaderLike */
/** @typedef {typeof IttyRouter<IRequestStrict, [ReaderLike], Response>} RouterType */

/**
 * @param {Resource} resource
 * @param {ResponseInit} [options]
 * @returns {Response} reply
 */
function resourceResponse(resource, options = {}) {
  const response = new Response(resource.stream, options)
  response.headers.set('Content-Type', resource.contentType)
  response.headers.set('Content-Length', resource.contentLength.toString())
  if (resource.contentEncoding) {
    response.headers.set('Content-Encoding', resource.contentEncoding)
  }
  return response
}

const jsonRaw = createResponse('application/json; charset=utf-8')
const encoder = new TextEncoder()

/** @param {unknown} obj */
function json(obj) {
  const data = encoder.encode(JSON.stringify(obj))
  return jsonRaw(data, {
    headers: { 'Content-Length': data.length.toString() },
  })
}

/**
 * Create a server for serving styled map packages (SMP) over http. The server
 * is a `fetch` handler that must be provided a WHATWG `Request` and a SMP
 * `Reader` instance. Use `@whatwg-node/server` to use with Node.js HTTP server.
 *
 * To handle errors, catch errors from `fetch` and return appropriate HTTP responses.
 * You can use `itty-router/error` for this.
 *
 * @example
 * ```js
 * import { createServer } from 'node:http'
 * import { error } from 'itty-router/error'
 * import { createServerAdapter } from '@whatwg-node/server'
 * import { createServer as createSMPServer } from 'styled-map-package/server'
 * import { Reader } from 'styled-map-package/reader'
 *
 * const reader = new Reader('path/to/your-style.smp')
 * const smpServer = createSMPServer()
 * const httpServer = createServer(createServerAdapter((request) => {
 *   return smpServer.fetch(request, reader).catch(error)
 * }))
 * ```
 *
 * @param {object} [options]
 * @param {string} [options.base='/'] Base path for the server routes
 * @param {(tileId: { x: number, y: number, z: number }, sourceInfo: { sourceId: string, source: import('./types.js').SMPSource }) => Response | Promise<Response>} [options.fallbackTile] Called when a tile is missing from the SMP
 * @param {(fontstack: string, range: string) => Response | Promise<Response>} [options.fallbackGlyph] Called when a glyph is missing from the SMP
 * @returns {{ fetch: (request: RequestLike, reader: ReaderLike) => Promise<Response> }} server instance
 */
export function createServer({ base = '/', fallbackTile, fallbackGlyph } = {}) {
  base = base.endsWith('/') ? base : base + '/'

  /** @type {WeakMap<ReaderLike, Promise<TileMatcher[]>>} */
  const tileMatcherCache = new WeakMap()

  const router = IttyRouter({
    base,
  })
    .get('/style.json', async (request, reader) => {
      const baseUrl = new URL('.', request.url)
      const style = await reader.getStyle(baseUrl.href)
      return json(style)
    })
    .get(':path+', async (request, reader) => {
      const path = decodeURIComponent(request.params.path)
      try {
        const resource = await reader.getResource(path)
        return resourceResponse(resource)
      } catch (err) {
        if (!isFileNotThereError(err)) throw err

        if (fallbackTile) {
          if (!tileMatcherCache.has(reader)) {
            tileMatcherCache.set(reader, buildTileMatchers(reader))
          }
          const matchers = await /** @type {Promise<TileMatcher[]>} */ (
            tileMatcherCache.get(reader)
          )
          for (const { regex, sourceId, source } of matchers) {
            const match = path.match(regex)
            if (match) {
              return fallbackTile(
                {
                  x: Number(match[2]),
                  y: Number(match[3]),
                  z: Number(match[1]),
                },
                { sourceId, source },
              )
            }
          }
        }

        if (fallbackGlyph) {
          const glyphInfo = parseGlyphPath(path)
          if (glyphInfo) {
            return fallbackGlyph(glyphInfo.fontstack, glyphInfo.range)
          }
        }

        throw new StatusError(404, 'Not Found')
      }
    })
  return {
    fetch: (request, reader) => {
      return router.fetch(request, reader).catch((err) => {
        if (isFileNotThereError(err)) {
          throw new StatusError(404, 'Not Found')
        } else {
          throw err
        }
      })
    },
  }
}

/**
 * @typedef {{ regex: RegExp, sourceId: string, source: import('./types.js').SMPSource }} TileMatcher
 */

/**
 * Build precompiled regex matchers for all tile sources in a reader's style.
 * Each regex has capture groups: (1) z, (2) x, (3) y.
 *
 * @param {ReaderLike} reader
 * @returns {Promise<TileMatcher[]>}
 */
async function buildTileMatchers(reader) {
  // getStyle() without baseUrl returns raw SMP URIs (smp://maps.v1/...),
  // whose path portion after URI_BASE matches the zip entry paths used by
  // getResource(), so we can match request paths against these templates.
  const style = await reader.getStyle()
  /** @type {TileMatcher[]} */
  const matchers = []
  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (!('tiles' in source) || !source.tiles) continue
    for (const tileUrl of source.tiles) {
      if (!tileUrl.startsWith(URI_BASE)) continue
      const templatePath = tileUrl.slice(URI_BASE.length)
      const pattern = templatePath
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace('\\{z\\}', '(\\d+)')
        .replace('\\{x\\}', '(\\d+)')
        .replace('\\{y\\}', '(\\d+)')
      matchers.push({ regex: new RegExp(`^${pattern}$`), sourceId, source })
    }
  }
  return matchers
}

/** Regex derived from the GLYPH_URI template to parse fontstack and range from a glyph path. */
const GLYPH_PATH_REGEX = new RegExp(
  '^' +
    GLYPH_URI.slice(URI_BASE.length)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace('\\{fontstack\\}', '(.+)')
      .replace('\\{range\\}', '([^/]+)') +
    '$',
)

/**
 * Parse font stack and glyph range from a glyph resource path.
 * @param {string} path e.g. "fonts/Open Sans Semibold/0-255.pbf.gz"
 * @returns {{ fontstack: string, range: string } | null}
 */
function parseGlyphPath(path) {
  const match = path.match(GLYPH_PATH_REGEX)
  return match ? { fontstack: match[1], range: match[2] } : null
}
