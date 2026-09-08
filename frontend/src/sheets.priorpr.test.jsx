// @vitest-environment happy-dom
// PR seeding (issue: first-ever log shouldn't fake a PR) — the exercise detail sheet's 1RM
// calculator doubles as where you tell the app what you already lift.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { EXDB } from './lib/exercises.js'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { exerciseDetailSheet } from './sheets.jsx'

const mounted = []
const S = () => useStore.getState().S
const ex = EXDB[0]

function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const saveButton = host => [...host.querySelectorAll('button')].find(b => b.textContent.includes('Save it as your PR'))
const clearButton = host => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === 'Clear')

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  useStore.setState({ S: structuredClone(DEF), user: null })
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('seeding a prior PR from the exercise detail sheet', () => {
  it('offers to save the calculator\'s current weight/reps as a PR', () => {
    exerciseDetailSheet(ex)
    const host = renderTop()
    expect(saveButton(host)).toBeTruthy()

    act(() => { saveButton(host).click() })
    expect(S().priorPRs[ex.id]).toEqual({ w: 20, r: 5 }) // the calculator's own defaults with no history
    expect(useUI.getState().toastMsg).toContain('Saved as your PR')
  })

  it('shows a seeded PR as "set by you", distinct from real logged history, with a Clear action', () => {
    useStore.setState(s => ({ S: { ...s.S, priorPRs: { [ex.id]: { w: 180, r: 3 } } } }))
    exerciseDetailSheet(ex)
    const host = renderTop()
    expect(host.textContent).toContain('Your PR (set by you):')
    expect(host.textContent).not.toContain('From your log:')

    act(() => { clearButton(host).click() })
    expect(S().priorPRs[ex.id]).toBeUndefined()
    expect(useUI.getState().toastMsg).toBe('Cleared')
  })

  it('a real logged PR shows no Clear action — only a seeded one is yours to remove', () => {
    useStore.setState(s => ({
      S: { ...s.S, workouts: [{ d: '2024-01-01', start: 1, entries: [{ id: ex.id, sets: [{ w: 100, r: 5, done: true }] }] }] },
    }))
    exerciseDetailSheet(ex)
    const host = renderTop()
    expect(host.textContent).toContain('From your log:')
    expect(clearButton(host)).toBeFalsy()
  })
})
