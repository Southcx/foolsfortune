// ---------------------------------------------------------------------------------------
// THE SANDBOX'S LOOK (plain name; the room is the runtime's, world/sandbox/, its rules Dovina's, progress/sandbox.js; docs/plans/SANDBOX.md
// 5, "Looks (Calissa's): the hall, the rack, the pen's posts, the goal's net"): the god hand's physics room dressed over its
// placeholder boxes, built with her area and taken down with it (render/areas.js stage 2, `area.build` / `area.teardown` for
// 'sandbox'), a look only: her colliders, lamps, labels, ball and rules untouched, her stand-ins hidden where these stand in for them.
//   the hall    vfx/sandbox/hall.js: the floor, walls, lecterns, the pen's posts, the pitch's walls and kemari's four trees
//   the pitch   vfx/sandbox/pitchlook.js: the goal's frame and net (billowing on `sandbox.goal`), the temari ball and its shadow
// Panic over a struck creature is not the Sandbox's: it is anywhere a thrown thing strikes (vfx/panic.js).
//
// Prior art: the Touchstone's look over its placeholder room (vfx/touchstonelook.js: built and taken down with her area, her meshes
// found by her own numbers and hidden); the modules' own (their headers).
//
//   game.sandboxLook = new SandboxLook(game)   (boot/rooms.js, after game.sandbox)   .update(raw) (boot/frame.js)   .built
// ---------------------------------------------------------------------------------------
import { SandboxHall } from './hall.js';
import { SandboxPitchLook } from './pitchlook.js';

export class SandboxLook {
  constructor(game) {
    this.game = game; this.room = null; this.built = false;
    this.hall = new SandboxHall(game); this.pitch = new SandboxPitchLook(game);
    const E = game.events;
    E?.on?.('area.build', (e) => { if (e?.area === 'sandbox') this.build(); });
    E?.on?.('area.teardown', (e) => { if (e?.area === 'sandbox') this.teardown(); });
    E?.on?.('sandbox.goal', () => this.pitch.goal());
  }

  build() {
    const sb = this.game.sandbox; if (!sb?.built || !sb.room) return;
    if (this.built) this.teardown();
    this.room = sb.room; this.built = true;
    const found = this.hall.build(sb.room);
    this.pitch.build(sb.room, found);
  }

  teardown() {
    if (!this.built) return;
    this.hall.teardown(); this.pitch.teardown();
    this.room = null; this.built = false;
  }

  update(raw) {
    const sb = this.game.sandbox; if (!sb) return;
    if (sb.built && this.room !== sb.room) this.build();
    else if (!sb.built && this.built) this.teardown();
    if (this.built) this.pitch.update(raw);
  }
}
