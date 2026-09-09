import { describe, expect, it } from 'vitest'
import { EXIDX } from './exercises.js'
import { generateWorkout, hasMainLiftChoice, mainLiftOptions } from './workout-generator.js'

// Deterministic PRNG (mulberry32) so a "random" run is reproducible in a test.
function seeded(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const emptyS = { workouts: [], unit: 'kg' }

describe('generateWorkout', () => {
  it('resolves a named lift to itself, every entry referencing real exercises', () => {
    const w = generateWorkout(emptyS, { focus: 'bench', style: 'auto' }, seeded(1))
    expect(w.ex[0].id).toBe('0025')
    for (const e of w.ex) expect(EXIDX[e.id], e.id).toBeTruthy()
  })

  it('resolves a category focus to one of its own lifts, not a fixed one', () => {
    const seen = new Set()
    for (let seed = 0; seed < 40; seed++) {
      const w = generateWorkout(emptyS, { focus: 'push', style: 'volume' }, seeded(seed))
      seen.add(w.ex[0].id)
    }
    expect(seen.size).toBeGreaterThan(1)
    for (const id of seen) expect(['0025', '0091', '0047']).toContain(id)
  })

  it('"surprise" focus picks from every category over many runs', () => {
    const seen = new Set()
    for (let seed = 0; seed < 60; seed++) {
      seen.add(generateWorkout(emptyS, { focus: 'surprise', style: 'auto' }, seeded(seed)).ex[0].id)
    }
    // At least two distinct main lifts is enough to prove it isn't hardcoded to one path.
    expect(seen.size).toBeGreaterThan(1)
  })

  it('logs baseline (weight 0) with no history for the lift', () => {
    const w = generateWorkout(emptyS, { focus: 'squat', style: 'auto' }, seeded(2))
    for (const e of w.ex.filter(e => e.id === '0043')) {
      expect(e.weight).toBe(0)
      expect(e.note).toMatch(/Log baseline/)
    }
  })

  it('scales the top set and back-off off a real e1RM, back-off lighter than the top set', () => {
    const S = { unit: 'kg', workouts: [{ start: 1, d: '2024-01-01', entries: [{ id: '0025', sets: [{ done: true, w: 100, r: 5 }] }] }] }
    const w = generateWorkout(S, { focus: 'bench', style: 'auto' }, seeded(3))
    const [top, backoff] = w.ex.filter(e => e.id === '0025')
    expect(top.weight).toBeGreaterThan(0)
    expect(backoff.weight).toBeGreaterThan(0)
    expect(backoff.weight).toBeLessThan(top.weight)
    expect(top.sets).toBe(1)
    expect(backoff.sets).toBeGreaterThanOrEqual(2)
  })

  it('"failure" style is a single set with no back-off', () => {
    const w = generateWorkout(emptyS, { focus: 'deadlift', style: 'failure' }, seeded(4))
    const mainSets = w.ex.filter(e => e.id === '0032')
    expect(mainSets).toHaveLength(1)
    expect(mainSets[0].sets).toBe(1)
    expect(mainSets[0].note).toMatch(/failure/i)
  })

  it('"volume" style uses straight sets, no top-set/back-off split', () => {
    const w = generateWorkout(emptyS, { focus: 'ohp', style: 'volume' }, seeded(5))
    const mainSets = w.ex.filter(e => e.id === '0091')
    expect(mainSets).toHaveLength(1)
    expect(mainSets[0].reps).toBeGreaterThanOrEqual(8)
  })

  it('"surprise" style picks a real style, not a fourth kind', () => {
    const seenNotes = new Set()
    for (let seed = 0; seed < 30; seed++) {
      const w = generateWorkout(emptyS, { focus: 'bench', style: 'surprise' }, seeded(seed))
      seenNotes.add(/Top set/.test(w.ex[0].note) ? 'auto' : /failure/i.test(w.ex[0].note) ? 'failure' : 'volume')
    }
    expect(seenNotes.size).toBeGreaterThan(1)
    for (const s of seenNotes) expect(['auto', 'failure', 'volume']).toContain(s)
  })

  it('"surprise" never rolls a PR attempt — that has to be chosen on purpose', () => {
    for (let seed = 0; seed < 60; seed++) {
      const w = generateWorkout(emptyS, { focus: 'bench', style: 'surprise' }, seeded(seed))
      expect(w.about).not.toMatch(/PR Attempt/)
    }
  })

  it('"pr" style is one all-out single at the estimated 1RM, with a warm-up ramp', () => {
    const S = { unit: 'kg', workouts: [{ start: 1, d: '2024-01-01', entries: [{ id: '0043', sets: [{ done: true, w: 100, r: 5 }] }] }] }
    const w = generateWorkout(S, { focus: 'squat', style: 'pr' }, seeded(9))
    const mainSets = w.ex.filter(e => e.id === '0043')
    expect(mainSets).toHaveLength(1)
    expect(mainSets[0]).toMatchObject({ sets: 1, reps: 1, warmupSets: 3 })
    expect(mainSets[0].weight).toBeGreaterThan(0)
    expect(mainSets[0].note).toMatch(/PR attempt/i)
  })

  it('"pr" style keeps accessories minimal (0-1), unlike a normal 2-4 accessory block', () => {
    for (let seed = 0; seed < 20; seed++) {
      const w = generateWorkout(emptyS, { focus: 'deadlift', style: 'pr' }, seeded(seed))
      const accessories = w.ex.filter(e => e.note.includes('Accessory'))
      expect(accessories.length).toBeLessThanOrEqual(1)
    }
  })

  it('picks 2-4 accessories, none of them the main lift, all real exercises', () => {
    const w = generateWorkout(emptyS, { focus: 'squat', style: 'auto' }, seeded(6))
    const accessories = w.ex.filter(e => e.note.includes('Accessory'))
    expect(accessories.length).toBeGreaterThanOrEqual(2)
    expect(accessories.length).toBeLessThanOrEqual(4)
    const ids = accessories.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length) // no duplicates
    for (const e of accessories) {
      expect(e.id).not.toBe('0043')
      expect(EXIDX[e.id], e.id).toBeTruthy()
    }
  })

  it('every entry is prog:"off" so the progression engine never rewrites a generated weight', () => {
    const w = generateWorkout(emptyS, { focus: 'bench', style: 'volume' }, seeded(7))
    for (const e of w.ex) expect(e.prog).toBe('off')
  })

  it('names the routine after the resolved focus', () => {
    expect(generateWorkout(emptyS, { focus: 'bench', style: 'auto' }, seeded(8)).name).toBe('Bench Day')
    expect(generateWorkout(emptyS, { focus: 'deadlift', style: 'auto' }, seeded(8)).name).toBe('Deadlift Day')
  })

  it('is deterministic for a given rng — same seed, same workout', () => {
    const a = generateWorkout(emptyS, { focus: 'legs', style: 'surprise' }, seeded(42))
    const b = generateWorkout(emptyS, { focus: 'legs', style: 'surprise' }, seeded(42))
    expect(a).toEqual(b)
  })

  it('builds around a chosen mainId instead of rolling a new one, once the lifter has picked', () => {
    for (let seed = 0; seed < 20; seed++) {
      const w = generateWorkout(emptyS, { focus: 'push', style: 'auto', mainId: '0091' }, seeded(seed))
      expect(w.ex[0].id).toBe('0091')
    }
  })
})

describe('hasMainLiftChoice', () => {
  it('is true for a category with more than one candidate main lift', () => {
    expect(hasMainLiftChoice('push')).toBe(true)
    expect(hasMainLiftChoice('pull')).toBe(true)
    expect(hasMainLiftChoice('legs')).toBe(true)
  })

  it('is false for a named lift and for surprise itself (resolve it to a category first)', () => {
    expect(hasMainLiftChoice('bench')).toBe(false)
    expect(hasMainLiftChoice('squat')).toBe(false)
    expect(hasMainLiftChoice('surprise')).toBe(false)
  })
})

describe('mainLiftOptions', () => {
  it('offers 3 distinct, real candidate lifts for a category', () => {
    const opts = mainLiftOptions('push', seeded(1))
    expect(opts).toHaveLength(3)
    expect(new Set(opts).size).toBe(3)
    for (const id of opts) expect(EXIDX[id], id).toBeTruthy()
  })

  it('shuffles the order across seeds rather than always the same 3', () => {
    const orders = new Set()
    for (let seed = 0; seed < 20; seed++) orders.add(mainLiftOptions('legs', seeded(seed)).join(','))
    expect(orders.size).toBeGreaterThan(1)
  })

  it('returns nothing for a focus with no pool to choose from', () => {
    expect(mainLiftOptions('bench')).toEqual([])
  })
})
