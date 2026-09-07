// The offline "engine": a couple of threshold checks over data the app already computes (RIR
// per set, last time an exercise was trained) — not a search or a model, just arithmetic. At
// most one line, and null when nothing clearly applies: forcing a stretch every session is
// worse than saying nothing. Two triggers only — the ones with an honest, cheap signal already
// in the payload; RPE-as-autoregulation and progressive overload are already surfaced elsewhere
// (the effort picker itself, the New PR tile), so a third and fourth trigger would just restate
// those rather than add anything.
import { rirOf } from './effort.js'
import { lastEntryFor } from './history.js'
import { isWarmupRow } from './workout-model.js'

export function spotPrinciple(S, w) {
  let hardest = null
  for (const e of w.entries) for (const s of e.sets) {
    if (!s.done || isWarmupRow(s)) continue
    const r = rirOf(s)
    if (r != null && (hardest == null || r < hardest)) hardest = r
  }
  if (hardest != null && hardest <= 0.5) {
    return 'A set taken to true failure — Mentzer’s break-over point, the one that actually recruits every fiber.'
  }

  for (const e of w.entries) {
    const prev = lastEntryFor(S, e.id)
    if (!prev) continue
    const now = e.sets.filter(s => s.done && !isWarmupRow(s)).length
    if (now > prev.sets.length) {
      return 'More sets than last time on that exercise — the RP climb from MEV toward MRV.'
    }
  }
  return null
}
