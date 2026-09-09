// @vitest-environment happy-dom
// Pushing a day's workout forward should never silently overwrite a day that already has its
// own plan, and should disappear once the day is already logged — there's nothing left to push.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { dayOverrideSheet } from './sheets.jsx'
import { effectiveRoutineId } from './lib/history.js'

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
const rowFor = (host, label) => [...host.querySelectorAll('.item')].find(el => el.querySelector('.tt')?.textContent === label)

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  useStore.setState(s => ({
    S: {
      ...s.S,
      routines: [{ id: 'mine', name: 'My routine', emoji: 'star', ex: [] }, { id: 'other', name: 'Other routine', emoji: 'legs', ex: [] }],
      week: {}, dayPlan: {}, dayLog: {}, workouts: [], active: null
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
    // Closed itself, no confirmation needed — but a (skippable) "why?" follows the push.
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(renderTop().querySelector('h3').textContent).toContain('Why skip this one?')
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

describe('swap with tomorrow', () => {
  // ISO (2026-01-05) is a Monday, NEXT (2026-01-06) a Tuesday — weekdays 1 and 2.
  it('exchanges two different planned days, rewriting the weekly schedule so it repeats', () => {
    useStore.setState(s => ({ S: { ...s.S, week: { 1: 'mine', 2: 'other' }, dayPlan: { [ISO]: 'mine', [NEXT]: 'other' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { buttonFor(host, 'Swap with tomorrow (Other routine)').click() })

    expect(S().week[1]).toBe('other')
    expect(S().week[2]).toBe('mine')
    // No dangling one-off override for this week — the recurring plan already reflects it.
    expect(S().dayPlan[ISO]).toBeUndefined()
    expect(S().dayPlan[NEXT]).toBeUndefined()

    // And it sticks next week too, not just this one.
    const NEXT_WEEK_ISO = '2026-01-12', NEXT_WEEK_NEXT = '2026-01-13'
    expect(effectiveRoutineId(S(), NEXT_WEEK_ISO)).toBe('other')
    expect(effectiveRoutineId(S(), NEXT_WEEK_NEXT)).toBe('mine')
  })

  it('can swap a planned day with a rest day', () => {
    useStore.setState(s => ({ S: { ...s.S, week: { 1: 'mine' }, dayPlan: { [ISO]: 'mine', [NEXT]: 'rest' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { buttonFor(host, 'Swap with tomorrow (Rest)').click() })

    expect(S().week[1]).toBeUndefined()
    expect(S().week[2]).toBe('mine')
  })

  it('offers nothing to swap when tomorrow has the same plan, or either day is already logged', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine', [NEXT]: 'mine' } } }))
    dayOverrideSheet(ISO)
    expect(buttonFor(renderTop(), 'Swap with tomorrow (My routine)')).toBeFalsy()

    useUI.setState({ sheets: [] })
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine', [NEXT]: 'other' }, workouts: [{ d: NEXT, entries: [] }] } }))
    dayOverrideSheet(ISO)
    expect(buttonFor(renderTop(), 'Swap with tomorrow (Other routine)')).toBeFalsy()
  })
})

describe('skip reason', () => {
  it('offers a reason picker after pushing, and records a quick pick', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })
    const reasonHost = renderTop()

    act(() => { rowFor(reasonHost, 'Sick').click() })
    expect(S().dayLog[ISO]).toMatchObject({ reason: 'sick' })
  })

  it('offers a reason picker after marking a planned day rest, but not when it was already rest', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    let host = renderTop()
    act(() => { rowFor(host, 'Rest / skip this day').click() })
    expect(useUI.getState().sheets).toHaveLength(1)
    expect(renderTop().querySelector('h3').textContent).toContain('Why skip this one?')

    useUI.setState({ sheets: [] })
    dayOverrideSheet(ISO) // now already rest — picking rest again is not "skipping" anything
    host = renderTop()
    act(() => { rowFor(host, 'Rest / skip this day').click() })
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('can be skipped without recording anything', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })
    const reasonHost = renderTop()
    act(() => { buttonFor(reasonHost, 'Skip without a reason').click() })

    expect(S().dayLog[ISO]).toBeUndefined()
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('"Other" asks for a note and only saves once something is typed', () => {
    useStore.setState(s => ({ S: { ...s.S, dayPlan: { [ISO]: 'mine' } } }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    act(() => { pushButton(host).click() })
    // One live-mounted instance from here on — re-invoking sheet.render() would mount a fresh
    // component and lose the "Other" toggle's state, same pitfall as re-rendering any sheet.
    const reasonHost = renderTop()
    act(() => { rowFor(reasonHost, 'Other').click() })

    const saveBtn = buttonFor(reasonHost, 'Save')
    expect(saveBtn.disabled).toBe(true)

    const textarea = reasonHost.querySelector('textarea')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
      setter.call(textarea, 'Flight got delayed')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => { buttonFor(reasonHost, 'Save').click() })

    expect(S().dayLog[ISO]).toMatchObject({ reason: 'other', note: 'Flight got delayed' })
  })

  it('shows a previously recorded reason when the day is reopened', () => {
    useStore.setState(s => ({
      S: { ...s.S, dayPlan: { [ISO]: 'rest' }, dayLog: { [ISO]: { reason: 'travel', note: '', at: 1 } } }
    }))
    dayOverrideSheet(ISO)
    const host = renderTop()
    expect(host.textContent).toContain('You noted:')
    expect(host.textContent).toContain('Travel')
  })
})
