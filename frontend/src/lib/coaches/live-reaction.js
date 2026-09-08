// Live, per-set commentary — chess.com's "nice move" after you play, not progression.js's
// verdict on the whole session. Fires the moment a work set is checked off, purely off that one
// set plus the minimum context needed to place it: no session-history walk, no coach state, and
// deliberately not the same message bank as the pre-exercise Suggestion (see the coach.*.js
// files) — that one opens the exercise, this one reacts inside it.
const BANKS = {
  mentzer: {
    new_best: 'That is a new number. One honest set beat everything you have done before — that is the whole method working.',
    last_set: 'Set’s done. You gave it what you had — walk away, the work is finished.',
    hit: 'Every rep required. That is a real set.',
    close_miss: 'One rep short of true failure — respectable, but not quite there.',
    big_miss: 'Short by more than a rep — the weight won today. Note it and move on.'
  },
  wood: {
    new_best: 'New number, inside the guardrail. That is exactly how it is supposed to go.',
    last_set: 'That’s the exercise done — steady work, nothing reckless about it.',
    hit: 'Clean set. Patience paying off.',
    close_miss: 'One rep away — log it honestly, that is what tells us what to do next.',
    big_miss: 'Short today. No panic — that is one data point, not a trend yet.'
  },
  nippard: {
    new_best: 'New best, and you called it — trust that number, not just the plates.',
    last_set: 'That’s the exercise wrapped. Rate that last set honestly before you move on.',
    hit: 'Reps in the bank. How close to failure did that actually feel?',
    close_miss: 'One short. If that felt like a true top set, the number is doing its job.',
    big_miss: 'A few short of the mark. Worth rating that one — was it the weight, or was it you?'
  },
  sanku: {
    new_best: 'New number’s up. Worst case next time you don’t beat it — so what.',
    last_set: 'That’s the exercise in the books. Go again next time, harder if you’ve got it.',
    hit: 'Target met. Nothing left on the table there? Push it next time.',
    close_miss: 'One rep short — you were right there. Go again.',
    big_miss: 'Short today — fine. Worst case is you learn the real number. Reset and go.'
  }
}

/**
 * @param {string} coachId - one of BANKS' keys; falls back to Sanku's voice for anything else,
 *   same default the rest of coaches/index.js uses.
 * @param {{ reps: number, weight: number, goal: number, best: number, isLastWorkSet: boolean }} ctx
 *   `goal` is the target reps for this set, `best` the lift's best-ever logged weight (a PR you
 *   seeded yourself counts, same as progression.js's own `best` everywhere else).
 * @returns {{message, severity, source_coach, signal, source_rule}|null} null when there is no
 *   rep target to judge this set against (callers are expected to skip warm-ups themselves).
 */
export function reactToSet(coachId, { reps, weight, goal, best, isLastWorkSet }) {
  if (!(goal > 0)) return null
  const bank = BANKS[coachId] || BANKS.sanku
  const shortfall = goal - reps
  const newBest = weight > 0 && best > 0 && weight >= best && reps >= goal
  const key = newBest ? 'new_best'
    : isLastWorkSet ? 'last_set'
    : shortfall <= 0 ? 'hit'
    : shortfall === 1 ? 'close_miss'
    : 'big_miss'
  return { message: bank[key], severity: 'info', source_coach: coachId, signal: 'live_reaction', source_rule: key }
}
