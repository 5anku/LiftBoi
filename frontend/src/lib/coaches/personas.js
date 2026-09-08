// Identity for each coach's chat-bubble presentation — name, one-line personality, and an
// accent color for the fallback avatar. Portraits themselves are user-supplied art (see
// public/coaches/README.md for the exact spec); this file only carries what doesn't need an
// image to exist, so the UI works before any art is dropped in.
//
// The `name`/`tagline` shown here are deliberately NOT the same as the coach_id — coach_id
// (see index.js/programs.json) is an internal attribution to whose book/program the rules came
// from, which is normal citation. A user-facing persona with a real, living person's name and a
// lookalike face is a different thing entirely (implied endorsement, not citation), so `wood` —
// a named influencer — gets an original persona name here instead of the coach_id's namesake.
// Pending: approval from Nippard and Sean Wood (`wood`) to use their real identity; until either
// lands, this file is the only thing that needs to change either way.
export const COACH_PERSONAS = {
  mentzer: { name: 'Mentzer', tagline: 'One set. True failure. That’s the whole program.', color: 'var(--red)' },
  nippard: { name: 'Nippard', tagline: 'RPE over ego — autoregulate and trust the number.', color: 'var(--blue)' },
  wood: { name: 'Guardrail', tagline: 'Steady gains. A hard ceiling on every jump.', color: 'var(--orange)' },
  sanku: { name: 'Sanku', tagline: 'Train by feel — earn the backoff, don’t force it.', color: 'var(--shadow)' }
}

// public/ is served at the site root, so this is the same path in dev and in the built app —
// no import, no bundler involvement, just a URL the <img> either loads or 404s on.
export const coachAvatarSrc = coachId => `/coaches/${coachId}.png`
