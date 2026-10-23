// ---------------------------------------------------------------------------------------
// THE SUB'S VERB, LENT: what every tool's lend() shares (main and sub, tools/belt.js; SUB_GIFTS in progress/toolpairs.js). The sub is
// never drawn: on R its one verb goes off at once from where the tool hangs, or from the hand where the verb needs a hand (the shot's
// round, the hook's line). Each tool's own effect code does the work; this is the point it leaves from, and the word it goes by.
//
// Its body is Calissa's gesture over the main's stance (courier/anim/lendgesture.js, on the event `tool.lend`); where a verb needs the
// tool in a hand, the model is moved from where it hangs to that hand for the move's window (LENT_MODELS, her table of 2026-10-23), after
// the hands are posed, and goes back to its holster the next frame by its own placing.
//
// Prior art: NieR: Automata's pod and Elden Ring's off hand (a second tool's one act, done without changing what is held).
//
//   lendHand(game, out) -> the right hand's world point (the shoulder's, the chest's, before the body is built)
//   game.lentModels = new LentModels(game)   .update(rawDt) (main.js, after character.poseHands)   .placed -> the tool put at a hand this frame
//   LENT_MODELS[tool] -> { hand, at: [from, to] real s, shotAt? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Where a lent verb that needs a hand leaves from: the right hand. */
export function lendHand(game, out) {
  const ch = game.character, hand = ch?.arm?.R?.hand;
  if (hand) { hand.updateWorldMatrix(true, false); return hand.getWorldPosition(out); }
  const P = game.player;
  return out.set(P.pos.x, P.pos.y + 1.2, P.pos.z);
}

/** The verbs whose tool is shown at a hand while they play: the hand, and the window in real s after the press (Calissa's, 2026-10-23;
 *  the Grapple's line already leaves the right hand, lendHand, and the Sondelass stays on the back). */
export const LENT_MODELS = {
  psygun: { hand: 'R', at: [0, 0.26], shotAt: 0.09 }, // (the snap shot's gun, in the hand from the press; at the aim 0.09 real s after it, so its round waits for that: weapon.js tryFire)
  lockheart: { hand: 'L', at: [0.03, 0.34] }, // (the coffin at the mouth by 0.07, through the Gulp's 0.25 real s window)
  veritome: { hand: 'R', at: [0.05, 0.45] }, // (the Flash held up)
};
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();

export class LentModels {
  constructor(game) {
    this.game = game; this.cur = null; this.placed = null;
    game.events?.on?.('tool.lend', (e) => { if (LENT_MODELS[e.tool]) this.cur = { tool: e.tool, t: 0 }; });
  }
  /** Once a frame after the hands are posed: the lent tool's model at its hand for its window (the gun by its socket, a held tool by its
   *  measured grip, tools/grip.js), over where its own placing put it this frame. */
  update(raw) {
    this.placed = null;
    const c = this.cur; if (!c) return;
    const S = LENT_MODELS[c.tool];
    c.t += raw;
    if (c.t > S.at[1]) { this.cur = null; return; }
    if (c.t < S.at[0]) return;
    const g = this.game, ch = g.character, hand = ch?.arm?.[S.hand]?.hand;
    if (!hand || ch.hidden) return;
    hand.updateWorldMatrix(true, false);
    let obj;
    if (c.tool === 'psygun') { if (!ch.socketR || ch.gunOff) return; obj = ch.gun; _m.multiplyMatrices(hand.matrixWorld, ch.socketR); }
    else {
      const t = g.techs?.get(c.tool), grip = t?.grip; obj = t?.model?.group;
      if (!grip || !obj?.visible) return;
      _m.multiplyMatrices(hand.matrixWorld, S.hand === 'R' ? grip.R : grip.L);
    }
    _m.decompose(_p, _q, _s);
    obj.position.copy(_p); obj.quaternion.copy(_q); obj.updateMatrixWorld(true);
    this.placed = c.tool;
  }
}
