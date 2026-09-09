// Identity for each coach's chat-bubble presentation — name, one-line personality, and an
// accent color for the fallback avatar. Portraits themselves are user-supplied art (see
// public/coaches/README.md for the exact spec); this file only carries what doesn't need an
// image to exist, so the UI works before any art is dropped in.
//
// The `name`/`tagline` shown here are deliberately NOT the same as the coach_id — coach_id
// (see index.js/programs.json) is an internal attribution to whose book/program the rules came
// from, which is normal citation (see also starter.js's program names/descriptions and
// program-recommender.js, which name real published programs by their real authors the same
// way a cookbook credits a recipe's author — that stays as-is). A user-facing persona with a
// real, living person's name and a lookalike face is a different thing entirely (implied
// endorsement, not citation), so both `wood` and `nippard` get an original persona name here
// instead of the coach_id's namesake.
// Resolved: Sean Wood (`wood`) — de-identified from the start, no request made. Jeff Nippard's
// team (Max Edsey, Nippard Fitness, 2026-09-09) declined a direct request to name the persona
// and use a likeness-styled avatar for it — asked that the persona stay generic, which it does.
export const COACH_PERSONAS = {
  mentzer: { name: 'Mentzer', tagline: 'One set. True failure. That’s the whole program.', color: 'var(--red)' },
  nippard: { name: 'Gauge', tagline: 'RPE over ego — autoregulate and trust the number.', color: 'var(--blue)' },
  wood: { name: 'Guardrail', tagline: 'Steady gains. A hard ceiling on every jump.', color: 'var(--orange)' },
  sanku: { name: 'Sanku', tagline: 'What’s the worst that happens? You fail. So go for it.', color: 'var(--shadow)' }
}

// public/ is served at the site root, so this is the same path in dev and in the built app —
// no import, no bundler involvement, just a URL the <img> either loads or 404s on.
export const coachAvatarSrc = coachId => `/coaches/${coachId}.png`
