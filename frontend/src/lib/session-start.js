// How a session's exercise entries are built from a routine. Shared by the live start and by
// "log a past workout", which is the same screen pointed at another day — both must walk up
// to identical entries, or the two paths drift apart the first time a prescription rule changes.
// Imports both history.js and progression.js (which itself imports history.js); nothing in
// either imports this file, so there is no cycle.
import { buildSets, applyIntensifierPlan, modeOf } from './history.js'
import { nextPrescription, applyPrescription, defaultIncrement, weightIncrement, sessionsFor } from './progression.js'
import { evaluate } from './coaches/index.js'

export function buildSessionEntries(st, r) {
  // The prescription is applied as the session is built, so you walk up to the bar with the
  // right weight already on the screen instead of being told about it afterwards. `plan` is
  // kept on the entry purely so the workout can explain the number it chose.
  const excluded = r?.excludeFromProgression === true
  const entries = (r ? r.ex : []).map(cfg => {
    const plan = excluded ? { policy: 'off', kind: 'off' } : nextPrescription(st, cfg, r)
    // The warm-up ramp and the prescription snap to the exercise's own increment (1.25 kg
    // plates exist), not the unit default; a timed exercise's `inc` is seconds, so it keeps the
    // default for its optional load.
    const step = modeOf(cfg) === 'reps' ? weightIncrement(cfg, st.unit) : defaultIncrement(cfg.id, st.unit)
    const sets = applyIntensifierPlan(applyPrescription(buildSets(st, cfg, { step, useTarget: plan.kind === 'off' }), plan, step), cfg)
    // Every session gets a coach by default now — Sanku, unless the routine came from a
    // program with its own (see starter.js's programId tag) — as long as progression itself
    // isn't switched off for this entry; a planned deload shouldn't also get told to add
    // weight or deload again.
    const coach = !excluded ? evaluate(r?.programId, sessionsFor(st, cfg.id, cfg), cfg) : []
    return { id: cfg.id, sg: cfg.sg, target: { ...cfg }, plan, sets, coach }
  })
  return { entries, excluded }
}
