// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE DREAMVANE'S FORK AND DOWSE (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8). With the
// Dreamvane in hand, the sub's lent verb (R) goes to the fork where it is stuck, or through the dowse while it is held:
//   2  Revelation      Veritome sub: the lent Flash with the dowse held shows every signature near: creatures outlined and tagged as a
//                      flare's finds (through walls while it holds), every hidden thing found and charted as the dowse finds it
//   7  Slingshot       Sondelass sub: the lent Grapple with the fork stuck bites the fork, draws you to it and flings you on past it
//   16 Lightning Rod   psygun sub: the lent snap shot with the fork stuck brings a bolt down on the fork, once a stick
//   18 Singing Mirage  Crucibelle sub: the lent toll with the fork stuck raises a singing decoy where it stands, once a stick
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Skyward Sword's dowsing, Okami's Thunder Edge over a lightning rod, Tomb Raider's and Just Cause's grapple slingshot, the
// Pied Piper and Okami's Veil of Mist (a lure that sings), the Bombardier's flare here (vfx/flarereveal.js: the reveal reused).
//
//   forkSpecials(PS) -> part { lend(tool), lendAim(tool) -> point | null, zip(e), update(raw) }   FORK_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The placeholders, each against a number the game already has. */
export const FORK_PLAY = {
  // Revelation: 30 m (the dowse finds within 45 m and the Flash reaches 10: "near you" between them); shown 8 real s, the flare's own
  reveal: { n: 2, r: 30, secs: 8 },
  // Slingshot: flung at 14 m/s along the pull (past the dash's 12) and lifted 6 m/s, within 3 real s of the bite
  sling: { n: 7, fling: 14, lift: 6, life: 3 },
  // Lightning Rod: a bolt of power 2.5 (a charged shot's middle) within 4 m of the fork, dazing 0.6 real s
  rod: { n: 16, power: 2.5, r: 4, stun: 0.6 },
  // Singing Mirage: 6 real s of song (the Crucibelle's own mirage lasts 8; the fork's is borrowed), at the mirage's own power
  mirage: { n: 18, secs: 6, power: 1 },
};

const _a = new THREE.Vector3();

export function forkSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  const fork = () => g.techs?.get?.('dreamvane')?.fork;
  const stuck = () => { const F = fork(); return F?.state === 'stuck' ? F : null; };
  let sling = null, spent = false; // (this stick spent on a bolt or a decoy: cleared when the fork leaves it, thrown again for another)
  return {
    /** Where the lent Grapple goes, before it fires (tools/sondelass/hookshot.js lend): the stuck fork, for a Slingshot. */
    lendAim(tool) {
      const F = stuck(); if (tool !== 'sondelass' || !F || !PS.live(P().sling.n)) return null;
      sling = { until: PS.now + P().sling.life, at: F.pos.clone(), from: g.player.pos.clone() };
      return F.pos.clone();
    },
    lend(tool) {
      const F = stuck();
      if (tool === 'veritome' && PS.live(P().reveal.n) && g.techs?.get?.('dreamvane')?.dowsing) this.reveal();
      if (tool === 'sondelass' && sling) PS.said(P().sling.n);
      if (tool === 'psygun' && F && !spent && PS.live(P().rod.n)) { spent = true; this.bolt(F.pos); }
      if (tool === 'crucibelle' && F && !spent && PS.live(P().mirage.n)) { const M = P().mirage; spent = true; g.mirage?.raise?.(F.pos.clone(), M.secs, M.power); PS.said(M.n); g.events?.emit('pair.mark', { kind: 'mirage', by: 'courier' }); }
    },
    /** Every signature near shown: creatures as a flare's finds, hidden things found as the dowse finds them. */
    reveal() {
      const R = P().reveal, at = g.player.pos, play = g.weapon?.play, dv = g.techs?.get?.('dreamvane');
      let n = 0;
      for (const c of g.creatures?.near?.(at, R.r) || []) { if (!c.alive || c.ally) continue; c.revealed = true; play?.revealed?.set(c, R.secs); n++; } // (variantplay.js keeps the clock and clears it)
      for (const s of g.signatures?.around?.(at, R.r) || []) {
        if (s.ref?.type === 'creature' || !s.ref || dv?.found?.has(s.ref)) continue;
        dv?.found?.add(s.ref); n++;
        g.events?.emit('dowse.find', { kind: s.kind, veiled: !!s.ref?.veiled, dist: Math.round(s.d ?? 0), revealed: true });
        g.cartography?.chartAt?.(s.pos);
        g.glyphs?.pop('star', _a.copy(s.pos).setY(s.pos.y + 1).clone(), { color: 0xfff4e6, size: 0.7, life: 1.4, ring: true }); // (placeholder: a found thing's tag is Calissa's, on pair.special)
      }
      PS.said(R.n, { n });
    },
    /** The bolt down on the fork: what stands within its reach struck and dazed. */
    bolt(p) {
      const B = P().rod;
      for (const c of g.creatures?.near?.(p, B.r) || []) {
        if (!c.alive || c.ally) continue;
        g.creatures.strike(c, c.pos.clone(), _a.set(0, -1, 0).clone(), B.power, 'bolt', 'courier', null, 'impact');
        g.stun?.add(c, B.stun, { by: 'courier', cause: 'bolt' });
      }
      g.fx?.impact?.(p.clone(), new THREE.Vector3(0, 1, 0), { sparks: 24, dust: 10 }); // (placeholder: the bolt's look is Calissa's, the caster's lightning, on pair.special)
      g.ai?.stimuli?.emit('noise', p, { radius: 30, strength: 1, by: 'courier' });
      PS.said(B.n);
    },
    /** The Grapple drew them to the fork: flung on past it, along the pull. */
    zip(e) {
      if (!sling || PS.now > sling.until || e.how !== 'arrive' || !PS.live(P().sling.n)) { sling = null; return; }
      const S = P().sling, P0 = g.player, d = _a.copy(sling.at).sub(sling.from); d.y = 0; // (along the pull: from where they stood to the fork)
      if (d.lengthSq() < 1e-4) d.set(Math.sin(P0.yaw), 0, Math.cos(P0.yaw)); // (straight up to it: flung the way they face)
      d.normalize().multiplyScalar(S.fling); d.y = S.lift;
      P0.impulse(d, 'slingshot'); sling = null;
      g.events?.emit('pair.mark', { kind: 'sling', by: 'courier' });
    },
    update() { if (sling && PS.now > sling.until + 3) sling = null; if (fork()?.state !== 'stuck') spent = false; },
  };
}
