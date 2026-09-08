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
const rowFor = (host, name) => [...host.querySelectorAll('.item')].find(el => el.querySelector('.tt')?.textContent === name)

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [] })
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('coachPickerSheet', () => {
  it('lists every coach and marks the current one', () => {
    coachPickerSheet('mentzer', vi.fn())
    const host = renderTop()
    for (const name of ['Mentzer', 'Nippard', 'Guardrail', 'Sanku']) expect(rowFor(host, name)).toBeTruthy()
    expect(rowFor(host, 'Mentzer').querySelector('.accent')).toBeTruthy()
    expect(rowFor(host, 'Sanku').querySelector('.accent')).toBeFalsy()
  })

  it('calls onPick with the tapped coach id and closes', () => {
    const onPick = vi.fn()
    coachPickerSheet('sanku', onPick)
    const host = renderTop()
    act(() => { rowFor(host, 'Nippard').click() })
    expect(onPick).toHaveBeenCalledWith('nippard')
    expect(useUI.getState().sheets).toHaveLength(0)
  })
})
