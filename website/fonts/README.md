# Fonts

`Metal-Mania-Regular.ttf` and `Trueno-Round-Bold.otf` are genuine SIL Open Font License
fonts ([Metal Mania](https://fonts.google.com/specimen/Metal+Mania) is a Google Font;
Trueno Round Bold's OFL terms are recorded separately) and are committed here.

`Eternal.ttf` is **gitignored** — its recorded terms require an FG Studios license for
this kind of use, which hasn't been confirmed. It's used only for `.eyebrow` labels
(short, static, letters-only strings — it has no digit glyphs at all). To use it locally:

1. Get your own licensed copy of Eternal.
2. Drop it into this folder as `Eternal.ttf`.
3. `@font-face` in `styles.css` already points here — no code changes needed.

Without it, `--font-flourish` just falls back to a system serif; nothing breaks.
