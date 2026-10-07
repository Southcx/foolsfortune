// ---------------------------------------------------------------------------------------
// THE GOD HAND IN THE GARDEN: the cursor is the hand, always (docs/plans/SPIRIT-GARDEN.md sections 1 and 4). Its arts, by the number
// keys: 1 GRAB (pick up the Jar or a spirit and throw it; a quick tap on a spirit PETS it, the right button FLICKS it), 2 PULL and
// 3 PRESS (raise and lower the planetoid's clay), 4 CARVE (a narrow groove, for water to run in), 5 SMOOTH, 6 PLACE (a feature in a
// plot: world/garden/plots.js). The model is the god hand's own (godhand/godhand.js: its fingers posed there); the strokes are the
// clay's (world/garden/clay.js). Which art is up is said once in the log (garden.art); the hand's pose says the rest (open over the
// ground, pinched to sculpt, curled to grab).
//
// Prior art: Black & White's hand (the cursor as your whole presence: pick up, throw, pat and slap), Populous's raise and lower,
// From Dust's carved channels, and Animal Crossing's placing on a grid of plots.
//
//   const H = new GardenHand(realm)   H.update(dt)   H.art ('grab' | 'pull' | 'press' | 'carve' | 'smooth' | 'place')   H.held
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { FEATURES, costOf } from '../../progress/realm.js';
import { FEELING_COLOR } from './plots.js';
import { STATS } from '../../progress/spirits.js';
import { SculptBrush } from '../../vfx/garden/sculptbrush.js';

export const ARTS = ['grab', 'pull', 'press', 'carve', 'smooth', 'place'];
const FEATURE_NAME = { terrace: 'terrace', pavilion: 'pavilion', spiritHouse: 'spirit house', pond: 'pond', lantern: 'lantern', incense: 'incense burner', stone: 'formation stone', drillYard: 'drill yard' }; // (the features as said, not their code ids: Espada's to word)
const HAND = { reach: 2.2, throwMax: 26, lift: 1.4, tap: 0.22, brush: 3, every: 0.05 }; // (grab within 2.2 m of the ray; a throw at most 26 m/s; a tap under 0.22 s pets; a stroke 3 m wide, 20 a second)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix4();

/** Where a ray (o, unit d) first meets a sphere, or -1. */
/** Where a ray meets a planetoid's ground as shaped (its needles and hills: GARDEN-SWEEP #6): its reach's sphere first, then marched
 *  in steps and halved to the surface; -1 when it misses. */
const _rp = new THREE.Vector3();
export function rayGround(o, d, P) {
  if (!P.radiusAt) return raySphere(o, d, P.c, P.r);
  const R = P.rMax ?? P.r + 4, inside = o.distanceTo(P.c) < R;
  let t = inside ? 0 : raySphere(o, d, P.c, R); if (t < 0) return -1;
  const under = (tt) => { _rp.copy(o).addScaledVector(d, tt).sub(P.c); const r = _rp.length(); return r < P.radiusAt(_rp.divideScalar(r || 1)); };
  for (const end = t + 2 * R, step = 0.4; t < end; t += step) if (under(t)) { let a = t - step, b = t; for (let k = 0; k < 6; k++) { const m = (a + b) / 2; if (under(m)) b = m; else a = m; } return b; }
  return -1;
}
export function raySphere(o, d, c, r) {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, k = ox * ox + oy * oy + oz * oz - r * r, h = b * b - k;
  if (h < 0) return -1;
  const s = Math.sqrt(h), t = -b - s;
  return t > 0 ? t : -b + s;
}

export class GardenHand {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.art = 'grab';
    this.held = null; this.dist = 0; this.at = new THREE.Vector3(); this.prev = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.point = new THREE.Vector3(); this.hit = null; this.downT = 0; this.stroke = null; this.brushT = 0;
    this.brush = new SculptBrush({ fx: realm.game.fx }); realm.place.group.add(this.brush.group); // (Calissa's: the ring on the clay under the hand)
  }

  setArt(a) {
    if (!ARTS.includes(a) || a === this.art) return;
    this.art = a; this.R.plots?.show(a === 'place');
    this.game.events?.emit('garden.art', { art: a, by: 'courier' });
  }

  /** The cursor's ray, and the planetoid it meets (the ground under the hand). */
  ray() {
    const g = this.game, I = g.input, cam = g.camera;
    const o = cam.position, d = _v.set((I.mx / innerWidth) * 2 - 1, -(I.my / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(o).normalize().clone();
    let tHit = Infinity, planet = null;
    for (const P of this.R.place.planets) { const t = rayGround(o, d, P); if (t > 0 && t < tHit) { tHit = t; planet = P; } }
    this.hit = planet ? { planet, point: o.clone().addScaledVector(d, tHit) } : null;
    this.point.copy(planet ? this.hit.point : o.clone().addScaledVector(d, 30));
    return { o: o.clone(), d };
  }
  /** The Jar or a spirit nearest the ray, within reach. */
  pick(o, d) {
    let best = null, bd = HAND.reach;
    for (const b of [{ hop: this.R.jar, kind: 'jar' }, ...this.R.spirits.map((s) => ({ hop: s.hop, kind: 'spirit', s }))]) {
      const t = Math.max(0, _w.copy(b.hop.pos).sub(o).dot(d)), near = _w.copy(o).addScaledVector(d, t).distanceTo(b.hop.pos);
      if (near < bd) { bd = near; best = b; }
    }
    return best;
  }

  update(dt) {
    const g = this.game, I = g.input, R = this.R;
    for (let k = 0; k < ARTS.length; k++) if (I.wasPressed(`Digit${k + 1}`) && !g.log?.typing) this.setArt(ARTS[k]);
    const { o, d } = this.ray(), cursorIn = I.mx >= 0, menuOpen = !!(g.indexMenu?.open || g.course?.menu?.open);
    if (!cursorIn || menuOpen) { this.letGo(); this.brush.hide(); return this.pose(dt); }
    // the right button: a flick for the spirit under the hand
    if (I.wasPressed('Mouse2')) { if (R.kiln?.active) R.kiln.flick(this.point); else { const b = this.pick(o, d); if (b?.kind === 'spirit') R.raising.flick(b.s); } } // (in the Heavenly Kiln, the flick sends a bolt back)
    switch (this.art) {
      case 'grab': this.grab(dt, o, d); break;
      case 'place': if (I.wasPressed('Mouse0') && this.hit) { const p = R.plots.near(this.hit.point, 2.6); if (p && !p.placed) this.choose(p); } break;
      default: this.sculpt(dt);
    }
    // the brush's ring on the clay under the hand, for the four strokes
    if (this.hit && !['grab', 'place'].includes(this.art)) { const P = this.hit.planet; this.brush.at(P.look, this.hit.point.clone().sub(P.c), HAND.brush, this.art === 'pull' ? 'raise' : this.art === 'smooth' ? 'smooth' : 'dig'); this.brush.work(!!this.stroke); }
    else this.brush.hide();
    this.brush.update(this.game.rawDt ?? dt);
    this.pose(dt);
  }

  // ---- grab, throw, pet
  grab(dt, o, d) {
    const I = this.game.input;
    if (I.wasPressed('Mouse0') && !this.held) {
      const b = this.pick(o, d);
      if (b) { this.held = b; this.dist = o.distanceTo(b.hop.pos); this.downT = 0; this.moved = 0; b.hop.held = true; b.hop.flight = null; this.at.copy(b.hop.pos); this.prev.copy(this.at); sfx.grab?.(); }
    }
    if (!this.held) return;
    this.downT += dt;
    const want = _w.copy(o).addScaledVector(d, this.dist);
    this.prev.copy(this.at); this.at.lerp(want, 1 - Math.exp(-14 * dt)); this.moved += this.at.distanceTo(this.prev);
    this.vel.copy(this.at).sub(this.prev).divideScalar(Math.max(dt, 1e-3));
    this.held.hop.pos.copy(this.at);
    if (!I.isDown('Mouse0')) {
      const b = this.held;
      if (b.kind === 'spirit' && this.downT < HAND.tap && this.moved < 0.4) { b.hop.held = false; this.R.raising.pet(b.s); } // (a tap: a pat on the head)
      else { b.hop.release(this.vel.clampLength(0, HAND.throwMax)); sfx.toss?.(); }
      this.held = null;
    }
  }
  letGo() { if (this.held) { this.held.hop.release(new THREE.Vector3()); this.held = null; } this.endStroke(); }

  // ---- the clay
  sculpt(dt) {
    const I = this.game.input, how = this.art;
    if (!I.isDown('Mouse0') || !this.hit) { this.endStroke(); return; }
    const P = this.hit.planet, clay = this.R.clays[P.id]; if (!clay) return;
    this.stroke ||= { planet: P, how, moved: false };
    if ((this.brushT -= dt) > 0) return;
    this.brushT = HAND.every;
    const dir = this.hit.point.clone().sub(P.c).normalize();
    if (clay.brush(dir, how, how === 'smooth' ? 0.5 : 0.12, HAND.brush)) { this.stroke.moved = true; this.R.reshape(P); }
  }
  endStroke() {
    const S = this.stroke; this.stroke = null; if (!S?.moved) return;
    this.R.reshape(S.planet, true);
    this.game.events?.emit('garden.sculpt', { planetoid: S.planet.id, how: S.how, by: 'courier' });
  }

  // ---- placing: the page of what may stand there (its cost in cubes and a material of the feeling's kind)
  choose(p) {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    menu.showPage('garden.place', (im, el) => {
      // one row a feature, its five feelings in the order the pages show them (STATS: wonder first); what you cannot afford is shown dim,
      // never hidden (Dovina's ruling, GARDEN-SWEEP #14). Which features a Firing opens waits on Dovina's table: all are listed until then.
      const rows = el('div', 'rooms'), cubes = g.cubes?.balance ?? Infinity, has = (m) => !m || g.pneuka?.slots.some((x) => x?.id === `mat.${m}`);
      for (const [id, F] of Object.entries(FEATURES)) {
        const c0 = costOf(id, 'wonder'), d = el('div', 'room', `<span class="n">◇</span><span><b>${FEATURE_NAME[id] || id}</b><s>${F.does} · ${c0.cubes} cubes and a material of its feeling</s></span>`);
        const pick = el('span', 'feel');
        for (const f of Object.keys(STATS)) {
          const c = costOf(id, f), ok = cubes >= c.cubes && has(c.material), b = el('span', '', `◆ ${f}`);
          b.style.cssText = `color:#${FEELING_COLOR[f].toString(16).padStart(6, '0')};margin-right:.8em;cursor:pointer;opacity:${ok ? 1 : 0.35}`;
          b.title = `${c.cubes} cubes${c.material ? ` and ${/^[aeiou]/.test(c.material) ? 'an' : 'a'} ${c.material} material` : ''}`;
          b.onclick = (e) => { e.stopPropagation(); const r = this.R.plots.place(p, id, f); if (!r.ok) g.log?.say('warn', r.why, { key: 'garden.place', throttle: 1 }); else this.R.flowAll(); menu.close(); };
          pick.appendChild(b);
        }
        d.lastChild.appendChild(pick); rows.appendChild(d);
      }
      im.appendChild(el('div', 'grp', `A PLOT ON ${p.planet.name.toUpperCase()}`)); im.appendChild(rows);
    }, { title: 'PLACE', sub: 'click a feeling beside a feature · F closes' });
  }

  // ---- the model: over what it holds, or the ground under the cursor, its fingers by the art
  pose(dt) {
    const R = this.R, god = R.god, hand = god?.hand; if (!hand?.root) return;
    const at = this.held ? this.at : this.point, n = R.place.planets.reduce((b, P) => (at.distanceTo(P.c) - P.r < at.distanceTo(b.c) - b.r ? P : b)).c;
    const up = _w.copy(at).sub(n).normalize(), fwd = R.cam.fwd.clone().projectOnPlane(up).normalize();
    const fingers = fwd.clone().multiplyScalar(Math.cos(0.5)).addScaledVector(up, -Math.sin(0.5)).normalize(), back = up.clone().addScaledVector(fingers, -up.dot(fingers)).normalize();
    _m.makeBasis(new THREE.Vector3().crossVectors(fingers, back).normalize(), fingers, back); hand.root.quaternion.setFromRotationMatrix(_m);
    hand.root.position.copy(at).addScaledVector(up, this.held ? 0.6 : this.stroke ? 0.5 : HAND.lift).addScaledVector(fingers, -hand.tip.length());
    const want = this.held ? 1 : this.stroke ? 0.65 : this.art === 'grab' ? 0.15 : 0.4;
    hand.grab += (want - hand.grab) * Math.min(1, dt * 12); hand.point = this.art === 'place' ? 1 : 0;
    god.t = (god.t || 0) + dt; god.poseHand?.(dt);
  }
}
