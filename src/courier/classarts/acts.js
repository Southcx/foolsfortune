// ---------------------------------------------------------------------------------------
// A CLASS'S ACTIONS IN PLAY (CLASS-ARTS.md; the rules and numbers Dovina's, progress/classarts.js CLASS_ARTS): what each worn action does
// on its key, read by the runtime (courier/classarts/body.js press). Each is `{ can(run, R) -> refusal | null, go(run, R) }`, `R` the
// art's numbers as worn now (accented by the class read); an action that plays away from the body says where (`run.place`: `at` a point,
// `target` a creature), for its look (vfx/classartlooks.js, Calissa's). Built in waves, four classes a wave (CLASS-ARTS.md 4):
//   wave 1  the Fool (Beginner's Luck) and the Knights (Onrush, Water Walk, Riposte Rush, Bulwark)
//   wave 2  the Pages (Spark, Offering, Scout, Prospect) and the Queens (Stoke, Catch the Rain, Clear Sight, Harvest)
// A refusal's words are Espada's where she wrote them (docs/handoffs/everyone/2026-10-30-from-espada-words-ahead.md 2), else placeholders.
//
// Prior art: Final Fantasy Tactics' action abilities (one verb on a key), Hades' boons, the house's own verbs reused where an art is one
// (the flare's reveal for Scout, the dowse's ping for Prospect, the mop's wash for Spark's ember, the Lachrymato Bottle's fill).
//
//   ACTS[id] -> { can?, go }   (body.js asks)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOTTLES } from '../../progress/brushload.js';
import { ECON } from '../../progress/econ/table.js';
import * as calendar from '../../core/calendar.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24;
const nothing = (R) => `${R.label} finds nothing in reach.`; // (Espada's, for an area art with no one in it)

export const ACTS = {
  // ---- wave 1 ---------------------------------------------------------------------------------------------------------------------
  beginnersLuck: { go: (run, R) => { run.luckUntil = run.now + R.does.within; } },
  charge: { // Onrush: the blink's body run forward, everything on the line struck
    go: (run, R) => {
      const P = run.P, dir = P.forward(new THREE.Vector3());
      run.rush(dir, R.does.dist, (from, to) => run.sweep(from, to, R.does.width, R.does.power, R.id));
    },
  },
  wade: { // Water Walk: the surface bears them, paint runs faster
    go: (run, R) => { run.wadeK = R.does.paintSpeed; run.mgr.get?.('waterwalk')?.on(R.does.dur); },
  },
  ripostRush: { // within its window of a parry: blinked behind what was parried, and struck
    can: (run, R) => { const p = run.parried; return p && p.c?.alive && run.now - p.at <= R.does.after ? null : `Riposte Rush needs a parry first: parry a blow, then use it within ${R.does.after} s.`; },
    go: (run, R) => {
      const P = run.P, c = run.parried.c; run.parried = null; run.place = { target: c };
      const to = _b.copy(c.pos).sub(P.pos).setY(0), d = to.length(); if (d < 1e-3) return;
      const dir = to.normalize().clone(), dist = d + (c.radius ?? 0.6) + 0.9;
      run.rush(dir, dist, () => { if (c.alive) run.game.creatures?.strike(c, c.pos.clone().setY(c.pos.y + 0.8), dir.clone().negate(), R.does.power, 'art', 'courier'); });
    },
  },
  bulwark: { // braced: blows worth less, the body held still
    go: (run, R) => { run.braceUntil = run.now + R.does.dur; run.braceTaken = R.does.taken; },
  },

  // ---- wave 2: the Pages ------------------------------------------------------------------------------------------------------------
  spark: { // an ember flicked where you look: what it hits staggered; a slick or a blot where it lands burnt away
    go: (run, R) => {
      const g = run.game, P = run.P, from = _a.copy(P.pos).setY(P.pos.y + 1.5), dir = P.lookDir(new THREE.Vector3());
      const hit = g.physics?.raycast(from, dir, R.does.reach, P.collider, undefined, (k) => !k.isSensor());
      const at = hit ? hit.point.clone() : from.clone().addScaledVector(dir, R.does.reach), c = hit ? g.physics.entityOf?.(hit.collider) : null;
      if (c?.type === 'creature' && c.alive && !c.ally) {
        g.creatures.strike(c, at.clone(), dir.clone(), R.does.power, 'art', 'courier', null, 'impact');
        g.stun?.add(c, R.does.power, { by: 'courier', cause: 'spark' }); // (staggered: its poise knocked as a light blow's)
        run.place = { target: c };
      } else run.place = { at };
      if (R.does.burns) { // (the ember lands: crude burnt off where it fell, as Clean washes it: a blot emptied is washed by you)
        const down = hit ? at : (g.physics?.raycast(at, _b.set(0, -1, 0), 6, P.collider, undefined, (k) => !k.isSensor())?.point ?? at);
        g.paintmap?.wipe?.(down.x, down.z, down.x, down.z, down.y, 1.6, 99, 'slick');
        g.stains?.wipe?.({ x: down.x, z: down.z }, { x: down.x, z: down.z }, down.y, 99, 1.6);
      }
    },
  },
  offering: { // a cup of the pool set down where you stand: what is near drinks, and is calmed
    can: (run, R) => ((run.game.lachryma?.value ?? 0) >= R.does.pool ? null : `Offering needs ${R.does.pool} of your pool.`),
    go: (run, R) => {
      const g = run.game, P = run.P; if (!g.lachryma?.spend?.(R.does.pool, 'art')) return;
      run.place = { at: P.pos.clone() };
      for (const c of g.creatures?.near?.(P.pos, R.does.reach) || []) if (c.alive && !c.ally) g.creatures.apply(c, R.does.status, R.does.dur, 1, 'courier');
    },
  },
  scout: { // every creature within reach outlined through walls (the flare's reveal), every source of Lachryma marked
    can: (run, R) => (run.game.creatures?.near?.(run.P.pos, R.does.reach)?.some((c) => c.alive && !c.ally) || run.game.signatures?.around?.(run.P.pos, R.does.reach)?.length ? null : nothing(R)),
    go: (run, R) => {
      const g = run.game, P = run.P, play = g.weapon?.play;
      for (const c of g.creatures?.near?.(P.pos, R.does.reach) || []) if (c.alive && !c.ally) { c.revealed = true; play?.revealed?.set(c, R.does.dur); }
      for (const s of g.signatures?.around?.(P.pos, R.does.reach) || []) {
        if (s.ref?.type === 'creature') continue;
        g.glyphs?.pop?.('star', s.pos.clone().setY(s.pos.y + 1), { color: 0x9fd8ff, size: 0.6, life: R.does.dur, ring: true, throughWalls: true }); // (placeholder: a source's tag is Calissa's, on art.use)
      }
    },
  },
  prospect: { // the strongest Lachryma ahead pinged, as the dowse pings it
    pick(run, R) {
      const P = run.P, f = P.forward(new THREE.Vector3()); let best = null;
      for (const s of run.game.signatures?.around?.(P.pos, R.does.reach) || []) {
        if (s.ref?.type === 'creature') continue;
        const d = _a.copy(s.pos).sub(P.pos).setY(0); if (d.lengthSq() > 0.25 && d.normalize().angleTo(f) > R.does.cone) continue;
        if (!best || (s.strength ?? 0) > (best.strength ?? 0)) best = s;
      }
      return best;
    },
    can(run, R) { return this.pick(run, R) ? null : nothing(R); },
    go(run, R) { const s = this.pick(run, R); if (s) run.place = { at: s.pos.clone() }; }, // (its ping is the look's mark there, art.prospect.mark)
  },

  // ---- wave 2: the Queens -----------------------------------------------------------------------------------------------------------
  kindleHeart: { // Stoke: for a while your blows build statuses faster (onStrike) and the pool fills faster (the pool's modifier)
    go: (run, R) => { run.stokeUntil = run.now + R.does.dur; run.stokeBuild = R.does.build; run.game.lachryma?.addModifier?.('art.stoke', { regenMult: R.does.regen }); },
  },
  wellUp: { // Catch the Rain: under falling weather and open sky, the Lachrymato Bottle filled from it
    can: (run, R) => {
      const g = run.game, L = g.techs?.get?.('soulbrush')?.load, w = g.weather?.here?.(run.P.pos);
      if (!L?.bottle) return 'Catch the Rain needs a Lachrymato Bottle on your back.';
      if (!w?.aspect || !(w.strength > 0) || (R.does.open && w.exposure && w.exposure !== 'open')) return 'Catch the Rain needs falling weather over open sky.';
      return null;
    },
    go: (run, R) => {
      const g = run.game, L = g.techs.get('soulbrush').load, cap = BOTTLES[L.bottle]?.capacity ?? 0, w = g.weather?.here?.(run.P.pos);
      if (!(L.held > 0.5)) L.grade = w?.aspect ?? L.grade; // (an empty bottle takes the weather's feeling)
      L.fill?.(cap * R.does.bottle);
    },
  },
  clearSight: { // every windup's Figment telegraph shown in full while it lasts (creatures/creatures.js asks clearSight())
    go: (run, R) => { run.clearUntil = run.now + R.does.dur; },
  },
  harvest: { // a Spirit Garden bed ripened at once (in the garden), else one more cube from the next crystal struck
    go: (run, R) => {
      const g = run.game, G = g.garden;
      if (g.realm?.active && G?.s?.beds) {
        const i = G.s.beds.findIndex((b, k) => b && !G.ripe(k));
        if (i >= 0) { G.s.beds[i].at = calendar.now() - ECON.garden.growHours * GAME_HOUR; G.dirty?.(); return; }
      }
      run.harvestCubes = (run.harvestCubes || 0) + R.does.crystalCube;
    },
  },
};
