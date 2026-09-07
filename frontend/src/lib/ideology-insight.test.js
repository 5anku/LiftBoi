import { describe, expect, it } from 'vitest'
import { spotPrinciple } from './ideology-insight.js'

const set = (over) => ({ done: true, w: 100, r: 8, ...over })
const workout = entries => ({ entries })

describe('spotPrinciple', () => {
  it('spots a set taken to true failure', () => {
    const S = { workouts: [] }
    const w = workout([{ id: '0025', sets: [set({ rir: 0 })] }])
    expect(spotPrinciple(S, w)).toMatch(/break-over point/)
  })

  it('spots more sets than last time on the same exercise', () => {
    const S = { workouts: [{ d: '2024-01-01', entries: [{ id: '0025', sets: [set(), set()] }] }] }
    const w = workout([{ id: '0025', sets: [set(), set(), set()] }])
    expect(spotPrinciple(S, w)).toMatch(/MRV/)
  })

  it('stays quiet when nothing clearly applies', () => {
    const S = { workouts: [{ d: '2024-01-01', entries: [{ id: '0025', sets: [set(), set()] }] }] }
    const w = workout([{ id: '0025', sets: [set(), set()] }])
    expect(spotPrinciple(S, w)).toBeNull()
  })

  it('ignores warm-ups on both sides of the comparison', () => {
    const S = { workouts: [] }
    const w = workout([{ id: '0025', sets: [set({ warmup: true, rir: 0 })] }])
    expect(spotPrinciple(S, w)).toBeNull()
  })
})
