import './style.css'

/**
 * Review page: auto-discovers every src/diagrams/<name>/<name>.svg
 * (the generated, canonical artifacts) and embeds them so SMIL
 * animations run live in the browser.
 */
const mods = import.meta.glob('./diagrams/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const root = document.querySelector<HTMLElement>('#diagrams')!

for (const [path, markup] of Object.entries(mods)) {
  const name = path.split('/').slice(-2, -1)[0]

  const card = document.createElement('section')
  card.className = 'card'

  const title = document.createElement('h2')
  title.textContent = name

  const stage = document.createElement('div')
  stage.className = 'stage'
  stage.innerHTML = markup as string

  card.append(title, stage)
  root.append(card)
}
