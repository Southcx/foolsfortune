// ---------------------------------------------------------------------------------------
// THE RIDGES' FULGURITE, HOT (plain name; the rule Petra's and Dovina's, world/dunes/rarefinds.js and progress/areas.js RARE_FINDS.ridges:
// in Fury's weather a bolt that lands in the crystal ridges leaves a fulgurite that can be dug with the Dreamvane's pick for `hot` real s).
// The glass the bolt leaves is the fulgurites' own (fulgurites.js lays one at every strike); while it can be dug, this dresses that one
// piece as still hot from the strike, so it is found and read without a word:
//   - THE GLOW: a shell over the exposed glass, yellow-hot at the strike and cooling through orange to a deep red over its `hot` real s,
//     breathing slower as it cools (a cooling ember's own clock: the time left is read off the colour), never under a floor that still
//     says "now".
//   - THE HALO AND THE HEAT: a soft halo at its knob, embers lifting and a thin smoke rising off it (the library's 'dunes.fulgurite.hot',
//     a held stream), a column a player can find across the ridges in a storm's dark.
//   - THE SCORCH: the sand round it fused glassy and dark, laid on the slope.
//   - DUG (`area.rare` for the fulgurite): the sand thrown up ('dunes.fulgurite.dig'), the piece lifted out of its hole turning and flown
//     into the Courier; its glass gone from the sand (it is in your Pneuka Box now). COOLED undug: the glow, halo and heat fade over a real
//     second and the glass stays, a fulgurite like the rest.
// Looks only: nothing here is a rule, the dig is Petra's (rareFinds.dig), the find counted by her events.
//
// Prior art: real fulgurites (formed in a flash at about 1,800 C, glowing for seconds; dug out of desert sand after a storm), the house's
// cooling ember on a puzzle duel's board (vfx/duelview/crazing.js: white to red as it cools), Breath of the Wild's ore deposits and
// Monster Hunter's gathering points (a glint that says "here" with no word), a pickup flown into the body (the chest's curio, the cubes).
//
//   const H = new HotFulgurite(game, parent, fulgurites)   H.update(dt)   (reads game.rareFinds.hot each frame)   H.dug()   H.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RARE_FINDS } from '../../progress/areas.js';

/** The shell's scale over the glass; the glow's colours fresh, mid and cooling; its breath fresh and late (Hz) and its floor; the halo's
 *  size (m); the scorch's radius (m); how long the glass under a strike is looked for before one is laid here (real s); the fade on
 *  cooling and the flight into the Courier (real s). */
export const HOT_FULG = { scale: 1.08, colours: [0xffcf6a, 0xff7a28, 0xc8301a], breath: [1.5, 0.55], floor: 0.45, halo: 1.7, scorch: 1.5, seek: 0.5, fade: 1, fly: 0.8 };

let DISC = null, SCORCH = null;
/** The halo's soft disc and the scorch's glassy dark, drawn once on canvases (no image files). */
function textures() {
  if (DISC) return { disc: DISC, scorch: SCORCH };
  const c1 = document.createElement('canvas'); c1.width = c1.height = 64;
  let x = c1.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const c2 = document.createElement('canvas'); c2.width = c2.height = 128; x = c2.getContext('2d');
  g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(24,20,18,0.85)'); g.addColorStop(0.45, 'rgba(48,40,34,0.6)'); g.addColorStop(1, 'rgba(70,56,44,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  let s = 917; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = 10 + r() * 46; x.fillStyle = `rgba(210,232,200,${0.18 + r() * 0.3})`; x.fillRect(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 1 + r() * 2, 1 + r() * 2); } // (glassy flecks fused in it)
  DISC = new THREE.CanvasTexture(c1); SCORCH = new THREE.CanvasTexture(c2); SCORCH.colorSpace = THREE.SRGBColorSpace;
  return { disc: DISC, scorch: SCORCH };
}

const _spin = new THREE.Quaternion(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), UP = new THREE.Vector3(0, 1, 0);
const COLS = HOT_FULG.colours.map((h) => new THREE.Color(h));

export class HotFulgurite {
  constructor(game, parent, fulgurites) {
    this.game = game; this.F = fulgurites; this.cur = null; this.slot = -1; this.seekT = 0; this.fading = false; this.fadeT = 0; this.flyT = -1; this.clock = 0; this.heat = null;
    const T = textures();
    this.group = new THREE.Group(); this.group.name = 'dunes-fulgurite-hot'; this.group.visible = false; parent.add(this.group);
    this.shellMat = new THREE.MeshBasicMaterial({ color: COLS[0], transparent: true, opacity: 0.8, depthWrite: false, fog: false }); // (laid over, not added: it reads hot on noon's pale sand as in a storm's dark)
    this.shell = new THREE.Mesh(fulgurites.mesh.geometry, this.shellMat); this.shell.matrixAutoUpdate = false; this.shell.renderOrder = 3; this.group.add(this.shell);
    this.glass = new THREE.Mesh(fulgurites.mesh.geometry, fulgurites.mat); this.glass.matrixAutoUpdate = false; this.glass.visible = false; this.group.add(this.glass); // (the piece itself, once dug: the flight's body)
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.disc, color: COLS[0], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    this.halo.renderOrder = 4; this.group.add(this.halo);
    this.scorchMat = new THREE.MeshBasicMaterial({ map: T.scorch, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.scorch = new THREE.Mesh(new THREE.CircleGeometry(HOT_FULG.scorch, 20), this.scorchMat); this.group.add(this.scorch);
    this.at = new THREE.Vector3(); this.top = new THREE.Vector3(); this.from = new THREE.Matrix4();
  }

  /** The glass under the strike: the nearest of the fulgurites' within 1.5 m of it, or -1. */
  find(at) {
    const L = this.F.list; let best = -1, bd = 1.5;
    for (let i = 0; i < L.length; i++) { const f = L[i]; if (!f) continue; const d = Math.hypot(f.x - at.x, f.z - at.z); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  /** It struck: dress the glass under it (or lay one, if the fulgurites passed this strike by). */
  start(H) {
    this.cur = H; this.slot = -1; this.seekT = HOT_FULG.seek; this.fading = false; this.fadeT = 0; this.flyT = -1; this.at.copy(H.at);
    this.group.visible = false;
  }

  /** The glass found: the shell on it, the halo at its knob, the scorch on the slope round it, the heat lifting. */
  dress(i) {
    const D = this.game.dunes, f = this.F.list[i]; this.slot = i;
    this.F.mesh.getMatrixAt(i, this.from); this.from.decompose(_p, _q, _s);
    this.shell.matrix.compose(_p, _q, _s.multiplyScalar(HOT_FULG.scale)); this.shell.matrixWorldNeedsUpdate = true;
    this.top.set(f.x, f.y, f.z); this.halo.position.copy(this.top).y += 0.1;
    const y = D?.heightAt?.(f.x, f.z) ?? this.at.y, dx = (D?.heightAt?.(f.x + 0.6, f.z) ?? y) - (D?.heightAt?.(f.x - 0.6, f.z) ?? y), dz = (D?.heightAt?.(f.x, f.z + 0.6) ?? y) - (D?.heightAt?.(f.x, f.z - 0.6) ?? y);
    _n.set(-dx / 1.2, 1, -dz / 1.2).normalize(); this.scorch.position.set(f.x, y + 0.02, f.z); this.scorch.quaternion.setFromUnitVectors(_s.set(0, 0, 1), _n);
    this.shell.visible = this.halo.visible = this.scorch.visible = true; this.glass.visible = false; this.group.visible = true;
    const me = this.cur;
    this.heat?.stop?.();
    this.heat = this.game.vfx?.play('dunes.fulgurite.hot', { pos: this.top.clone(), follow: (h) => this.cur === me && this.flyT < 0 && !this.fading && (h.ctx.power = 0.35 + 0.65 * this.k, true) }) || null;
  }

  /** Dug out (`area.rare` for the fulgurite): the sand thrown up, its glass gone from the sand, the piece flown into the Courier. */
  dug() {
    if (!this.cur || this.slot < 0) { this.cur = null; return; }
    this.game.vfx?.play('dunes.fulgurite.dig', { pos: this.top.clone() });
    this.F.mesh.setMatrixAt(this.slot, ZERO); this.F.mesh.instanceMatrix.needsUpdate = true;
    const f = this.F.list[this.slot]; if (f) f.x = f.z = Infinity; // (no glint on a hole)
    this.heat?.stop?.(); this.heat = null;
    this.glass.matrix.copy(this.from); this.glass.visible = true; this.scorch.visible = true; this.flyT = 0;
  }

  get k() { const H = this.cur; return H ? Math.max(0, Math.min(1, H.left / (RARE_FINDS.ridges.hot || 30))) : 0; }

  update(dt) {
    const H = this.game.rareFinds?.hot; this.clock += dt;
    if (H && H !== this.cur) this.start(H);
    if (this.cur && this.slot < 0 && this.flyT < 0) { // (looking for the glass the same bolt left; laid here if none came)
      const i = this.find(this.at);
      if (i >= 0) this.dress(i);
      else if ((this.seekT -= dt) <= 0) { this.F.lay(this.at.x, this.at.z, Math.random() * 6.28, 1.2); const j = this.find(this.at); if (j >= 0) this.dress(j); else this.cur = null; }
      return;
    }
    if (this.flyT >= 0) return this.fly(dt);
    if (!this.cur) return;
    if (!H && !this.fading) { this.fading = true; this.fadeT = HOT_FULG.fade; } // (cooled undug: it fades, the glass stays)
    const k = this.k, u = 1 - k, fade = this.fading ? (this.fadeT -= dt) / HOT_FULG.fade : 1;
    if (fade <= 0) { this.group.visible = false; this.cur = null; this.heat?.stop?.(); this.heat = null; return; }
    if (u < 0.5) _c.copy(COLS[0]).lerp(COLS[1], u / 0.5); else _c.copy(COLS[1]).lerp(COLS[2], (u - 0.5) / 0.5);
    const hz = HOT_FULG.breath[0] + (HOT_FULG.breath[1] - HOT_FULG.breath[0]) * u, b = 0.5 + 0.5 * Math.sin(this.clock * Math.PI * 2 * hz);
    const o = Math.max(HOT_FULG.floor, 0.55 + 0.4 * k) * (0.78 + 0.22 * b) * Math.max(0, fade);
    this.shellMat.color.copy(_c); this.shellMat.opacity = o;
    this.halo.material.color.copy(_c); this.halo.material.opacity = o * 0.9; this.halo.scale.setScalar(HOT_FULG.halo * (0.75 + 0.25 * k) * (0.9 + 0.15 * b));
    this.scorchMat.opacity = Math.max(0, fade);
  }

  /** The piece out of its hole: up and turning for a third of the flight, then into the Courier's chest, shrinking. */
  fly(dt) {
    const P = this.game.player, t = (this.flyT += dt) / HOT_FULG.fly;
    this.shell.visible = this.halo.visible = false; this.scorchMat.opacity = Math.max(0, 1 - t);
    if (t >= 1 || !P) { this.group.visible = false; this.glass.visible = false; this.cur = null; this.flyT = -1; this.slot = -1; this.game.vfx?.play('dunes.fulgurite.glint', { pos: P ? _p.copy(P.pos).setY(P.pos.y + 1.1) : this.top, power: 1.2 }); return; }
    this.from.decompose(_p, _q, _s);
    const lift = Math.min(1, t / 0.35), go = Math.max(0, (t - 0.35) / 0.65), e = go * go * (3 - 2 * go);
    _p.lerp(_n.copy(this.top).setY(this.top.y + 1.0), lift * (1 - e)); if (e > 0) _p.lerp(_n.copy(P.pos).setY(P.pos.y + 1.1), e);
    _q.multiply(_spin.setFromAxisAngle(UP, t * 9)); _s.multiplyScalar(1 - 0.75 * e);
    this.glass.matrix.compose(_p, _q, _s); this.glass.matrixWorldNeedsUpdate = true;
  }

  dispose() { this.heat?.stop?.(); this.group.parent?.remove(this.group); this.scorch.geometry.dispose(); this.shellMat.dispose(); this.scorchMat.dispose(); this.halo.material.dispose(); }
}
