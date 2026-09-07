import { describe, expect, it } from 'vitest'
import { PROGRAM_META, recommendPrograms } from './program-recommender.js'
import { starterPlanDays, starterPlanOptions } from './starter.js'

describe('program-recommender', () => {
  it('every entry in PROGRAM_META names a real, loadable starter plan with a matching day count', () => {
    const known = new Set(starterPlanOptions().map(o => o.id))
    for (const [id, meta] of Object.entries(PROGRAM_META)) {
      expect(known.has(id), id).toBe(true)
      expect(starterPlanDays(id)).toHaveLength(meta.days)
    }
  })

  it('ranks every program, best score first', () => {
    const ranked = recommendPrograms({ days: 5, goal: 'balanced', philosophy: 'auto' })
    expect(ranked).toHaveLength(Object.keys(PROGRAM_META).length)
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score)
  })

  it('a perfect match for ulppl scores higher than everything else', () => {
    const ranked = recommendPrograms({ days: 5, goal: 'balanced', philosophy: 'auto' })
    expect(ranked[0].id).toBe('ulppl')
    expect(ranked[0].score).toBe(6) // 3 (days) + 2 (goal) + 1 (philosophy)
  })

  it('weighs days over goal over philosophy when answers conflict', () => {
    // pure-strength: 4 days, strength, auto. Give it the right days and philosophy but the
    // wrong goal, against a program that only matches on goal — days+philosophy should still win.
    const ranked = recommendPrograms({ days: 4, goal: 'size', philosophy: 'auto' })
    const psScore = ranked.find(r => r.id === 'pure-strength').score
    const phScore = ranked.find(r => r.id === 'pure-hypertrophy').score // 6 days, size, volume: only goal matches
    expect(psScore).toBe(4) // 3 (days) + 0 (goal) + 1 (philosophy)
    expect(phScore).toBe(2) // 0 + 2 (goal) + 0
    expect(psScore).toBeGreaterThan(phScore)
  })

  it('a travel-minimal-equipment answer surfaces the travel program near the top', () => {
    const ranked = recommendPrograms({ days: 3, goal: 'travel', philosophy: 'failure' })
    expect(ranked[0].id).toBe('travel')
  })

  it('an unanswered/unknown axis just scores zero on that axis rather than throwing', () => {
    expect(() => recommendPrograms({ days: null, goal: null, philosophy: null })).not.toThrow()
    const ranked = recommendPrograms({ days: null, goal: null, philosophy: null })
    expect(ranked.every(r => r.score === 0)).toBe(true)
  })
})
