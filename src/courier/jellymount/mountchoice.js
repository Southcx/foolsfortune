// ---------------------------------------------------------------------------------------
// THE MOUNTS' CHOICE (progress/jellymount.js JELLY_MOUNT.call: Y held past `call.hold` offers the two mounts; the let go calls the one
// lit): the Solar Skiff or the slip jelly, which the mouse moved sideways, A or D, or a thumb's push on the stick picks. Its state only;
// it is drawn as the mounts' ring round the Courier (Calissa's, vfx/jellymount/ring.js, which reads `pick` each frame while
// `game.jellyMount.choice` stands), no words (Espada: "The held Y's choice needs no words"). It replaced the two HTML choice cards that
// stood in a strip low in the view until the ring was built (2026-10-30).
//
// Prior art: the quick pick (tools/soulbrush/radial.js: held, flicked, let go), Red Dead Redemption 2's horse whistle held for a choice.
//
//   const C = new MountChoice(game, first)   C.steer(input, player) (each step while Y is held)   C.pick ('skiff' | 'jelly')   C.close()
// ---------------------------------------------------------------------------------------

const STEP = 40; // (pixels of the mouse's sideways move to change the pick, the quick pick's)

export class MountChoice {
  constructor(game, first = 'jelly') {
    this.game = game; this.pick = first; this.acc = 0; this.was = 0;
    if (game.player?.lookScale) game.player.lookScale.wheel = 0; // (the mouse picks while it is open, not the camera)
  }
  set(id) { this.pick = id; }
  /** The mouse's sideways move, A or D, or the stick: left the skiff, right the jelly. */
  steer(inp, P) {
    this.acc += inp.dx || 0;
    if (this.acc <= -STEP) { this.acc = 0; this.set('skiff'); } else if (this.acc >= STEP) { this.acc = 0; this.set('jelly'); }
    const x = inp.axis ? inp.axis('moveX') : 0, k = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0) || (Math.abs(x) > 0.5 ? Math.sign(x) : 0);
    if (k && k !== this.was) this.set(k < 0 ? 'skiff' : 'jelly');
    this.was = k;
  }
  close() { if (this.game.player?.lookScale) this.game.player.lookScale.wheel = 1; }
}
