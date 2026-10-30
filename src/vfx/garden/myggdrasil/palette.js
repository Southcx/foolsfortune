// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S PALETTE: every colour its parts are painted in, linear (as the vertices mix them). Bone white, coral pink and orange,
// with teal and violet in the shade and in the glow; the roots an ashen mauve going dark where they sink, lichened teal.
//
// Prior art: Nausicaa's Sea of Corruption (the Fukai's bone-white fungal trees, its teal and violet shade, the Ohmu's blue-grey shell and
// amber light, its spores' yellow), Princess Mononoke's forest (the moss on old roots), and living reefs (Acropora's pink and orange,
// the purple sea fan Gorgonia ventalina, Aplysina's tube sponges, the brain coral Diploria's sage and ochre).
//
//   import { PAL } from './palette.js'   PAL.bone (linear rgb)   PAL.gTeal (a glow)
// ---------------------------------------------------------------------------------------
import { lin } from './kit.js';

export const PAL = {
  sunk: lin(0x3a2b37), root: lin(0x7a6670), rootLight: lin(0xa4918f), lichen: lin(0x6d9e94),
  bone: lin(0xebe3d3), boneShade: lin(0xb9abaa), boneWarm: lin(0xf2dcc4),
  coral: lin(0xf29d89), coralDeep: lin(0xd6695c), orange: lin(0xf38a4c), peach: lin(0xf7caa4),
  teal: lin(0x62b8b0), tealDeep: lin(0x2e6d77), violet: lin(0x8f6ec8), violetDeep: lin(0x46336c), magenta: lin(0xb45c9c),
  ohmu: lin(0x6f91ad), ohmuDeep: lin(0x3a5572), sage: lin(0x93bfa4), ochre: lin(0x9b7646), amber: lin(0xd9a04a), honey: lin(0xb88a52),
  dark: lin(0x1c1420), loam: lin(0x2e2329), cream: lin(0xf4ecdc), gill: lin(0x5a4a6a),
  gTeal: lin(0x4ff0d6), gViolet: lin(0xb48cff), gAmber: lin(0xffc45c), gPink: lin(0xff8fb4), gPale: lin(0xdff2ff),
};
