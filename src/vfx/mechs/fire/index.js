// ---------------------------------------------------------------------------------------
// THE CITY'S FIRE'S LOOK (plain name; game.cityFireLooks; docs/plans/MECHS.md 9.1): the toy city's fire drawn over Dovina's rules
// (progress/mechs/fire.js) and her runtime (world/hangar/cityfire.js), stepped on the real clock in the `fx` phase after the hangar
// has moved things. Looks only: nothing here spreads a fire, burns a cell or touches a collider.
//   WHAT BURNS    told by her events (`city.ignite`, `city.burn`, `city.char`, `city.douse`, `city.out`), never a scan of the city a
//                 frame: each building told of is tracked and its cells read again from `rec.b.fire` (state, fuel, indexed as b.mat)
//                 at most every FIRE_LOOK.rebuild real s when told it changed, every `refresh` while it burns; the burning cell list
//                 she exposes (`city.fire.cells`, `.n`, `.ver`: Dovina's cityfire.js) marks the read due when its version moves
//   ITS PARTS     a flame card on each burning cell with air beside it (flames.js), sized by its fuel left; char, its shell over each
//                 cell by state (char.js); a smoke column and embers a burning building (smoke.js); the fire lamps (lamps.js); the
//                 moments (vfx/library/cityfire.js, played on her events); bodies in the fire (bodies.js); the flamer's cone (flamer.js)
//   MOMENTS       an ignite's flash; a char's sparks; a douse's steam; the glass shower (`city.break` cause 'heat', or a steel frame's
//                 glass shattering with it); a fire-felled building's ember storm; a chunk landing hard splitting with dust; the dust
//                 that hangs in the street after any collapse
// A phone draws a share (FIRE_LOOK.phone) of the flames, smoke and embers, and one fire lamp (`machine.mobile`, Petra's budget).
// Prior art: Red Faction Guerrilla (the city's fire and dust), Far Cry 2's fire spread (a cell's flame by its fuel, a column of smoke a
// fire), Battlefield's Levolution (the hanging dust, the glass), the Godzilla films' miniature city fires; the house's split of rules
// from looks over a division's placeholders (vfx/mechs/challenges/, vfx/mechs/giants/).
//
//   game.cityFireLooks = installCityFireLooks(game)   (boot/world.js, with the giants' looks)   .update(rawDt)   .clear()
//   .flamer.set(on) (also on `mech.flamer { on }`)   .tracks (the buildings tracked)   .stats() -> { flames, char, burning, lamps }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK, FIRE_STATE, fuelK } from './table.js';
import { FlameCards, FLAME_TIME, FLAME_WIND } from './flames.js';
import { CharShell } from './char.js';
import { FireSmoke } from './smoke.js';
import { FireLamps } from './lamps.js';
import { FireBodies } from './bodies.js';
import { FlamerLook } from './flamer.js';
import { CITY_LOOK } from '../../../world/hangar/city.js';
import { MATERIALS } from '../../../progress/mechs/destruction.js';
import { PROVING } from '../../../world/hangar/layout.js';

const FK = FIRE_LOOK.flames, CK = FIRE_LOOK.char, S_ = FIRE_STATE, SAMPLES = 16;
const _v = new THREE.Vector3(), _c = new THREE.Color(), _k = new THREE.Color(), _w = new THREE.Color(), _a = new THREE.Vector3();
const hash = (i, s) => { let h = Math.imul(i ^ s, 2654435761); h ^= h >>> 15; return ((h >>> 0) % 10007) / 10007; };
/** A cell's own colour (the city's look, its paper and furnishing a guess until her CITY_LOOK has them). */
const OWN = { paper: 0xe8d6a8, furnishing: 0x7a4a2e };
const ownColour = (m) => CITY_LOOK.colour[MATERIALS[m]?.id] ?? OWN[MATERIALS[m]?.id] ?? (m === 6 ? OWN.paper : m === 7 ? OWN.furnishing : 0x8c8a84);
/** The six neighbours, the open one a flame leans out of tried first: up, then the sides, then down. */
const NB = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]];

export class CityFireLooks {
  constructor(game) {
    this.game = game; this.t = 0; this.tracks = []; this.city = null; this.recs = null; this.built = false; this.dirty = false; this.lastRead = -1e9; this.ver = -1;
    this.smoke = new FireSmoke(game); this.bodies = new FireBodies(game); this.flamer = new FlamerLook(game);
    this.offs = []; this.n = { flames: 0, char: 0, burning: 0 };
    const ev = game.events, on = (n, f) => ev?.on && this.offs.push(ev.on(n, (e) => { try { f(e || {}); } catch (x) { console.warn('city fire look', x); } }));
    on('city.ignite', (e) => { this.mark(e, true); this.at(e.at, _v) && this.play('city.fire.ignite', { pos: _v, power: this.k() }); });
    on('city.burn', (e) => { const T = this.mark(e, true); if (T && e.k != null) T.burnK = e.k; });
    on('city.char', (e) => { this.mark(e, true); this.at(e.at, _v) && this.play('city.fire.char', { pos: _v, power: this.k() }); });
    on('city.douse', (e) => { const T = this.mark(e, true); if (T) this.play('city.fire.douse', { pos: this.at(e.at, _v) || _v.set(T.cx, T.cy, T.cz), power: Math.min(2, 0.6 + (e.cells || 4) / 20) * this.k() }); });
    on('city.out', (e) => this.mark(e, true));
    on('city.break', (e) => { if (e.cause === 'heat' || e.cause === 'shatter' || e.cause === 'frame') this.at(e.at, _v) && this.play('city.glass.burst', { pos: _v, power: Math.min(2.4, 0.5 + (e.cells || 1) / 6) }); else if (e.chunks > 0) this.at(e.at, _v) && this.play('city.dust.hang', { pos: _v.setY(PROVING.at.y + 2), power: Math.min(1.5, 0.4 + e.chunks / 4) * this.k() }); });
    on('city.felled', (e) => {
      const R = this.recOf(e); if (!R) return;
      _v.set(R.cx, PROVING.at.y + 1, R.cz);
      if (e.cause === 'fire') { _a.copy(_v).setY(PROVING.at.y + R.b.h * 0.4); this.play('city.fire.felled', { pos: _a, power: this.k() }); }
      this.play('city.dust.hang', { pos: _v, power: Math.min(2, 0.8 + R.b.h / 25) * this.k(), scale: Math.max(1, Math.hypot(R.b.w, R.b.d) / 16) });
      this.mark(e, true);
    });
    on('city.land', (e) => { if (e.at && (e.k >= 0.6 || e.split)) this.at(e.at, _v) && this.play('city.chunk.split', { pos: _v, power: Math.min(2, 0.6 + e.k / 2) }); });
    on('mech.heat', (e) => this.bodies.heat(e.k));
    on('giant.burn', (e) => this.bodies.burn(e.id, e.k));
    on('giant.vitrify', (e) => this.bodies.vitrify(e.id, e.on));
    on('mech.flamer', (e) => this.flamer.set(e.on));
  }
  play(n, ctx) { try { this.game.vfx?.play(n, ctx); } catch { /* (headless) */ } }
  /** The phone's share (Petra's quarter), else 1. */
  k() { return this.game.graphics?.machine?.mobile ? FIRE_LOOK.phone : 1; }
  at(a, out) { if (!a) return null; if (a.isVector3) return out.copy(a); return Array.isArray(a) && a.length >= 3 ? out.set(a[0], a[1], a[2]) : null; }
  recOf(e) { const C = this.city; if (!C?.built) return null; const r = C.recs[e.lot]; return r && (!e.building || r.id === e.building) ? r : C.recs.find((x) => x.id === e.building) || null; }
  /** A building told of: tracked (once), its cells due to be read again. */
  mark(e, due) {
    const rec = this.recOf(e); if (!rec) return null;
    let T = this.tracks.find((x) => x.rec === rec);
    if (!T) {
      T = { rec, prev: new Uint8Array(rec.b.mat.length), samples: new Float32Array(SAMPLES * 3), nS: 0, n: 0, lastN: 0, cx: rec.cx, cy: PROVING.at.y + rec.b.h / 2, cz: rec.cz,
        charK: 0, burnK: 0, smokeAcc: 0, emberAcc: 0, lamp: 0 };
      this.tracks.push(T);
    }
    if (due) this.dirty = true;
    return T;
  }

  update(dt) {
    this.t += dt; FLAME_TIME.value = this.t;
    const C = this.game.hangar?.city, live = C?.built ? C : null;
    if (live !== this.city || (live && live.recs !== this.recs)) { this.drop(); this.city = live; this.recs = live?.recs || null; }
    this.bodies.update(dt); this.flamer.update(dt);
    if (!live) return;
    if (!this.built) this.build(live);
    const F = live.fire; if (F && F.ver !== undefined && F.ver !== this.ver) { this.ver = F.ver; this.dirty = true; this.adopt(F); }
    const burning = this.n.burning > 0;
    if ((this.dirty && this.t - this.lastRead >= FIRE_LOOK.rebuild) || (burning && this.t - this.lastRead >= FIRE_LOOK.refresh)) this.read();
    const k = this.k();
    for (const T of this.tracks) if (T.n > 0) this.smoke.step(dt, T, k);
    this.lamps.update(dt);
  }
  /** Her exposed burning list (Dovina's world/hangar/cityfire.js: `cells`, x y z a burning cell's centre in world metres, `n` of them):
   *  a building holding one that is not tracked yet (a spread that said no ignite) is tracked anew. */
  adopt(F) {
    const P = F.cells, n = Math.min(F.n | 0, P ? P.length / 3 : 0), recs = this.recs; if (!n || !recs) return;
    const step = Math.max(1, Math.floor(n / 256));
    for (let j = 0; j < n; j += step) {
      const x = P[j * 3], z = P[j * 3 + 2];
      for (let r = 0; r < recs.length; r++) {
        const R = recs[r], b = R.b; if (!b?.fire) continue;
        if (Math.abs(x - R.cx) <= b.w / 2 + 0.5 && Math.abs(z - R.cz) <= b.d / 2 + 0.5) { if (!this.tracks.some((T) => T.rec === R)) this.mark({ lot: r, building: R.id }, true); break; }
      }
    }
  }

  build(C) {
    const into = this.game.scene, mobile = this.game.graphics?.machine?.mobile;
    this.flames = new FlameCards(into, mobile ? FK.maxPhone : FK.max, 'fire.city.flames');
    this.char = new CharShell(into, mobile ? CK.maxPhone : CK.max);
    this.lamps = new FireLamps(this.game, into);
    FLAME_WIND.value.fromArray(FIRE_LOOK.wind);
    this.built = true;
  }
  drop() {
    this.flames?.dispose(); this.char?.dispose(); this.lamps?.dispose(); this.flames = this.char = this.lamps = null;
    this.tracks = []; this.built = false; this.dirty = false; this.ver = -1; this.n.flames = this.n.char = this.n.burning = 0;
  }
  clear() { this.drop(); this.bodies.clear(); this.flamer.clear(); this.city = null; this.recs = null; }

  // ------------------------------------------------------------------ the burning set read again
  read() {
    this.lastRead = this.t; this.dirty = false;
    const FC = this.flames, CS = this.char, k = this.k(), cap = Math.max(1, Math.round(FK.perBuilding * k)), A = PROVING.at;
    let nf = 0, burning = 0, sparks = 0; CS.begin();
    for (let ti = this.tracks.length - 1; ti >= 0; ti--) {
      const T = this.tracks[ti], rec = T.rec, b = rec.b, F = b.fire;
      if (!F?.state) { if (!b.fire) this.tracks.splice(ti, 1); continue; }
      const w = b.w, d = b.d, h = b.h, st = F.state, fuel = F.fuel, yaw = 0, s = rec.s;
      const stride = Math.max(1, Math.ceil(T.lastN / cap));
      let n = 0, sx = 0, syy = 0, sz = 0, top = 0, charSum = 0, ns = 0, marked = 0;
      for (let i = 0; i < st.length; i++) {
        const m = b.mat[i], was = T.prev[i], now = m ? st[i] : 0;
        T.prev[i] = now;
        if (!now) { if (was === S_.burning && !m && sparks < FIRE_LOOK.embers.sparksMax) { this.cellAt(rec, i, _v); this.smoke.sparks(_v.x, _v.y, _v.z, Math.round(FIRE_LOOK.embers.sparks * k)); sparks++; } continue; }
        marked++;
        const x = i % w, r = (i - x) / w, z = r % d, y = (r - z) / d;
        let open = -1; for (let q = 0; q < 6; q++) { const N = NB[q], X = x + N[0], Y = y + N[1], Z = z + N[2]; if (Y < 0) continue; if (X < 0 || Z < 0 || X >= w || Z >= d || Y >= h || !b.mat[X + w * (Z + d * Y)]) { open = q; break; } }
        const wx = rec.cx + s * (x + 0.5 - w / 2), wy = A.y + y + 0.5, wz = rec.cz + s * (z + 0.5 - d / 2);
        if (now === S_.burning) {
          n++; sx += wx; syy += wy; sz += wz; if (y > top) top = y;
          const fk = fuelK(m, fuel?.[i]); charSum += 1 - fk;
          if (open >= 0) {
            if (ns < SAMPLES) { T.samples[ns * 3] = wx; T.samples[ns * 3 + 1] = wy; T.samples[ns * 3 + 2] = wz; ns++; }
            else if (hash(i, n) < SAMPLES / n) { const j = ((hash(i, 7) * SAMPLES) | 0) * 3; T.samples[j] = wx; T.samples[j + 1] = wy; T.samples[j + 2] = wz; }
            if (nf < FC.max && n % stride === 0) {
              const N = NB[open], up = open === 0, lx = N[0] * s, lz = N[2] * s; // (out of its open face, in the world: a lot turned half round mirrors its cells, as city.js cellWorld)
              const hh = FK.minH + (FK.maxH - FK.minH) * Math.sqrt(fk), out = up ? 0 : FK.out;
              FC.set(nf++, wx + lx * out, wy + (up ? 0.45 : open === 5 ? -0.9 : -0.35), wz + lz * out, FK.width * (0.75 + 0.5 * hash(i, 3)), hh * (0.8 + 0.4 * hash(i, 5)), hash(i, 9) * 6.28, hash(i, 1), 1 - fk, 1);
            }
          }
          if (open >= 0) { _k.setHex(ownColour(m)); _c.copy(_k).lerp(_w.setHex(CK.burning.charcoal), Math.min(1, 0.25 + 0.85 * (1 - fk))); CS.add(wx, wy, wz, yaw, _c, CK.burning.glow * (0.35 + 0.65 * (1 - fk)), CK.burning.rough); }
        } else if (open >= 0) {
          const R = hash(i, 11);
          if (now === S_.scorched) { _c.setHex(CK.scorched.colour[0]).lerp(_w.setHex(CK.scorched.colour[1]), R); CS.add(wx, wy, wz, yaw, _c, 0, CK.scorched.rough); }
          else if (now === S_.soft) { _c.setHex(CK.soft.colour[0]).lerp(_w.setHex(CK.soft.colour[1]), R); CS.add(wx, wy, wz, yaw, _c, CK.soft.glow * (0.4 + 0.6 * (F.heat ? Math.min(1, F.heat[i]) : 1)), CK.soft.rough); }
          else if (now === S_.wet) { _c.setHex(ownColour(m)).multiplyScalar(CK.wet.k).lerp(_w.setHex(CK.wet.tint), 0.25); CS.add(wx, wy, wz, yaw, _c, 0, CK.wet.rough); }
        }
      }
      T.n = n; T.lastN = n; T.nS = ns; burning += n ? 1 : 0;
      if (n) { T.cx = sx / n; T.cy = syy / n; T.cz = sz / n; T.top = A.y + top + 1; T.charK = Math.min(1, charSum / n); }
      if (!marked) this.tracks.splice(ti, 1); // (nothing of the fire left on it: let go)
    }
    FC.commit(nf); CS.end();
    this.n.flames = nf; this.n.char = CS.n; this.n.burning = burning;
    this.lamps.place(this.tracks);
  }
  cellAt(rec, i, out) {
    const b = rec.b, x = i % b.w, r = (i - x) / b.w, z = r % b.d, y = (r - z) / b.d;
    return out.set(rec.cx + rec.s * (x + 0.5 - b.w / 2), PROVING.at.y + y + 0.5, rec.cz + rec.s * (z + 0.5 - b.d / 2));
  }
  stats() { return { ...this.n, tracks: this.tracks.length, lamps: this.lamps ? this.lamps.lamps.filter((l) => l.visible).length : 0 }; }
}

/** The look installed and stepped in the `fx` phase on the real clock (core/systems.js). */
export function installCityFireLooks(game) {
  const L = game.cityFireLooks = new CityFireLooks(game);
  game.systems?.add('fx', L, { clock: 'raw', name: 'cityFireLooks' });
  return L;
}
