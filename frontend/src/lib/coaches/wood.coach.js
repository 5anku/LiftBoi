// Dysfunctional Lifter's Handbook: double progression (8-12 reps typical) with a 5-10% guardrail
// on any single jump — the book's own stated ceiling, not a per-exercise choice. Deload is a
// plateau call ("a couple of weeks"), not a fixed number, so this reuses the shared utility's
// own session-count stall threshold rather than inventing a calendar rule Mentzer already owns.
import { doubleProgression, repWord } from './shared/progression-mechanics.js'

const DEFAULTS = { bottom: 8, top: 12, inc: 2.5, maxJumpPct: 7.5, deloadAt: 3 }

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string, bottom?: number, top?: number, inc?: number, maxJumpPct?: number, deloadAt?: number }} cfg
 * @returns {object|null} a Suggestion, or null with nothing logged yet
 */
export function evaluateWood(sessions, cfg) {
  const opts = { ...DEFAULTS, ...cfg }
  const r = doubleProgression(sessions, opts)

  const suggest = (signal, severity, message, rule) =>
    ({ lift: cfg.id, signal, severity, message, source_coach: 'wood', source_rule: rule })

  if (r.kind === 'first') {
    return suggest('hold', 'info',
      `New lift, no rush. Log it honestly today — every jump from here is capped at ${opts.maxJumpPct}%, and that ceiling is what keeps you training next month too.`,
      'ideology_first_session')
  }
  if (r.kind === 'up') {
    return suggest('add_weight', 'action',
      `Top of the ${opts.bottom}-${opts.top} range every set — up to ${r.weight} (held under the ${opts.maxJumpPct}% guardrail), back to ${repWord(r.reps)}.`,
      'double_progression_guardrail')
  }
  if (r.kind === 'deload') {
    return suggest('deload', 'action',
      `Plateaued a couple of weeks running — take a deload week before pushing the range again.`,
      'plateau_deload')
  }
  // A miss is the only way to land here — an `ok` session always takes the 'up' branch above —
  // so this stays a patience message, not a congratulation.
  return suggest('hold', 'info',
    `Came up short — that is fine. Same weight, aim for ${repWord(r.reps)}. Patience is the method here, not a consolation prize.`,
    'double_progression_guardrail')
}
