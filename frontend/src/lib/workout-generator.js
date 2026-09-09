// A one-off, unsaved session built from a focus lift and a training philosophy — the
// "I want a Bench Day" button. Deliberately never touches S.routines: this is Freestyle's
// sibling, not a routine-builder. Every exercise id here is drawn from the same validated
// pool starter.js already uses (see starter.test.js's EXIDX check), so nothing here can name
// an exercise the library doesn't have.
import { best1RM } from './onerm.js'

const MAIN_LIFTS = {
  bench: '0025', squat: '0043', deadlift: '0032', ohp: '0091'
}

// A category picks a random main lift from its own pool rather than always the same one —
// "Push Day" should not be Bench Day every single time.
const CATEGORY_LIFTS = {
  push: ['0025', '0091', '0047'],
  pull: ['2330', '0027', '0841'],
  legs: ['0043', '0032', '0739']
}

// Which accessory pool a main lift borrows from. Deadlift and squat share the "legs" pool
// (both are lower-body/posterior-chain), bench and ohp share "push".
const ACCESSORY_POOL = {
  '0025': ['0334', '0241', '0060', '0314', '0227', '0405'],   // bench: push
  '0091': ['0334', '0383', '0203', '0241'],                   // ohp: shoulders/triceps
  '0043': ['0739', '0586', '0585', '1460', '0605', '1371'],   // squat: legs
  '0032': ['0027', '0085', '2330', '1323', '0605'],           // deadlift: back/posterior
  '0047': ['0334', '0241', '0060', '0405'],
  '2330': ['0027', '1323', '0313', '0031', '0238', '0383'],
  '0027': ['2330', '1323', '0313', '0031', '0085'],
  '0841': ['0027', '1323', '0313', '0031', '0238'],
  '0739': ['0586', '0585', '1460', '0605', '1371']
}

// 'pr' is deliberately excluded from this pool — a max-effort attempt should never be the
// outcome of "surprise me", only a choice you made on purpose.
const STYLES = ['auto', 'failure', 'volume']

const round25 = w => Math.round(w / 2.5) * 2.5

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]
const pickN = (arr, n, rng) => {
  const pool = arr.slice()
  const out = []
  while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
}
const between = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1))

/** The main lift's sets for one style, given its estimated 1RM (or null — no history yet). */
function mainSets(style, e1rm, rng) {
  const w = pct => (e1rm ? round25(e1rm * pct) : 0)
  const base = e1rm ? {} : { note: 'Log baseline — ' }
  if (style === 'auto') {
    return [
      { sets: 1, reps: 3, weight: w(0.9), note: base.note + 'Top set · RPE 8-9' },
      { sets: between(2, 3, rng), reps: 5, weight: w(0.8), note: base.note + 'Back-off · RPE 7-8' }
    ]
  }
  if (style === 'failure') {
    return [{ sets: 1, reps: between(6, 10, rng), weight: w(0.85), note: base.note + 'One set to true failure — Mentzer' }]
  }
  if (style === 'pr') {
    // The estimate is a jumping-off point, not the ceiling — Epley from submaximal work reads
    // close but not exact. A real ramp of warm-up singles beyond this weight is how you find
    // out where today's actual max sits, same as any peaking block (Program 9's own approach).
    return [{
      sets: 1, reps: 1, weight: w(1), warmupSets: 3,
      note: e1rm ? 'PR attempt · work up in singles past this weight as it feels good' : 'Log baseline — PR attempt'
    }]
  }
  // volume
  return [{ sets: between(3, 5, rng), reps: between(8, 12, rng), weight: w(0.7), note: base.note + 'RP volume · straight sets' }]
}

const FOCUS_NAME = {
  bench: 'Bench', squat: 'Squat', deadlift: 'Deadlift', ohp: 'Overhead Press',
  push: 'Push', pull: 'Pull', legs: 'Legs'
}
const STYLE_LABEL = { auto: 'Autoregulated', failure: 'To Failure', volume: 'Volume', pr: 'PR Attempt' }

/**
 * Builds a one-off routine-shaped object: { name, ex: [{id, sets, reps, weight, note, prog}] }.
 * `prog: 'off'` on every entry is deliberate — a generated session states its own weights from
 * the lifter's e1RM right now, and must not be re-written by the progression engine reading
 * unrelated history for the same exercise id from some other routine.
 *
 * @param {object} S - app state (for best1RM lookups)
 * @param {{focus: string, style?: string, mainId?: string}} opts - focus:
 *   bench|squat|deadlift|ohp|push|pull|legs|surprise; style: auto|failure|volume|pr|surprise
 *   (default surprise); mainId overrides the random main-lift pick for a category focus — the
 *   generator sheet uses this once the lifter has picked one of the 3 options it offered,
 *   rather than re-rolling a lift they didn't choose.
 * @param {function} rng - injectable for deterministic tests; defaults to Math.random
 */
export function generateWorkout(S, { focus, style = 'surprise', mainId: forcedMainId }, rng = Math.random) {
  const resolvedFocus = focus === 'surprise' ? pick(Object.keys(CATEGORY_LIFTS), rng) : focus
  const mainId = forcedMainId || MAIN_LIFTS[resolvedFocus] || pick(CATEGORY_LIFTS[resolvedFocus] || CATEGORY_LIFTS.push, rng)
  const resolvedStyle = style === 'surprise' ? pick(STYLES, rng) : style

  const e1rm = best1RM(S, mainId)?.est || null
  const main = mainSets(resolvedStyle, e1rm, rng).map(s => ({ id: mainId, prog: 'off', ...s }))

  // A max attempt wants fresh legs and a fresh CNS, not a pump — light accessory work at most,
  // never the 2-4 exercises a normal accessory block gets.
  const accessoryCount = resolvedStyle === 'pr' ? between(0, 1, rng) : between(2, 4, rng)
  const pool = (ACCESSORY_POOL[mainId] || []).filter(id => id !== mainId)
  const accessories = pickN(pool, accessoryCount, rng).map(id => ({
    id, prog: 'off', sets: between(2, 4, rng), reps: between(8, 15, rng), weight: 0,
    note: 'Accessory · RPE 8-9'
  }))

  const label = FOCUS_NAME[resolvedFocus] || FOCUS_NAME[focus] || 'Focus'
  return {
    name: `${label} Day`,
    about: `${STYLE_LABEL[resolvedStyle]} · generated`,
    ex: [...main, ...accessories]
  }
}

// A category (push/pull/legs, or 'surprise' once resolved to one of those) has 3 candidate main
// lifts to choose between; a named lift (bench/squat/deadlift/ohp) has exactly one and skips the
// choice entirely — the generator sheet uses this to decide whether to show the picker at all.
export const CATEGORY_FOCI = Object.keys(CATEGORY_LIFTS)
export const CATEGORY_NAME = { push: 'Push', pull: 'Pull', legs: 'Legs' }
export const hasMainLiftChoice = focus => CATEGORY_FOCI.includes(focus)

/** The (up to) 3 candidate main lifts for a category focus, to show as a real choice instead of
 * silently rolling one — ids only; the caller resolves names/muscle tags from the exercise
 * library, this file stays free of that lookup on purpose (see the header comment). */
export function mainLiftOptions(focus, rng = Math.random) {
  const pool = CATEGORY_LIFTS[focus]
  return pool ? pickN(pool, Math.min(3, pool.length), rng) : []
}

export const GENERATOR_FOCUS_OPTIONS = [
  { value: 'bench', label: 'Bench' }, { value: 'squat', label: 'Squat' },
  { value: 'deadlift', label: 'Deadlift' }, { value: 'ohp', label: 'Overhead Press' },
  { value: 'push', label: 'Push' }, { value: 'pull', label: 'Pull' }, { value: 'legs', label: 'Legs' },
  { value: 'surprise', label: 'Surprise me' }
]
export const GENERATOR_STYLE_OPTIONS = [
  { value: 'auto', label: 'Autoregulated', sub: 'Top set + back-off, RPE-driven (Nippard)' },
  { value: 'failure', label: 'To failure', sub: 'One hard set, no filler (Mentzer)' },
  { value: 'volume', label: 'Build volume', sub: 'Straight sets, climb toward more (RP)' },
  { value: 'pr', label: 'PR attempt', sub: 'One all-out single, minimal accessories' },
  { value: 'surprise', label: 'Surprise me', sub: 'Pick a philosophy at random' }
]
