// Identity for each coach's chat-bubble presentation — name, one-line personality, and an
// accent color for the fallback avatar. Portraits themselves are user-supplied art (see
// public/coaches/README.md for the exact spec); this file only carries what doesn't need an
// image to exist, so the UI works before any art is dropped in.
export const COACH_PERSONAS = {
  mentzer: { name: 'Mentzer', tagline: 'One set. True failure. No more, no less.', color: 'var(--red)' },
  nippard: { name: 'Nippard', tagline: 'Autoregulated, RPE-driven, technical.', color: 'var(--blue)' },
  wood: { name: 'Wood', tagline: 'Double progression, steady and guarded.', color: 'var(--orange)' },
  rp: { name: 'RP', tagline: 'MEV to MRV — volume has a landmark.', color: 'var(--teal)' },
  sanku: { name: 'Sanku', tagline: 'Your own blend. Gated on feel.', color: 'var(--shadow)' }
}

// public/ is served at the site root, so this is the same path in dev and in the built app —
// no import, no bundler involvement, just a URL the <img> either loads or 404s on.
export const coachAvatarSrc = coachId => `/coaches/${coachId}.png`
