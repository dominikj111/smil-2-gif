#!/usr/bin/env node
/**
 * SVG animation -> GIF/WebM/MP4 converter.
 *
 * Playwright-based re-implementation of the svg-to-gif pipeline:
 *   1. load the SVG in headless Chromium
 *   2. seek the SMIL timeline with svg.setCurrentTime(t) and screenshot
 *      each frame at time t = i / fps
 *   3. encode frames with ffmpeg (palette-based GIF by default)
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
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const DEFAULTS = {
  duration: 4,
  fps: 30,
  width: 0, // 0 => native
  height: 0, // 0 => auto
  scheme: 'dark',
  format: 'gif',
  scaleStrategy: 'lanczos',
  palette: true,
  dither: null, // null = ffmpeg default (sierra2_4a); 'none' for flat UI / smaller files
  useGifsicle: true,
  dpr: 2,
  maxFrames: 2000,
  preview: null,
  previewAt: null,
}

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

function loadConfig() {
  const configPath = join(process.cwd(), 'svg-to-gif.config.json')
  if (!existsSync(configPath)) return {}
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch (e) {
    console.error('Warning: failed to parse svg-to-gif.config.json:', e.message)
    return {}
  }
}

function validate(opts) {
  if (!(opts.duration > 0 && opts.duration <= 60)) throw new Error('duration must be within (0, 60] seconds')
  if (!Number.isInteger(opts.fps) || opts.fps < 1 || opts.fps > 60) throw new Error('fps must be 1..60')
  if (!['light', 'dark'].includes(opts.scheme)) throw new Error('scheme must be light|dark')
  if (!['gif', 'webm', 'mp4'].includes(opts.format)) throw new Error('format must be gif|webm|mp4')
  if (!['lanczos', 'bilinear', 'neighbor'].includes(opts.scaleStrategy)) throw new Error('scaleStrategy must be lanczos|bilinear|neighbor')
  const totalFrames = Math.round(opts.duration * opts.fps)
  if (totalFrames > opts.maxFrames) throw new Error(`duration * fps = ${totalFrames} frames; max is ${opts.maxFrames}`)
  return { ...opts, totalFrames }
}

function hasGifsicle() {
  try {
    execFileSync('gifsicle', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function ffmpeg(args) {
  console.error('  ffmpeg', args.join(' '))
  execFileSync('ffmpeg', args, { stdio: 'inherit' })
}

/** page.screenshot is occasionally flaky in headless shell; retry a few times */
async function screenshotWithRetry(page, path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.screenshot({ path })
      return
    } catch (err) {
      if (attempt === 4) throw err
      console.error(`  screenshot flake (${err.message.split('\n')[0]}), retry ${attempt}...`)
      await page.waitForTimeout(300)
    }
  }
}

async function main() {
  const { inputSvg, outputPath, opts: cliOpts } = parseArgs(process.argv)
  const opts = validate({ ...DEFAULTS, ...loadConfig(), ...cliOpts })

  if (!existsSync(inputSvg)) throw new Error(`Input SVG does not exist: ${inputSvg}`)
  mkdirSync(dirname(outputPath), { recursive: true })
  const svgMarkup = readFileSync(inputSvg, 'utf8')

  // derive native dimensions from the SVG root
  const rootMatch = svgMarkup.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/)
  const nativeW = rootMatch ? parseFloat(rootMatch[1]) : 720
  const nativeH = rootMatch ? parseFloat(rootMatch[2]) : 600

  const outW = opts.width > 0 ? opts.width : nativeW
  const hasH = opts.height > 0
  const outH = hasH ? opts.height : Math.round((nativeH / nativeW) * outW)

  console.error(`Input:   ${inputSvg}`)
  console.error(`Output:  ${outputPath}`)
  console.error(`Format:  ${opts.format} | ${opts.duration}s | ${opts.fps} fps | ${opts.totalFrames} frames`)
  console.error(`Size:    ${outW}x${outH} (native ${nativeW}x${nativeH}, capture @${opts.dpr}x)`)

  const framesDir = mkdtempSync(join(tmpdir(), 'svg-to-gif-'))
  const previewAt = opts.previewAt ?? opts.duration * 0.6

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

    const start = Date.now()
    const seek = (t) =>
      page.evaluate((timeSec) => {
        const svg = document.querySelector('svg')
        if (svg && typeof svg.setCurrentTime === 'function') {
          try { svg.setCurrentTime(timeSec) } catch { /* ignore */ }
        }
      }, t)

    for (let i = 0; i < opts.totalFrames; i++) {
      const t = i / opts.fps
      await seek(t)
      const framePath = join(framesDir, `frame_${String(i).padStart(4, '0')}.png`)
      await screenshotWithRetry(page, framePath)

      if (opts.preview && Math.abs(t - previewAt) < 0.5 / opts.fps) {
        await screenshotWithRetry(page, resolve(opts.preview))
        console.error(`Preview: ${resolve(opts.preview)} (t=${t.toFixed(2)}s)`)
      }

      if (i === 0 || i === opts.totalFrames - 1 || i % Math.max(1, Math.floor(opts.totalFrames / 10)) === 0) {
        const pct = Math.round(((i + 1) / opts.totalFrames) * 100)
        console.error(`  frames ${i + 1}/${opts.totalFrames} (${pct}%)`)
      }
    }
    console.error(`Frame capture done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
    await browser.close()

    const inputPattern = join(framesDir, 'frame_%04d.png')
    // always scale to the target size (screenshots are captured at DPR 2x)
    const scaleFilter = `scale=${outW}:${outH}:flags=${opts.scaleStrategy}`

    if (opts.format === 'gif' && opts.palette) {
      const palettePath = join(framesDir, 'palette.png')
      ffmpeg(['-y', '-framerate', String(opts.fps), '-i', inputPattern, '-vf', `${scaleFilter},palettegen`, palettePath])
      const useFilter = opts.dither ? `${scaleFilter},paletteuse=dither=${opts.dither}` : `${scaleFilter},paletteuse`
      ffmpeg(['-y', '-framerate', String(opts.fps), '-i', inputPattern, '-i', palettePath, '-lavfi', useFilter, '-loop', '0', '-gifflags', '-offsetting-transdiff', outputPath])
    } else {
      const base = ['-y', '-framerate', String(opts.fps), '-i', inputPattern, '-vf', scaleFilter]
      if (opts.format === 'gif') {
        ffmpeg([...base, '-loop', '0', outputPath])
      } else if (opts.format === 'webm') {
        ffmpeg([...base, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-pix_fmt', 'yuva420p', outputPath])
      } else {
        ffmpeg([...base, '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputPath])
      }
    }

    if (opts.format === 'gif' && opts.useGifsicle && hasGifsicle()) {
      console.error('  gifsicle -O3 optimization...')
      const tmp = outputPath + '.tmp.gif'
      execFileSync('gifsicle', ['-O3', outputPath, '-o', tmp], { stdio: 'inherit' })
      renameSync(tmp, outputPath)
    } else if (opts.format === 'gif' && opts.useGifsicle) {
      console.error('  gifsicle not found; skipping optimization')
    }

    console.error(`Done -> ${outputPath}`)
  } finally {
    rmSync(framesDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
