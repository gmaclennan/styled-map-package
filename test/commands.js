import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Custom Vitest browser command: list files in a directory.
 * Runs on the Vitest server (Node.js) side.
 *
 * @param {import('vitest/node').BrowserCommandContext} ctx
 * @param {string} dir - path relative to project root
 * @returns {Promise<string[]>}
 */
export async function readdir(ctx, dir) {
  const root = /** @type {any} */ (ctx).project?.config?.root ?? process.cwd()
  return fs.readdir(path.resolve(root, dir))
}
