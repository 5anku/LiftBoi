// Jeff Nippard's programs disagree with each other on a mechanical level, so there is no single
// Nippard rule set — evaluate() looks up which of 4 mechanic variants the active program uses and
// dispatches to it. All 4 share double progression and a scheduled (calendar-week) deload rather
// than a stall-count one, so a coach here never calls a deload on its own — that's the block's
// own week count, which isn't tracked yet (see the open question in feature-stockfish-coach.md).
import { snapWeight } from '../progression.js'

export const VARIANTS = [
  'last_set_failure_tightening',
  'first_set_failure_loosening',
  'top_set_pct1rm_rpe_wave',
  'pct1rm_rpe_periodized_technique_rich'
]

// Min-Max's own refinement on double progression: once every working set hits the top of the
// range, add weight and reset to the bottom — but if a stall means that's not happening yet,
// extend the range upward by a rep instead of grinding at the same target forever.
function rangeExtendProgression(sessions, { bottom, top, inc }) {
  const last = sessions[sessions.length - 1]
  if (!last) return { kind: 'first' }
  if (last.ok) return { kind: 'up', weight: snapWeight(last.weight + inc, inc), reps: bottom }
  const aim = last.low + 1
  return { kind: 'hold', weight: last.weight, reps: aim, extended: aim > top }
}

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string, bottom?: number, top?: number, inc?: number }} cfg
 * @param {string} variant - one of VARIANTS, from programs.json's mechanic_variant field
 * @returns {object|null} a Suggestion, or null with nothing logged yet
 */
export function evaluateNippard(sessions, cfg, variant) {
  if (!VARIANTS.includes(variant)) throw new Error(`Unknown Nippard mechanic variant: ${variant}`)

  const suggest = (signal, severity, message, rule) =>
    ({ lift: cfg.id, signal, severity, message, source_coach: 'nippard', source_rule: rule, mechanic_variant: variant })

  if (variant === 'last_set_failure_tightening' || variant === 'first_set_failure_loosening') {
    const opts = { bottom: cfg.bottom ?? 6, top: cfg.top ?? 8, inc: cfg.inc ?? 2.5 }
    const r = rangeExtendProgression(sessions, opts)
    if (r.kind === 'first') return null
    if (r.kind === 'up') {
      return suggest('add_weight', 'action',
        `Every set hit the top of the range — up to ${r.weight}, back to ${r.reps} reps.`,
        'double_progression_range_extend')
    }
    return suggest('hold', 'info',
      r.extended
        ? `Same weight, range extends to ${r.reps} — the block's own way of avoiding a reset.`
        : `Same weight — aim for ${r.reps} reps this time.`,
      'double_progression_range_extend')
  }

  // %1RM wave variants: only Week 1 of the source block is in the library, so this coach can
  // report where you stand against the block's own baseline but can't yet judge week-to-week
  // wave progression — that needs the later weeks pulled from the source PDFs.
  const last = sessions[sessions.length - 1]
  if (!last) return null
  return suggest('hold', 'info',
    `Logged at ${last.weight} — wave progression isn't tracked yet, only Week 1 baselines are in the library.`,
    'wave_progression_unavailable')
}
