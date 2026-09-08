import { describe, expect, it } from 'vitest'
import { doubleProgression, repWord, backoffFor } from './progression-mechanics.js'

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

describe('repWord', () => {
  // A real bug caught live: a session with one missed set (logged 0) aimed for "1 reps" —
  // grammatically wrong, and every coach message that reports a rep count can hit this.
  it('keeps 1 singular and everything else plural', () => {
    expect(repWord(1)).toBe('1 rep')
    expect(repWord(0)).toBe('0 reps')
    expect(repWord(2)).toBe('2 reps')
    expect(repWord(8)).toBe('8 reps')
  })
})

describe('backoffFor', () => {
  it('halves the weight and doubles the achieved reps', () => {
    expect(backoffFor(100, 5)).toEqual({ weight: 50, reps: 10 })
  })

  it('rounds the halved weight to the nearest 0.5 (real plate math)', () => {
    // half of 105 is 52.5 -- already on a 0.5 grid, so it should land exactly there, not drift.
    expect(backoffFor(105, 3)).toEqual({ weight: 52.5, reps: 6 })
  })

  it('still prescribes a real backoff after a total failure (0 reps achieved)', () => {
    // A missed lift isn't "0 reps forever" -- floor the reps at 1 so doubling still means something.
    expect(backoffFor(190, 0)).toEqual({ weight: 95, reps: 2 })
  })
})
