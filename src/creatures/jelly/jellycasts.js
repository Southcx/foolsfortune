// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY'S CASTS, AS THE BODY PLAYS THEM (docs/plans/DUNEMAW-EXTREME.md section 3). The timeline runner
// (creatures/ai/timeline.js) says when a cast begins and when it lands; the numbers are its data (progress/combat/greatjelly.js
// CASTS: windup, area, effect); this says what each one IS: the body's windup (the telegraph: no floor marker, only the body and what
// persists, as an extreme trial hides its markers) and what lands. A blow on the Courier goes through the raid's `hit` (world/well/raid.js:
// the share of the pool, Sodden, the guard), never straight to the vessel.
//
// Prior art: FFXIV's extreme trials (the tankbuster, out-then-in, baited puddles, the gaze turned away, the raidwide, the cone, the
// adds, the split that is a damage check, the desperation, the enrage), Monster Hunter's tells read from the body, the Medusa gaze
// answered with a mirror (Perseus's shield; Zelda's Mirror Shield).
//
//   DO[castId] = { begin(R, def), blow(R, def) }   (R: the raid; R.F the body, R.B the bowl, R.N the nursery, R.P the Courier)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';

const UP = new THREE.Vector3(0, 1, 0);
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** The ring of slip between two radii about a point, as discs round it (what persists of an out-in is the slip it leaves). */
function slipRing(R, at, r0, r1, life) {
  const g = R.g, mid = (r0 + r1) / 2, w = Math.max(1.2, (r1 - r0) / 2), n = Math.max(6, Math.round((2 * Math.PI * mid) / (w * 1.6)));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = at.x + Math.sin(a) * mid, z = at.z + Math.cos(a) * mid;
    g.slip?.addDisc(new THREE.Vector3(x, R.ground(x, z), z), UP, w, life);
  }
}

export const DO = {
  // the tankbuster: rear, lunge; parried it staggers; rolled through it misses (the body's `bash`)
  crownBash: { begin: (R, d) => R.F.bash(d.windup, d.area.reach) },
  // the ram: scrape, charge; into a pillar it cracks its own crown (the body's `ram`, Round 1's bullfight)
  brineLine: { begin: (R, d) => R.F.ram(d.windup) },
  // out, then in: a ring of slip at its feet, then one far out a beat later
  gelidRings: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 0.8 }),
    blow: (R, d) => {
      const at = R.F.c.pos.clone(), { inner, outer } = d.area, P = R.P.pos;
      slipRing(R, at, 0.5, inner, 3); R.F.c.deform.kick(-5, null, 0.25); sfx.slam?.(0.8);
      if (flat(P, at) < inner) R.hit('gelidRings', d.effect, { from: at });
      R.after(1.2, () => {
        slipRing(R, at, outer[0], outer[1], 3); sfx.slam?.(0.6);
        const r = flat(R.P.pos, at); if (r >= outer[0] && r < outer[1]) R.hit('gelidRings', d.effect, { from: at });
      });
    },
  },
  // three drops lobbed where you stand, a second apart: each leaves a puddle for a real minute (lead them to the rim)
  oozeRain: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 1.25 }),
    blow: (R, d) => {
      const A = d.area;
      for (let i = 0; i < A.drops; i++) R.after(i * A.every, () => R.lob(R.F.c.pos.clone().setY(R.F.c.pos.y + 1.6), R.P.pos.clone(), 0.8, (at) => {
        R.g.slip?.addDisc(at.clone(), UP, A.radius, A.lasts);
        sfx.jellySquelch?.(R.g.listenerDistance(at), 1);
        if (flat(R.P.pos, at) < A.radius && Math.abs(R.P.pos.y - at.y) < 2) R.hit('oozeRain', d.effect, { from: at });
      }));
    },
  },
  // the gaze: its crown's eye opens over a bar; look away, or look back through the Veritome and it is stunned instead
  crownGlare: {
    begin: (R, d) => { R.F.cast(d.windup, { pose: 1.1 }); R.F.crown.tell?.(1); },
    blow: (R, d) => {
      R.F.crown.tell?.(0);
      const look = R.looking();
      if (look === 'lens') { R.g.creatures.apply(R.F.c, 'stun', d.mirror, 1, 'courier'); R.rec.mirrored++; R.moment('mirror'); }
      else if (look === 'eye') R.hit('crownGlare', d.effect, { from: R.F.c.pos, gaze: true });
    },
  },
  // the raidwide: no way out of it; guard (V held) at the flash for half
  slipNova: {
    begin: (R, d) => { if (R.F.state !== 'hidden' && R.F.state !== 'sinkHold') R.F.cast(d.windup, { pose: 0.7 }); },
    blow: (R, d) => {
      const at = R.F.c.pos.clone().setY(R.F.c.pos.y + 1);
      R.g.fx?.toneBurst?.(at, 0xd9c19a, 1, 10); R.P.shake = Math.max(R.P.shake || 0, 0.7); sfx.slam?.(1.6);
      R.hit('slipNova', d.effect, { from: at, raidwide: true });
    },
  },
  // Centring: the floor slides toward it, faster below a third; islands hold
  sinkingSands: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 0.75 }),
    blow: (R, d) => R.slideFor(12, R.F.share < 1 / 3 ? d.area.slide[1] : d.area.slide[0]),
  },
  // Slake and Wedge: down, and up under you (the body's `submerge`; the ring 1.2 s before)
  surfaceSlam: { begin: (R) => R.F.submerge() },
  // Decant: a cone 120 degrees wide, its facing locked for the windup's last 0.4 s (get behind it)
  brineCascade: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 1.35, lockAt: Math.max(0, d.windup - 0.4) }),
    blow: (R, d) => {
      const F = R.F, at = F.c.pos, dir = F.dir, half = (d.area.degrees / 2) * (Math.PI / 180), P = R.P.pos;
      for (let i = 1; i <= 4; i++) { const r = (i / 4) * d.area.length; R.g.slip?.addDisc(at.clone().addScaledVector(dir, r).setY(R.ground(at.x + dir.x * r, at.z + dir.z * r)), UP, 1 + r * 0.35, 4); }
      sfx.jellySquelch?.(R.g.listenerDistance(at), 1.4);
      const to = new THREE.Vector3(P.x - at.x, 0, P.z - at.z), r = to.length();
      if (r < d.area.length && to.normalize().dot(dir) > Math.cos(half)) R.hit('brineCascade', d.effect, { from: at });
    },
  },
  // Broodwake: two brood from each clutch still whole, making for it; each that reaches it heals it and grows a plate back
  broodCall: {
    begin: (R, d) => { if (R.F.state !== 'hidden' && R.F.state !== 'sinkHold') R.F.cast(d.windup, { pose: 1.2 }); },
    blow: (R, d) => R.brood(d.area.perClutch * (R.N?.whole ?? 0), d.area.heal),
  },
  // Sherds: four calves a quadrant, sharing its health; all down within `within` s, or they mend and heal it
  calving: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 0.6 }),
    blow: (R, d) => R.calve(d.area),
  },
  // the desperation: the whole floor is slip, and every clutch left hatches
  overflow: {
    begin: (R, d) => R.F.cast(d.windup, { pose: 0.65 }),
    blow: (R, d) => { R.overflow = true; R.slideFor(Infinity, 1.5); R.brood(Infinity, 0.02); },
  },
  // the enrage: the Dunemaw swallows the bowl
  swallow: {
    begin: (R, d) => { R.F.cast(d.windup, { pose: 0.5 }); R.P.shake = Math.max(R.P.shake || 0, 0.4); },
    blow: (R) => R.swallow(),
  },
};
