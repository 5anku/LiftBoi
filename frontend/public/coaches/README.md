# Coach portraits

Five files, one per coach in `lib/coaches/personas.js` — drop them in here with these exact names:

```
mentzer.png
nippard.png
wood.png
rp.png
sanku.png
```

**Spec:**
- PNG, square, at least 256×256 (the UI displays them small — around 44px — but retina screens
  and any future "full portrait" view need the headroom)
- Transparent background, or a background that reads fine cropped to a circle (the UI clips
  every portrait with `border-radius: 50%`)
- Front-facing or three-quarter, shoulders-up — the reference brief was a chess.com-style coach
  avatar (see the app's own git history for the image this was modeled on)

Until a file is here, `CoachBubble` (components/CoachBubble.jsx) falls back to a plain colored
circle with the coach's initial — the app works with zero, some, or all five files present.

**Licensing:** same rule as `public/fonts/` — don't commit art you don't have the rights to
distribute. If a file's license is unclear, gitignore it here the way `Eternal.ttf` is gitignored
there, and keep your own copy locally.
