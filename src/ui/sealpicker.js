// ---------------------------------------------------------------------------------------
// THE SEAL PICKER (stub; built in round 6's game pass, HANKO.md 5): your seal chosen once, at the title.
//   game.sealPicker = new SealPicker(game)   .open(done)   (done() once game.cradles.choose has taken it)
// ---------------------------------------------------------------------------------------
import { drawSealFace } from '../vfx/sealface.js';

export class SealPicker {
  constructor(game) { this.game = game; this.draw = drawSealFace; }
  open(done) { done(); }
}
