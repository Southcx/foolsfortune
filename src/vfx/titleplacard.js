// ---------------------------------------------------------------------------------------
// THE TITLE PLACARD (stub; built in round 6's game pass): the one pop-up, on achievement.unlock with a title.
//   game.titlePlacard = new TitlePlacard(game)
// ---------------------------------------------------------------------------------------
import { runningHand } from '../ui/runninghand.js';

export class TitlePlacard {
  constructor(game) { this.game = game; this.hand = runningHand; }
}
