// @vitest-environment happy-dom
// Pushing a day's workout forward should never silently overwrite a day that already has its
// own plan, and should disappear once the day is already logged — there's nothing left to push.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { dayOverrideSheet } from './sheets.jsx'

const mounted = []
const S = () => useStore.getState().S
const ISO = '2026-01-05'
const NEXT = '2026-01-06'

// Renders whatever sheet is on top and returns its host element.
function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const buttonFor = (host, label) => [...host.querySelectorAll('button')].find(b => b.textContent === label)
const pushButton = host => [...host.querySelectorAll('button')].find(b => b.textContent.startsWith('Push'))

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  useStore.setState(s => ({
    S: {
      ...s.S,
      routines: [{ id: 'mine', name: 'My routine', emoji: 'star', ex: [] }, { id: 'other', name: 'Other routine', emoji: 'legs', ex: [] }],
      week: {}, dayPlan: {}, workouts: [], active: null
    }
  }))
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('push to tomorrow', () => {
  it('offers to push a planned, not-yet-logged day forward', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    expect(buttonFor(host, 'Push My routine to tomorrow')).toBeTruthy()
  })

  it('has nothing to push on a rest day', () => {
    dayOverrideSheet(ISO) // no dayPlan entry, no weekly plan -> rest
    const host = renderTop()
    expect(pushButton(host)).toBeFalsy()
  })

  it('has nothing to push once the day is already logged', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' }, workouts: [{ d: ISO, entries: [] }] } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    expect(pushButton(host)).toBeFalsy()
  })

  it('moves the routine to the next day and makes this day rest, when the next day is free', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })

    expect(S().dayPlan[ISO]).toBe('rest')
    expect(S().dayPlan[NEXT]).toBe('mine')
    expect(useUI.getState().toastMsg).toContain('pushed')
    expect(useUI.getState().sheets).toHaveLength(0) // closed itself, no confirmation needed
  })

  it('asks first if the next day already has a different plan, and does nothing on cancel', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine', [NEXT]: 'other' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })

    const confirm = renderTop()
    expect(confirm.querySelector('h3').textContent).toContain('Push to')
    act(() => { buttonFor(confirm, 'Cancel').click() })

    expect(S().dayPlan[ISO]).toBe('mine')
    expect(S().dayPlan[NEXT]).toBe('other')
  })

  it('overwrites the next day once confirmed', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine', [NEXT]: 'other' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })

    const confirm = renderTop()
    act(() => { buttonFor(confirm, 'Push it').click() })

    expect(S().dayPlan[ISO]).toBe('rest')
    expect(S().dayPlan[NEXT]).toBe('mine')
  })
})
