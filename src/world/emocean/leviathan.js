// ---------------------------------------------------------------------------------------
// THE ROGUE LEVIATHAN: Old Nobody (docs/plans/RAIL.md section 7; its numbers are progress/rail/setpieces.js LEVIATHAN, Dovina's; its look
// vfx/leviathan.js, Calissa's; its name Espada's). Rare and certain (a deck: it comes within its count), forty metres of crude-hided
// Egregore, a set piece of four faces, each with a bar or more of warning for every big blow (a spectacle to read, not a wall):
//
//   HEAVE     (0 to 8, the free view) the sea heaves; a lane ahead darkens for a bar (its shadow under the swell), then it breaches
//             along that lane: be out of it, or roll through the spray (two of what the ship bears). From here it spits: an outlined
//             glob every bar.
//   ABREAST   (8 to 18, abeam) it runs alongside: four gills on its near flank, open two bars in four as it breathes (only an open gill
//             takes a shot; 34 each); a fin rises a bar before it sweeps (too heavy to parry: roll); a spit parried back flies into
//             the nearest open gill (5).
//   SOUND     (18 to 26, from above) it sounds; its shadow grows under where the ship was for two bars; then it breaches from under:
//             be out of the 8 m ring.
//   MAW       (26 to 34, the free view) face to face, the jaw down: six teeth, a lance each; the throat's light swells before each spit,
//             and a spit sent home goes down it (five and the throat is struck).
// Every gill shut and the throat struck before the last bar: FELLED (three shards); else it sounds and is gone, DRIVEN off (one shard,
// and Letty Marque posts the bounty).
//
// Prior art: Panzer Dragoon's sea-beasts (a sequence of faces, each read before it strikes), Shadow of the Colossus's Phalanx (a beast
// that is a place), Sin & Punishment's leviathan, Star Fox 64's Sector Y and its boss of parts, Moby-Dick (survived, rarely killed).
//
//   const L = new LeviathanPiece(stage)   L.build(scene)   L.begin(leg)   L.update(dt, rel, ctx)   L.finish() -> 'driven' | 'felled'
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LEVIATHAN as N } from '../../progress/rail/setpieces.js';
import { SCORE } from '../../progress/rail/score.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { LeviathanLook } from '../../vfx/leviathan.js';
import { sfx } from '../../audio/sfx.js';

const FLANK = -1;           // (the flank it shows the ship: it runs on the ship's far side)
const ABEAM = -24;          // (rail frame: its spine's place alongside)
const _w = new THREE.Vector3(), _l = new THREE.Vector3(), _v = new THREE.Vector3();
const lerp = THREE.MathUtils.lerp, smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export class LeviathanPiece {
  constructor(stage) { this.stage = stage; this.game = stage.game; this.at = new THREE.Vector3(); this.rot = new THREE.Euler(); }

  build(scene) {
    const g = this.game;
    this.look = new LeviathanLook({ env: g.sky?.env || null, fx: g.fx || null }); this.look.group.visible = false;
    this.look.group.traverse((o) => { o.userData.zoneFree = true; }); this.look.group.userData.zoneFree = true;
    scene.add(this.look.group);
  }
  show(on) { if (this.look) { this.look.group.visible = on; if (!on) this.look.shadow(_l.set(0, 0, 0), 0, 0); } }

  /** Alongside: the side view's gun fires abeam, at its flank (courier/ship/ship.js). */
  abeam(rel) { return rel >= 8 && rel < 18 && !this.ended; }

  begin(leg) {
    const st = this.stage, W = st.waves, L = this.look;
    this.leg = leg; this.ended = null; this.lastBar = -1; this.breach = null; this.sounding = null; this.fins = { t: -1, side: FLANK };
    for (let i = 0; i < N.gills.count; i++) L.gill(i, { side: FLANK, open: 0, gone: false });
    for (let i = 0; i < N.teeth.count; i++) L.tooth(i, false);
    L.maw(0); L.throat(0);
    this.at.set(0, -14, 40); this.rot.set(0, 0, 0);
    this.place();
    this.gills = Array.from({ length: N.gills.count }, (_, i) => W.add({
      kind: 'rail.gill', name: 'a gill', role: 'gill', cls: 3, radius: 1.6, hp: N.gills.hp, chain: false, count: false, pay: SCORE.part.gill,
      returned: N.spit.returned, open: 0,
      get solid() { return this.open > 0.5; }, get lock() { return this.solid; }, armour: (f) => (f.open > 0.5 ? 1 : 0),
      tick: (dt, f) => { this.partAt(this.look.gillWorld(i, FLANK, _w), f.local); return !this.ended; },
      onDown: () => { this.look.gill(i, { side: FLANK, gone: true }); sfx.explosion?.(4); this.game.events?.emit('rail.part', { part: 'gill', by: 'courier' }); },
    }));
    this.teeth = Array.from({ length: N.teeth.count }, (_, i) => W.add({
      kind: 'rail.tooth', name: 'a tooth', role: 'tooth', cls: 2, radius: 0.9, hp: N.teeth.hp, chain: false, count: false, pay: SCORE.part.tooth,
      get solid() { return this.maw; }, get lock() { return this.maw; }, maw: false,
      tick: (dt, f) => { this.partAt(this.look.toothWorld(i, _w), f.local); f.maw = this.phase === 'maw'; return !this.ended; },
      onDown: () => { this.look.tooth(i, true); sfx.shatter?.(1, 4, 'porcelain'); this.game.events?.emit('rail.part', { part: 'tooth', by: 'courier' }); },
    }));
    this.throat = W.add({
      kind: 'rail.throat', name: 'its throat', role: 'throat', cls: 4, radius: 1.8, hp: N.throat.spits, chain: false, count: false, pay: 0, returned: 1,
      lock: false, armour: (f) => (f.last?.returned ? 1 : 0), // (only its own spit, sent home, goes down it)
      get solid() { return this.maw; }, maw: false,
      tick: (dt, f) => { this.partAt(this.look.throatWorld(_w), f.local); f.maw = this.phase === 'maw'; return !this.ended; },
      onDown: () => { this.look.throat(0); this.game.events?.emit('rail.part', { part: 'throat', by: 'courier' }); },
    });
    this.body = W.add({ // (the beast itself: what the medal counts; its hide takes nothing, and shots pass to its parts)
      kind: 'rail.leviathan', name: 'Old Nobody', role: 'leviathan', cls: 4, radius: 3.5, hp: 1e9, chain: false, pay: 0, lock: false, solid: false, armour: () => 0,
      tick: (dt, f) => { f.local.copy(this.at); return !this.ended; },
    });
    this.show(true);
  }

  partAt(w, out) { const Q = this.stage.rail.Q; return out.set(Q.x - w.x, w.y - Q.y, w.z - Q.z); }
  place() { const st = this.stage, G = this.look.group; st.rail.toWorld(this.at, G.position); G.rotation.copy(this.rot); G.updateMatrixWorld(true); }

  get phase() { const r = this.rel ?? 0; return r < 8 ? 'heave' : r < 18 ? 'abreast' : r < 26 ? 'sound' : 'maw'; }

  update(dt, rel, ctx) {
    const st = this.stage, S = st.ship, raw = this.game.rawDt ?? dt, L = this.look, bar = Math.floor(rel);
    this.rel = rel;
    if (this.ended) this.leave(dt);
    else if (rel < 8) this.heave(rel, dt);
    else if (rel < 18) this.abreast(rel, dt);
    else if (rel < 26) this.sound(rel, dt);
    else this.maw(rel, dt);
    this.place();
    // below the surface or above it: the music dives with it (the owner's ruling: Wanda filters the boss line while `under`); the hook
    // every boss of the rail sets, Charybdis's too when it lands (stage.foe)
    st.stage.foe = { id: 'nobody', under: !this.ended && L.group.visible && L.group.position.y < st.rail.Q.y - 0.5 };
    if (bar !== this.lastBar && !this.ended) { this.lastBar = bar; this.onBar(bar, rel); }
    if (this.throatT > 0 && (this.throatT -= dt) <= 0) L.throat(0);
    L.update(raw, st.sea);
    void S;
  }

  /** The heave: under the swell ahead; a lane darkens for a bar, then it breaches along it. */
  heave(rel, dt) {
    const st = this.stage, S = st.ship, L = this.look;
    if (!this.breach && rel >= 2) { this.breach = { x: S.local.x, t0: rel, hit: false }; this.game.events?.emit('rail.warn', { blow: 'breach', bars: N.breach.warn, by: 'creature' }); }
    const b = this.breach;
    if (!b) { this.at.set(0, -14, 40); this.rot.set(0, 0, 0); L.set({ swim: 0.4, bend: 0 }); return; }
    const k = (rel - b.t0) / N.breach.warn;
    L.shadow(st.rail.toWorld(_l.set(b.x, 0, S.local.z + 4), _w), 0, k < 1 ? smooth(k) : Math.max(0, 1 - (k - 1) * 2), st.sea);
    if (k >= 1) { // (it leaps along the lane, nose first, and under again)
      const u = Math.min(1, (k - 1) / 1.5);
      this.at.set(b.x, -10 + 18 * Math.sin(u * Math.PI), S.local.z - 20 + 50 * u); this.rot.set(-Math.cos(u * Math.PI) * 0.7, 0, 0);
      if (!b.hit && u > 0.35) { b.hit = true; if (Math.abs(S.local.x - b.x) < 4.5) this.stage.blow(N.breach.hits, { by: 'creature', what: 'breach', rollable: true }); sfx.splash?.(); this.stage.trauma = Math.min(1, this.stage.trauma + 0.4); }
      if (u >= 1) { this.at.set(ABEAM, -12, -20); }
    } else { this.at.set(b.x, -14, S.local.z + 4); this.rot.set(0, 0, 0); }
  }

  /** Alongside: it keeps pace on the far flank; its gills breathe; a fin rises a bar, then sweeps. */
  abreast(rel, dt) {
    const L = this.look, S = this.stage.ship;
    this.at.set(ABEAM, lerp(this.at.y, -1.2, Math.min(1, dt * 1.5)), lerp(this.at.z, 2 + Math.sin(rel * 0.4) * 4, Math.min(1, dt)));
    this.rot.set(0, 0, 0); L.set({ swim: 0.6, bend: Math.sin(rel * 0.3) * 0.08 });
    const open = ((rel - 8) % N.gills.of) < N.gills.open ? 1 : 0;
    for (const [i, g] of this.gills.entries()) if (g.alive) { g.flashT = Math.max(0, (g.flashT || 0) - dt); g.open = lerp(g.open, g.flashT > 0 ? 1 : open, Math.min(1, dt * 5)); L.gill(i, { side: FLANK, open: g.open }); } // (the plate's Flash holds a gill open)
    // the fin: raised a bar (its windup), then the sweep
    const F = this.fins;
    if (F.t >= 0) {
      F.t += dt / BAR_S; L.fin(F.side, F.t < N.fin.windup ? smooth(F.t / N.fin.windup) : -1);
      if (F.t >= N.fin.windup && !F.hit) { F.hit = true; this.stage.blow(N.fin.hits, { by: 'creature', what: 'fin', rollable: true }); sfx.whoosh?.(); }
      if (F.t >= N.fin.windup + 0.4) { F.t = -1; L.fin(F.side, 0); }
    }
    void S;
  }

  /** It sounds: down, its shadow growing under where the ship was, then up from under through the ring. */
  sound(rel, dt) {
    const st = this.stage, S = st.ship, L = this.look, at = N.sound.at - 62; // (the breach from under, on the set piece's 22nd bar)
    for (const [i, g] of this.gills.entries()) if (g.alive) { g.open = 0; L.gill(i, { side: FLANK, open: 0 }); }
    if (!this.sounding && rel >= at - N.sound.grow) { this.sounding = { c: S.local.clone().setY(0), hit: false }; this.game.events?.emit('rail.warn', { blow: 'sound', bars: N.sound.grow, by: 'creature' }); }
    const s = this.sounding;
    if (!s) { this.at.set(ABEAM, lerp(this.at.y, -24, Math.min(1, dt)), this.at.z); this.rot.set(0.5, 0, 0); return; }
    const k = (rel - (at - N.sound.grow)) / N.sound.grow;
    L.shadow(st.rail.toWorld(_l.copy(s.c), _w), 0, Math.min(1, k), st.sea);
    if (k < 1) { this.at.set(s.c.x, -26, s.c.z); this.rot.set(-Math.PI / 2, 0, 0); return; }
    const u = Math.min(1, (k - 1) * 1.6);
    this.at.set(s.c.x, -26 + 34 * Math.sin(u * Math.PI * 0.6), s.c.z); this.rot.set(-Math.PI / 2 + u * 0.6, 0, 0);
    if (!s.hit && u > 0.25) {
      s.hit = true; L.shadow(_w, 0, 0, st.sea);
      if (Math.hypot(S.local.x - s.c.x, S.local.z - s.c.z) < N.sound.radius) this.stage.blow(N.sound.hits, { by: 'creature', what: 'sound' });
      sfx.splash?.(); this.stage.trauma = Math.min(1, this.stage.trauma + 0.5);
    }
  }

  /** Face to face: ahead of the ship, the jaw down, teeth and throat. */
  maw(rel, dt) {
    const L = this.look, S = this.stage.ship;
    this.at.set(lerp(this.at.x, S.local.x * 0.5, Math.min(1, dt)), lerp(this.at.y, -1.5, Math.min(1, dt)), lerp(this.at.z, 44, Math.min(1, dt * 0.8)));
    this.rot.set(0, Math.PI, 0); L.set({ swim: 0.35, bend: 0 }); L.maw(1);
  }

  /** On the bar: a spit (outlined, from the throat, its light swelling first); a fin's windup every other bar alongside. */
  onBar(bar, rel) {
    const st = this.stage, S = st.ship;
    if (rel >= 4 && (this.phase === 'heave' || this.phase === 'abreast' || this.phase === 'maw') && bar % N.spit.every === 0) {
      this.look.throat(1); this.throatT = 0.3; // (its light swells, and dies with the spit)
      const mouth = this.throat.alive ? this.throat.local : this.at, aim = _v.copy(S.local).sub(mouth).normalize().multiplyScalar(18);
      // (sent home: alongside, into the nearest open gill; face to face, down its throat)
      const home = this.phase === 'maw' ? (this.throat.alive ? this.throat : null) : this.gills.filter((g) => g.alive && g.open > 0.5).sort((a, b) => a.local.distanceTo(S.local) - b.local.distanceTo(S.local))[0] || this.gills.find((g) => g.alive) || null;
      st.shots.foe(_l.copy(mouth), aim, { outlined: true, from: home });
    }
    if (this.phase === 'abreast' && (bar - 8) % N.fin.every === 1 && this.fins.t < 0) { this.fins = { t: 0, side: FLANK, hit: false }; this.game.events?.emit('rail.warn', { blow: 'fin', bars: N.fin.windup, by: 'creature' }); }
  }

  /** Driven off, it sounds away ahead; felled, it rolls and sinks. */
  leave(dt) {
    if (this.ended === 'felled') { this.at.y -= dt * 2; this.rot.z = lerp(this.rot.z, Math.PI, dt * 0.6); }
    else { this.at.y -= dt * 6; this.at.z += dt * 10; this.rot.x = lerp(this.rot.x, 0.6, dt); }
  }

  finish() {
    const st = this.stage, W = st.waves;
    if (!this.ended) {
      const felled = this.gills.every((g) => !g.alive) && !this.throat.alive;
      this.ended = felled ? 'felled' : 'driven';
      this.game.events?.emit('rail.end', { end: this.ended, by: felled ? 'courier' : 'creature' });
      st.endPay(this.ended);
    }
    for (const f of [...this.gills, ...this.teeth, this.throat, this.body]) if (f?.alive) W.drop(f);
    this.show(false);
    return this.ended;
  }
}
