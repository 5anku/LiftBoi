import { describe, expect, it } from 'vitest'
import { evaluate, PROGRAM_BY_ID } from './index.js'

const session = (weight, ok, low, goal = 8) => ({ mode: 'reps', goal, reps: [low], weight, count: 1, low, amrap: low, ok })

describe('evaluate dispatch', () => {
  it('defaults to Sanku instead of throwing for an unknown/missing program', () => {
    const s = evaluate('not_a_real_program', [session(50, true, 8)], { id: '0025' })
    expect(s[0].source_coach).toBe('sanku')
    expect(evaluate(undefined, [session(50, true, 8)], { id: '0025' })[0].source_coach).toBe('sanku')
  })

  it('opts.coachId forces a specific coach regardless of programId — freestyle\'s own picker', () => {
    const s = evaluate('not_a_real_program', [session(50, true, 12)], { id: '0025', sets: 1 }, { coachId: 'mentzer' })
    expect(s[0].source_coach).toBe('mentzer')
  })

  it('routes heavy_duty to Mentzer', () => {
    const s = evaluate('heavy_duty', [session(50, true, 12)], { id: '0025', sets: 1 })
    expect(s[0].source_coach).toBe('mentzer')
  })

  it('routes a DLH program to Wood', () => {
    const s = evaluate('dlh_3day_ppl', [session(50, true, 12)], { id: '0025' })
    expect(s[0].source_coach).toBe('wood')
  })

  it('routes a Nippard program to Nippard, threading its own mechanic_variant', () => {
    const s = evaluate('min_max_4x', [session(50, true, 8)], { id: '0025' })
    expect(s[0].source_coach).toBe('nippard')
    expect(s[0].mechanic_variant).toBe('last_set_failure_tightening')
  })

  it('threads the first_set_failure_loosening variant for Phase 2 programs', () => {
    const s = evaluate('min_max_phase2_4x', [session(50, true, 8)], { id: '0025' })
    expect(s[0].mechanic_variant).toBe('first_set_failure_loosening')
  })

  it('every coach opens with an ideology message on a fresh lift rather than staying silent', () => {
    const s = evaluate('heavy_duty', [], { id: '0025' })
    expect(s).toHaveLength(1)
    expect(s[0].source_rule).toBe('ideology_first_session')
  })

  it('every program in the catalog resolves to a known coach', () => {
    const known = new Set(['mentzer', 'wood', 'nippard', 'sanku'])
    for (const p of Object.values(PROGRAM_BY_ID)) expect(known.has(p.coach_id)).toBe(true)
  })
})
