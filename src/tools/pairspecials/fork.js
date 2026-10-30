// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE DREAMVANE'S FORK AND DOWSE (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and
// numbers Dovina's, progress/toolpairs.js SPECIAL_PLAY):
//   2  Revelation      Veritome sub: the lent Flash rings the dowse out to `reach`: every signature in it shown and tagged through walls
//                      for `life` (creatures as a flare's finds; a hidden thing found and charted as the dowse finds it)
//   7  Slingshot       Sondelass sub: the lent Grapple with the fork stuck within `range` bites the fork; you arrive flung, keeping `carry`
//                      of `fling` along the pull, so it chains into a jump
//   16 Lightning Rod   psygun sub: where the fork sticks, a bolt `delay` later: `radius`, `power`, a daze of `stun`; one bolt a throw
//   18 Singing Mirage  Crucibelle sub: where the fork lands the bell's mirage rises for `life`, singing so creatures within `lure` go to it
//
// Prior art: Skyward Sword's dowsing, Ōkami's Thunder Edge over a lightning rod, Just Cause's grapple slingshot, the Pied Piper and
// Ōkami's Veil of Mist (a lure that sings), the Bombardier's flare here (vfx/flarereveal.js: the reveal reused).
//
//   forkSpecials(PS) -> part { lend(tool), lendAim(tool) -> point | null, forkStick(), zip(e), update(raw) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Petra's, where the row is silent: the mirage's own loudness (`loud`, 1.6 + 0.4 x power, tools/crucibelle/mirage.js) reaches about
 *  6 m at power 1, so `lure` 12 m is power 2. */
const MIRAGE_M = 6;
const _a = new THREE.Vector3();

export function forkSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  const fork = () => g.techs?.get?.('dreamvane')?.fork;
  const stuck = () => { const F = fork(); return F?.state === 'stuck' ? F : null; };
  let sling = null, bolt = null;
  return {
    /** Where the lent Grapple goes, before it fires (tools/sondelass/hookshot.js lend): the stuck fork within reach, for a Slingshot. */
    lendAim(tool) {
      const F = stuck(), S = P().slingshot; if (tool !== 'sondelass' || !F || !PS.live(S.n) || F.pos.distanceTo(g.player.pos) > S.range) return null;
      sling = { until: PS.now + 3, at: F.pos.clone(), from: g.player.pos.clone() }; // (3 real s for the line to arrive: 30 m at the reel's pace)
      return F.pos.clone();
    },
    lend(tool) {
      if (tool === 'veritome' && PS.live(P().revelation.n)) this.reveal();
      if (tool === 'sondelass' && sling) PS.said(P().slingshot.n);
    },
    /** The fork stuck (fork.stick): a bolt on its way, or the mirage raised there. */
    forkStick() {
      const F = stuck(); if (!F) return;
      if (PS.live(P().lightningRod.n)) bolt = { at: F.pos.clone(), left: P().lightningRod.delay };
      if (PS.live(P().singingMirage.n)) { const M = P().singingMirage; g.mirage?.raise?.(F.pos.clone(), M.life, M.lure / MIRAGE_M); PS.said(M.n); g.events?.emit('pair.mark', { kind: 'mirage', by: 'courier' }); }
    },
    /** Every signature in the dowse's ring shown: creatures as a flare's finds, hidden things found as the dowse finds them. */
    reveal() {
      const R = P().revelation, at = g.player.pos, play = g.weapon?.play, dv = g.techs?.get?.('dreamvane');
      let n = 0;
      for (const c of g.creatures?.near?.(at, R.reach) || []) { if (!c.alive || c.ally) continue; c.revealed = true; play?.revealed?.set(c, R.life); n++; } // (variantplay.js keeps the clock and clears it)
      for (const s of g.signatures?.around?.(at, R.reach) || []) {
        if (s.ref?.type === 'creature' || !s.ref || dv?.found?.has(s.ref)) continue;
        dv?.found?.add(s.ref); n++;
        g.events?.emit('dowse.find', { kind: s.kind, veiled: !!s.ref?.veiled, dist: Math.round(s.d ?? 0), revealed: true });
        g.cartography?.chartAt?.(s.pos);
        g.glyphs?.pop('star', _a.copy(s.pos).setY(s.pos.y + 1).clone(), { color: 0xfff4e6, size: 0.7, life: R.life, ring: true, throughWalls: true }); // (placeholder: a found thing's tag is Calissa's, on pair.special)
      }
      PS.said(R.n, { n });
    },
    strikeBolt(p) {
      const B = P().lightningRod;
      for (const c of g.creatures?.near?.(p, B.radius) || []) {
        if (!c.alive || c.ally) continue;
        g.creatures.strike(c, c.pos.clone(), _a.set(0, -1, 0).clone(), B.power, 'bolt', 'courier', null, 'impact');
        g.stun?.add(c, B.stun, { by: 'courier', cause: 'bolt' });
      }
      g.fx?.impact?.(p.clone(), new THREE.Vector3(0, 1, 0), { sparks: 24, dust: 10 }); // (placeholder: the bolt's look is Calissa's, on pair.special)
      g.ai?.stimuli?.emit('noise', p, { radius: 30, strength: 1, by: 'courier' });
      PS.said(B.n);
    },
    /** The Grapple drew them to the fork: they arrive flung, keeping `carry` of `fling` along the pull. */
    zip(e) {
      if (!sling || PS.now > sling.until || e.how !== 'arrive' || !PS.live(P().slingshot.n)) { sling = null; return; }
      const S = P().slingshot, P0 = g.player, d = _a.copy(sling.at).sub(sling.from); d.y = 0; // (along the pull: from where they stood to the fork)
      if (d.lengthSq() < 1e-4) d.set(Math.sin(P0.yaw), 0, Math.cos(P0.yaw)); // (straight up to it: flung the way they face)
      d.normalize().multiplyScalar(S.fling * S.carry); d.y = 3;
      P0.impulse(d, 'slingshot'); sling = null;
      g.events?.emit('pair.mark', { kind: 'sling', by: 'courier' });
    },
    update(raw) {
      if (sling && PS.now > sling.until) sling = null;
      if (bolt && (bolt.left -= raw) <= 0) { const at = bolt.at; bolt = null; if (PS.live(P().lightningRod.n)) this.strikeBolt(at); }
    },
  };
}
