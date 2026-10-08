// ---------------------------------------------------------------------------------------
// THE GOD HAND IN THE GARDEN: the cursor is the hand, always (docs/plans/SPIRIT-GARDEN.md sections 1 and 4). Its arts, by the number
// keys: 1 GRAB (pick up the Jar or a spirit and throw it; a quick tap on a spirit PETS it, the right button FLICKS it), the terraforming
// strokes (the owner: "fluid sims, mesh deformation, the works"): 2 PULL and 3 PRESS (raise and lower the planetoid's clay), 4 SMOOTH,
// 5 FLATTEN (to the height where the stroke began: terraces), 6 CARVE (a narrow groove, for water to run in), 7 ROUGHEN; 8 WATER (pour
// with the left button, drink up with the right, a spring with Shift and the left, a drain with Ctrl and the left, Shift and the right
// takes the nearest away: world/garden/waterworks.js); 9 PLACE (a feature in a plot: world/garden/plots.js); 0 PAINT (a ground's
// material with the left button, none with the right: world/garden/clay.js). R turns the choice: PAINT's ground, WATER's feeling. GRAB
// also lifts a placed feature and sets it in the free plot it is let go over (its formation worked out again there, free). Shift and the
// wheel size the stroke (1 to 12 m); Ctrl+Z undoes the last of ten; Ctrl+Backspace twice within three real seconds puts the planetoid
// under the hand back to its rest shape (its clay, its paint and its water: free). The model is the god hand's own (godhand/godhand.js; its clips: godhand/godhandclips.js); the strokes are the
// clay's (world/garden/clay.js). Which art is up is said once in the log (garden.art); the hand's clip says the rest (a snap for the
// art, pulling, patting, shooing, pointing to carve and place, a pat for a pet, a flick, a backhand for an undo, the grip to hold).
//
// Prior art: Black & White's hand (the cursor as your whole presence: pick up, throw, pat and slap), Populous's raise and lower,
// From Dust's carved channels, and Animal Crossing's placing on a grid of plots.
//
//   const H = new GardenHand(realm)   H.update(dt)   H.art (ARTS)   H.held   H.size (metres)   H.undo()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { FEATURES, costOf } from '../../progress/realm.js';
import { FEELING_COLOR } from './plots.js';
import { STATS, firingOf, ranksOf } from '../../progress/spirits.js';
import { SculptBrush } from '../../vfx/garden/sculptbrush.js';
import { basinVolume } from './water.js';
import { GROUNDS } from './clay.js';
import { FEELINGS } from './water.js';

export const ARTS = ['grab', 'pull', 'press', 'smooth', 'flatten', 'carve', 'roughen', 'water', 'place', 'paint']; // (keys 1 to 9, then 0)
const KEY = (k) => `Digit${(k + 1) % 10}`;
const RESET = { within: 3 }; // (real seconds between the two presses that put a planetoid back)
const STROKE = { pull: 0.12, press: 0.12, carve: 0.12, smooth: 0.5, flatten: 0.5, roughen: 0.25, size: [1, 12], undo: 10 }; // (metres a stroke tick, or the share eased; the size's range; strokes kept to undo)
const FEATURE_NAME = { terrace: 'herb terrace', pavilion: 'echo pavilion', spiritHouse: 'spirit house', pond: 'Lachryma pond', lantern: 'stone lantern', incense: 'incense burner', stone: 'formation stone', drillYard: 'drill yard' }; // (the features as said, not their code ids: Espada's words)
const HAND = { reach: 2.2, throwMax: 26, lift: 1.4, tap: 0.22, brush: 3, every: 0.05 }; // (grab within 2.2 m of the ray; a throw at most 26 m/s; a tap under 0.22 s pets; a stroke 3 m wide, 20 a second)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix4(), _UP = new THREE.Vector3(0, 1, 0);

/** Where a ray (o, unit d) first meets a sphere, or -1. */
/** Where a ray meets a planetoid's ground as shaped (its needles and hills: GARDEN-SWEEP #6): its reach's sphere first, then marched
 *  in steps and halved to the surface; -1 when it misses. */
const _rp = new THREE.Vector3(), _n2 = new THREE.Vector3();
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
    this.point = new THREE.Vector3(); this.hit = null; this.downT = 0; this.stroke = null; this.brushT = 0; this.size = HAND.brush; this.undos = [];
    this.brush = new SculptBrush({ fx: realm.game.fx }); realm.site.group.add(this.brush.group); // (Calissa's: the ring on the clay under the hand)
    this.ground = GROUNDS[0]; this.feeling = null; // (PAINT's ground; WATER's feeling, null: your draught's)
    this.resetAsk = null; this.clock = 0; // ({ planet, t } after the first Ctrl+Backspace; the hand's own real seconds)
  }

  setArt(a) {
    if (!ARTS.includes(a) || a === this.art) return;
    this.art = a; this.R.plots?.show(a === 'place');
    this.game.events?.emit('garden.art', { art: a, ground: a === 'paint' ? this.ground : undefined, feeling: a === 'water' ? this.feeling || undefined : undefined, by: 'courier' });
  }
  /** A bought planetoid's seed in the hand (world/garden/orbit.js), until it is let go in the open sky. */
  carrySeed(id) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), this.R.site.mats.lotus); mesh.name = 'garden-seed';
    this.R.site.group.add(mesh); this.seed = { id, mesh }; this.setArt('grab');
  }
  /** R: the next ground to paint, or the next feeling to pour (wonder first, as the pages show them; then your draught's again). */
  turn() {
    if (this.art === 'paint') this.ground = GROUNDS[(GROUNDS.indexOf(this.ground) + 1) % GROUNDS.length];
    else if (this.art === 'water') { const i = this.feeling ? FEELINGS.indexOf(this.feeling) + 1 : 0; this.feeling = i < FEELINGS.length ? FEELINGS[i] : null; }
    else return;
    this.game.events?.emit('garden.art', { art: this.art, ground: this.art === 'paint' ? this.ground : undefined, feeling: this.art === 'water' ? this.feeling || 'draught' : undefined, by: 'courier' });
  }
  /** Ctrl+Backspace: asked twice within RESET.within real seconds, the planetoid under the hand is put back to its rest shape. */
  askReset() {
    const P = this.hit?.planet; if (!P) return;
    const now = this.clock;
    if (this.resetAsk?.planet === P && now - this.resetAsk.t < RESET.within) { this.resetAsk = null; this.R.resetPlanetoid(P); return; }
    this.resetAsk = { planet: P, t: now };
    this.game.events?.emit('garden.reset.ask', { planetoid: P.id, by: 'courier' });
  }

  /** The cursor's ray, and the planetoid it meets (the ground under the hand). */
  ray() {
    const g = this.game, I = g.input, cam = g.camera;
    const o = cam.position, d = _v.set((I.mx / innerWidth) * 2 - 1, -(I.my / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(o).normalize().clone();
    let tHit = Infinity, planet = null;
    for (const P of this.R.site.planets) { const t = rayGround(o, d, P); if (t > 0 && t < tHit) { tHit = t; planet = P; } }
    this.hit = planet ? { planet, point: o.clone().addScaledVector(d, tHit) } : null;
    this.point.copy(planet ? this.hit.point : o.clone().addScaledVector(d, 30));
    return { o: o.clone(), d };
  }
  /** The Jar or a spirit nearest the ray, within reach. */
  pick(o, d) {
    let best = null, bd = HAND.reach;
    for (const b of [{ body: this.R.jarBody, kind: 'jar' }, ...this.R.spirits.map((s) => ({ body: s.body, kind: 'spirit', s }))]) {
      const t = Math.max(0, _w.copy(b.body.pos).sub(o).dot(d)), near = _w.copy(o).addScaledVector(d, t).distanceTo(b.body.pos);
      if (near < bd) { bd = near; best = b; }
    }
    return best;
  }

  update(dt) {
    const g = this.game, I = g.input, R = this.R;
    this.clock += g.rawDt ?? dt;
    if (R.press?.viewing) { this.brush.hide(); R.press.handle(dt, this); return this.pose(dt); } // (the press view: the station has the hand, world/garden/press.js)
    const typing = g.log?.typing, ctrl = I.isDown('ControlLeft') || I.isDown('ControlRight'), shift = I.isDown('ShiftLeft') || I.isDown('ShiftRight');
    for (let k = 0; k < ARTS.length; k++) if (I.wasPressed(KEY(k)) && !typing) this.setArt(ARTS[k]);
    if (I.wasPressed('KeyR') && !typing) this.turn();
    if (this.seed) { const { o: so, d: sd } = this.ray(); this.seed.mesh.position.copy(this.hit ? this.hit.point : so.clone().addScaledVector(sd, 30)); this.seed.mesh.rotation.y += dt;
      if (I.wasPressed('Mouse0')) { if (this.hit) this.game.log?.say('warn', 'Let it go in the open sky, away from the planetoids.', { key: 'garden.seed', throttle: 1 }); else if (this.R.orbit.release(this.seed.id, this.seed.mesh.position)) { this.R.site.group.remove(this.seed.mesh); this.seed = null; } }
      this.brush.hide(); return this.pose(dt); }
    if (ctrl && I.wasPressed('Backspace') && !typing) this.askReset();
    if (shift && I.wheel) { this.size = THREE.MathUtils.clamp(this.size * (1 + Math.sign(I.wheel) * 0.15), STROKE.size[0], STROKE.size[1] * (this.game.alchemy?.widen?.('visualization.canvas') ?? 1)); I.wheel = 0; } // (Shift and the wheel: the stroke's size)
    if (ctrl && I.wasPressed('KeyZ') && !typing) this.undo();
    const { o, d } = this.ray(), cursorIn = I.mx >= 0, menuOpen = !!(g.indexMenu?.open || g.course?.menu?.open);
    if (!cursorIn || menuOpen) { this.letGo(); this.brush.hide(); return this.pose(dt); }
    // the right button: a flick for the spirit under the hand
    if (I.wasPressed('Mouse2') && this.art !== 'water') { if (R.tribulation?.active) R.tribulation.flick(this.point); else { const b = this.pick(o, d); if (b?.kind === 'spirit') R.raising.flick(b.s); } } // (in the Heavenly Kiln, the flick sends a bolt back)
    switch (this.art) {
      case 'grab': this.grab(dt, o, d); break;
      case 'paint': this.paint(dt); break;
      case 'water': R.waterworks?.handle(dt, this.hit, { feeling: this.feeling, pour: I.isDown('Mouse0') && !shift && !ctrl, drink: I.isDown('Mouse2') && !shift, spring: shift && I.wasPressed('Mouse0'), drain: ctrl && I.wasPressed('Mouse0'), unset: shift && I.wasPressed('Mouse2') }); break;
      case 'place': if (I.wasPressed('Mouse0') && this.hit) { const p = R.plots.near(this.hit.point, 2.6); if (p && !p.placed) this.choose(p); } break;
      default: this.sculpt(dt);
    }
    // the brush's ring on the clay under the hand, for the four strokes
    if (this.hit && !['grab', 'place'].includes(this.art)) { const P = this.hit.planet; this.brush.at(P.look, this.hit.point.clone().sub(P.c), this.art === 'water' ? 1.5 : this.size, this.art === 'pull' ? 'raise' : this.art === 'smooth' || this.art === 'flatten' || this.art === 'water' || this.art === 'paint' ? 'smooth' : 'dig'); this.brush.work(!!this.stroke); }
    else this.brush.hide();
    this.brush.update(this.game.rawDt ?? dt);
    this.pose(dt);
  }

  // ---- grab, throw, pet
  grab(dt, o, d) {
    const I = this.game.input;
    if (I.wasPressed('Mouse0') && !this.held) {
      const b = this.pick(o, d);
      if (b) { this.held = b; this.dist = o.distanceTo(b.body.pos); this.downT = 0; this.moved = 0; b.body.held = true; b.body.flight = null; this.at.copy(b.body.pos); this.prev.copy(this.at); sfx.grab?.(); }
      else if (this.hit) { const p = this.R.plots.near(this.hit.point, 2.2); if (p?.placed) { this.held = { kind: 'feature', plot: p }; this.R.plots.show(true); sfx.grab?.(); } } // (a placed feature: lifted, to be set in another plot)
    }
    if (this.held?.kind === 'feature') return this.carryFeature();
    if (!this.held) return;
    this.downT += dt;
    const want = _w.copy(o).addScaledVector(d, this.dist);
    // never into the ground: what the hand holds stays over the planetoid under it (the held Jar was dragged 5.6 m in, casebook 2026-10-07)
    { const P = this.R.jarBody.nearest(want), n = _n2.copy(want).sub(P.c), r = n.length(), floor = (P.radiusAt ? P.radiusAt(n.divideScalar(r || 1)) : P.r) + this.held.body.radius + 0.1; if (r < floor) want.copy(P.c).addScaledVector(n, floor); }
    this.prev.copy(this.at); this.at.lerp(want, 1 - Math.exp(-14 * dt)); this.moved += this.at.distanceTo(this.prev);
    this.vel.copy(this.at).sub(this.prev).divideScalar(Math.max(dt, 1e-3));
    this.held.body.pos.copy(this.at);
    if (!I.isDown('Mouse0')) {
      const b = this.held;
      if (b.kind === 'spirit' && this.downT < HAND.tap && this.moved < 0.4) { b.body.held = false; this.R.raising.pet(b.s); } // (a tap: a pat on the head)
      else { b.body.release(this.vel.clampLength(0, HAND.throwMax)); sfx.toss?.(); }
      this.held = null;
    }
  }
  /** A feature held: it follows the ground under the hand, and is set in the free plot it is let go over (or goes back to its own). */
  carryFeature() {
    const I = this.game.input, p = this.held.plot, G = p.group;
    if (G && this.hit) { const n = this.hit.point.clone().sub(this.hit.planet.c).normalize(); G.position.copy(this.hit.point).addScaledVector(n, 0.8); G.quaternion.setFromUnitVectors(_UP, n); }
    if (I.isDown('Mouse0')) return;
    const to = this.hit ? this.R.plots.near(this.hit.point, 2.6) : null;
    this.held = null; this.R.plots.show(this.art === 'place');
    if (to && to !== p && !to.placed) this.R.plots.move(p, to); else this.R.plots.settle(p); // (moved free: the formation worked out where it lands)
    this.R.flowAll();
  }
  letGo() { if (this.held?.kind === 'feature') { this.R.plots.settle(this.held.plot); this.held = null; this.R.plots.show(this.art === 'place'); } else if (this.held) { this.held.body.release(new THREE.Vector3()); this.held = null; } this.endStroke(); }

  // ---- paint: a ground's material where the hand is (the left button), none (the right); a stroke as the clay's, undone the same way
  paint(dt) {
    const I = this.game.input, clear = I.isDown('Mouse2'), on = I.isDown('Mouse0') || clear;
    if (!on || !this.hit) { this.endStroke(); return; }
    const P = this.hit.planet, clay = this.R.clays[P.id]; if (!clay) return;
    if (!this.stroke) { this.stroke = { planet: P, how: 'paint', moved: false, ground: clear ? null : this.ground }; this.undos.push({ planet: P, h: clay.snapshot() }); if (this.undos.length > STROKE.undo) this.undos.shift(); }
    if ((this.brushT -= dt) > 0) return;
    this.brushT = HAND.every;
    if (clay.paint(this.hit.point.clone().sub(P.c), this.stroke.ground, this.size)) { this.stroke.moved = true; this.R.reshape(P); if (this.stroke.ground === 'moss') this.R.plants?.seed(P, this.hit.point.clone().sub(P.c), this.size * 0.5); } // (moss painted is moss growing)
  }

  // ---- the clay
  sculpt(dt) {
    const I = this.game.input, how = this.art;
    if (!I.isDown('Mouse0') || !this.hit) { this.endStroke(); return; }
    const P = this.hit.planet, clay = this.R.clays[P.id]; if (!clay) return;
    const dir = this.hit.point.clone().sub(P.c).normalize();
    if (!this.stroke) { // (a stroke begins: what it changes can be undone, and a flattening keeps the height it began at)
      this.stroke = { planet: P, how, moved: false, to: clay.heightAt(dir), path: how === 'carve' ? [] : null, held: basinVolume(clay) }; // (a carve's path: a track if it closes on itself, world/garden/races.js; held: what its basins hold before, for the stroke's q)
      this.undos.push({ planet: P, h: clay.snapshot() }); if (this.undos.length > STROKE.undo) this.undos.shift();
    }
    if ((this.brushT -= dt) > 0) return;
    this.brushT = HAND.every;
    if (this.stroke.path && this.stroke.planet === P) this.stroke.path.push(dir.clone());
    if (clay.brush(dir, how, STROKE[how] ?? 0.12, this.size, { to: this.stroke.to })) { this.stroke.moved = true; this.R.reshape(P); this.R.waterworks?.disturb(P); }
  }
  /** Ctrl+Z: the last stroke taken back (the ground as it was before it, and the water told). */
  undo() {
    const U = this.undos.pop(); if (!U) return;
    this.R.clays[U.planet.id]?.restore(U.h); this.R.reshape(U.planet, true); this.R.waterworks?.disturb(U.planet); this.R.plots.veins(U.planet); this.R.races?.redraw(U.planet);
    this.game.events?.emit('garden.undo', { planetoid: U.planet.id, by: 'courier' });
  }
  endStroke() {
    const S = this.stroke; this.stroke = null; if (!S) return; if (!S.moved) { this.undos.pop(); return; } // (nothing changed: nothing to undo)
    this.R.reshape(S.planet, true);
    if (S.how === 'paint') this.game.events?.emit('garden.paint', { planetoid: S.planet.id, ground: S.ground || 'none', by: 'courier' });
    else { const after = basinVolume(this.R.clays[S.planet.id]), q = S.held + after > 1e-3 ? after / (S.held + after) : 0.5; this.game.events?.emit('garden.sculpt', { planetoid: S.planet.id, how: S.how, q: +q.toFixed(3), by: 'courier' }); this.R.plots.veins(S.planet); this.R.races?.redraw(S.planet); if (S.path) this.R.races?.offer(S.planet, S.path); } // (a ridge raised moves the veins' ends: item 13; a carve that closes is a track: 17c) // (q: the basins after against before, 0.5 unchanged: TRAINING.md 6)
  }

  // ---- placing: the page of what may stand there (its cost in cubes and a material of the feeling's kind)
  choose(p) {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    menu.showPage('garden.place', (im, el) => {
      // one row a feature the Firings have opened (Dovina's table, FEATURES[id].firing), its five feelings in the order the pages show them
      // (STATS: wonder first); what you cannot afford is shown dim, never hidden (her ruling, GARDEN-SWEEP #14)
      const rows = el('div', 'rooms'), cubes = g.cubes?.balance ?? Infinity, has = (m) => !m || g.pneuka?.slots.some((x) => x?.id === `mat.${m}`);
      const fired = g.ledger ? firingOf(ranksOf(g.ledger)) : Infinity, shut = Object.values(FEATURES).filter((F) => (F.firing || 1) > fired).length;
      for (const [id, F] of Object.entries(FEATURES)) {
        if ((F.firing || 1) > fired) continue;
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
      if (shut) im.appendChild(el('div', 'grp', `${shut} more open with the Firings to come`));
    }, { title: 'PLACE', sub: 'click a feeling beside a feature · F closes' });
  }

  // ---- the model: over what it holds, or the ground under the cursor; its clip by the art
  pose(dt) {
    const R = this.R, god = R.god, hand = god?.hand; if (!hand?.root) return;
    const at = this.held ? this.at : this.point, n = R.site.planets.reduce((b, P) => (at.distanceTo(P.c) - P.r < at.distanceTo(b.c) - b.r ? P : b)).c;
    const up = _w.copy(at).sub(n).normalize(), fwd = (R.press?.viewing ? R.press.frame.N : R.camera.fwd).clone().projectOnPlane(up).normalize(); // (at the press, the view's north: SOUL-ALCHEMY.md 4.3)
    const fingers = fwd.clone().multiplyScalar(Math.cos(0.5)).addScaledVector(up, -Math.sin(0.5)).normalize(), back = up.clone().addScaledVector(fingers, -up.dot(fingers)).normalize();
    _m.makeBasis(new THREE.Vector3().crossVectors(fingers, back).normalize(), fingers, back); hand.root.quaternion.setFromRotationMatrix(_m);
    hand.root.position.copy(at).addScaledVector(up, this.held ? 0.6 : this.stroke ? 0.5 : R.press?.viewing ? R.press.look.handLift : HAND.lift).addScaledVector(fingers, -hand.tip.length()); // (at the press, raised over the bath: vfx/alchemy/presslook.js)
    god.handClips?.update(dt); // (its clips by the art, the stroke and what is held: godhand/godhandclips.js)
  }
}
