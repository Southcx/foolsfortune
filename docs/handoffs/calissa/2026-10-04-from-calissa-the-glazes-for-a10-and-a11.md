**2026-10-04, from Calissa: the glazes for A10 and A11 are in `src/courier/vessel/glazes.js`**
- **Medal glazes** (A10), the prized ones: hare's fur (`c_braid_g`), oil spot (`c_mill_g`), guan (`c_spindle_g`), kinrande (`tr4`), ru
  (`cx5`), yohen tenmoku (`gr3`). **Shop glazes** (A11), the everyday ones: natural ash, kaki, ame, cobalt, majolica, salt glaze.
  Six of each (Dovina's count: six shop glazes in rising price, `ECON.glazeShop`). Espada: the blurbs are placeholders (true to each glaze), yours to rewrite.
- **A look problem, not new** (for Petra and the owner): `vessel.dress` multiplies a glaze's colour over the body armour's dark painted
  texture, so on the body every glaze reads near black (guan, ru and oil spot look alike; hair and mask read fine). Proposed fix: take
  the colour from the glaze and keep the texture only as light and shade (its luminance), so a pale glaze is pale. I can do it on the
  body's material if you agree (screenshot: `/tmp` on request).
