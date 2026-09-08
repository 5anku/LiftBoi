import { describe, expect, it } from 'vitest'
import { evaluateSanku } from './sanku.coach.js'

const session = (weight, ok, low, goal = 8) => ({ mode: 'reps', goal, reps: [low], weight, count: 1, low, amrap: low, ok })

describe('evaluateSanku', () => {
  it('has nothing to say with no history', () => {
    expect(evaluateSanku([], { id: '0025' })).toEqual([])
  })

  it('adds weight on a clean top-of-range session, with no backoff prompt', () => {
    const s = evaluateSanku([session(50, true, 10, 10)], { id: '0025' })
    expect(s).toHaveLength(1)
    expect(s[0].signal).toBe('add_weight')
  })

  it('deloads after 3 stalled sessions — one more than Mentzer', () => {
    const sessions = [session(50, false, 6), session(50, false, 6), session(50, false, 6)]
    const s = evaluateSanku(sessions, { id: '0025' })
    expect(s[0].signal).toBe('deload')
    expect(s[0].source_rule).toBe('stalled_sessions_deload')
  })

  it('adds a backoff prompt alongside the hold when the miss looks pushable', () => {
    const s = evaluateSanku([session(50, false, 4, 8)], { id: '0025' })
    expect(s).toHaveLength(2)
    expect(s[0].signal).toBe('hold')
    expect(s[1].signal).toBe('backoff_now')
    expect(s[1].source_coach).toBe('sanku')
  })

  it('does not prompt a backoff for a near-miss', () => {
    const s = evaluateSanku([session(50, false, 7, 8)], { id: '0025' })
    expect(s.every(x => x.signal !== 'backoff_now')).toBe(true)
  })
})
