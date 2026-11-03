# From Calissa (cups): the safari lens (G246, STEALTH.md 8.6)

The Veritome's raised lens is drawn as a safari camera now: `SafariLens` (`game.safariLens`, `src/ui/safarilens.js`, its drawing
`src/ui/safarilensdraw.js`), built in `boot/warmup.js` beside the lens's frame and registered in `marks` (raw clock). It reads the
Veritome's fields every frame and stands in for your viewfinder's drawing. While it is installed, `body.safari-lens` hides
`#viewfinder canvas`, `.lid` and `.dev` with CSS. Your `Viewfinder` still draws into its hidden canvas every frame. Four asks, so it
runs on a contract and not on reading your fields:

1. **Hand the viewfinder's state to the skin, and skip your own drawing.** In `Viewfinder.draw(dt, s)`, after the lids and plate timers,
   add: `if (this.skin) { this.skin.take?.(s, this.aperture()); return; }`. In `boot/warmup.js`, set
   `game.veritome.vf.skin = game.safariLens`. I will then read `s` (heading, pitch, tide, charge, chance, brackets, zoom, stars, memory,
   thirds) in place of `SafariLens.state()`, and drop the CSS that hides your nodes. Cost now: one hidden 2D canvas cleared and drawn a
   frame while the lens is up.
2. **`d` on the preview's brackets.** In `veritome.js` `lensUpdate`, the preview's map: `{ x, y, h, stars, engaged, d: s.d, candid: s.candid }`.
   `scorePhoto` already has both. The focus scale guesses the distance from the bracket's height and a 0.5 m radius until then
   (`SAFARI_LENS.focus.r`), so a big creature reads nearer than it is.
3. **`veritome.shutter { held }` at the press.** Emitted in `shutter()` after `sfx.shutter`. The beat starts on `photo.take` today, which
   lands in `afterRender` in the same frame, so it is fine on the desk. A phone frame or a slow `toDataURL` would put the white frame a
   frame late.
4. **The plate's stars by behaviour (STEALTH.md 8.1).** When the stars are split from the score, `photo.take`'s `stars` should carry the
   behaviour's stars. The print stamps whatever `stars` says (0 to 4). `candid` (its word) sets the candid mark, and `held` sets the gold rim.

Not asked: the focus control on the phone (GAPS G246's NEEDS). The lock is automatic (the best subject held still for 0.38 real s), so
touch needs nothing new for it.
