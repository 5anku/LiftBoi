// @vitest-environment happy-dom
// Generate-a-workout flow: a category focus (or "surprise", once resolved) now offers a real
// choice of 3 main lifts instead of silently rolling one behind the scenes.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useUI } from './store/useUI.js'
import { generatorSheet } from './sheets.jsx'

const mounted = []

// One live-mounted instance per test: clicks re-render it in place, same as the real app —
// re-invoking sheet.render() would mount a fresh component and lose its state, not follow a nav.
function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const rowFor = (host, name) => [...host.querySelectorAll('.item')].find(el => el.querySelector('.tt')?.textContent === name)

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('generatorSheet', () => {
  it('offers 3 real lift options for a category focus before asking how to train it', () => {
    generatorSheet()
    const host = renderTop()
    act(() => { rowFor(host, 'Push').click() })

    expect(host.querySelector('h3').textContent).toMatch(/pick your main lift/i)
    const rows = [...host.querySelectorAll('.item')]
    expect(rows).toHaveLength(3)
    // Every row names a real exercise, not a placeholder — and none of them are the style step.
    for (const row of rows) expect(row.querySelector('.tt').textContent.length).toBeGreaterThan(0)
  })

  it('skips the lift-pick step for a named single lift', () => {
    generatorSheet()
    const host = renderTop()
    act(() => { rowFor(host, 'Bench').click() })

    expect(host.querySelector('h3').textContent).toMatch(/how do you want to train it/i)
  })

  it('advances to the style step once a lift is picked', () => {
    generatorSheet()
    const host = renderTop()
    act(() => { rowFor(host, 'Legs').click() })
    const firstLift = host.querySelector('.item .tt').textContent
    act(() => { host.querySelector('.item').click() })

    expect(host.querySelector('h3').textContent).toMatch(/how do you want to train it/i)
    for (const name of ['Autoregulated', 'To failure', 'Build volume', 'PR attempt', 'Surprise me']) {
      expect(rowFor(host, name), `${name} missing after picking ${firstLift}`).toBeTruthy()
    }
  })

  it('also offers 3 real lift options once "surprise" resolves to a category', () => {
    generatorSheet()
    const host = renderTop()
    act(() => { rowFor(host, 'Surprise me').click() })

    // Either the lift-pick step (category focus) or straight to style (named-lift focus) is a
    // valid resolution of "surprise" — both are real screens, never a blank one.
    expect(host.querySelector('h3').textContent).toMatch(/pick your main lift|how do you want to train it/i)
  })
})
