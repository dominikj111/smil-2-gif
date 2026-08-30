import './style.css'
import '@ui-components-library/react/styles'
import { createRoot } from 'react-dom/client'
import { StrictMode, useMemo } from 'react'
import { Button, useDemoClockTransport } from '@ui-components-library/react'

/**
 * Review page for both authoring modes:
 *   - SVG diagrams (SMIL) from src/diagrams/<name>/<name>.svg
 *   - React mockups from src/mockups/<name>/Mockup.tsx
 *
 * Isolated mode (?isolated=<name>): renders ONLY that mockup full-window —
 * this is what scripts/mockup-to-video.mjs drives for export.
 */

// ── SVG diagram gallery (same as the previous vanilla page) ──────────────────
const diagramMods = import.meta.glob('./diagrams/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const mockupMods = import.meta.glob<{ default: () => React.JSX.Element }>('./mockups/**/Mockup.tsx', {
  eager: true,
})

function DiagramCard({ name, markup }: { name: string; markup: string }) {
  return (
    <section className="card">
      <h2>{name}</h2>
      <div className="stage" dangerouslySetInnerHTML={{ __html: markup }} />
    </section>
  )
}

function MockupCard({ name }: { name: string }) {
  const mod = mockupMods[`./mockups/${name}/Mockup.tsx`]
  const Component = mod?.default
  if (!Component) return null
  return (
    <section className="card">
      <h2>
        {name} <span className="card__tag">mockup</span>
      </h2>
      <div className="stage stage--mockup" data-mockup={name}>
        <Component />
      </div>
    </section>
  )
}

function TransportStrip() {
  const clock = useDemoClockTransport()
  return (
    <div className="transport">
      <Button size="sm" onClick={clock.toggle}>{clock.playing ? 'Pause' : 'Play'}</Button>
      <Button size="sm" variant="outline" onClick={clock.restart}>Restart</Button>
      {[0.5, 1, 2].map((s) => (
        <Button key={s} size="sm" variant={clock.speed === s ? 'default' : 'outline'} onClick={() => clock.setSpeed(s)}>
          {s}×
        </Button>
      ))}
      <code className="transport__t">t = {clock.t.toFixed(2)}s</code>
    </div>
  )
}

function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const isolated = params.get('isolated')

  if (isolated) {
    const mod = mockupMods[`./mockups/${isolated}/Mockup.tsx`]
    const Component = mod?.default
    if (!Component) return <div className="isolated-missing">Unknown mockup: {isolated}</div>
    return (
      <div className="isolated" data-mockup={isolated}>
        <Component />
      </div>
    )
  }

  const diagrams = Object.entries(diagramMods).map(([path, markup]) => {
    const name = path.split('/').slice(-2, -1)[0]
    return { name, markup: markup as string }
  })
  const mockups = Object.keys(mockupMods).map((path) => path.split('/').slice(-2, -1)[0])

  return (
    <>
      <header>
        <h1>smil-2-gif — animated mockup pipeline</h1>
        <p>
          <strong>Diagrams</strong>: author <code>src/diagrams/&lt;name&gt;/gen.ts</code> →{' '}
          <code>npm run gen</code> → <code>npm run gif:&lt;name&gt;</code>
          <br />
          <strong>Mockups</strong>: author <code>src/mockups/&lt;name&gt;/Mockup.tsx</code> (React,
          library components, <code>useDemoClock</code>) → <code>npm run video:&lt;name&gt;</code>
          <br />
          The transport strip controls the shared demo clock (also driven
          deterministically by the exporter via <code>window.__demoClock</code>).
          <br />
          <strong>HTML artifacts</strong> (standalone review pages, no pipeline):{' '}
          <a href="/html/memory-hierarchy-v2.html">memory-hierarchy-v2.html</a>
          {' · '}
          <a href="/html/context-linker-sketch.html">context-linker-sketch.html</a>
          {' · '}
          <a href="/html/motherboard.html">motherboard.html</a>
        </p>
      </header>
      <TransportStrip />
      <main id="diagrams">
        {diagrams.map((d) => (
          <DiagramCard key={d.name} {...d} />
        ))}
        {mockups.map((name) => (
          <MockupCard key={name} name={name} />
        ))}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
