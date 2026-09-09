import { describe, expect, it } from 'vitest'
import { EXDB } from './exercises.js'
import { similarExercises } from './exercise-similar.js'

const ex = (id, n, tg, bp, eq) => ({ id, n, tg, bp, eq })

describe('similarExercises', () => {
  const pool = [
    ex('bench', 'barbell bench press', 'pectorals', 'chest', 'barbell'),
    ex('inclinepress', 'incline dumbbell press', 'pectorals', 'chest', 'dumbbell'),
    ex('fly', 'cable fly', 'pectorals', 'chest', 'cable'),
    ex('inclinefly', 'incline cable fly', 'pectorals', 'chest', 'cable'),
    ex('row', 'barbell row', 'upper back', 'back', 'barbell'),
    ex('curl', 'barbell curl', 'biceps', 'arms', 'barbell'),
  ]

  it('never includes the exercise itself', () => {
    const out = similarExercises(pool, pool[0])
    expect(out.some(e => e.id === 'bench')).toBe(false)
  })

  it('ranks the same movement (press) over a different one (fly) on the same muscle', () => {
    const out = similarExercises(pool, pool[0]) // bench press
    expect(out[0].id).toBe('inclinepress')
  })

  it('ranks the same movement (fly) over a press when swapping a fly', () => {
    const out = similarExercises(pool, pool[2]) // cable fly
    expect(out[0].id).toBe('inclinefly')
  })

  it('never crosses target muscle when the target pool is big enough', () => {
    const out = similarExercises(pool, pool[0], 3)
    for (const e of out) expect(e.tg).toBe('pectorals')
    expect(out.some(e => e.id === 'row' || e.id === 'curl')).toBe(false)
  })

  it('falls back to the body part when the target-muscle pool is too thin', () => {
    const thin = [
      ex('main', 'seated calf raise', 'calves', 'legs', 'machine'),
      ex('other-leg', 'leg extension', 'quadriceps', 'legs', 'machine'),
      ex('other-leg2', 'leg curl', 'hamstrings', 'legs', 'machine'),
    ]
    const out = similarExercises(thin, thin[0], 2)
    expect(out.length).toBe(2)
    for (const e of out) expect(e.bp).toBe('legs')
  })

  it('prefers a candidate sharing equipment when movement words tie', () => {
    const tied = [
      ex('main', 'barbell row', 'upper back', 'back', 'barbell'),
      ex('barbell-row-2', 'pendlay row', 'upper back', 'back', 'barbell'),
      ex('cable-row', 'seated cable row', 'upper back', 'back', 'cable'),
    ]
    const out = similarExercises(tied, tied[0])
    expect(out[0].id).toBe('barbell-row-2')
  })

  it('holds up against the real exercise library — bench press swaps toward another press', () => {
    const benchPress = EXDB.find(e => e.id === '0025')
    const out = similarExercises(EXDB, benchPress, 5)
    expect(out.length).toBeGreaterThan(0)
    expect(out.some(e => e.n.includes('press'))).toBe(true)
    expect(out.some(e => e.id === '0025')).toBe(false)
  })
})
