// The "Stockfish Coach" dispatch: called on-demand with one exercise's logged history, returns
// whatever that program's own coach has to say about it. No memory between calls, no blending
// across coaches at runtime — a program picks one coach via programs.json's coach_id, and that's
// the only rule set that ever judges it. See feature-stockfish-coach.md for the full spec.
import programsData from './programs.json' with { type: 'json' }
import { evaluateMentzer } from './mentzer.coach.js'
import { evaluateWood } from './wood.coach.js'
import { evaluateNippard } from './nippard.coach.js'
import { evaluateSanku } from './sanku.coach.js'

export const PROGRAM_BY_ID = Object.fromEntries(programsData.programs.map(p => [p.id, p]))

/**
 * @param {string} programId - a programs.json id, or null/unknown for "no specific program"
 * @param {Array} sessions - oldest-first, from progression.js's sessionsFor(S, exId, cfg)
 * @param {{ id: string }} cfg - the routine's own prescription for this exercise
 * @param {{ coachId?: string }} opts - coachId forces a specific coach regardless of programId
 *   (freestyle's own coach picker uses this — there's no program to look up a coach_id from).
 *   Without it, an unrecognized programId falls through to Sanku rather than silence: every
 *   session gets a coach by default now, book-sourced program or not.
 * @returns {object[]} 0+ Suggestion objects. Even with no history logged every coach still has
 *   an opening line — its own ideology, stated plainly, rather than silence on session one.
 */
export function evaluate(programId, sessions, cfg, opts = {}) {
  const program = PROGRAM_BY_ID[programId]
  const coachId = opts.coachId || program?.coach_id || 'sanku'

  switch (coachId) {
    case 'mentzer': { const s = evaluateMentzer(sessions, cfg); return s ? [s] : [] }
    case 'wood': { const s = evaluateWood(sessions, cfg); return s ? [s] : [] }
    case 'nippard': { const s = evaluateNippard(sessions, cfg, opts.mechanicVariant || program?.mechanic_variant); return s ? [s] : [] }
    case 'sanku': return evaluateSanku(sessions, cfg)
    default: return []
  }
}
