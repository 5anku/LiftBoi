import { describe, expect, it } from 'vitest'
import { EXIDX } from './exercises.js'
import { buildStarterPlan, starterPlanDays, starterPlanOptions, starterRoutines } from './starter.js'

// The library plans added on top of the original four — RPE/volume-landmark programs sourced
// from a specific written program, not generic templates. Their exercise picks and rep/RPE
// notes are training content, not invariants worth pinning verbatim here (that would just be a
// change-detector test); what's worth protecting is that every one is structurally sound.
const EXTENDED_PLAN_IDS = [
  'ulppl', 'hit', 'pure-strength', 'pure-hypertrophy', 'classic-full-body',
  'powerbuild-ul', 'ppl-6day', 'minmax', 'cutting', 'peak', 'travel', 'chest-back-focus',
  'heavy_duty', 'min_max_4x', 'min_max_5x', 'min_max_phase2_4x', 'min_max_phase2_5x',
  'powerbuilding_3_4x', 'powerbuilding_3_5x', 'upper_lower_4x_nippard',
  'dlh_3day_ppl', 'dlh_6day_ppl', 'dlh_upper_lower_fullbody'
]

// The approved prescription, written out again rather than imported: a test that reads the
// same table as the code would pass no matter what that table said. [weekday, name, sets].
const APPROVED = {
  ppl: [
    [1, 'Push Day', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
    [3, 'Pull Day', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
    [5, 'Leg Day', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]],
  ],
  'upper-lower': [
    [1, 'Upper A', [['0025', 3, 8], ['2330', 3, 10], ['0047', 2, 10], ['1323', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0031', 2, 12]]],
    [2, 'Lower A', [['0043', 3, 8], ['0085', 3, 8], ['0739', 2, 10], ['0586', 2, 12], ['0605', 3, 15]]],
    [4, 'Upper B', [['0047', 3, 8], ['0027', 3, 8], ['0426', 2, 10], ['2330', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0313', 2, 12]]],
    [5, 'Lower B', [['0739', 3, 10], ['0085', 2, 10], ['0585', 2, 12], ['0586', 3, 12], ['0605', 3, 15]]],
  ],
  'full-body': [
    [1, 'Full Body A', [['0043', 3, 8], ['0025', 3, 8], ['2330', 3, 10], ['0586', 3, 12], ['0334', 2, 12], ['0031', 2, 12]]],
    [3, 'Full Body B', [['0085', 3, 8], ['0047', 3, 10], ['1323', 3, 10], ['0585', 3, 12], ['0334', 2, 12], ['0241', 2, 12]]],
    [5, 'Full Body C', [['0739', 3, 10], ['0025', 2, 10], ['0027', 3, 10], ['0426', 2, 10], ['0586', 3, 12], ['0605', 3, 15]]],
  ],
  '5x5': [
    [1, '5×5 A', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
    [3, '5×5 B', [['0085', 5, 5], ['0426', 5, 5], ['2330', 5, 5]]],
    [5, '5×5 C', [['0739', 5, 5], ['0047', 5, 5], ['1323', 5, 5]]],
  ],
}

const shape = r => r.ex.map(e => [e.id, e.sets, e.reps])

describe('starter plan catalog', () => {
  it('offers the original four plans plus the extended library, with the day count read off the schedule', () => {
    const ids = starterPlanOptions().map(o => o.id)
    expect(ids).toEqual(['ppl', 'upper-lower', 'full-body', '5x5', ...EXTENDED_PLAN_IDS])
    for (const { id, days } of starterPlanOptions()) expect(starterPlanDays(id)).toHaveLength(days)
  })

  it('changes nothing for an unknown plan id', () => {
    expect(buildStarterPlan('nope')).toBeNull()
    expect(buildStarterPlan(undefined)).toBeNull()
    // A click handler wired straight to a loader would hand the event in as the plan.
    expect(buildStarterPlan({ type: 'click' })).toBeNull()
    expect(starterPlanDays('nope')).toBeNull()
  })
})

describe.each(Object.keys(APPROVED))('%s', planId => {
  const approved = APPROVED[planId]

  it('builds the approved exercises, sets and reps in order', () => {
    const { routines } = buildStarterPlan(planId)
    expect(routines.map(r => r.name)).toEqual(approved.map(([, name]) => name))
    routines.forEach((r, i) => expect(shape(r)).toEqual(approved[i][2]))
  })

  it('puts each routine on its approved weekday, by identity not position', () => {
    const { routines, schedule } = buildStarterPlan(planId)
    const nameOf = Object.fromEntries(routines.map(r => [r.id, r.name]))
    expect(schedule.map(({ day, routineId }) => [day, nameOf[routineId]]))
      .toEqual(approved.map(([day, name]) => [day, name]))
  })

  it('references only real exercises and starts every one at weight 0', () => {
    for (const r of buildStarterPlan(planId).routines) {
      for (const e of r.ex) {
        expect(EXIDX[e.id], e.id).toBeTruthy()
        expect(e.sets).toBeGreaterThan(0)
        expect(e.reps).toBeGreaterThan(0)
        expect(e.weight).toBe(0)
      }
    }
  })

  it('mints fresh ids and independent objects on every build', () => {
    const first = buildStarterPlan(planId)
    const second = buildStarterPlan(planId)
    const ids = first.routines.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(second.routines.some(r => ids.includes(r.id))).toBe(false)
    expect(first.routines[0].ex[0]).not.toBe(second.routines[0].ex[0])
    // and the static definition survives a caller mutating what it got back
    first.routines[0].ex[0].sets = 99
    expect(buildStarterPlan(planId).routines[0].ex[0].sets).toBe(approved[0][2][0][1])
  })
})

describe.each(EXTENDED_PLAN_IDS)('extended program library: %s', planId => {
  it('resolves to a real, well-formed plan', () => {
    const days = starterPlanDays(planId)
    expect(days).not.toBeNull()
    expect(days.length).toBeGreaterThan(0)
    // every weekday is Mon(1)..Sun(7), so a typo'd schedule tuple can't silently pass
    for (const d of days) expect(d).toBeGreaterThanOrEqual(1) && expect(d).toBeLessThanOrEqual(7)

    const built = buildStarterPlan(planId)
    expect(built.routines.length).toBeGreaterThan(0)
    // schedule length can exceed routine count (a routine repeated across multiple weekdays,
    // e.g. push/pull/legs run twice a week), but never reference a routine that wasn't built
    const routineIds = new Set(built.routines.map(r => r.id))
    for (const { routineId } of built.schedule) expect(routineIds.has(routineId)).toBe(true)
  })

  it('references only real exercises with positive sets/reps and non-negative seeded weight', () => {
    for (const r of buildStarterPlan(planId).routines) {
      expect(r.ex.length).toBeGreaterThan(0)
      for (const e of r.ex) {
        expect(EXIDX[e.id], `${planId}/${r.name}: unknown exercise id ${e.id}`).toBeTruthy()
        expect(e.sets).toBeGreaterThan(0)
        expect(e.reps).toBeGreaterThan(0)
        expect(e.weight).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('mints fresh ids and independent objects on every build', () => {
    const first = buildStarterPlan(planId)
    const second = buildStarterPlan(planId)
    const ids = first.routines.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(second.routines.some(r => ids.includes(r.id))).toBe(false)
    expect(first.routines[0].ex[0]).not.toBe(second.routines[0].ex[0])
  })
})

describe('pure-strength superset', () => {
  it('links the Face Pull + Curl finisher via a shared sg', () => {
    const { routines } = buildStarterPlan('pure-strength')
    const accessory = routines.find(r => r.name === '4 — Repeat/Accessory')
    const [facePull, curl] = accessory.ex.slice(-2)
    expect(facePull.sg).toBeTruthy()
    expect(facePull.sg).toBe(curl.sg)
  })
})

describe('starterRoutines (the demo build entry point)', () => {
  it('still returns push, pull and legs unchanged', () => {
    const routines = starterRoutines()
    expect(routines.map(r => r.name)).toEqual(['Push Day', 'Pull Day', 'Leg Day'])
    routines.forEach((r, i) => expect(shape(r)).toEqual(APPROVED.ppl[i][2]))
    expect(routines.map(r => r.emoji)).toEqual(['barbell', 'pullup', 'legs'])
  })

  it('mints fresh ids on every invocation', () => {
    const first = starterRoutines().map(r => r.id)
    const second = starterRoutines().map(r => r.id)
    expect(new Set([...first, ...second]).size).toBe(6)
  })
})
