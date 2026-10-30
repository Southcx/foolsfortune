// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE PSYGUN'S SHOT (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and numbers
// Dovina's, progress/toolpairs.js SPECIAL_PLAY):
//   1  Hooked Shot   Sondelass sub: the next round within `window` of the lent Grapple drags what it hits to `stop` at `pull`; a creature
//                    over `maxHp` is too heavy and pulls you to it instead, as the hook does
//   4  On the Beat   Crucibelle sub: after the lent toll, for `bars` of the bell's bars, `shots` rounds fired within `window` of its beat
//                    each stagger what they hit (`stagger`, a toll's); off the beat a round is a plain round
//   15 Chain Shot    Lockheart sub: a round that hits chains its creature to the nearest other within `reach`: both halted `halt`, then
//                    held within `length` of each other
//   21 Full Circle   Soul Brush sub: a round paints a line `width` along its flight to `length` at `cost` a metre, and a cracked region
//                    of yours within `mendReach` of it mends `mend` a metre it crosses
//
// Prior art: Bayonetta's Wicked Weaves fed through a gun's string, NieR: Automata's pod programs, Bionic Commando's grappling shot
// (Hooked Shot), Hi-Fi Rush's beat (On the Beat), Gungrave's chained shots, Splatoon's ink shots (Full Circle).
//
//   shotSpecials(PS) -> part { lend(tool), shot(e), strike(c, cause) -> mods | null, update(raw) }; each act said with its place
//   (pair.special, pair.hit, pair.end: tools/pairspecials.js) for its look (vfx/pairspeciallooks.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { spendLoad, loadAspect } from '../soulbrush/load.js';
import { REGIONS } from '../../courier/vessel/damage.js';

/** Petra's, where the rows are silent: a chain holds `TETHER` real s once its halt ends (the Gulp holds what it drinks about as long);
 *  a drag gives up after `DRAG_MAX` real s (a dragged body that snags on a wall is let go). */
const TETHER = 4, DRAG_MAX = 2;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);

export function shotSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let hooked = null, beat = null;
  const drags = [], chains = []; // ({ c, left }) / ({ a, b, left })
  const chainedNow = (c) => chains.some((L) => L.a === c || L.b === c);
  return {
    lend(tool) {
      if (tool === 'sondelass' && PS.live(P().hookedShot.n)) hooked = { until: PS.now + P().hookedShot.window };
      if (tool === 'crucibelle' && PS.live(P().onTheBeat.n)) {
        const B = g.techs?.get?.('crucibelle'), spb = B?.grid?.().spb ?? 60 / 96;
        beat = { left: P().onTheBeat.shots, until: PS.now + P().onTheBeat.bars * 4 * spb }; PS.said(P().onTheBeat.n, { dur: P().onTheBeat.bars * 4 * spb, beat: spb });
      }
    },
    /** A round left the gun: On the Beat judges it against the beat; Full Circle paints its flight and mends what it passes. */
    shot(e) {
      if (beat) beat.hot = false;
      const O = P().onTheBeat, B = g.techs?.get?.('crucibelle');
      if (beat && beat.left > 0 && PS.now < beat.until && PS.live(O.n) && B && B.offBeat(B.now(), B.grid()) < O.window) { beat.left--; beat.hot = true; } // (its strikes come after its shot.fire)
      if (PS.live(P().fullCircle.n) && e.at) this.circle(e);
    },
    circle(e) {
      const C = P().fullCircle, aspect = loadAspect(g); if (!aspect) return;
      const from = _a.copy(g.player.pos).setY(g.player.pos.y + 1.2), seg = _b.copy(e.at).sub(from), len = Math.min(C.length, seg.length());
      if (len < 0.5) return;
      seg.normalize();
      const metres = Math.max(1, Math.floor(len)), paid = spendLoad(g, C.cost * metres, 'pairCircle'); if (!(paid > 0)) return;
      const reach = len * Math.min(1, paid / (C.cost * metres)), D = g.vesselDamage, near = new Array(REGIONS.length).fill(0);
      for (let s = 0.25; s <= reach; s += 0.25) {
        const p = _c.copy(from).addScaledVector(seg, s);
        if (s % 0.5 < 0.25) { const hit = g.physics?.raycast(p, DOWN, 3, g.player.collider, undefined, (k) => !k.isSensor()); if (hit) g.paintmap?.stamp(hit.point.x, hit.point.y, hit.point.z, C.width / 2, aspect, 0.9); }
        const r = D?.boxes?.nearest(p); if (r && r.d <= C.mendReach) near[r.region] += 0.25; // (the metres it crosses within reach of each region of yours)
      }
      let mended = 0; for (let i = 0; i < near.length; i++) if (near[i] > 0 && D?.mendBy?.(C.mend * near[i], 'circle', i)) mended++;
      const land = from.clone().addScaledVector(seg, reach), ground = g.physics?.raycast(land, DOWN, 3, g.player.collider, undefined, (k) => !k.isSensor());
      const at = ground ? new THREE.Vector3(ground.point.x, ground.point.y, ground.point.z) : land;
      PS.said(C.n, { at, from: from.clone(), to: land, feeling: aspect, ...(mended ? { mended } : null) });
      PS.hit(C.n, { at, feeling: aspect });
    },
    strike(c, cause) {
      if ((cause !== 'shot' && cause !== 'charged') || c.ally) return null;
      let mods = null;
      if (hooked && PS.now < hooked.until && PS.live(P().hookedShot.n)) { // (the next round: dragged to you, or you to it)
        hooked = null; const H = P().hookedShot;
        mods = { after: (t) => {
          if (!t.alive) return;
          const heavy = (t.maxHp ?? 0) > H.maxHp || t.heavy;
          if (heavy) { const d = _a.copy(t.pos).sub(g.player.pos).setY(0); if (d.lengthSq() > 1e-4) g.player.impulse(d.normalize().multiplyScalar(H.pull).setY(2), 'hooked'); }
          else { t.cancel?.('hooked'); drags.push({ c: t, left: DRAG_MAX }); }
          PS.said(H.n, { target: t, dur: heavy ? undefined : DRAG_MAX }); PS.hit(H.n, { target: t });
        } };
      }
      if (beat?.hot && PS.live(P().onTheBeat.n)) { g.stun?.add(c, P().onTheBeat.stagger, { by: 'courier', cause: 'beat' }); PS.hit(P().onTheBeat.n, { target: c }); } // (fired on the beat: staggered as by a toll)
      if (PS.live(P().chainShot.n) && !chainedNow(c)) {
        const K = P().chainShot; let o = null, od = K.reach;
        for (const x of g.creatures?.near?.(c.pos, K.reach) || []) { if (x === c || !x.alive || x.ally || chainedNow(x)) continue; const d = x.pos.distanceTo(c.pos); if (d < od) { od = d; o = x; } }
        if (o) {
          const was = mods?.after;
          mods = { ...mods, after: (t) => {
            was?.(t); if (!t.alive || !o.alive) return;
            for (const x of [t, o]) g.creatures.apply(x, 'halt', K.halt, 1, 'courier');
            chains.push({ a: t, b: o, left: K.halt + TETHER });
            PS.said(K.n, { target: t, other: o, dur: K.halt + TETHER }); PS.hit(K.n, { target: t });
            g.events?.emit('pair.mark', { kind: 'chain', by: 'courier' }); // (the sound's cue)
          } };
        }
      }
      return mods;
    },
    update(raw) {
      const H = P().hookedShot, to = _a;
      for (let i = drags.length - 1; i >= 0; i--) { // (its own steering overruled, as on the hook's line: tools/sondelass/hookshot.js fixedPull)
        const d = drags[i], c = d.c; d.left -= raw;
        to.copy(g.player.pos).sub(c.pos); to.y = 0; const dist = to.length();
        if (d.left <= 0 || !c.alive || dist <= H.stop) { drags.splice(i, 1); if (!drags.length) PS.ended(H.n); continue; }
        if (c.vel) { const k = Math.min(1, 10 * raw); to.multiplyScalar(Math.min(H.pull, dist * 9) / dist); c.vel.x += (to.x - c.vel.x) * k; c.vel.z += (to.z - c.vel.z) * k; }
      }
      const K = P().chainShot;
      for (let i = chains.length - 1; i >= 0; i--) { // (held within its length: the two drawn back toward each other)
        const L = chains[i]; L.left -= raw;
        if (L.left <= 0 || !L.a.alive || !L.b.alive) { chains.splice(i, 1); if (L.left > 0 && !chains.length) PS.ended(K.n); continue; } // (broken early: its look let go)
        const d = _b.copy(L.b.pos).sub(L.a.pos); d.y = 0; const n = d.length();
        if (n > K.length) { const k = Math.min(1, 8 * raw), v = d.multiplyScalar(((n - K.length) * 6) / n); if (L.a.vel) { L.a.vel.x += v.x * k; L.a.vel.z += v.z * k; } if (L.b.vel) { L.b.vel.x -= v.x * k; L.b.vel.z -= v.z * k; } }
      }
      if (beat) { beat.hot = false; if (beat.left <= 0 || PS.now > beat.until) { if (beat.left <= 0) PS.ended(P().onTheBeat.n); beat = null; } } // (the six spent before the bars: its look let go)
      if (hooked && PS.now > hooked.until) hooked = null;
    },
  };
}
