/**
 * chart-lab — TanStack Charts (canvas renderer) + useDemoClock + library components.
 *
 * The first React-mockup authoring example for the smil-2-gif pipeline:
 *   - a few controls alter the data rendered on the canvas chart
 *   - the demo clock drives a live data stream (wave phase), so the same
 *     component renders live in the browser AND exports to GIF/WebM/MP4 via
 *     `npm run video:chart-lab` (the exporter steps the clock per frame).
 *
 * Loop period: 8s (must match the exporter's --duration).
 */
import { useMemo, useState } from 'react'
import { Chart } from '@tanstack/charts/react/canvas'
import { areaY, barY, defineChart, dot, lineY, type ChartMark } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { Button, Card, CardContent, CardHeader, CardTitle, StatCard, useDemoClock } from '@ui-components-library/react'

const LOOP = 8 // seconds — keep in sync with scripts/mockup-to-video.mjs --duration

const SERIES_NAMES = ['signal', 'wave', 'pulse'] as const
const SERIES_COLORS = ['#22d3ee', '#f77f00', '#a78bfa']

type Kind = 'line' | 'area' | 'bar' | 'dot'
const KINDS: Kind[] = ['line', 'area', 'bar', 'dot']

interface Reading {
  id: string
  bucket: string
  value: number
  series: string
}

/** Deterministic pseudo-noise — no Math.random, so every frame is reproducible. */
function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function buildData(t: number, series: number, points: number, amplitude: number, frequency: number): Reading[] {
  const rows: Reading[] = []
  for (let s = 0; s < series; s++) {
    const name = SERIES_NAMES[s]
    const phase = series > 1 ? (s * 2 * Math.PI) / series : 0
    for (let i = 0; i < points; i++) {
      const x = points === 1 ? 0 : i / (points - 1)
      const wave = Math.sin(2 * Math.PI * (frequency * t + x + phase))
      const wobble = Math.sin(2 * Math.PI * (2.3 * x + 1.3 * t + s * 0.7)) * 0.3
      const value = amplitude * (wave + wobble)
      rows.push({ id: `${name}-${i}`, bucket: `B${i}`, value: +value.toFixed(3), series: name })
    }
  }
  return rows
}

function buildMark(kind: Kind, data: Reading[]): ChartMark<Reading, any, any> {
  switch (kind) {
    case 'line':
      return lineY(data, { x: 'bucket', y: 'value', z: 'series', key: 'id', strokeWidth: 2.5 })
    case 'area':
      return areaY(data, { x: 'bucket', y: 'value', z: 'series', key: 'id', fillOpacity: 0.22 })
    case 'bar':
      return barY(data, { x: 'bucket', y: 'value', z: 'series', key: 'id', radius: 2 })
    case 'dot':
      return dot(data, { x: 'bucket', y: 'value', z: 'series', key: 'id', r: 4 })
  }
}

interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  display: string
  onChange(v: number): void
}

function Slider({ label, min, max, step, value, display, onChange }: SliderProps) {
  return (
    <label className="chartlab__slider">
      <span className="chartlab__slider-head">
        <span className="chartlab__slider-label">{label}</span>
        <code className="chartlab__slider-value">{display}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export default function Mockup() {
  const [kind, setKind] = useState<Kind>('line')
  const [series, setSeries] = useState(2)
  const [points, setPoints] = useState(36)
  const [amplitude, setAmplitude] = useState(0.9)
  const [frequency, setFrequency] = useState(0.75)
  const clock = useDemoClock({ duration: LOOP })

  const data = useMemo(
    () => buildData(clock.localT, series, points, amplitude, frequency),
    [clock.localT, series, points, amplitude, frequency],
  )

  // New definition only when captured data or visual policy changes
  // (TanStack: definition identity is the host update boundary).
  const definition = useMemo(
    () =>
      defineChart({
        marks: [buildMark(kind, data)],
        x: { scale: () => scalePoint<string>().padding(0.4) },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'value' } },
        color: { scale: () => scaleOrdinal<string, string>().range(SERIES_COLORS) },
      }),
    [data, kind],
  )

  const peak = useMemo(() => data.reduce((m, r) => Math.max(m, Math.abs(r.value)), 0), [data])
  const average = useMemo(() => {
    const bySeries = data.filter((r) => r.series === SERIES_NAMES[0])
    return bySeries.length ? bySeries.reduce((sum, r) => sum + r.value, 0) / bySeries.length : 0
  }, [data])

  return (
    <div className="chartlab">
      <header className="chartlab__header">
        <div>
          <h1 className="chartlab__title">Chart Lab</h1>
          <p className="chartlab__subtitle">
            TanStack Charts · canvas renderer · driven by <code>useDemoClock</code>
          </p>
        </div>
        <div className="chartlab__transport">
          <Button size="sm" onClick={clock.toggle}>{clock.playing ? 'Pause' : 'Play'}</Button>
          <Button size="sm" variant="outline" onClick={clock.restart}>Restart</Button>
          {[0.5, 1, 2].map((s) => (
            <Button key={s} size="sm" variant={clock.speed === s ? 'default' : 'outline'} onClick={() => clock.setSpeed(s)}>
              {s}×
            </Button>
          ))}
          <code className="chartlab__t">t = {clock.localT.toFixed(2)}s</code>
        </div>
      </header>

      <div className="chartlab__body">
        <aside className="chartlab__controls">
          <Card>
            <CardHeader>
              <CardTitle>Chart kind</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chartlab__grid">
                {KINDS.map((k) => (
                  <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)}>
                    {k}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Series</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chartlab__grid">
                {[1, 2, 3].map((n) => (
                  <Button key={n} size="sm" variant={series === n ? 'default' : 'outline'} onClick={() => setSeries(n)}>
                    {n}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent className="chartlab__sliders">
              <Slider label="Samples" min={12} max={60} step={1} value={points} display={`${points}`} onChange={setPoints} />
              <Slider label="Amplitude" min={20} max={150} step={5} value={Math.round(amplitude * 100)} display={amplitude.toFixed(2)} onChange={(v) => setAmplitude(v / 100)} />
              <Slider label="Frequency" min={25} max={200} step={5} value={Math.round(frequency * 100)} display={`${frequency.toFixed(2)} Hz`} onChange={(v) => setFrequency(v / 100)} />
            </CardContent>
          </Card>
        </aside>

        <section className="chartlab__chart">
          <Chart definition={definition} height={460} ariaLabel="Live chart lab data" />
        </section>
      </div>

      <footer className="chartlab__stats">
        <StatCard label="Peak |value|" value={peak.toFixed(2)} />
        <StatCard label={`Mean ${SERIES_NAMES[0]}`} value={average.toFixed(2)} />
        <StatCard label="Samples" value={data.length} />
      </footer>
    </div>
  )
}
