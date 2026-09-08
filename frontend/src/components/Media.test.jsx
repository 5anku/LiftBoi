// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Media from './Media.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => {
  const state = { S: { gifSize: 'full' } }
  state.snapshot = () => ({
    S: state.S,
    update: mut => {
      const next = structuredClone(state.S)
      mut(next)
      state.S = next
    },
  })
  return state
})
vi.mock('../store/useStore.js', () => {
  const useStore = selector => selector(mocks.snapshot())
  useStore.getState = mocks.snapshot
  return { useStore }
})

const EX = { id: 'bench', n: 'bench press', gif: 'bench.gif', img: 'bench.jpg' }

let host, root
beforeEach(() => {
  mocks.S = { gifSize: 'full' }
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = props => act(() => root.render(<Media ex={EX} {...props} />))

describe('Media gifSize', () => {
  it('renders the full animation by default and toggles to mini in the workout', () => {
    mount({ minimizable: true })
    expect(host.querySelector('.exmedia img')).toBeTruthy()
    expect(host.querySelector('.exmedia.mini')).toBeFalsy()
    act(() => { host.querySelector('.giftoggle').click() })
    expect(mocks.S.gifSize).toBe('mini')
    mount({ minimizable: true })
    expect(host.querySelector('.exmedia.mini')).toBeTruthy()
  })

  it("renders nothing at all in the workout when gifSize is 'off'", () => {
    mocks.S = { gifSize: 'off' }
    mount({ minimizable: true })
    expect(host.querySelector('.exmedia')).toBeFalsy()
    expect(host.querySelector('img')).toBeFalsy()
    expect(host.innerHTML).toBe('')
  })

  it("'off' only applies to the workout — the detail sheet (not minimizable) still shows media", () => {
    mocks.S = { gifSize: 'off' }
    mount({})
    expect(host.querySelector('.exmedia img')).toBeTruthy()
  })

  it('treats a legacy/unknown value as full', () => {
    mocks.S = { gifSize: 'huge' }
    mount({ minimizable: true })
    expect(host.querySelector('.exmedia img')).toBeTruthy()
    expect(host.querySelector('.exmedia.mini')).toBeFalsy()
  })
})

// A source with only a still (e.g. Free Exercise DB) has no animation to play — the old code
// gated the whole component on `ex.gif` and rendered nothing at all for these (issue: exercise
// library expansion).
describe('Media with a static-only exercise (no gif)', () => {
  const STILL_EX = { id: 'stretch', n: 'hip stretch', img: 'stretch.jpg' }
  const mountStill = props => act(() => root.render(<Media ex={STILL_EX} {...props} />))

  it('shows the still image instead of rendering nothing', () => {
    mountStill({})
    const img = host.querySelector('.exmedia img')
    expect(img).toBeTruthy()
    expect(img.src).toContain('stretch.jpg')
  })

  it('renders nothing only when there is neither a gif nor an image', () => {
    act(() => root.render(<Media ex={{ id: 'custom', n: 'my exercise' }} />))
    expect(host.innerHTML).toBe('')
  })

  it('drops the play/pause hint and tap-to-toggle since there is nothing to animate', () => {
    mountStill({})
    expect(host.querySelector('.gifhint')).toBeFalsy()
    act(() => { host.querySelector('.exmedia').dispatchEvent(new Event('click', { bubbles: true })) })
    expect(host.querySelector('.exmedia img').src).toContain('stretch.jpg') // unchanged
  })
})
