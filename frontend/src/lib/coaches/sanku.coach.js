// Your own blend — no book programs own this yet (see programs.json's unmapped_coaches), built
// for future programs of your own. Shares the double-progression substrate every other coach
// uses, but owns two things exclusively: a 3-stalled-session deload (one more crack than
// Mentzer's 2-week rule) that overrides a scheduled deload if one exists, and the backoff prompt
// — never auto-applied, since it's gated on feel, not automatic on every missed rep.
import { doubleProgression, repWord, backoffFor } from './shared/progression-mechanics.js'

const DEFAULTS = { bottom: 6, top: 10, inc: 2.5, deloadAt: 3 }
// Missing the target by this many reps or more is what "the pattern suggests you could've
// pushed further" means in practice — small enough to catch a real miss, not a rounding error.
const BACKOFF_SHORTFALL = 2

// A hot streak is worth pointing out even though it changes nothing about the prescription —
// it's the whole "go for it" pitch backed by evidence, not just a slogan.
const HYPE_STREAK = 3
function hitStreak(sessions) {
  let n = 0
  for (let i = sessions.length - 1; i >= 0 && sessions[i].ok; i--) n++
  return n
}

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string, bottom?: number, top?: number, inc?: number, deloadAt?: number }} cfg
 * @returns {object[]} 0-3 Suggestions — a progression call plus, optionally, a hot-streak
 *   callout and/or a backoff prompt when the miss looks pushable.
 */
export function evaluateSanku(sessions, cfg) {
  const opts = { ...DEFAULTS, ...cfg }
  const r = doubleProgression(sessions, opts)
  const suggest = (signal, severity, message, rule) => ({ lift: cfg.id, signal, severity, message, source_coach: 'sanku', source_rule: rule })
  const out = []

  if (r.kind === 'first') {
    out.push(suggest('hold', 'info',
      "First one's in the books. Chase the top of the range, and if you're not sure whether you can make the next jump — take it anyway. Worst case, you find out where the ceiling is today.",
      'ideology_first_session'))
    return out
  }
  const streak = hitStreak(sessions)
  if (streak >= HYPE_STREAK) {
    out.push(suggest('hold', 'info',
      `${streak} clean sessions running — whatever you're doing, keep doing it. Don't be shy about pushing the next jump a little harder.`,
      'hot_streak'))
  }
  if (r.kind === 'up') {
    out.push(suggest('add_weight', 'action', `Top of the range every set — up to ${r.weight}, back to ${repWord(r.reps)}.`, 'double_progression'))
  } else if (r.kind === 'deload') {
    out.push(suggest('deload', 'action',
      `Stalled 3 sessions running — deload now, even ahead of a scheduled one.`, 'stalled_sessions_deload'))
  } else {
    out.push(suggest('hold', 'info', `Same weight — aim for ${repWord(r.reps)} this time.`, 'double_progression'))
  }

  const last = sessions[sessions.length - 1]
  if (last && !last.ok && (last.goal - last.low) >= BACKOFF_SHORTFALL) {
    const { weight: backoffWeight, reps: backoffReps } = backoffFor(last.weight, last.low)
    out.push({
      lift: cfg.id, signal: 'backoff_now', severity: 'info',
      message: `Missed by ${repWord(last.goal - last.low)} — want a backoff set? ~${backoffWeight} for ~${repWord(backoffReps)}, to genuine exhaustion. Your call.`,
      source_coach: 'sanku', source_rule: 'backoff_prompt'
    })
  }
  return out
}
