import { describe, expect, it } from 'vitest'
import { reactToSet } from './live-reaction.js'

describe('reactToSet', () => {
  it('has nothing to say without a rep target (cardio, bodyweight with no goal)', () => {
    expect(reactToSet('mentzer', { reps: 10, weight: 0, goal: 0, best: 0, isLastWorkSet: false })).toBeNull()
  })

  it('celebrates a set that both hits the target and beats the lift\'s best-ever weight', () => {
    const s = reactToSet('sanku', { reps: 8, weight: 105, goal: 8, best: 100, isLastWorkSet: false })
    expect(s.source_rule).toBe('new_best')
    expect(s.source_coach).toBe('sanku')
  })

  it('does not call a PR if the rep target was not actually met', () => {
    const s = reactToSet('sanku', { reps: 5, weight: 105, goal: 8, best: 100, isLastWorkSet: false })
    expect(s.source_rule).not.toBe('new_best')
  })

  it('closes out the exercise on the last work set, ahead of an ordinary hit', () => {
    const s = reactToSet('wood', { reps: 8, weight: 50, goal: 8, best: 60, isLastWorkSet: true })
    expect(s.source_rule).toBe('last_set')
  })

  it('calls a clean hit when reps met the target mid-exercise', () => {
    const s = reactToSet('mentzer', { reps: 8, weight: 50, goal: 8, best: 60, isLastWorkSet: false })
    expect(s.source_rule).toBe('hit')
  })

  it('reads one rep short as a close miss', () => {
    const s = reactToSet('nippard', { reps: 7, weight: 50, goal: 8, best: 60, isLastWorkSet: false })
    expect(s.source_rule).toBe('close_miss')
  })

  it('reads two or more reps short as a big miss', () => {
    const s = reactToSet('nippard', { reps: 5, weight: 50, goal: 8, best: 60, isLastWorkSet: false })
    expect(s.source_rule).toBe('big_miss')
  })

  it('falls back to Sanku\'s voice for an unknown coach id', () => {
    const s = reactToSet('made_up', { reps: 8, weight: 50, goal: 8, best: 50, isLastWorkSet: false })
    expect(s.message).toBe(reactToSet('sanku', { reps: 8, weight: 50, goal: 8, best: 50, isLastWorkSet: false }).message)
  })
})
