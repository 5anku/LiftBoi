// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import CoachBubble from './CoachBubble.jsx'

let root, host

function render(props) {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<CoachBubble {...props} />))
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
})

describe('CoachBubble', () => {
  it('renders the coach\'s name and message, flagged as a warning for non-info severity', () => {
    const el = render({ coachId: 'mentzer', message: '12 reps — add weight.', severity: 'action' })
    const bubble = el.querySelector('.coach-bubble')
    expect(bubble.classList.contains('warn')).toBe(true)
    expect(bubble.textContent).toContain('Mentzer')
    expect(bubble.textContent).toContain('12 reps — add weight.')
  })

  it('shows an <img> pointed at the coach\'s portrait, ready to fall back on error', () => {
    const el = render({ coachId: 'wood', message: 'On track.', severity: 'info' })
    const img = el.querySelector('.coach-avatar')
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('/coaches/wood.png')
  })

  it('falls back to a colored initial once the portrait fails to load', () => {
    const el = render({ coachId: 'wood', message: 'On track.', severity: 'info' })
    const img = el.querySelector('.coach-avatar')
    act(() => { img.dispatchEvent(new Event('error')) })
    const fallback = el.querySelector('.coach-avatar-fallback')
    expect(fallback).toBeTruthy()
    expect(fallback.textContent).toBe('G')
  })
})
