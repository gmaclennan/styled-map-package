# Plan: Add Support for Currently Unsupported Source Types

## Current State

The SMP package currently supports **3 source types**: `vector`, `raster`, and `geojson`.

The MapLibre style spec defines these additional source types that SMP does **not** support:
1. **`raster-dem`** — Raster Digital Elevation Model tiles (used for terrain/hillshade layers)
2. **`image`** — Single static image positioned on the map
3. **`video`** — Video overlay positioned on the map

The spec (Section 5.1) explicitly states: *"Support for `raster-dem` sources (terrain/hillshade) is planned for a future version."*

---

## Source Type Analysis

### 1. `raster-dem` — High priority, most impactful

**What it is:** Tile-based source (like `raster` and `vector`) that provides elevation data for terrain rendering and hillshade layers.

**Current partial support already exists:**
- `style-downloader.js:120` — Already handles `raster-dem` in TileJSON fetching/inlining alongside `vector` and `raster`
- `utils/style.js:199` — `isInlinedSource()` already checks for `raster-dem`
- `types.ts:8,25` — Already imports `RasterDEMSourceSpecification` and uses it in `TransformInlinedSource`

**What's missing:**
- `writer.js:51-55` — `SUPPORTED_SOURCE_TYPES` array does not include `'raster-dem'`
- `writer.js:281-283` — `addTile()` rejects `raster-dem` sources with an error
- `validator.js:417` — Validator treats `raster-dem` as unsupported and emits a warning
- `types.ts:59` — `TransformSMPInputSource` does not handle `RasterDEMSourceSpecification` (it would fall to the `T` passthrough, missing required `bounds`/`minzoom`/`maxzoom`)
- `spec/1.0/README.md` — Spec explicitly excludes `raster-dem`
- No test fixtures for `raster-dem` sources

**Changes needed:**
1. **`writer.js`**: Add `'raster-dem'` to `SUPPORTED_SOURCE_TYPES`; update `addTile()` to accept `raster-dem` source type
2. **`types.ts`**: Add `RasterDEMSourceSpecification` to `TransformSMPInputSource` union for tile-like sources
3. **`validator.js`**: Add `'raster-dem'` to the accepted tile source type check (line 417)
4. **`spec/1.0/README.md`**: Update Section 5.1 to list `raster-dem` as a supported tile source type; remove the "planned for future version" note
5. **Tests**: Add test fixtures and validator tests for `raster-dem` sources
6. **`style-downloader.js`**: Already works — no changes needed

### 2. `image` — Low priority, simple to pass through

**What it is:** A single image (PNG/JPG) positioned on the map at specific coordinates. Defined by a `url` and `coordinates` (four corner points).

**Characteristics:**
- Not tile-based — it's a single static image
- The image `url` could be external or could be bundled into the SMP archive
- `isInlinedSource()` already returns `true` for image sources (treated as always "inlined")
- The style-downloader returns image sources as-is (line 156)

**Changes needed:**
1. **`writer.js`**: Add `'image'` to `SUPPORTED_SOURCE_TYPES`; add a method like `addImageSource()` to allow bundling the image file into the archive and rewriting the URL to an `smp://` URI
2. **`types.ts`**: Update type definitions to handle `ImageSourceSpecification`
3. **`validator.js`**: Add validation for image sources (check that the image file exists in the archive if using `smp://` URI)
4. **`style-downloader.js`**: Add logic to download the image from the URL and bundle it
5. **`spec/1.0/README.md`**: Document image source support
6. **Tests**: Add test fixtures

### 3. `video` — Low priority, questionable offline utility

**What it is:** A video positioned on the map at specific coordinates. Similar to `image` but with video data.

**Characteristics:**
- Not tile-based — single video file
- Less useful for offline maps (videos can be very large)
- `isInlinedSource()` already returns `true` for video sources
- The style-downloader returns video sources as-is

**Changes needed:** Similar scope to `image` source support.

---

## Recommended Implementation Order

### Phase 1: `raster-dem` support (recommended first)
This is the most impactful change because:
- Most of the plumbing already exists (downloader, type defs, inline detection)
- It follows the same tile-based pattern as `vector` and `raster`
- The spec already planned for it
- Terrain/hillshade is a widely-used map feature

**Files to modify:**
| File | Change |
|------|--------|
| `packages/api/lib/writer.js` | Add `'raster-dem'` to `SUPPORTED_SOURCE_TYPES`; accept in `addTile()` |
| `packages/api/lib/types.ts` | Add `RasterDEMSourceSpecification` to `TransformSMPInputSource` |
| `packages/api/lib/validator.js` | Accept `'raster-dem'` in tile source validation |
| `spec/1.0/README.md` | Update Section 5.1 |
| `packages/api/test/validator.test.js` | Update/add test for `raster-dem` |
| Test fixtures | Add `raster-dem` source fixtures |

**Estimated scope:** ~6 files, small changes in each. Low risk since it mirrors existing `raster` handling.

### Phase 2: `image` source support (optional)
Requires new functionality for downloading/bundling single images. Medium complexity.

### Phase 3: `video` source support (optional)
Similar to `image` but with larger files. Questionable offline utility. Could be deferred indefinitely.

---

## Key Considerations

- **Tile format detection**: `raster-dem` tiles are typically PNG (like raster tiles). The existing `getTileFormatFromStream()` should handle them without changes.
- **Encoding**: `raster-dem` tiles may use `mapbox` or `terrarium` encoding (specified via the `encoding` property on the source). This property should be preserved but doesn't affect storage.
- **Backward compatibility**: Adding `raster-dem` to `SUPPORTED_SOURCE_TYPES` means older readers that don't understand `raster-dem` will encounter it. However, since the SMP format delegates rendering to MapLibre, this is a MapLibre concern, not an SMP concern — the SMP file just needs to store and serve the tiles correctly.
