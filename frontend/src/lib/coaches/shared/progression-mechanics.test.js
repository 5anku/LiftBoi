import { describe, expect, it } from 'vitest'
import { doubleProgression } from './progression-mechanics.js'

// Sessions in progression.js's own readSession() shape — oldest first.
const session = (weight, ok, low = ok ? 8 : 6) => ({ mode: 'reps', goal: 8, reps: [low], weight, count: 1, low, amrap: low, ok })

describe('doubleProgression', () => {
  it('has no opinion with nothing logged yet', () => {
    expect(doubleProgression([], { bottom: 6, top: 8, inc: 2.5 })).toEqual({ kind: 'first' })
  })

  it('adds weight and resets to the bottom of the range on a clean top-of-range session', () => {
    const r = doubleProgression([session(50, true, 8)], { bottom: 6, top: 8, inc: 2.5 })
    expect(r).toEqual({ kind: 'up', weight: 52.5, reps: 6, stalls: 0 })
  })

  it('caps the jump at maxJumpPct instead of the full increment', () => {
    // 10% of 50 is 5, well under the 10kg increment, so the guardrail — not the increment — wins.
    const r = doubleProgression([session(50, true, 8)], { bottom: 6, top: 8, inc: 10, maxJumpPct: 10 })
    expect(r.weight).toBe(55)
  })

  it('holds and aims one rep higher after a single miss', () => {
    const sessions = [session(50, true, 8), session(50, false, 6)]
    const r = doubleProgression(sessions, { bottom: 6, top: 8, inc: 2.5, deloadAt: 3 })
    expect(r).toEqual({ kind: 'hold', weight: 50, reps: 7, stalls: 1 })
  })

  it('never aims past the top of the range while holding', () => {
    const sessions = [session(50, false, 8)]
    const r = doubleProgression(sessions, { bottom: 6, top: 8, inc: 2.5, deloadAt: 3 })
    expect(r.reps).toBe(8)
  })

  it('deloads once the stall count reaches the threshold', () => {
    const sessions = [session(50, false, 6), session(50, false, 6), session(50, false, 6)]
    const r = doubleProgression(sessions, { bottom: 6, top: 8, inc: 2.5, deloadAt: 3 })
    expect(r.kind).toBe('deload')
    expect(r.weight).toBeLessThan(50)
    expect(r.reps).toBe(6)
    expect(r.stalls).toBe(3)
  })
})
