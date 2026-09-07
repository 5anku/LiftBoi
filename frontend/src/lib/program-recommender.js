// "Choose a program for me" — a short quiz scored against the 12-program library (the ones
// with a specific "use when" written for them, see starter.js's own comments; the original
// four — ppl/upper-lower/full-body/5x5 — are generic templates without that framing and stay
// out of the match, still reachable from the plain "Load starter plan" list).
//
// Deliberately not machine-learned or fuzzy: three tags per program, three answers from the
// user, count what matches. A program's own "Quick Reference" row in the source doc is this
// table by another name — the doc was already the spec.
export const GOAL_OPTIONS = [
  { value: 'balanced', label: 'Balanced default — strength and size together' },
  { value: 'strength', label: 'Dedicated strength block' },
  { value: 'size', label: 'Maximum muscle growth' },
  { value: 'rebuilding', label: 'Rebuilding after a break' },
  { value: 'frequency', label: 'High frequency per muscle' },
  { value: 'variety', label: 'Variety without high volume' },
  { value: 'cutting', label: 'Cutting calories' },
  { value: 'peaking', label: 'Testing maxes / peaking' },
  { value: 'travel', label: 'Travel / minimal equipment' }
]
export const DAYS_OPTIONS = [3, 4, 5, 6]
export const PHILOSOPHY_OPTIONS = [
  { value: 'auto', label: 'Autoregulated', sub: 'Top set + back-off, RPE-driven (Nippard)' },
  { value: 'failure', label: 'To failure', sub: 'Short, brutal, no filler (Mentzer)' },
  { value: 'volume', label: 'Build volume', sub: 'Climb toward more sets over the block (RP)' },
  { value: 'menu', label: 'Flexible menu', sub: 'Pick your exercises session to session' }
]

// { days, goal, philosophy } per program — matches its own "Use when" line in starter.js.
export const PROGRAM_META = {
  ulppl: { days: 5, goal: 'balanced', philosophy: 'auto' },
  hit: { days: 3, goal: 'balanced', philosophy: 'failure' },
  'pure-strength': { days: 4, goal: 'strength', philosophy: 'auto' },
  'pure-hypertrophy': { days: 6, goal: 'size', philosophy: 'volume' },
  'classic-full-body': { days: 3, goal: 'rebuilding', philosophy: 'failure' },
  'powerbuild-ul': { days: 4, goal: 'balanced', philosophy: 'auto' },
  'ppl-6day': { days: 6, goal: 'frequency', philosophy: 'volume' },
  minmax: { days: 4, goal: 'variety', philosophy: 'failure' },
  cutting: { days: 5, goal: 'cutting', philosophy: 'auto' },
  peak: { days: 3, goal: 'peaking', philosophy: 'auto' },
  travel: { days: 3, goal: 'travel', philosophy: 'failure' },
  'chest-back-focus': { days: 3, goal: 'variety', philosophy: 'menu' }
}

/**
 * Scores every program against the three answers and returns them best-first.
 * Days matches score highest (it's the hardest constraint to work around), then goal, then
 * philosophy — a program that fits your week but trains differently than you'd like is more
 * usable than one that trains exactly how you want on a week you don't have.
 * @returns {{id: string, score: number}[]} every program, sorted — callers slice the top N.
 */
export function recommendPrograms({ days, goal, philosophy }) {
  return Object.entries(PROGRAM_META)
    .map(([id, meta]) => ({
      id,
      score: (meta.days === days ? 3 : 0) + (meta.goal === goal ? 2 : 0) + (meta.philosophy === philosophy ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score)
}
