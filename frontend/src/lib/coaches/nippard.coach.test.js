import { describe, expect, it } from 'vitest'
import { evaluateNippard, VARIANTS } from './nippard.coach.js'

const session = (weight, ok, low, rir) => ({ mode: 'reps', goal: 8, reps: [low], weight, count: 1, low, amrap: low, ok, rir: [rir ?? null] })

describe('evaluateNippard', () => {
  it('rejects an unknown mechanic variant rather than guessing', () => {
    expect(() => evaluateNippard([], { id: '0025' }, 'made_up')).toThrow()
  })

  it('lists exactly the 4 documented variants', () => {
    expect(VARIANTS).toHaveLength(4)
  })

  for (const variant of ['last_set_failure_tightening', 'first_set_failure_loosening']) {
    describe(variant, () => {
      it('opens with the RPE ideology on a fresh lift, not silence', () => {
        const s = evaluateNippard([], { id: '0025' }, variant)
        expect(s.source_rule).toBe('ideology_first_session')
        expect(s.message).toContain('RIR')
      })

      it('flags a set rated too far from failure to autoregulate off', () => {
        const s = evaluateNippard([session(50, false, 6, 4)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.source_rule).toBe('rpe_autoregulation')
        expect(s.message).toContain('short of failure')
      })

      it('flags rating every set at zero as no longer a useful signal', () => {
        const s = evaluateNippard([session(50, false, 6, 0)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.source_rule).toBe('rpe_autoregulation')
      })

      it('stays quiet on RPE when the rating is in the sweet spot', () => {
        const s = evaluateNippard([session(50, false, 6, 1.5)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.source_rule).toBe('double_progression_range_extend')
      })

      it('adds weight and resets to the bottom on a clean top-of-range session', () => {
        const s = evaluateNippard([session(50, true, 8)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.signal).toBe('add_weight')
        expect(s.mechanic_variant).toBe(variant)
      })

      it('extends the range upward instead of resetting on a stall past the top', () => {
        const s = evaluateNippard([session(50, false, 9)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.signal).toBe('hold')
        expect(s.message).toContain('extends')
      })

      it('holds and aims one rep higher on an ordinary miss', () => {
        const s = evaluateNippard([session(50, false, 6)], { id: '0025', bottom: 6, top: 8, inc: 2.5 }, variant)
        expect(s.signal).toBe('hold')
        expect(s.message).toContain('7 reps')
      })
    })
  }

  for (const variant of ['top_set_pct1rm_rpe_wave', 'pct1rm_rpe_periodized_technique_rich']) {
    describe(variant, () => {
      it('opens with the RPE ideology on a fresh lift, not silence', () => {
        const s = evaluateNippard([], { id: '0043' }, variant)
        expect(s.source_rule).toBe('ideology_first_session')
      })

      it('reports the logged weight without judging wave progression', () => {
        const s = evaluateNippard([session(94, true, 1)], { id: '0043' }, variant)
        expect(s.signal).toBe('hold')
        expect(s.source_rule).toBe('wave_progression_unavailable')
        expect(s.mechanic_variant).toBe(variant)
      })
    })
  }
})
