#!/usr/bin/env node
/**
 * Shared capture + encode core for the animated-mockup pipeline.
 *
 * Two authoring front-ends produce a sequence of PNG frames (same shape as
 * `svg.setCurrentTime(t)` seeking in the SMIL world):
 *
 *   - scripts/svg-to-gif.mjs        SMIL SVG diagrams      (perFrame = seek)
 *   - scripts/mockup-to-video.mjs   React mockups          (perFrame = step clock)
 *
 * This module owns: option parsing/validation, the deterministic frame-capture
 * loop (with progress + preview), and ffmpeg/gifsicle encoding to GIF/WebM/MP4.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const DEFAULTS = {
  duration: 4,
  fps: 30,
  width: 0, // 0 => native / CSS width
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

export function loadConfig(configFile = 'svg-to-gif.config.json') {
  const configPath = join(process.cwd(), configFile)
  if (!existsSync(configPath)) return {}
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch (e) {
    console.error(`Warning: failed to parse ${configFile}:`, e.message)
    return {}
  }
}

export function validate(opts) {
  if (!(opts.duration > 0 && opts.duration <= 60)) throw new Error('duration must be within (0, 60] seconds')
  if (!Number.isInteger(opts.fps) || opts.fps < 1 || opts.fps > 60) throw new Error('fps must be 1..60')
  if (!['light', 'dark'].includes(opts.scheme)) throw new Error('scheme must be light|dark')
  if (!['gif', 'webm', 'mp4'].includes(opts.format)) throw new Error('format must be gif|webm|mp4')
  if (!['lanczos', 'bilinear', 'neighbor'].includes(opts.scaleStrategy)) throw new Error('scaleStrategy must be lanczos|bilinear|neighbor')
  const totalFrames = Math.round(opts.duration * opts.fps)
  if (totalFrames > opts.maxFrames) throw new Error(`duration * fps = ${totalFrames} frames; max is ${opts.maxFrames}`)
  return { ...opts, totalFrames }
}

export function hasGifsicle() {
  try {
    execFileSync('gifsicle', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function ffmpeg(args) {
  console.error('  ffmpeg', args.join(' '))
  execFileSync('ffmpeg', args, { stdio: 'inherit' })
}

/** page.screenshot is occasionally flaky in headless shell; retry a few times */
export async function screenshotWithRetry(page, path) {
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

/**
 * Deterministic frame capture loop.
 *
 * @param {object} p
 * @param {import('playwright').Page} p.page
 * @param {string} p.framesDir   temp dir for frame_%04d.png
 * @param {object} p.opts        validated options (has .totalFrames, .fps, .preview, .previewAt)
 * @param {(t: number, i: number) => Promise<void>} p.perFrame  advance the authoring
 *        timeline to time t (SMIL seek or demo-clock step), then settle the frame
 * @param {(t: number) => Promise<void>} [p.settle]  extra wait to let rendering flush
 */
export async function captureLoop({ page, framesDir, opts, perFrame, settle }) {
  const previewAt = opts.previewAt ?? opts.duration * 0.6
  const start = Date.now()
  const wait = settle ?? (async () => { await page.waitForTimeout(30) })

  for (let i = 0; i < opts.totalFrames; i++) {
    const t = i / opts.fps
    await perFrame(t, i)
    await wait(t, i)
    const framePath = join(framesDir, `frame_${String(i).padStart(4, '0')}.png`)
    await screenshotWithRetry(page, framePath)

    if (opts.preview && Math.abs(t - previewAt) < 0.5 / opts.fps) {
      await screenshotWithRetry(page, opts.preview)
      console.error(`Preview: ${opts.preview} (t=${t.toFixed(2)}s)`)
    }

    if (i === 0 || i === opts.totalFrames - 1 || i % Math.max(1, Math.floor(opts.totalFrames / 10)) === 0) {
      const pct = Math.round(((i + 1) / opts.totalFrames) * 100)
      console.error(`  frames ${i + 1}/${opts.totalFrames} (${pct}%)`)
    }
  }
  console.error(`Frame capture done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
}

/**
 * Encode PNG frames (frame_%04d.png) into the requested format.
 * @param {object} p
 * @param {string} p.framesDir
 * @param {string} p.outputPath
 * @param {object} p.opts
 */
export function encodeFrames({ framesDir, outputPath, opts }) {
  const inputPattern = join(framesDir, 'frame_%04d.png')
  // always scale to the target size (screenshots are captured at DPR 2x)
  const scaleFilter = `scale=${opts.width}:${opts.height}:flags=${opts.scaleStrategy}`

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
}

export function ensureOutputDir(outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true })
}
