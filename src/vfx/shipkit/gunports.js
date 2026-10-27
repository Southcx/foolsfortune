// ---------------------------------------------------------------------------------------
// A SHIP'S GUN PORTS: the broadside's guns (world/opensea/seafight.js, OPEN-SEA.md 14.6) let into every class's hull, a row down each side
// at the gun deck, as many a side as the class carries (progress/rail/ships.js SHIPS.guns: the sloop 3 .. the galleon 8), spaced along
// the middle three-fifths of the hull as the runtime spaces them when no look is given.
//   THE PORT     a square cut in the side: a black opening framed by a brass rim, written into the hull's one mesh (shipkit/hullkit.js
//                Mesher), so it costs no draw; set square to the side's own flare and run (the lofted section's slope at that point).
//   THE LID      a square of the class's lacquer hinged on the port's top edge, swung up and out (about 100 degrees) while the side is
//                cleared for action, shut flush otherwise: one instanced draw for every lid of the ship.
//   THE GUN      a dark iron barrel run out through the open port while the side is loaded, kicked in when it fires and left in while it
//                reloads (the crew's sponge and rammer, unseen): one instanced draw. `ports(side)` gives its muzzles, run out, in world space.
// Prior art: the age of sail's gun deck (HMS Victory's red-lined ports and their lids hauled up by the port tackle), Sea of Thieves' and
// Assassin's Creed IV: Black Flag's broadsides (the lids up, the guns run out, the recoil back inboard), the kit's one-mesh rule (hullkit.js).
//
//   const P = new GunPorts(look, spec)   P.write(M) (the openings and rims, before the hull's geometry)   P.mesh (lids and barrels: add to the body)
//   P.tick(dt, { port: { open, out }, starboard: { open, out } })   P.fire(side)   P.ports(side) -> [Vector3] (world, the muzzles)   P.count (a side's)
//   (side 'port' (the ship frame's +x) | 'starboard' (-x); spec.ports { lid, rim, size, guns } overrides the class's own)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sideAt } from './hullkit.js';
import { SHIPS } from '../../progress/rail/ships.js';

/** lid / rim / mouth / iron: the colours; open: the lid's swing (rad); size: the port's side as a share of the beam (clamped, m); run: how
 *  far the barrel stands out of the side run out, and kicked in (shares of the port's size); ease: the lid's and the gun's rates (1/s). */
export const GUN_PORTS = { lid: 0x2a2226, rim: 0xc9a24e, mouth: 0x0a0807, iron: 0x1b1a1c, open: 1.75, size: { k: 0.11, lo: 0.7, hi: 1.5 }, run: { out: 0.62, kick: -0.15 }, ease: { lid: 5, run: 7 } };
const SIDES = { port: 1, starboard: -1 };
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _n = new THREE.Vector3(), _u = new THREE.Vector3(), _a = new THREE.Vector3();
const _hide = new THREE.Matrix4().makeScale(0, 0, 0);

export class GunPorts {
  constructor(look, spec) {
    const P = spec.ports || {}, H = spec.hull;
    this.look = look; this.count = H ? (P.guns ?? SHIPS[spec.id]?.guns ?? 0) : 0;
    this.size = THREE.MathUtils.clamp(P.size ?? spec.beam * GUN_PORTS.size.k, GUN_PORTS.size.lo, GUN_PORTS.size.hi);
    this.frames = { port: [], starboard: [] }; this.state = { port: { open: 0, run: 0 }, starboard: { open: 0, run: 0 } };
    this.mesh = null; if (!this.count) return;
    const S = this.size, L = spec.length, mainY = look.deckY;
    for (const [side, s] of Object.entries(SIDES)) for (let i = 0; i < this.count; i++) {
      const z = this.count > 1 ? (i / (this.count - 1) - 0.5) * L * 0.6 : 0;
      const y = Math.min(look.deckHeight(z), mainY) - 0.62 * S - 0.18; // (the gun deck under the main deck's edge, a raised quarterdeck's too)
      const x = sideAt(H, z, y), fy = (sideAt(H, z, y + 0.2) - sideAt(H, z, y - 0.2)) / 0.4, fz = (sideAt(H, z + 0.3, y) - sideAt(H, z - 0.3, y)) / 0.6;
      _n.set(s, -fy, -fz * s).normalize(); // (the side's outward normal there: x = s f(y, z))
      _u.set(0, 1, 0).addScaledVector(_n, -_n.y).normalize(); _a.crossVectors(_u, _n); // (a right-handed frame: along the side, up, out)
      this.frames[side].push(new THREE.Matrix4().makeBasis(_a, _u, _n).setPosition(s * x, y, z));
    }
    // the lids and the barrels: one instanced draw each, in the ship's body (they heel and fold with it)
    const lidG = new THREE.BoxGeometry(S * 1.06, S * 1.06, S * 0.12), gunG = new THREE.CylinderGeometry(S * 0.2, S * 0.24, S * 1.1, 10, 1);
    gunG.rotateX(Math.PI / 2);
    const lidM = new THREE.MeshStandardMaterial({ color: P.lid ?? GUN_PORTS.lid, roughness: 0.55, metalness: 0.1 }), gunM = new THREE.MeshStandardMaterial({ color: GUN_PORTS.iron, roughness: 0.4, metalness: 0.65 });
    this.lids = new THREE.InstancedMesh(lidG, lidM, this.count * 2); this.guns = new THREE.InstancedMesh(gunG, gunM, this.count * 2);
    for (const m of [this.lids, this.guns]) { m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; }
    this.lids.name = 'ship-gunport-lids'; this.guns.name = 'ship-guns';
    this.mesh = new THREE.Group(); this.mesh.name = 'ship-gunports'; this.mesh.add(this.lids, this.guns);
    this.disposables = [lidG, gunG, lidM, gunM];
    this.rimCol = P.rim ?? GUN_PORTS.rim;
    this.pose(true);
  }

  /** The openings and their brass rims, written into the hull's mesh (no draw of their own). */
  write(M) {
    if (!this.count) return;
    const S = this.size, w = S * 0.12, d = S * 0.14;
    for (const side of Object.keys(SIDES)) for (const F of this.frames[side]) M.xf(F, () => {
      M.box([0, 0, 0.01], [S, S, 0.08], GUN_PORTS.mouth, 0); // (the dark of the gun deck behind the port)
      M.box([0, S / 2 + w / 2, d / 2 - 0.02], [S + 2 * w, w, d], this.rimCol, 0); M.box([0, -S / 2 - w / 2, d / 2 - 0.02], [S + 2 * w, w, d], this.rimCol, 0);
      M.box([S / 2 + w / 2, 0, d / 2 - 0.02], [w, S, d], this.rimCol, 0); M.box([-S / 2 - w / 2, 0, d / 2 - 0.02], [w, S, d], this.rimCol, 0);
    });
  }

  /** Each frame while the ship fights: a side's lid wanted `open` (true / false) and its gun wanted run `out`; both eased there. */
  tick(dt, want) {
    if (!this.count) return;
    let moved = false;
    for (const side of Object.keys(SIDES)) {
      const st = this.state[side], w = want?.[side]; if (!w) continue;
      const o = w.open ? 1 : 0, r = w.out && w.open ? 1 : 0;
      const no = st.open + (o - st.open) * (1 - Math.exp(-GUN_PORTS.ease.lid * dt)), nr = st.run + (r - st.run) * (1 - Math.exp(-GUN_PORTS.ease.run * dt));
      if (Math.abs(no - st.open) + Math.abs(nr - st.run) > 1e-4) { st.open = no; st.run = nr; moved = true; }
    }
    if (moved) this.pose();
  }
  /** A side fires: its guns kicked back inboard at once (the recoil), to be run out again when loaded. */
  fire(side) { const st = this.state[side]; if (!st || !this.count) return; st.run = GUN_PORTS.run.kick; this.pose(); }

  /** The muzzles of a side's guns as run out, world space (the runtime's `look.ports(side)`). */
  ports(side) {
    if (!this.count || !this.frames[side]) return null;
    this.look.body.updateWorldMatrix(true, false);
    const out = GUN_PORTS.run.out * this.size + 0.12, W = this.look.body.matrixWorld;
    return this.frames[side].map((F) => new THREE.Vector3(0, 0, out).applyMatrix4(F).applyMatrix4(W));
  }

  pose(force = false) {
    if (!this.count) return;
    const S = this.size;
    let k = 0;
    for (const side of Object.keys(SIDES)) {
      const st = this.state[side], a = -GUN_PORTS.open * st.open, run = force ? 0 : st.run;
      for (const F of this.frames[side]) {
        // the lid: hinged at the rim's top edge (y S/2 + rim, just proud of the side), swung about the port's along-side axis
        _t.makeTranslation(0, S / 2 + S * 0.12, S * 0.14); _r.makeRotationX(a); _m.makeTranslation(0, -S * 0.53 - S * 0.12, S * 0.06);
        this.lids.setMatrixAt(k, _r.premultiply(_t).multiply(_m).premultiply(F));
        // the gun: its muzzle `run` of the way out (behind the opening when in)
        if (run <= 0.02 && st.open < 0.05) this.guns.setMatrixAt(k, _hide);
        else this.guns.setMatrixAt(k, _m.makeTranslation(0, -S * 0.06, -0.55 * S + 0.06 + run * GUN_PORTS.run.out * S).premultiply(F));
        k++;
      }
    }
    this.lids.instanceMatrix.needsUpdate = true; this.guns.instanceMatrix.needsUpdate = true;
  }

  dispose() { for (const o of this.disposables || []) o.dispose(); }
}
