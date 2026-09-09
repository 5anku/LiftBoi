// Curated "similar exercises" for the swap picker (issue: swap should offer real alternatives,
// not dump the whole library search on you). The dataset carries no movement-pattern field, so
// this reads the same signals the picker already filters on — target muscle (tg), body part
// (bp), equipment (eq) — plus a movement word pulled from the exercise's own name. Two presses
// on the same muscle rank above a press and a fly on that muscle, which is the whole point: a
// swap-in should train the same thing the same way, not just hit the same muscle.
const MOVEMENT_WORDS = [
  'pulldown', 'pullover', 'pull-up', 'pullup', 'chin-up', 'chinup', 'push-up', 'pushup',
  'pushdown', 'crossover', 'deadlift', 'row', 'press', 'fly', 'flye', 'curl', 'extension',
  'raise', 'shrug', 'squat', 'lunge', 'thrust', 'dip', 'plank', 'crunch', 'twist', 'kickback'
].sort((a, b) => b.length - a.length) // longest first: "pulldown" must win over a bare "pull"

function movementWord(name) {
  const n = (name || '').toLowerCase()
  return MOVEMENT_WORDS.find(w => n.includes(w)) || null
}

/**
 * Up to `limit` exercises that make a sensible swap-in for `ex`.
 * @param {object[]} pool - candidates to choose from (already equipment/profile-filtered by the
 *   caller, same pool the rest of the picker searches)
 * @param {object} ex - the exercise being replaced
 * @returns {object[]} ranked candidates, `ex` itself never included
 */
export function similarExercises(pool, ex, limit = 5) {
  const word = movementWord(ex.n)
  const byTarget = pool.filter(e => e.id !== ex.id && e.tg === ex.tg)
  // A thin target-muscle pool (an uncommon target, or one this profile's equipment barely
  // covers) falls back to the broader body part rather than surfacing 1-2 options.
  const base = byTarget.length >= limit ? byTarget : pool.filter(e => e.id !== ex.id && e.bp === ex.bp)
  return base
    .map(e => ({ e, score: (word && movementWord(e.n) === word ? 2 : 0) + (e.eq === ex.eq ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.e)
}
