// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import CoachToast from './CoachToast.jsx'
import { useUI } from '../store/useUI.js'

let root, host

function render() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<CoachToast />))
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  useUI.setState({ coachToast: null })
})

describe('CoachToast', () => {
  it('renders nothing visible until a live reaction is showing', () => {
    const el = render()
    expect(el.querySelector('#coach-toast').className).not.toContain('show')
    expect(el.querySelector('.coach-bubble')).toBeFalsy()
  })

  it('shows the coach\'s bubble once showCoachToast fires', () => {
    const el = render()
    act(() => { useUI.getState().showCoachToast('mentzer', 'Every rep required.', 'info') })
    expect(el.querySelector('#coach-toast').className).toContain('show')
    expect(el.querySelector('.coach-bubble').textContent).toContain('Every rep required.')
  })
})
