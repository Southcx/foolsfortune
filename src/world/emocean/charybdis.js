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
//
// Prior art: Homer's Charybdis (Odyssey XII: thrice a day it swallows the sea and spits it out), Rez's Area X and Star Fox 64's
// all-range mode (the arena off the rail), Ikaruga's bosses that change their polarity on a beat.
//
//   const C = new Charybdis(stage)   C.begin(k, waypoint)   C.update(dt, bar)   C.end()   C.active
//   events: charybdis.rise { feel }, charybdis.dive { feel }, charybdis.felled { feel, shards }, charybdis.driven { feel, hp }, all with `by`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { whirlHeart } from '../../vfx/whirlpool.js';
import { CRUISE } from '../../courier/ship/views.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { CHARYBDIS, charybdisHurt } from '../../progress/rail/setpieces.js'; // (its numbers and its hit rule: Dovina's)

const _c = new THREE.Vector3(), _h = new THREE.Vector3();
const CHARYBDIS_R = 3; // (m: its hit sphere, the maw's radius)

export class Charybdis {
  constructor(stage) { this.st = stage; this.game = stage.game; this.active = false; this.foe = null; }

  /** The maelstrom leg `k` begins: its arena found (stage.arenas), its heavy taken when it comes. */
  begin(k, w) {
    const S = this.st;
    this.k = k; this.w = w; this.arena = (S.arenas || []).find((t) => t.k === k) || null; this.foe = null; this.said = false; this.dove = false; this.done = false;
    this.active = !!this.arena; this.y = CHARYBDIS.depth;
    return this.active;
  }

  /** Whether Charybdis is held in the arena now (the ship's aim turns abeam, the cursor free: stage.js). */
  get holding() { return this.active && !!this.foe?.alive; }

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
    // glances off with the resist mark (the ward), once a fifth of a real second at most
    f.armour = (foe) => {
      const k = charybdisHurt(this.st.ship.form, this.y), now = performance.now();
      if (k <= 0 && now - (this.wardAt ?? -1e9) > 200) { this.wardAt = now; this.game.glyphs?.pop?.('ward', foe.pos.clone(), { color: 0xffffff, size: 1.4, life: 0.6, float: 0.3, burst: true, ring: true }); }
      return k;
    };
    const down = f.onDown; f.onDown = (foe) => { down?.(foe); this.felled(); };
  }

  /** Felled before the peak ends: its class's down pay (the waves'), and CHARYBDIS.pay.felled crystal shards. */
  felled() {
    if (this.done) return; this.done = true;
    for (let i = 0; i < (CHARYBDIS.pay?.felled ?? 0); i++) this.game.pneuka?.add('mat.shard', 'loot');
    this.game.events?.emit('charybdis.felled', { feel: this.w?.feel || null, shards: CHARYBDIS.pay?.felled ?? 0, by: 'courier' });
  }

  end() {
    if (!this.active) return;
    this.active = false;
    if (this.foe?.alive && !this.done) { this.done = true; this.game.events?.emit('charybdis.driven', { feel: this.w?.feel || null, hp: Math.round(this.foe.hp), by: 'creature' }); } // (alive at the release: it goes down, nothing more paid)
    if (this.foe) { this.foe.tick = null; this.foe.armour = null; this.foe = null; }
    if (this.st.stage.foe?.id === 'charybdis') this.st.stage.foe = null;
  }
}
