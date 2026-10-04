import * as THREE from 'three';
import { Tech } from './techs.js';

// ---------------------------------------------------------------------------
// THE KILN STATION (a tech that holds the body while they are dressed, as talking does): F at the mouth of the workshop's kiln opens the
// station (courier/vessel/kilnui.js: the glazes, the preview, the firing). The Courier stands in the kiln's light and puts away what was in them
// hands, and steps into the kiln's mouth; the camera leaves their shoulder for a turntable: it holds in front of them, the kiln's glow
// behind them, and they turn (dragging on the scene, or A / D), so the look is seen from every side before it is fired. Esc or LEAVE
// ends it; a look not fired is taken off again. Nothing about the core movement changes: when it is over, the core is exactly as it was.
//
// Prior art: the character-edit turntable of the PS2 era (Soul Calibur II's, Dark Cloud 2's), FFXIV's glamour dresser camera, and
// Animal Crossing's fitting room.
// ---------------------------------------------------------------------------
export const KILN_AT = new THREE.Vector3(0, 0, 8.4); // (in front of the kiln's mouth, in the workshop: level.js)
// where they stand to be dressed (in the kiln's mouth, between the plate stands, its glow behind them), and the lens: a little above
// them, over the plate on its stand in front of the kiln
const SPOT = new THREE.Vector3(0, 0, 8.9), CAM = new THREE.Vector3(0, 2.25, -2.45);
const _p = new THREE.Vector3(), _l = new THREE.Vector3();

export class Kiln extends Tech {
  constructor(mgr) { super(mgr, 'kiln'); this.blendIn = 8; this.face = Math.PI; }
  get enabled() { return true; }
  usable() { return true; }
  get handsBusy() { return true; }
  get blocksFire() { return true; }
  label() { return 'KILN'; }
  canStart() {
    const P = this.P, g = this.game;
    if (!g.kilnUI || !g.vessel || g.interact?.cur?.id !== 'kiln' || !P.peekLatch('KeyF')) return false;
    if (Math.hypot(SPOT.x - P.pos.x, SPOT.z - P.pos.z) > 4) return false; // (a stale interact: they are not at the kiln)
    return P.grounded && !P.mantle && !P.sliding && !g.god?.controlling && !g.techs.get('carry')?.item && !g.dialogue?.open;
  }
  start() {
    const P = this.P, g = this.game;
    P.latch('KeyF'); P.endCore?.(); P.vel.set(0, 0, 0);
    for (const t of g.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
    this.face = Math.PI; this.done = false; // (they face the lens, the kiln's glow behind them)
    g.kilnUI.onLeave = () => { this.done = true; };
    g.kilnUI.show();
    g.ui?.want('kiln', true); // (the HUD steps out of the picture)
    g.events?.emit('kiln.open', { by: 'courier' });
  }
  update(dt) {
    const P = this.P, g = this.game, ui = g.kilnUI;
    if (this.done || !ui.open) return false;
    // they step into the kiln's mouth, then holds
    const dx = SPOT.x - P.pos.x, dz = SPOT.z - P.pos.z, far = Math.hypot(dx, dz);
    if (far > 4) return false; // (opened from afar, or set down elsewhere: the kiln is not walked to at speed, it lets them go)
    P.vel.set(far > 0.05 ? dx * 5 : 0, -2, far > 0.05 ? dz * 5 : 0); P.move(dt);
    // the turntable: the camera stays in front of them and they turn (under the keys, or after a drag)
    this.face += ui.turn * 1.8 * (g.rawDt ?? dt) + ui.drag; ui.drag = 0;
    _p.set(SPOT.x + CAM.x, P.pos.y + CAM.y, SPOT.z + CAM.z);
    // (they sit left of centre, so the window at the right does not cover them)
    _l.set(SPOT.x - 0.5, P.pos.y + 0.85, SPOT.z);
    g.cinema?.shot('kiln', { pos: _p, look: _l, fov: -6, bars: 0, ease: 5 });
    return true;
  }
  end() {
    const g = this.game;
    g.cinema?.unshot('kiln');
    g.ui?.want('kiln', false);
    if (g.kilnUI?.open) g.kilnUI.hide();
    g.vessel?.revert(); // (a look tried on and not fired comes off)
    g.events?.emit('kiln.close', {});
    g.kilnUI.onClose?.();
  }
  faceYaw() { return this.face; }
}
