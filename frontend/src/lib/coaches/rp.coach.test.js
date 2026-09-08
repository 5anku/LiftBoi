import { describe, expect, it } from 'vitest'
import { evaluateRP } from './rp.coach.js'

const landmarks = { mv: 4, mev: 8, mav: 14, mrv: 20 }

describe('evaluateRP', () => {
  it('calls for a set below MEV', () => {
    const s = evaluateRP(6, landmarks)
    expect(s.signal).toBe('add_volume')
    expect(s.source_rule).toBe('below_mev')
  })

  it('keeps climbing between MEV and MRV', () => {
    const s = evaluateRP(12, landmarks)
    expect(s.signal).toBe('add_volume')
    expect(s.source_rule).toBe('climbing_to_mrv')
  })

  it('does not panic at MRV — a stall there is expected', () => {
    const s = evaluateRP(20, landmarks)
    expect(s.signal).toBe('hold')
    expect(s.severity).toBe('warn')
    expect(s.source_rule).toBe('at_mrv')
  })

  it('holds at maintenance volume during a cut instead of climbing', () => {
    const s = evaluateRP(4, landmarks, { mode: 'cutting' })
    expect(s.signal).toBe('hold')
    expect(s.source_rule).toBe('cutting_hold_mv')
  })

  it('adds a set toward MV if under it during a cut', () => {
    const s = evaluateRP(2, landmarks, { mode: 'cutting' })
    expect(s.signal).toBe('add_volume')
    expect(s.source_rule).toBe('cutting_hold_mv')
  })

  it('flags a collapsed window once a deep enough deficit pushes MEV past MRV', () => {
    const s = evaluateRP(10, landmarks, { mode: 'cutting', deficitPct: 80 })
    expect(s.source_rule).toBe('cut_window_collapsed')
    expect(s.severity).toBe('warn')
  })
})
