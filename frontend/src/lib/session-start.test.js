import { describe, it, expect } from 'vitest'
import { buildSessionEntries } from './session-start.js'
import { isWarmupRow } from './workout-model.js'

// The session builder used by the live start and by "log a past workout".
describe('buildSessionEntries', () => {
  const st = { unit: 'kg', workouts: [], exWeights: {}, routines: [] }

  it('ramps the warm-ups on the exercise’s own increment, not the unit default', () => {
    const r = { id: 'r', prog: 'off', ex: [{ id: '0025', sets: 3, reps: 5, weight: 60, inc: 1.25, warmupSets: 2 }] }
    const { entries } = buildSessionEntries(st, r)
    const warm = entries[0].sets.filter(isWarmupRow).map(s => s.w)
    expect(warm).toHaveLength(2)
    for (const w of warm) expect(Math.round(w / 1.25 * 1000) / 1000 % 1).toBe(0)   // a multiple of 1.25
    expect(entries[0].sets.filter(s => !isWarmupRow(s)).every(s => s.w === 60)).toBe(true)
  })

  it('keeps the unit default for timed exercises, whose inc is seconds', () => {
    const r = { id: 'r', prog: 'off', ex: [{ id: '0025', mode: 'time', sets: 2, sec: 30, inc: 10, weight: 0 }] }
    const { entries } = buildSessionEntries(st, r)
    expect(entries[0].sets.every(s => s.sec === 30)).toBe(true)
  })

  // The active program's coach (lib/coaches) — a routine only gets asked when starter.js tagged
  // it with a programId, same gate progression itself uses for excludeFromProgression.
  it('asks the active program’s coach when the routine carries a programId', () => {
    const stWithHistory = { unit: 'kg', exWeights: {}, workouts: [{ d: '2024-01-01', entries: [{ id: '0025', sets: [{ done: true, r: 12, w: 50 }] }] }] }
    const r = { id: 'r', programId: 'heavy_duty', ex: [{ id: '0025', sets: 1, reps: 8, weight: 50, prog: 'off' }] }
    const { entries } = buildSessionEntries(stWithHistory, r)
    expect(entries[0].coach[0].signal).toBe('add_weight')
    expect(entries[0].coach[0].source_coach).toBe('mentzer')
  })

  it('defaults to Sanku for a routine with no recognized program, opening with his ideology on a fresh lift', () => {
    const r = { id: 'r', ex: [{ id: '0025', sets: 1, reps: 8, weight: 50, prog: 'off' }] }
    const { entries } = buildSessionEntries(st, r)
    expect(entries[0].coach[0].source_coach).toBe('sanku')
    expect(entries[0].coach[0].source_rule).toBe('ideology_first_session')
  })

  it('has Sanku actually speak up for an uncoached routine once there is real history', () => {
    const stWithHistory = {
      unit: 'kg', exWeights: {},
      workouts: [
        { d: '2024-01-01', entries: [{ id: '0025', sets: [{ done: true, r: 8, w: 50 }] }] },
        { d: '2024-01-08', entries: [{ id: '0025', sets: [{ done: true, r: 4, w: 50 }] }] },
        { d: '2024-01-15', entries: [{ id: '0025', sets: [{ done: true, r: 4, w: 50 }] }] },
        { d: '2024-01-22', entries: [{ id: '0025', sets: [{ done: true, r: 4, w: 50 }] }] },
      ],
    }
    // A plain custom routine — no programId, no coach_id to look up. This used to mean silence;
    // Sanku is now the default for exactly this case (issue: coach pops up by default).
    const r = { id: 'r', ex: [{ id: '0025', sets: 1, reps: 8, weight: 50, prog: 'off' }] }
    const { entries } = buildSessionEntries(stWithHistory, r)
    expect(entries[0].coach[0].source_coach).toBe('sanku')
    expect(entries[0].coach[0].signal).toBe('deload')
  })

  it('skips the coach on a planned deload, same as it skips progression', () => {
    const r = { id: 'r', programId: 'heavy_duty', excludeFromProgression: true, ex: [{ id: '0025', sets: 1, reps: 8, weight: 50 }] }
    const { entries } = buildSessionEntries(st, r)
    expect(entries[0].coach).toEqual([])
  })
})
