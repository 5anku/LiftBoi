import { describe, expect, it } from 'vitest'
import { evaluateWood } from './wood.coach.js'

const session = (weight, ok, low) => ({ mode: 'reps', goal: 10, reps: [low], weight, count: 1, low, amrap: low, ok })

describe('evaluateWood', () => {
  it('has nothing to say with no history', () => {
    expect(evaluateWood([], { id: '0025' })).toBeNull()
  })

  it('adds weight and resets to the bottom of the range on a clean top-of-range session', () => {
    const s = evaluateWood([session(50, true, 12)], { id: '0025' })
    expect(s.signal).toBe('add_weight')
    expect(s.source_coach).toBe('wood')
    expect(s.message).toContain('8-12')
  })

  it('caps a big requested increment at the 5-10% guardrail', () => {
    const s = evaluateWood([session(50, true, 12)], { id: '0025', inc: 20, maxJumpPct: 10 })
    // 10% of 50 is 5, well under the 20 requested — the guardrail wins.
    expect(s.message).toMatch(/up to 55/)
  })

  it('holds and aims one rep higher after a miss', () => {
    const s = evaluateWood([session(50, true, 12), session(50, false, 8)], { id: '0025' })
    expect(s.signal).toBe('hold')
  })

  it('calls a deload once the plateau reaches the stall threshold', () => {
    const sessions = [session(50, false, 8), session(50, false, 8), session(50, false, 8)]
    const s = evaluateWood(sessions, { id: '0025', deloadAt: 3 })
    expect(s.signal).toBe('deload')
    expect(s.source_rule).toBe('plateau_deload')
  })
})
