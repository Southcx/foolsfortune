// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE PSYGUN'S SHOT (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8). The sub's lent verb (R) arms
// the next rounds, and each armed round carries it to what it strikes:
//   1  Hooked Shot   Sondelass sub: the lent Grapple arms rounds that drag what they strike to you, as the hook's line drags a creature
//   4  On the Beat   Crucibelle sub: the lent toll arms six rounds fired on the bell's beat, each staggering what it strikes
//   15 Chain Shot    Lockheart sub: the lent Gulp arms rounds that chain the next two creatures struck: both held where they stand,
//                    and a blow on one is shared with the other
//   21 Full Circle   Soul Brush sub: the lent Flick arms rounds that paint where they land, from the brush's load, and mend the allies
//                    they pass
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Bayonetta's Wicked Weaves fed through a gun's string, NieR: Automata's pod programs, Gungrave's chained shots, Splatoon's ink
// shots (Full Circle), the grappling shot of every action game since Bionic Commando (Hooked Shot).
//
//   shotSpecials(PS) -> part { lend(tool), shot(e), strike(c, cause, type, power) -> mods | null, update(raw) }   SHOT_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { spendLoad, loadAspect } from '../soulbrush/load.js';

/** The placeholders, each against a number the game already has. */
export const SHOT_PLAY = {
  // Hooked Shot: 3 rounds, half THE PSYGUN's cylinder (a whole reload's worth would make every shot a pull); 6 real s, a beat to aim;
  // dragged for 0.6 real s at up to 9 m/s (the hook's own reel caps near there for a light body), stopped 2.6 m off as the hook delivers
  hooked: { n: 1, rounds: 3, life: 6, drag: 0.6, speed: 9, near: 2.6, sting: 0.35 },
  // On the Beat: the line's own six (THE PSYGUN's cylinder); 8 real s to fire them; a stagger of 0.35 real s, the hook bite's own
  beat: { n: 4, shots: 6, life: 8, stagger: 0.35 },
  // Chain Shot: 6 real s to strike two; held 2.5 real s (a breath longer than the Flash's stun); a blow on one shared at half
  chain: { n: 15, life: 6, hold: 2.5, share: 0.5 },
  // Full Circle: 6 rounds (a cylinder); 8 real s; a splat the Flick's own size (0.9 m) for 1 of the load, an ally within 1.2 m of the
  // round's path mended 4 (a Lachrymato Bottle's sip against a body of 60)
  circle: { n: 21, rounds: 6, life: 8, r: 0.9, cost: 1, pass: 1.2, heal: 4 },
};

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

export function shotSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let hooked = null, beat = null, chain = null, circle = null; // (what each lend armed: { left, until, ... })
  const drags = []; // ({ c, left }: creatures dragged by a Hooked Shot)
  const armed = (a) => a && a.left > 0 && PS.now < a.until && PS.live(a.n); // (still worn its way round: a swap since the lend disarms it)
  return {
    lend(tool) {
      if (tool === 'sondelass' && PS.live(P().hooked.n)) hooked = { n: P().hooked.n, left: P().hooked.rounds, until: PS.now + P().hooked.life };
      if (tool === 'crucibelle' && PS.live(P().beat.n)) beat = { n: P().beat.n, left: P().beat.shots, until: PS.now + P().beat.life };
      if (tool === 'lockheart' && PS.live(P().chain.n)) chain = { n: P().chain.n, left: 2, until: PS.now + P().chain.life, got: [] };
      if (tool === 'soulbrush' && PS.live(P().circle.n)) circle = { n: P().circle.n, left: P().circle.rounds, until: PS.now + P().circle.life };
    },
    /** A round left the gun: On the Beat counts its shots on the beat; Full Circle paints where it lands and mends the allies it passes. */
    shot(e) {
      if (beat) beat.hot = false;
      if (armed(beat) && g.techs?.get?.('crucibelle')?.onTheBeat) { beat.left--; beat.hot = true; if (beat.left === P().beat.shots - 1) PS.said(P().beat.n); } // (hot: this round's strikes, which come after its shot.fire, stagger)
      if (armed(circle) && e.at) {
        const C = P().circle; circle.left--;
        const aspect = loadAspect(g), at = e.at;
        if (aspect && spendLoad(g, C.cost, 'pairCircle') > 0) g.paintmap?.stamp(at.x, at.y, at.z, C.r, aspect, 0.9);
        const from = _a.copy(g.player.pos).setY(g.player.pos.y + 1.2), seg = _b.copy(at).sub(from), len = seg.length() || 1;
        for (const f of g.creatures?.friends || []) { // (an ally the round passes: the nearest point of its path within reach)
          if (!f.alive || !f.pos) continue;
          const t = THREE.MathUtils.clamp(_c.copy(f.pos).sub(from).dot(seg) / (len * len), 0, 1);
          if (_c.copy(from).addScaledVector(seg, t).distanceTo(f.pos) <= C.pass) { f.hp = Math.min(f.maxHp ?? f.hp + C.heal, f.hp + C.heal); g.events?.emit('pair.mend', { kind: f.kind, by: 'courier' }); }
        }
        if (circle.left === C.rounds - 1) PS.said(C.n);
      }
    },
    /** A blow on a creature: a chained one shares it; a round strikes with what it was armed with. */
    strike(c, cause, type, power, point, dir) {
      let mods = null;
      const L = PS.chained;
      if (L && PS.now < L.until && !PS.sharing && (c === L.a || c === L.b)) { // (a blow on one of the chained, any blow of yours: the other takes its share)
        const o = c === L.a ? L.b : L.a;
        if (o.alive) mods = { after: () => { PS.sharing = true; try { g.creatures?.strike(o, o.pos.clone(), dir?.clone?.() ?? null, power * L.share, cause, 'courier'); } finally { PS.sharing = false; } } };
      } else if (L && PS.now >= L.until) PS.chained = null;
      if (cause !== 'shot' && cause !== 'charged') return mods;
      if (armed(hooked) && !c.heavy && !c.ally) {
        hooked.left--; const H = P().hooked;
        const was = mods?.after;
        mods = { ...mods, after: (t) => { was?.(t); if (!t.alive) return; g.stun?.add(t, H.sting, { by: 'courier', cause: 'hook' }); t.cancel?.('hooked'); drags.push({ c: t, left: H.drag }); } };
        if (hooked.left === H.rounds - 1) PS.said(H.n);
      }
      if (beat?.hot && !c.ally) g.stun?.add(c, P().beat.stagger, { by: 'courier', cause: 'beat' }); // (fired on the bell's beat: staggered)
      if (armed(chain) && !c.ally && !chain.got.includes(c)) {
        chain.got.push(c); chain.left--;
        if (chain.got.length === 2) {
          const K = P().chain; PS.chained = { a: chain.got[0], b: chain.got[1], until: PS.now + K.hold, share: K.share };
          for (const t of chain.got) g.creatures?.apply(t, 'halt', K.hold, 1, 'courier');
          chain = null; PS.said(K.n); g.events?.emit('pair.mark', { kind: 'chain', by: 'courier' });
        }
      }
      return mods;
    },
    update(raw) {
      const H = P().hooked, to = _a;
      for (let i = drags.length - 1; i >= 0; i--) { // (its own steering overruled, as on the hook's line: tools/sondelass/hookshot.js fixedPull)
        const d = drags[i], c = d.c; d.left -= raw;
        to.copy(g.player.pos).sub(c.pos); to.y = 0; const dist = to.length();
        if (d.left <= 0 || !c.alive || dist < H.near) { drags.splice(i, 1); continue; }
        if (c.vel) { const k = Math.min(1, 10 * raw); to.multiplyScalar(Math.min(H.speed, dist * 9) / dist); c.vel.x += (to.x - c.vel.x) * k; c.vel.z += (to.z - c.vel.z) * k; }
      }
      if (beat) { beat.hot = false; if (!armed(beat)) beat = null; }
    },
  };
}
