#!/usr/bin/env node
/**
 * SMIL SVG diagram -> GIF/WebM/MP4 converter. (Authoring front-end #1.)
 *
 * Playwright-based pipeline:
 *   1. load the SVG in headless Chromium
 *   2. freeze the SMIL timeline, then seek it deterministically with
 *      svg.setCurrentTime(t) for each frame
 *   3. encode frames with ffmpeg (palette-based GIF by default) + gifsicle
 *
 * Requires SMIL animations in the SVG (CSS animations are not seekable).
 *
 * Usage:
 *   node scripts/svg-to-gif.mjs input.svg output.gif [options]
 *
 * Options:
 *   --duration <sec>      Animation duration (default 4, max 60)
 *   --fps <n>             Frames per second (default 30)
 *   --width <px>          Output width (default: native SVG width)
 *   --height <px>         Output height (default: auto from aspect)
 *   --scheme <light|dark> prefers-color-scheme emulation (default dark)
 *   --format <gif|webm|mp4>
 *   --scale-strategy <lanczos|bilinear|neighbor>
 *   --palette / --no-palette   Palette-based GIF encoding
 *   --no-gifsicle         Skip gifsicle optimization
 *   --dpr <n>             Device scale factor for capture (default 2)
 *   --preview <path>      Also write a single PNG frame (fast check)
 *   --preview-at <sec>    Which frame time the preview shows (default 0.6 * duration)
 *
 * Reads defaults from ./svg-to-gif.config.json when present.
 */
import { chromium } from 'playwright'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { captureLoop, DEFAULTS, encodeFrames, ensureOutputDir, loadConfig, validate } from './lib/encoder.mjs'

function parseArgs(argv) {
  const args = argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: node scripts/svg-to-gif.mjs input.svg output.(gif|webm|mp4) [options]')
    process.exit(1)
  }
  const inputSvg = resolve(args[0])
  const outputPath = resolve(args[1])
  const opts = { ...DEFAULTS }

  for (let i = 2; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]
    const num = () => (next === undefined ? NaN : parseFloat(next))
    switch (arg) {
      case '--duration': opts.duration = num(); i++; break
      case '--fps': opts.fps = num(); i++; break
      case '--width': opts.width = num(); i++; break
      case '--height': opts.height = num(); i++; break
      case '--scheme': opts.scheme = next; i++; break
      case '--format': opts.format = String(next).toLowerCase(); i++; break
      case '--scale-strategy': opts.scaleStrategy = String(next).toLowerCase(); i++; break
      case '--dpr': opts.dpr = num(); i++; break
      case '--preview': opts.preview = next; i++; break
      case '--preview-at': opts.previewAt = num(); i++; break
      case '--palette': opts.palette = true; break
      case '--no-palette': opts.palette = false; break
      case '--dither': opts.dither = String(next).toLowerCase(); i++; break
      case '--no-gifsicle': opts.useGifsicle = false; break
      default:
        console.error(`Unknown option: ${arg}`)
        process.exit(1)
    }
  }
  return { inputSvg, outputPath, opts }
}

async function main() {
  const { inputSvg, outputPath, opts: cliOpts } = parseArgs(process.argv)
  const opts = validate({ ...DEFAULTS, ...loadConfig(), ...cliOpts })

  if (!existsSync(inputSvg)) throw new Error(`Input SVG does not exist: ${inputSvg}`)
  ensureOutputDir(outputPath)
  const svgMarkup = readFileSync(inputSvg, 'utf8')

  // derive native dimensions from the SVG root
  const rootMatch = svgMarkup.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/)
  const nativeW = rootMatch ? parseFloat(rootMatch[1]) : 720
  const nativeH = rootMatch ? parseFloat(rootMatch[2]) : 600

  const outW = opts.width > 0 ? opts.width : nativeW
  const hasH = opts.height > 0
  const outH = hasH ? opts.height : Math.round((nativeH / nativeW) * outW)
  opts.width = outW
  opts.height = outH

  console.error(`Input:   ${inputSvg}`)
  console.error(`Output:  ${outputPath}`)
  console.error(`Format:  ${opts.format} | ${opts.duration}s | ${opts.fps} fps | ${opts.totalFrames} frames`)
  console.error(`Size:    ${outW}x${outH} (native ${nativeW}x${nativeH}, capture @${opts.dpr}x)`)

  const framesDir = mkdtempSync(join(tmpdir(), 'smil-to-video-'))

  try {
    const browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: { width: Math.round(nativeW), height: Math.round(nativeH) },
      deviceScaleFactor: opts.dpr,
    })
    const page = await context.newPage()
    await page.emulateMedia({ colorScheme: opts.scheme })

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: ${opts.scheme === 'dark' ? '#000000' : '#ffffff'}; }
  svg { display: block; }
</style>
</head>
<body>
${svgMarkup}
</body>
</html>`

    await page.setContent(html, { waitUntil: 'load' })
    await page.waitForTimeout(200)

    // Freeze the SMIL timeline so setCurrentTime(t) is deterministic:
    // otherwise the playing timeline drifts forward during each screenshot
    // (first frame drifts by 0.5s+, later ones by ~0.1s, corrupting timings).
    await page.evaluate(() => {
      const svg = document.querySelector('svg')
      if (svg && typeof svg.pauseAnimations === 'function') {
        try { svg.pauseAnimations() } catch { /* ignore */ }
      }
    })

    await captureLoop({
      page,
      framesDir,
      opts,
      perFrame: async (t) => {
        await page.evaluate((timeSec) => {
          const svg = document.querySelector('svg')
          if (svg && typeof svg.setCurrentTime === 'function') {
            try { svg.setCurrentTime(timeSec) } catch { /* ignore */ }
          }
        }, t)
      },
    })

    await browser.close()

    encodeFrames({ framesDir, outputPath, opts })
    console.error(`Done -> ${outputPath}`)
  } finally {
    rmSync(framesDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
