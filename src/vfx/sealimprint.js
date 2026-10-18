// ---------------------------------------------------------------------------------------
// THE IMPRINT'S LOOK (stub; built in round 6's game pass): your imprint burned into a cradle on seal.set, dim after.
//   game.sealImprints = new SealImprints(game)
// ---------------------------------------------------------------------------------------
import { drawSealFace } from './sealface.js';

export class SealImprints {
  constructor(game) { this.game = game; this.draw = drawSealFace; }
}
