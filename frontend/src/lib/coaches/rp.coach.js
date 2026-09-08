// Mike Israetel & James Hoffmann's volume-landmark logic. No program in this library is tagged
// rp yet (see programs.json's unmapped_coaches) — this operates on weekly-sets-per-muscle-group,
// a different aggregation than every other coach here, which is exactly why it needs its own
// interface rather than reusing progression.js's per-exercise session shape.
const DEFAULT_LANDMARKS = { mv: 0, mev: 0, mav: 0, mrv: Infinity }

/**
 * @param {number} weeklySets - sets logged this week for one muscle group
 * @param {{ mv?: number, mev?: number, mav?: number, mrv?: number }} landmarks
 * @param {{ mode?: 'building'|'cutting', deficitPct?: number }} opts
 *   deficitPct: how deep the calorie deficit is (0-100-ish) — narrows the MEV-MRV window as it
 *   grows, per Israetel & Hoffmann: a cut drops MRV and raises MEV at the same time.
 * @returns {object} a Suggestion
 */
export function evaluateRP(weeklySets, landmarks, opts = {}) {
  const { mv, mev, mav, mrv } = { ...DEFAULT_LANDMARKS, ...landmarks }
  const { mode = 'building', deficitPct = 0 } = opts

  const suggest = (signal, severity, message, rule) => ({ signal, severity, message, source_coach: 'rp', source_rule: rule })

  if (mode === 'cutting') {
    const adjMev = mev * (1 + deficitPct / 100)
    const adjMrv = mrv * (1 - deficitPct / 100)
    if (adjMev > adjMrv) {
      return suggest('hold', 'warn',
        'The deficit is deep enough that no volume is both sufficient to grow and recoverable — pure maintenance territory. Do not add sets on this cut.',
        'cut_window_collapsed')
    }
    if (weeklySets < mv) {
      return suggest('add_volume', 'info', `Below maintenance volume (${mv} sets/week) — add a set to hold onto muscle through the cut.`, 'cutting_hold_mv')
    }
    return suggest('hold', 'info', `At or above maintenance volume in a cut — hold here, don't climb.`, 'cutting_hold_mv')
  }

  if (weeklySets < mev) {
    return suggest('add_volume', 'action', `Below MEV (${mev} sets/week) — this muscle isn't getting enough stimulus to grow. Add a set.`, 'below_mev')
  }
  if (weeklySets >= mrv) {
    return suggest('hold', 'warn',
      `At or above MRV (${mrv} sets/week) — a stall here is expected, not alarming on its own. Only cut volume once recovery is chronically behind, not after one bad session; raising sleep/food/stress capacity is an equally valid fix.`,
      'at_mrv')
  }
  return suggest('add_volume', 'info', `Between MEV and MRV (${mev}-${mrv} sets/week) — keep climbing toward MRV as recovery allows.`, 'climbing_to_mrv')
}
