// ---------------------------------------------------------------------------------------
// CHARYBDIS IN THE MAELSTROM: the maelstrom leg's director (docs/plans/RAIL-OVERHAUL.md section 6, PASSAGE.md 14.4; the name Espada's,
// the owner's rule: an Egregore, drawn from Homer). At the leg's peak the rail leaves its line for the arena (railpath.js `arena`: whole
// laps round the whirlpool, banked in), and the leg's heavy (the schedule's, Dovina's legs.js: its patterns thrown from it) is held at
// the whirlpool's heart, the arena's centre, as Charybdis: it RISES out of the maelstrom (the Astral: above the crude) and DIVES back in
// (the Umbral: under it) by turns, four bars each, `stage.foe = { id: 'charybdis', under }` all the while (Wanda's boss line dives with
// it). It wears the waypoint's feeling, which the log names as it first rises (Espada's line: "Charybdis rises, in grief."). Its look
// is Calissa's (vfx/charybdis.js and the whirlpool, vfx/whirlpool.js, drawn by vfx/crossinglook.js; the heavy's own mesh hidden). It is
// held at the whirlpool's heart as the look finds it (`whirlHeart`: the arena's centre on the sea, its bank taken out), so what is struck
// is where it is drawn. Its numbers and its hit rule are Dovina's (setpieces.js CHARYBDIS, charybdisHurt): hurt only from the world it
// is in, twice as it crosses the surface; felled, two crystal shards; driven off, nothing more.
// THE BOSS LAW (the owner, 2026-10-21; RAIL-FLOW.md 5): fought out, never driven off as the peak ends (the leg's peak is held until it
// falls, triprun.js). Its look's parts are parts on the roll (setpieces.js CHARYBDIS.eyes and .combs, Dovina's): six eyes, each owning
// an aimed burst it fires while risen (an eye shut, that aim gone), and two baleen combs, each throwing a wall of its whirl every four
// bars (a comb broken, a gap in the wall); each hurt by the world rule as its core is, lined and crazed on its look (vfx/bossparts.js).
// Past BOSS.enrage real s its eyes and combs quicken (their gaps times BOSS.quicken).
//
// Prior art: Homer's Charybdis (Odyssey XII: thrice a day it swallows the sea and spits it out), Rez's Area X and Star Fox 64's
// all-range mode (the arena off the rail), Ikaruga's bosses that change their polarity on a beat.
//
//   const C = new Charybdis(stage)   C.begin(k, waypoint)   C.update(dt, bar)   C.end()   C.active   C.beaten
//   events: charybdis.rise { feel }, charybdis.dive { feel }, charybdis.felled { feel, shards }, charybdis.driven { feel, hp }, all with `by`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { whirlHeart } from '../../vfx/whirlpool.js';
import { CRUISE } from '../../courier/ship/views.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { CHARYBDIS, charybdisHurt, BOSS } from '../../progress/rail/setpieces.js'; // (its numbers and its hit rule: Dovina's)
import { modeOf } from '../../progress/rail/legs.js';
import { leadOf } from '../../progress/rail/patterns.js';

const _c = new THREE.Vector3(), _h = new THREE.Vector3();
const CHARYBDIS_R = 3; // (m: its hit sphere, the maw's radius)
const EYE = { every: 3, shots: 3, speed: 17, spread: 0.12 }, COMB = { every: 4, of: [0, 4] }; // (an eye's burst every three bars, the six in turn; the two combs of the look's eight that are walls, opposite)
const _e = new THREE.Vector3(), _a = new THREE.Vector3();

export class Charybdis {
  constructor(stage) { this.st = stage; this.game = stage.game; this.active = false; this.foe = null; }

  /** The maelstrom leg `k` begins: its arena found (stage.arenas), its heavy taken when it comes. */
  begin(k, w) {
    const S = this.st;
    this.k = k; this.w = w; this.arena = (S.arenas || []).find((t) => t.k === k) || null; this.foe = null; this.said = false; this.dove = false; this.done = false; this.parts = []; this.lastBar = -1;
    this.active = !!this.arena; this.y = CHARYBDIS.depth;
    return this.active;
  }

  /** Whether Charybdis is held in the arena now (the ship's aim turns abeam, the cursor free: stage.js). */
  get holding() { return this.active && !!this.foe?.alive; }
  /** What the maelstrom's patterns fire from ('object': legs.js): Charybdis while it holds. */
  emitter() { return this.holding ? this.foe : null; }
  /** Beaten (the boss law: the leg's peak is held until then, triprun.js): felled. */
  get beaten() { return this.done; }

  update(dt, bar) {
    if (!this.active) return;
    const S = this.st, L = S.trip.layout?.legs[this.k]; if (!L || L.peak == null) return;
    if (bar < L.peak || bar >= L.release) { if (bar >= L.release) this.end(); return; } // (the arena is the peak: at the release the line goes straight on and Charybdis goes down)
    if (!this.foe?.alive && !this.done) this.take(); // (once: felled, a heavy come after is not Charybdis back up)
    const f = this.foe; if (!f) return;
    // risen or dived, by turns of four bars from the peak; eased between over a bar
    const rel = bar - L.peak, up = Math.floor(rel / CHARYBDIS.bars) % 2 === 0, want = up ? CHARYBDIS.rise : CHARYBDIS.depth;
    this.y += (want - this.y) * Math.min(1, dt / (CHARYBDIS.swing * BAR_S * 0.5));
    const under = this.y < 0;
    S.stage.foe = { id: 'charybdis', under };
    if (up && !this.said && this.y > 0) { this.said = true; this.game.events?.emit('charybdis.rise', { feel: this.w?.feel || null, by: 'creature' }); }
    if (!up && this.said && !this.dove && under) { this.dove = true; this.game.events?.emit('charybdis.dive', { feel: this.w?.feel || null, by: 'creature' }); } // (its first dive only: Espada's line)
    const b = Math.floor(bar); if (b !== this.lastBar && f.alive) { this.lastBar = b; this.onBar(b, up && !under); }
  }
  quick(n) { return this.st.t - (this.t0 ?? this.st.t) > BOSS.enrage ? Math.max(1, Math.round(n * BOSS.quicken)) : n; }
  /** On the bar: an eye's aimed burst (the six in turn, risen only), each living comb's wall every four bars. */
  onBar(bar, risen) {
    const S = this.st, ship = S.ship, eyes = this.parts.filter((p) => p.alive && p.role === 'eye');
    if (risen && eyes.length && bar % this.quick(EYE.every) === 0) {
      const e = eyes[(bar / this.quick(EYE.every)) % eyes.length | 0];
      _a.copy(ship.local).sub(e.local).normalize();
      for (let i = 0; i < EYE.shots; i++) S.shots.foe(e.local, _e.copy(_a).applyAxisAngle(_c.set(0, 1, 0), (i - (EYE.shots - 1) / 2) * EYE.spread).multiplyScalar(EYE.speed), { aspect: this.w?.feel || null, from: e });
    }
    if (bar % this.quick(COMB.every) === 0) for (const c of this.parts) if (c.alive && c.role === 'comb') {
      const view = S.trip?.viewAt?.(bar) || 'side', P = S.trip?.player, lead = leadOf('gapWall');
      if (!P) continue;
      S.shots.telegraphs?.mark((o) => c.part.world(o), lead, { radius: 1.8, alive: () => c.alive }); // (its windup: the rail's telegraph mark on the comb)
      P.play('gapWall', {}, { from: c, mode: modeOf(view), kind: 'feel', feel: this.w?.feel || null, up: view === 'side' ? [1, 0, 0] : [0, 1, 0], range: c.local.distanceTo(ship.local), bar0: P.bar, lead });
    }
  }
  /** Its look's parts as parts on the roll: each where its look draws it, hurt by the world rule, broken on its look as it falls. */
  addParts() {
    const S = this.st, W = S.waves, look = S.looks?.beast; if (!look || this.parts.length) return;
    const add = (name, role, hp) => {
      const P = look.part(name); if (!P) return;
      P.set('intact');
      const f = W.add({
        kind: `rail.charybdis.${role}`, name: role === 'eye' ? 'an eye of Charybdis' : 'a comb of Charybdis', role, cls: 3, aspect: this.w?.feel || null, radius: role === 'eye' ? 1.1 : 1.8, hp, chain: false, count: false,
        local: S.rail.toLocal(P.world(_e), new THREE.Vector3()), armour: () => charybdisHurt(this.st.ship.form, this.y),
        tick: (dt, x) => { S.rail.toLocal(P.world(_e), x.local); return !this.done && this.holding; },
        onHurt: (x) => { P.hit(0.6); P.hurt?.(1 - x.hp / hp); if (x.hp < hp / 2) P.damage(); }, // (its crazing as it is hurt: vfx/bossparts.js) onDown: () => { P.break(); this.game.events?.emit('rail.part', { part: role, by: 'courier' }); },
      });
      f.maxHp = hp; f.part = P; this.parts.push(f);
    };
    for (let i = 0; i < 6; i++) add(`eye.${i}`, 'eye', CHARYBDIS.eyes?.hp ?? 40);
    for (const k of COMB.of.slice(0, CHARYBDIS.combs?.count ?? 2)) add(`baleen.${k}`, 'comb', CHARYBDIS.combs?.hp ?? 160);
  }

  /** The leg's heavy is Charybdis: held at the whirlpool's heart at its height (in the world, then into the rail's frame: through the
   *  arena the frame is banked, so the frame's own centre would sit 14 m under the crude); its stand-in mesh hidden for its look. */
  take() {
    const S = this.st, W = S.waves, f = (W?.foes || []).find((x) => x.alive && x.role === 'heavy');
    if (!f) return;
    this.foe = f; f.name = 'Charybdis'; f.solid = true; f.hp = f.maxHp = CHARYBDIS.hp; f.cls = Math.max(f.cls ?? 0, 4); f.radius = Math.max(f.radius ?? 0, CHARYBDIS_R); if (f.mesh) f.mesh.visible = false; // (struck across its 6 m maw, as it is drawn: vfx/charybdis.js)
    whirlHeart(S.rail.path, this.arena, S.sea?.y ?? 0, _h, CRUISE);
    f.tick = (dt, foe) => { S.rail.toLocal(_c.copy(_h).setY(_h.y + this.y), foe.local); return true; };
    // hurt only from the world it is in, twice over as it crosses the surface (setpieces.js charybdisHurt); a shot from the other world
    // glances off (waves.js glance: the resist mark, once a fifth of a real second at most)
    f.armour = () => charybdisHurt(this.st.ship.form, this.y);
    const down = f.onDown; f.onDown = (foe) => { down?.(foe); this.felled(); };
    this.t0 = S.t; this.addParts();
  }

  /** Felled before the peak ends: its class's down pay (the waves'), and CHARYBDIS.pay.felled crystal shards. */
  felled() {
    if (this.done) return; this.done = true;
    const shards = this.game.emocean?.showcase ? 0 : CHARYBDIS.pay?.felled ?? 0; // (the showcase crossing pays nothing: world/emocean/stage.js)
    for (let i = 0; i < shards; i++) this.game.pneuka?.add('mat.shard', 'loot');
    this.game.events?.emit('charybdis.felled', { feel: this.w?.feel || null, shards, by: 'courier' });
  }

  end() {
    if (!this.active) return;
    this.active = false;
    if (this.foe?.alive && !this.done) { this.done = true; this.game.events?.emit('charybdis.driven', { feel: this.w?.feel || null, hp: Math.round(this.foe.hp), by: 'creature' }); } // (alive at the release: it goes down, nothing more paid)
    if (this.foe) { this.foe.tick = null; this.foe.armour = null; this.foe = null; }
    for (const p of this.parts) if (p.alive) this.st.waves.drop(p); this.parts = [];
    if (this.st.stage.foe?.id === 'charybdis') this.st.stage.foe = null;
  }
}
