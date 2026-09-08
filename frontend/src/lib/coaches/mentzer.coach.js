// Mike Mentzer's Heavy Duty: one set per exercise to true failure. Judged by weeks stalled, not
// session count — the book's own rule is "two straight weeks of no progress", regardless of how
// many times you happened to train the lift in that span. Progression is instant: the moment a
// set overshoots the 6-10 target it's time to add weight right now, not next session.
const INSTANT_ADD_REPS = 12
const DELOAD_WEEKS = 2

// Sessions are oldest-first, from progression.js's sessionsFor(). Walk back from the most recent
// miss to the last session that still shared its weight, then measure the calendar gap to now —
// a change of weight always resets the clock, same convention stallCount() already uses.
function weeksSinceProgress(sessions) {
  const last = sessions[sessions.length - 1]
  if (!last || last.ok) return 0
  let i = sessions.length - 1
  while (i > 0 && sessions[i - 1].weight === last.weight && !sessions[i - 1].ok) i--
  const anchor = sessions[i - 1] ? sessions[i - 1].d : sessions[0].d
  return (new Date(last.d) - new Date(anchor)) / (1000 * 60 * 60 * 24 * 7)
}

/**
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string, sets?: number }} cfg - the routine's own prescription for this exercise
 * @returns {object|null} a Suggestion, or null with nothing logged yet
 */
export function evaluateMentzer(sessions, cfg) {
  const last = sessions[sessions.length - 1]

  const suggest = (signal, severity, message, rule) =>
    ({ lift: cfg.id, signal, severity, message, source_coach: 'mentzer', source_rule: rule })

  if (!last) {
    return suggest('hold', 'info',
      'Forget everything you have heard about volume. Warm up, then one set, carried to true, honest failure — that is the entire stimulus. Give it everything, then get out.',
      'ideology_first_session')
  }

  const topRep = last.mode === 'reps' && last.reps ? last.reps[last.reps.length - 1] : 0
  if (topRep >= INSTANT_ADD_REPS) {
    return suggest('add_weight', 'action',
      `${topRep} reps — past the 6-10 target, add 10-20% and reset to 6-10 reps.`, 'instant_weight_add')
  }

  const weeks = weeksSinceProgress(sessions)
  if (weeks >= DELOAD_WEEKS) {
    return suggest('deload', 'action',
      `No progress in ${Math.floor(weeks)}+ weeks — take a full week off, then come back with fewer sets and more rest, not the same routine.`,
      'weeks_stalled_deload')
  }

  if (cfg.sets > 1) {
    return suggest('hold', 'warn',
      `${cfg.sets} sets logged for one exercise — Heavy Duty calls anything past the first set junk volume, not stimulus.`,
      'junk_volume')
  }

  return last.ok
    ? suggest('hold', 'info', 'Every rep required — that is a real set. Same weight next time, and find true failure again.', 'hold')
    : suggest('hold', 'info', 'Short of the mark is not the same as failure. Get back under the bar and take it there properly.', 'hold')
}
