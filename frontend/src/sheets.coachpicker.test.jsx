// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useUI } from './store/useUI.js'
import { coachPickerSheet } from './sheets.jsx'

const mounted = []

function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const cardFor = (host, name) => [...host.querySelectorAll('.coach-card')].find(el => el.querySelector('.coach-card-name')?.textContent === name)
const confirmButton = host => [...host.querySelectorAll('button')].find(b => b.className.includes('primary'))

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('coachPickerSheet', () => {
  it('shows every coach as a card, opened on the current one', () => {
    coachPickerSheet('mentzer', vi.fn())
    const host = renderTop()
    for (const name of ['Mentzer', 'Nippard', 'Guardrail', 'Sanku']) expect(cardFor(host, name)).toBeTruthy()
    expect(confirmButton(host).textContent).toContain('Keep Mentzer')
  })

  it('tapping another card, then confirming, calls onPick with that coach and closes', () => {
    const onPick = vi.fn()
    coachPickerSheet('sanku', onPick)
    const host = renderTop()
    act(() => { cardFor(host, 'Nippard').click() })
    expect(confirmButton(host).textContent).toContain('Train with Nippard')

    act(() => { confirmButton(host).click() })
    expect(onPick).toHaveBeenCalledWith('nippard')
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('tapping a dot moves the highlighted card the same as tapping the card itself', () => {
    coachPickerSheet('sanku', vi.fn())
    const host = renderTop()
    const dots = host.querySelectorAll('.coach-dot')
    expect(dots).toHaveLength(4)
    act(() => { dots[2].click() }) // wood/Guardrail, third persona
    expect(confirmButton(host).textContent).toContain('Guardrail')
    expect(dots[2].className).toContain('is-on')
  })

  it('confirming without changing the selection still calls onPick with the current coach', () => {
    const onPick = vi.fn()
    coachPickerSheet('sanku', onPick)
    const host = renderTop()
    act(() => { confirmButton(host).click() })
    expect(onPick).toHaveBeenCalledWith('sanku')
  })
})
