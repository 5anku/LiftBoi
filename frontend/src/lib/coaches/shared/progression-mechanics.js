// Generic double-progression math shared by every coach that uses it (Nippard's variants, Wood's
// guardrail version). A utility, not a voice: it only knows the shape of the decision (top of the
// range → add weight, else extend/reset the range, else deload on a long enough stall) — each
// coach supplies its own numbers (rep range, increment, deload threshold, optional jump guardrail).
// Reuses progression.js's own session shape and stall-counting rather than inventing a new one.
import { stallCount, snapWeight } from '../../progression.js'

// "1 rep" reads right; "1 reps" doesn't. Every coach message built off a rep count uses this.
export const repWord = n => n === 1 ? '1 rep' : `${n} reps`

/**
 * The backoff Sanku's coach prompts after a miss: ~half the weight, ~double the reps, to
 * genuine exhaustion. A live "mark this set failed" action needs the exact same math with only
 * the one set in front of it — no session history — so it lives here rather than inside
 * sanku.coach.js, which calls this too instead of keeping its own copy.
 * @param {number} weight - the weight actually lifted on the failed set
 * @param {number} achievedReps - reps actually completed (0 for a total failure)
 * @returns {{ weight: number, reps: number }}
 */
export function backoffFor(weight, achievedReps) {
  return {
    weight: Math.round(weight * 0.5 * 2) / 2,
    reps: Math.max(1, achievedReps) * 2
  }
}

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor()
 * @param {{ bottom: number, top: number, inc: number, deloadAt?: number, maxJumpPct?: number, roundTo?: number }} cfg
 *   maxJumpPct caps the weight increment at that percentage of the current weight — Wood's
 *   "5-10% guardrail on any single jump" rule; omit it for coaches with no such ceiling.
 *   roundTo is the loadable plate grid (default 2.5) — kept separate from `inc` so a guardrail-
 *   capped jump still snaps to a real plate change instead of the coach's full increment.
 * @returns {{ kind: 'first'|'up'|'hold'|'deload', weight?: number, reps?: number, stalls?: number }}
 */
export function doubleProgression(sessions, { bottom, top, inc, deloadAt = 3, maxJumpPct, roundTo = 2.5 }) {
  const last = sessions[sessions.length - 1]
  if (!last) return { kind: 'first' }

  const stalls = stallCount(sessions)
  if (last.ok) {
    const step = maxJumpPct > 0 ? Math.min(inc, last.weight * maxJumpPct / 100) : inc
    return { kind: 'up', weight: snapWeight(last.weight + step, roundTo), reps: bottom, stalls }
  }
  if (stalls >= deloadAt) {
    return { kind: 'deload', weight: snapWeight(last.weight * 0.9, roundTo), reps: bottom, stalls }
  }
  const aim = Math.min(top, Math.max(bottom, last.low + 1))
  return { kind: 'hold', weight: last.weight, reps: aim, stalls }
}
