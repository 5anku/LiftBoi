import { describe, expect, it } from 'vitest'
import { evaluateMentzer } from './mentzer.coach.js'

// Sessions in progression.js's readSession() shape — oldest first.
const session = (d, weight, reps, ok) => ({ d, mode: 'reps', goal: 8, reps, weight, count: reps.length, low: Math.min(...reps), amrap: reps[reps.length - 1], ok })

describe('evaluateMentzer', () => {
  it('has nothing to say with no history', () => {
    expect(evaluateMentzer([], { id: '0025', sets: 1 })).toBeNull()
  })

  it('calls an instant weight add the moment a set overshoots the 6-10 target', () => {
    const s = evaluateMentzer([session('2024-01-01', 50, [12], true)], { id: '0025', sets: 1 })
    expect(s.signal).toBe('add_weight')
    expect(s.severity).toBe('action')
    expect(s.source_coach).toBe('mentzer')
    expect(s.message).toContain('12 reps')
  })

  it('deloads after two calendar weeks of no progress, regardless of session count', () => {
    const sessions = [
      session('2024-01-01', 50, [8], true),
      session('2024-01-08', 50, [6], false),
      session('2024-01-15', 50, [6], false),
      session('2024-01-22', 50, [6], false)
    ]
    const s = evaluateMentzer(sessions, { id: '0025', sets: 1 })
    expect(s.signal).toBe('deload')
    expect(s.source_rule).toBe('weeks_stalled_deload')
  })

  it('does not deload inside the two-week window', () => {
    const sessions = [
      session('2024-01-01', 50, [8], true),
      session('2024-01-08', 50, [6], false)
    ]
    const s = evaluateMentzer(sessions, { id: '0025', sets: 1 })
    expect(s.signal).not.toBe('deload')
  })

  it('flags more than one set as junk volume', () => {
    const s = evaluateMentzer([session('2024-01-01', 50, [8], true)], { id: '0025', sets: 3 })
    expect(s.signal).toBe('hold')
    expect(s.source_rule).toBe('junk_volume')
  })

  it('holds quietly when everything is on track', () => {
    const s = evaluateMentzer([session('2024-01-01', 50, [8], true)], { id: '0025', sets: 1 })
    expect(s.signal).toBe('hold')
    expect(s.source_rule).toBe('hold')
  })
})
