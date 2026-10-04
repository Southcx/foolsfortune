// ---------------------------------------------------------------------------------------
// THE COLOUR OF A NOTE: one rule for every note the game makes visible, so a tone looks the same wherever it sounds. The ROOT is
// gold, and the other degrees take the Crucibelle's colours in order (tools/crucibelle/songs.js DEGREE_COLOR: rose, green, blue, violet),
// so "gold" always means "the home note": a crystal struck true shows gold, as the bell's root does.
//
// Prior art: Scriabin's and Rimsky-Korsakov's colour keyboards (a colour per pitch), Guitar Hero's and Rock Band's lane colours (a
// colour per place in the scale, learned by playing), and Ocarina of Time's coloured note buttons.
//
//   degreeColor(deg) -> 0xRRGGBB   (deg: steps from the root, any integer; 0 is the root)
// ---------------------------------------------------------------------------------------
import { DEGREE_COLOR } from '../tools/crucibelle/songs.js';

export const degreeColor = (deg) => DEGREE_COLOR[((Math.round(deg) % DEGREE_COLOR.length) + DEGREE_COLOR.length) % DEGREE_COLOR.length];
