#!/usr/bin/env node
/**
 * React mockup -> GIF/WebM/MP4 converter. (Authoring front-end #2.)
 *
 * Same deterministic frame pipeline as svg-to-gif.mjs, but the authoring
 * artifact is a real React mockup built from the component library:
 *
 *   1. start a Vite dev server (in-process) serving this repo
 *   2. open /?isolated=<mockup> — the app renders ONLY that mockup, full-window
 *   3. inject the demo-clock bridge (window.__demoClock) BEFORE app scripts
 *      run; the library's useDemoClock hook hands the bridge a driver and
 *      stops its rAF loop. We then advance the timeline deterministically
 *      with driver.step(dt) — the exact analogue of SMIL svg.setCurrentTime()
 *   4. screenshot each frame, encode with ffmpeg/gifsicle (shared encoder)
 *
 * Usage:
 *   node scripts/mockup-to-video.mjs --mockup <name> [options]
 *
 * Options:
 *   --mockup <name>       src/mockups/<name>/Mockup.tsx (required)
 *   --duration <sec>      Animation duration (default 8, max 60)
 *   --fps <n>             Frames per second (default 30)
 *   --width <px>          Viewport/output width (default 1200)
 *   --height <px>         Viewport/output height (default 720)
 *   --scheme <light|dark> (default dark; adds .dark class in isolated mode)
 *   --format <gif|webm|mp4> (default from config / gif)
 *   --out <path>          Output file (default gifs/<mockup>.<format>)
 *   --scale-strategy <lanczos|bilinear|neighbor>
 *   --palette / --no-palette / --dither <none|bayer|sierra2_4a>
 *   --no-gifsicle         Skip gifsicle optimization
 *   --dpr <n>             Capture supersampling (default 2)
 *   --preview <path> [--preview-at <sec>]   dump one PNG frame (fast check)
 *   --port <n>            Vite dev port (default: ephemeral)
 *   --url <url>           Use a running server instead of starting one
 *   --keep-frames <dir>   Keep raw PNG frames for debugging
 *   --wait <ms>           Extra settle time after load (default 400)
 *
 * Reads defaults from ./svg-to-gif.config.json when present.
 */
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { copyFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { captureLoop, DEFAULTS, encodeFrames, ensureOutputDir, loadConfig, validate } from './lib/encoder.mjs'

function parseArgs(argv) {
  const args = argv.slice(2)
  const opts = { ...DEFAULTS, mockup: null, out: null, port: 0, url: null, keepFrames: null, wait: 400 }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]
    const num = () => (next === undefined ? NaN : parseFloat(next))
    switch (arg) {
      case '--mockup': opts.mockup = next; i++; break
      case '--duration': opts.duration = num(); i++; break
      case '--fps': opts.fps = num(); i++; break
      case '--width': opts.width = num(); i++; break
      case '--height': opts.height = num(); i++; break
      case '--scheme': opts.scheme = next; i++; break
      case '--format': opts.format = String(next).toLowerCase(); i++; break
      case '--out': opts.out = next; i++; break
      case '--scale-strategy': opts.scaleStrategy = String(next).toLowerCase(); i++; break
      case '--dpr': opts.dpr = num(); i++; break
      case '--preview': opts.preview = next; i++; break
      case '--preview-at': opts.previewAt = num(); i++; break
      case '--port': opts.port = num(); i++; break
      case '--url': opts.url = next; i++; break
      case '--keep-frames': opts.keepFrames = next; i++; break
      case '--wait': opts.wait = num(); i++; break
      case '--palette': opts.palette = true; break
      case '--no-palette': opts.palette = false; break
      case '--dither': opts.dither = String(next).toLowerCase(); i++; break
      case '--no-gifsicle': opts.useGifsicle = false; break
      default:
        console.error(`Unknown option: ${arg}`)
        process.exit(1)
    }
  }

  if (!opts.mockup) {
    console.error('Usage: node scripts/mockup-to-video.mjs --mockup <name> [options]')
    process.exit(1)
  }
  return opts
}

async function startDevServer(port) {
  const server = await createServer({
    server: { port, strictPort: false },
    logLevel: 'error',
  })
  await server.listen()
  const address = server.httpServer.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  console.error(`Dev server: http://localhost:${actualPort}`)
  return { server, port: actualPort }
}

async function main() {
  const cliOpts = parseArgs(process.argv)
  const opts = validate({ ...DEFAULTS, ...loadConfig(), ...cliOpts })
  const outW = opts.width > 0 ? opts.width : 1200
  const outH = opts.height > 0 ? opts.height : 720
  opts.width = outW
  opts.height = outH

  const outputPath = resolve(opts.out ?? join('gifs', `${opts.mockup}.${opts.format}`))
  ensureOutputDir(outputPath)
  console.error(`Mockup:  ${opts.mockup}`)
  console.error(`Output:  ${outputPath}`)
  console.error(`Format:  ${opts.format} | ${opts.duration}s | ${opts.fps} fps | ${opts.totalFrames} frames`)
  console.error(`Size:    ${outW}x${outH} (capture @${opts.dpr}x)`)

  const framesDir = mkdtempSync(join(tmpdir(), 'mockup-to-video-'))
  let server = null

  try {
    if (opts.url) {
      console.error(`Using running server: ${opts.url}`)
    } else {
      const started = await startDevServer(opts.port)
      server = started.server
      opts.url = `http://localhost:${started.port}`
    }

    const browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: { width: outW, height: outH },
      deviceScaleFactor: opts.dpr,
    })
    const page = await context.newPage()
    await page.emulateMedia({ colorScheme: opts.scheme })

    // demo-clock bridge + dark class, installed before app scripts run.
    // NOTE: init scripts can run before <html> is parsed — never touch
    // documentElement synchronously without a guard, or the bridge below
    // would never be created (the library module depends on it).
    await page.addInitScript(
      ({ scheme }) => {
        if (!window.__demoClock) {
          window.__demoClock = {
            driver: null,
            setDriver(d) { this.driver = d },
          }
        }
        if (scheme === 'dark') {
          const apply = () => document.documentElement?.classList.add('dark')
          if (document.documentElement) apply()
          else document.addEventListener('DOMContentLoaded', apply)
        }
      },
      { scheme: opts.scheme },
    )

    const url = `${opts.url.replace(/\/$/, '')}/?isolated=${opts.mockup}`
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForSelector(`[data-mockup="${opts.mockup}"]`, { timeout: 30_000 })
    await page.waitForFunction(() => !!window.__demoClock?.driver, { timeout: 15_000 })
    await page.waitForTimeout(opts.wait)

    const settle = async () => {
      // double rAF lets React commit + canvas redraw; small pad for safety
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      await page.waitForTimeout(15)
    }

    await captureLoop({
      page,
      framesDir,
      opts,
      perFrame: async (t, i) => {
        await page.evaluate(
          ({ dt, seek }) => {
            const d = window.__demoClock?.driver
            if (!d) return
            if (seek) d.seek(0)
            else d.step(dt)
          },
          { dt: 1 / opts.fps, seek: i === 0 },
        )
      },
      settle,
    })

    await browser.close()

    encodeFrames({ framesDir, outputPath, opts })
    console.error(`Done -> ${outputPath}`)

    if (opts.keepFrames) {
      const keep = resolve(opts.keepFrames)
      mkdirSync(keep, { recursive: true })
      for (const f of readdirSync(framesDir)) {
        if (f.startsWith('frame_')) copyFileSync(join(framesDir, f), join(keep, f))
      }
      console.error(`Kept frames -> ${keep}`)
    }
  } finally {
    if (server) await server.close()
    rmSync(framesDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
