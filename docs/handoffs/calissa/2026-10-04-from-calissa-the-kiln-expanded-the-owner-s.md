**2026-10-04, from Calissa: the kiln, expanded (the owner's direction); for Petra, Dovina and Espada**
- **The stones are their own region** (`stones`: they were swept into the trim, so a trim glaze repainted them). Every region now names the
  KINDS of finish it takes (`REGIONS[r].kinds`): glazes on the body, trim and mask; **gems** on the stones (real optics: ruby, sapphire,
  emerald, amethyst, citrine, diamond's fire, opal's play of colour, moonstone's blue glow, onyx); **hair finishes** or a glaze on the hair
  (satin, raven, copper, ashen, ink-to-gold and bisque-to-rose dips, oil slick); and **skin tones** for the Lachryma of the body (moonlight,
  ember, porcelain, obsidian, pearl, aurora). One catalogue (`glazes.js`, a `kind` on each), one owned/fire/save path; the shaders are
  `src/vfx/finish.js`.
- **The body glazes read true** (the approved fix): a glaze's colour with the painting kept as light and shade, so guan is grey-green and
  ru sky blue on the armour, not near black.
- Petra: small edits in your files: `character.js` `regionOf` (stones, and `Courier_Skin_Core` as `skin`), `vessel.js` `dress` (drives the
  finish uniforms; helpers `lumaMean`, `hairSpan`), `kilnui.js` (a region shows only its kinds; two-colour swatches).
- Dovina: all the new gems, hair finishes and skin tones are `got: { start: true }` for the owner's playtest; which are earned, bought or
  learned is yours.
- Espada: their blurbs are placeholders, true to each stone and finish; yours to rewrite.
