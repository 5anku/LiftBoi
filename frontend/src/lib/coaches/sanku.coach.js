// Your own blend — no book programs own this yet (see programs.json's unmapped_coaches), built
// for future programs of your own. Shares the double-progression substrate every other coach
// uses, but owns two things exclusively: a 3-stalled-session deload (one more crack than
// Mentzer's 2-week rule) that overrides a scheduled deload if one exists, and the backoff prompt
// — never auto-applied, since it's gated on feel, not automatic on every missed rep.
import { doubleProgression } from './shared/progression-mechanics.js'

const DEFAULTS = { bottom: 6, top: 10, inc: 2.5, deloadAt: 3 }
// Missing the target by this many reps or more is what "the pattern suggests you could've
// pushed further" means in practice — small enough to catch a real miss, not a rounding error.
const BACKOFF_SHORTFALL = 2

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string, bottom?: number, top?: number, inc?: number, deloadAt?: number }} cfg
 * @returns {object[]} 0-2 Suggestions — a progression call plus, only when the miss looks
 *   pushable, a separate backoff prompt the lifter can take or leave.
 */
export function evaluateSanku(sessions, cfg) {
  const opts = { ...DEFAULTS, ...cfg }
  const r = doubleProgression(sessions, opts)
  const suggest = (signal, severity, message, rule) => ({ lift: cfg.id, signal, severity, message, source_coach: 'sanku', source_rule: rule })
  const out = []

  if (r.kind === 'first') return out
  if (r.kind === 'up') {
    out.push(suggest('add_weight', 'action', `Top of the range every set — up to ${r.weight}, back to ${r.reps} reps.`, 'double_progression'))
  } else if (r.kind === 'deload') {
    out.push(suggest('deload', 'action',
      `Stalled 3 sessions running — deload now, even ahead of a scheduled one.`, 'stalled_sessions_deload'))
  } else {
    out.push(suggest('hold', 'info', `Same weight — aim for ${r.reps} reps this time.`, 'double_progression'))
  }

  const last = sessions[sessions.length - 1]
  if (last && !last.ok && (last.goal - last.low) >= BACKOFF_SHORTFALL) {
    const backoffWeight = Math.round(last.weight * 0.5 * 2) / 2
    const backoffReps = Math.max(1, last.low) * 2
    out.push({
      lift: cfg.id, signal: 'backoff_now', severity: 'info',
      message: `Missed by ${last.goal - last.low} reps — want a backoff set? ~${backoffWeight} for ~${backoffReps} reps, to genuine exhaustion. Your call.`,
      source_coach: 'sanku', source_rule: 'backoff_prompt'
    })
  }
  return out
}
