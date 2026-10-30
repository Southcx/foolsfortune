// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S PALETTE: every colour its parts are painted in, linear (as the vertices mix them). Pale sea-glass where the bone was
// (the first firing's bone white read as a pastel tree in the garden's summer haze, Calissa, 2026-10-30), the reef's own saturated
// coral, orange, violet and magenta at the tips, teal and violet in the shade and the glow; the roots a deep plum going dark where they
// sink, lichened teal.
//
// Prior art: Nausicaa's Sea of Corruption (the Fukai's bone-white fungal trees, its teal and violet shade, the Ohmu's blue-grey shell and
// amber light, its spores' yellow), Princess Mononoke's forest (the moss on old roots), and living reefs (Acropora's pink and orange,
// the purple sea fan Gorgonia ventalina, Aplysina's tube sponges, the brain coral Diploria's sage and ochre).
//
//   import { PAL } from './palette.js'   PAL.bone (linear rgb)   PAL.gTeal (a glow)
// ---------------------------------------------------------------------------------------
import { lin } from './kit.js';

export const PAL = {
  sunk: lin(0x2a1d33), root: lin(0x4e3a5e), rootLight: lin(0x7d6b95), lichen: lin(0x3fae9c),
  bone: lin(0xc6ddd6), boneShade: lin(0x8aa0b4), boneWarm: lin(0xf2dcc4),
  coral: lin(0xff6f61), coralDeep: lin(0xd2384f), orange: lin(0xff7a2a), peach: lin(0xffb27a),
  teal: lin(0x3fc6b4), tealDeep: lin(0x1f6a78), violet: lin(0x8a52e0), violetDeep: lin(0x3e2a78), magenta: lin(0xd8389e),
  ohmu: lin(0x6f91ad), ohmuDeep: lin(0x3a5572), sage: lin(0x6fc4a0), ochre: lin(0x9b7646), amber: lin(0xd9a04a), honey: lin(0xb88a52),
  dark: lin(0x1c1420), loam: lin(0x2e2329), cream: lin(0xf4ecdc), gill: lin(0x5a4a6a),
  gTeal: lin(0x4ff0d6), gViolet: lin(0xb48cff), gAmber: lin(0xffc45c), gPink: lin(0xff8fb4), gPale: lin(0xdff2ff),
};
