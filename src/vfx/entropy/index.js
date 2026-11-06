// ---------------------------------------------------------------------------------------
// THE ENTROPY ROOM'S LOOK (plain name; South, 2026-11-06: "cosmic-themed, abstract, eldritch and avant-garde. Like playing on an oasis in
// high-entropy space", "I don't want you guys to anchor to the current artstyle"; docs/plans/ENTROPY-TACTICS.md 7; Dovina's handoff
// docs/handoffs/calissa/2026-11-06-from-dovina-entropy-room.md). Dovina's room (world/entropy/entropyroom.js) stands the oasis, the seat,
// the door and the 49 tiles as placeholders; this dresses them and plays the board, looks only:
//   void.js       the void and the oasis (EntropyVoid)
//   tiles.js      the 49 tiles: their model and material, the setup's cascade, a tile turned over, their drift (EntropyTiles)
//   tiltshift.js  the tilt-shift pass while seated: sharp on the board's focus row, falling off away from you (TiltShift, a screen volume)
//   boardview.js  the board view while seated: the tokens, the Grand Bomb and its counter, the Hungry Die, the Arcana, your hand, your
//                 choices as pieces you click, the camera from your side (EntropyBoardView), in place of the text page
// It is ticked by the room (its update, and its tickModal while the seat's page pauses the world: world/entropy/entropyroom.js).
// Built with the room (its area's build), taken down with it.
//
// Prior art: Hearthstone's and Magic: The Gathering Arena's boards (your side, tipped away, the far edge soft), Monument Valley's and
// Manifold Garden's tiles hung in an empty sky, the house's table view (vfx/bazaartable.js: a seat's camera and its pieces clicked).
//
//   game.entropyLook = new EntropyLook(game)   (boot/world.js)   .tick(dt) (every frame, before the modal pause)   .owns (the tiles' motion)
// ---------------------------------------------------------------------------------------
import { EntropyVoid } from './void.js';
import { EntropyTiles } from './tiles.js';
import { TiltShift } from './tiltshift.js';
import { EntropyBoardView } from './boardview.js';

export class EntropyLook {
  constructor(game) {
    this.game = game; this.t = 0; this.attached = false;
    this.void = new EntropyVoid(game, this); this.tiles = new EntropyTiles(game, this); this.shift = new TiltShift(game, this); this.board = new EntropyBoardView(game, this);
    game.events?.on('entropy.board', (e) => { if (e.phase === 'setup') this.tiles.setup(); });
  }
  /** True while the look moves the tiles (Dovina's placeholder animate() stands down). */
  get owns() { return this.attached; }
  tick(dt) {
    const g = this.game, room = g.entropyRoom;
    if (!room) return;
    if (room.built && !this.attached) { this.void.attach(room); this.tiles.attach(room); this.attached = true; }
    else if (!room.built && this.attached) { this.board.leave(); this.tiles.detach(); this.void.detach(); this.shift.set(false); this.attached = false; }
    if (!this.attached) return;
    this.t += dt;
    const S = room.session, seated = !!(S?.open && S.where === 'table' && S.S);
    if (seated && !this.board.on) this.board.enter(S); else if (!seated && this.board.on) this.board.leave();
    this.void.tick(dt, this.t); this.tiles.tick(dt, this.t); this.board.tick(dt, this.t);
    this.shift.set(this.board.on);
  }
}
