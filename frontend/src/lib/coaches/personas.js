// Identity for each coach's chat-bubble presentation — name, one-line personality, and an
// accent color for the fallback avatar. Portraits themselves are user-supplied art (see
// public/coaches/README.md for the exact spec); this file only carries what doesn't need an
// image to exist, so the UI works before any art is dropped in.
//
// The `name`/`tagline` shown here are deliberately NOT the same as the coach_id — coach_id
// (see index.js/programs.json) is an internal attribution to whose book/program the rules came
// from, which is normal citation. A user-facing persona with a real, living person's name and a
// lookalike face is a different thing entirely (implied endorsement, not citation), so `wood`
// and `rp` — a named influencer and a company brand — get an original persona name here instead
// of the coach_id's namesake. Pending: approval from Nippard, Sean Wood (`wood`) and Renaissance
// Periodization (`rp`) to use their real identity; until any of that lands, this file is the
// only thing that needs to change either way.
export const COACH_PERSONAS = {
  mentzer: { name: 'Mentzer', tagline: 'One set. True failure. No more, no less.', color: 'var(--red)' },
  nippard: { name: 'Nippard', tagline: 'Autoregulated, RPE-driven, technical.', color: 'var(--blue)' },
  wood: { name: 'Guardrail', tagline: 'Double progression, steady and guarded.', color: 'var(--orange)' },
  rp: { name: 'Landmark', tagline: 'MEV to MRV — volume has a landmark.', color: 'var(--teal)' },
  sanku: { name: 'Sanku', tagline: 'Your own blend. Gated on feel.', color: 'var(--shadow)' }
}

// public/ is served at the site root, so this is the same path in dev and in the built app —
// no import, no bundler involvement, just a URL the <img> either loads or 404s on.
export const coachAvatarSrc = coachId => `/coaches/${coachId}.png`
