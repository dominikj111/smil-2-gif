#!/usr/bin/env node
/**
 * Runs every src/diagrams/<name>/gen.ts and writes the resulting
 * standalone SVG to src/diagrams/<name>/<name>.svg.
 *
 * Uses Node's native TypeScript type-stripping (Node >= 23.6).
 */
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const diagramsDir = join(root, 'src', 'diagrams')

const entries = await readdir(diagramsDir, { withFileTypes: true })
const dirs = entries.filter((e) => e.isDirectory())

if (dirs.length === 0) {
  console.log('No diagrams found in src/diagrams/')
  process.exit(0)
}

for (const dir of dirs) {
  const genPath = join(diagramsDir, dir.name, 'gen.ts')
  try {
    const mod = await import(pathToFileURL(genPath).href + `?t=${Date.now()}`)
    if (typeof mod.generate !== 'function') {
      console.log(`- ${dir.name}: no "generate" export, skipping`)
      continue
    }
    const svg = await mod.generate()
    const out = join(diagramsDir, dir.name, `${dir.name}.svg`)
    await writeFile(out, svg)
    console.log(`✓ ${dir.name} -> ${out} (${svg.length} bytes)`)
  } catch (err) {
    console.error(`✗ ${dir.name}: ${err?.message ?? err}`)
  }
}
