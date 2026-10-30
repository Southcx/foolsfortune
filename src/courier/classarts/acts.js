// ---------------------------------------------------------------------------------------
// A CLASS'S ACTIONS IN PLAY (CLASS-ARTS.md; the rules and numbers Dovina's, progress/classarts.js CLASS_ARTS): what each worn action does
// on its key, read by the runtime (courier/classarts/body.js press). Each is `{ can(run, R) -> refusal | null, go(run, R) }`, `R` the
// art's numbers as worn now (accented by the class read); an action that plays away from the body says where (`run.place`: `at` a point,
// `target` a creature), for its look (vfx/classartlooks.js, Calissa's). Built in waves, four classes a wave (CLASS-ARTS.md 4):
//   wave 1  the Fool (Beginner's Luck) and the Knights (Onrush, Water Walk, Riposte Rush, Bulwark)
//   wave 2  the Pages (Spark, Offering, Scout, Prospect) and the Queens (Stoke, Catch the Rain, Clear Sight, Harvest)
//   wave 3  the Kings (Roar, Still Waters, Mark for Death, Earth Wall), the World (Completion), the fire signs (Ram, Tame, Blink Mark)
//   wave 4  the water, air and earth signs (Ride, Reap, Vanish, Payback, Starlight, Encore, Shackle, Sanctum, Lamp); what outlasts its
//           press is lasting.js's
//   wave 5  the other eight (Quick Swap, Veil, Overgrowth, Spin, Collapse, Daybreak, Hang Time, Settle the Score)
// A refusal's words are Espada's where she wrote them (docs/handoffs/everyone/2026-10-30-from-espada-words-ahead.md 2), else placeholders.
//
// Prior art: Final Fantasy Tactics' action abilities (one verb on a key), Hades' boons, the house's own verbs reused where an art is one
// (the flare's reveal for Scout, the dowse's ping for Prospect, the mop's wash for Spark's ember, the Lachrymato Bottle's fill).
//
//   ACTS[id] -> { can?, go, again? }   (body.js asks; `again(run, R)` -> true: a second press that is the art's own, before its cooldown)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOTTLES } from '../../progress/brushload.js';
import { ECON } from '../../progress/econ/table.js';
import * as calendar from '../../core/calendar.js';
import { REL } from '../../creatures/ai/index.js';
import { EMO, enraged } from '../../progress/combat/emo.js';
import { phaseAt } from '../../progress/weather.js';
import { ride, sanctum, lamp, echo, veil, thicket } from './lasting.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24;
const nothing = (R) => `${R.label} finds nothing in reach.`; // (Espada's, for an area art with no one in it)
/** Petra's, where the rows are silent: a stagger is the toll's (a fifth to a third of a light stun: tools/crucibelle/crucibelle.js 0.22, On
 *  the Beat's 0.3) with its shove; an art aimed at one creature takes the lock-on's target, else the nearest in front within AIM m. */
const STAGGER = 0.3, SHOVE = 2.5, AIM = 20;
/** Petra's, where the rows are silent: Starlight's patch of sky round where it was asked (m) and how strong its Wonder falls there; Reap's
 *  blow, its target's health over (so a blow worth less to a kind still downs it). */
const SKY = { r: 40, k: 0.7 }, REAP_OVER = 4;
/** Petra's, where the rows are silent: how long Veil's forgetting, Daybreak's blinding and Collapse's daze hold (real s, a status's time),
 *  Hang Time's lift off the ground (m/s), what Settle the Score deals back of each blow's k (as Payback does: body.js BACK). */
const FORGET = 6, BLIND = 4, LIFT = 6, SETTLE_BACK = 4;
const foes = (run, r) => (run.game.creatures?.near?.(run.P.pos, r) || []).filter((c) => c.alive && !c.ally);
/** The creature an art aims at: the lock-on's, else the nearest within `r` in front (a cone of 0.6 rad). */
function aimed(run, r = AIM, ok = () => true) {
  const g = run.game, L = g.lock?.target; if (L?.alive && !L.ally && ok(L) && L.pos.distanceTo(run.P.pos) <= r) return L;
  const P = run.P, f = P.forward(new THREE.Vector3()); let best = null, bd = Infinity;
  for (const c of foes(run, r)) { if (!ok(c)) continue; const d = _a.copy(c.pos).sub(P.pos).setY(0), n = d.length(); if (n > 0.5 && d.normalize().angleTo(f) > 0.6) continue; if (n < bd) { bd = n; best = c; } }
  return best;
}

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
        g.stun?.add(c, STAGGER, { by: 'courier', cause: 'spark' }); // (staggered, as by a toll)
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

  // ---- wave 3: the Kings ------------------------------------------------------------------------------------------------------------
  command: { // Roar: every creature within reach staggered, and its windup broken off
    can: (run, R) => (foes(run, R.does.reach).length ? null : nothing(R)),
    go: (run, R) => {
      const g = run.game, P = run.P;
      for (const c of foes(run, R.does.reach)) {
        g.stun?.add(c, STAGGER, { by: 'courier', cause: 'roar' });
        const d = _a.copy(c.pos).sub(P.pos).setY(0); if (d.lengthSq() > 1e-4) c.knock?.(d.normalize().multiplyScalar(SHOVE).setY(1).clone());
        if (R.does.breaks) c.cancel?.('roar');
      }
    },
  },
  stillWaters: { // every creature within reach settled: its mind to Balanced, its agitation to the middle of its best band
    can: (run, R) => (foes(run, R.does.reach).length ? null : nothing(R)),
    go: (run, R) => {
      const g = run.game, mid = (EMO.optimal[0] + EMO.optimal[1]) / 2;
      for (const c of foes(run, R.does.reach)) {
        if (c.mind != null) { c.mind = R.does.mind; g.creatures?.mindMoved?.(c, 'courier'); }
        if (R.does.emo === 'band' && c.emo != null) c.emo = mid;
        g.temper?.set?.(c, { state: c.mind, emo: c.emo, enrage: enraged(c.emo) }); // (its body settles too: vfx/temper.js)
      }
    },
  },
  verdict: { // Mark for Death: the creature aimed at marked; your blows on it worth more, and it cannot resist them (body.js onStrike, noResist)
    can: (run, R) => (aimed(run) ? null : nothing(R)),
    go: (run, R) => {
      const c = aimed(run); run.mark = { c, until: run.now + R.does.dur, mult: R.does.mult }; run.place = { target: c };
      if (R.does.noResist) run.open(c, R.does.dur);
    },
  },
  stronghold: { // Earth Wall: a wall of ground stood up in front of you for a while (body.js wall)
    spot(run) {
      const g = run.game, P = run.P, f = P.forward(new THREE.Vector3()), at = P.pos.clone().addScaledVector(f, 2.2).setY(P.pos.y + 1.5);
      const down = g.physics?.raycast(at, _b.set(0, -1, 0), 4, P.collider, undefined, (k) => !k.isSensor());
      return down && down.normal.y > 0.6 ? { at: down.point.clone(), yaw: Math.atan2(f.x, f.z) } : null;
    },
    can(run) { return this.spot(run) ? null : 'Earth Wall needs open ground in front of you.'; }, // (Espada's)
    go(run, R) { const s = this.spot(run); if (!s) return; run.place = { at: s.at }; run.wall(s.at, s.yaw, R.does.width, R.does.height, R.does.dur); },
  },

  // ---- wave 3: the World ------------------------------------------------------------------------------------------------------------
  completion: { // for a while every art costs nothing (the pool's modifier) and cools down faster (body.js press)
    go: (run, R) => { run.completeUntil = run.now + R.does.dur; run.completeCool = R.does.cool; run.game.lachryma?.addModifier?.('art.completion', { costMult: { art: 0 } }); },
  },

  // ---- wave 3: the fire signs -----------------------------------------------------------------------------------------------------
  ram: { // a wave of force ahead: everything in its cone struck and knocked back
    can: (run, R) => (run.inCone(R.does.reach, R.does.cone).length ? null : nothing(R)),
    go: (run, R) => {
      const g = run.game, P = run.P;
      for (const c of run.inCone(R.does.reach, R.does.cone)) {
        const d = _a.copy(c.pos).sub(P.pos).setY(0).normalize().clone();
        g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), d.clone(), R.does.power, 'art', 'courier', null, 'impact');
        run.carry(c, d, R.does.knock); // (carried its `knock` metres, whatever its own drag: a stunned jelly sheds a lone knock in 1.6 m)
      }
    },
  },
  tame: { // a creature stunned deep enough fights beside you a while: you its kin, the kinds near it its rivals (the brain wears the
    // relations off on its own clock, as a reprogrammed one's: creatures/ai/brain.js; body.js gives back its standing as a foe)
    ok: (run, R) => (c) => (run.game.stun?.depth?.(c) || 0) >= R.does.depth && !!c.brain,
    can(run, R) { return aimed(run, 8, this.ok(run, R)) ? null : 'Tame needs a creature stunned or out cold within 8 m.'; }, // (Espada's words)
    go(run, R) {
      const c = aimed(run, 8, this.ok(run, R)); if (!c) return;
      const until = (c.brain.now || 0) + R.does.dur, kinds = new Set(foes(run, 30).filter((o) => o !== c).map((o) => o.kind)).add(c.kind);
      c.rel ||= new Map(); c.relUntil ||= new Map();
      c.rel.set('courier', REL.KIN); c.relUntil.set('courier', until);
      for (const k of kinds) { c.rel.set(k, REL.RIVAL); c.relUntil.set(k, until); }
      const f = c.mem?.fact?.(run.P); if (f) { f.grudge = 0; f.threat = 0; } // (kin: no grudge left, as the Lockheart's kin outcome)
      c.ally = true; c.brain.signal?.(); run.tamed.push({ c, until: run.now + R.does.dur }); run.place = { target: c };
    },
  },
  arrowOfTime: { // Blink Mark: a mark thrown where you look; the key again within its window blinks you to it
    again(run, R) {
      const m = run.blinkMark; if (!m || run.now > m.until) return false;
      run.blinkMark = null; const P = run.P, to = _a.copy(m.at).sub(P.pos), d = to.length(); if (d < 0.5) return true;
      run.rush(to.normalize().clone(), d, null); run.fire('arrowOfTime'); return true;
    },
    go: (run, R) => {
      const g = run.game, P = run.P, from = _a.copy(P.pos).setY(P.pos.y + 1.5), dir = P.lookDir(new THREE.Vector3());
      const hit = g.physics?.raycast(from, dir, R.does.reach, P.collider, undefined, (k) => !k.isSensor());
      const at = hit ? hit.point.clone().addScaledVector(hit.normal, 0.6) : from.clone().addScaledVector(dir, R.does.reach);
      run.blinkMark = { at, until: run.now + R.does.window }; run.place = { at };
    },
  },

  // ---- wave 4: the water, air and earth signs -----------------------------------------------------------------------------------
  ride: { // Ride: a staggered creature's body steered by your movement keys a while, you held where you stand (lasting.js ride)
    ok: (run) => (c) => (run.game.stun?.depth?.(c) || 0) >= 1 && !c.driven,
    can(run) { return aimed(run, 8, this.ok(run)) ? null : 'Ride needs a staggered creature within 8 m.'; }, // (Espada's words)
    go(run, R) { const c = aimed(run, 8, this.ok(run)); if (!c) return; run.last(ride(run, c, R.does.dur)); run.place = { target: c }; },
  },
  reap: { // a sweep round you: every creature within reach under its share of health downed
    pick: (run, R) => foes(run, R.does.reach).filter((c) => c.maxHp > 0 && c.hp / c.maxHp < R.does.under),
    can(run, R) { return this.pick(run, R).length ? null : nothing(R); },
    go(run, R) {
      const g = run.game, P = run.P;
      for (const c of this.pick(run, R)) {
        const d = _a.copy(c.pos).sub(P.pos).setY(0); if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), d.normalize().clone(), Math.max(1, c.hp) * REAP_OVER, 'art', 'courier');
      }
    },
  },
  mirageStep: { go: (run, R) => { run.place = { at: run.P.pos.clone() }; run.last(veil(run, R.does.dur)); } }, // Vanish (lasting.js veil)
  weigh: { go: (run, R) => { run.paybackUntil = run.now + R.does.within; } }, // Payback: the next blow taken is dealt back (body.js struck)
  wish: { // Starlight: under the open night sky, the weather where you stand turned toward Wonder (weather.here asks body.js skyAt)
    can: (run, R) => {
      if (R.does.night && phaseAt() !== 'night') return 'Starlight needs the night sky.'; // (Espada's words)
      const w = run.game.weather?.here?.(run.P.pos); return w?.exposure && w.exposure !== 'open' ? 'Starlight needs the open sky over you.' : null;
    },
    go: (run, R) => {
      const P = run.P; run.place = { at: P.pos.clone() };
      run.sky = { x: P.pos.x, z: P.pos.z, r: SKY.r, aspect: R.does.toward, strength: SKY.k, until: run.now + (R.does.hours * GAME_HOUR) / 1000 };
    },
  },
  echo: { // Encore: the last tool move struck again from where it was made (the moveset's record, lasting.js echo)
    can: (run) => (run.lastMove ? null : 'Encore needs a move to repeat: use a tool first.'), // (Espada's words)
    go: (run, R) => { const m = run.lastMove; run.place = { at: m.at.clone() }; run.last(echo(run, m, R.does.delay)); },
  },
  bind: { // Shackle: the creature aimed at held where it stands, and it cannot resist
    can: (run, R) => (aimed(run) ? null : nothing(R)),
    go: (run, R) => { const c = aimed(run); run.place = { target: c }; if (R.does.noResist) run.open(c, R.does.dur); run.game.creatures.apply(c, R.does.status, R.does.dur, 1, 'courier'); },
  },
  sanctum: { go: (run, R) => { const at = run.P.pos.clone(); run.place = { at }; run.last(sanctum(run, at, R.does.reach / 2, R.does.dur)); } }, // (its reach is across)
  lantern: { go: (run, R) => { run.last(lamp(run, R.does.reach, R.does.dur)); } }, // Lamp (lasting.js lamp)

  // ---- wave 5: the other eight --------------------------------------------------------------------------------------------------
  sleight: { // Quick Swap: the chamber the cylinder is on given the next shell you hold that is not chambered, without the Pneuka Box
    next(run) {
      const S = run.game.shells; if (!S?.chambers?.length) return null;
      const held = Object.keys(S.counts || {}).filter((id) => (S.counts[id] || 0) > 0 && !S.chambers.includes(id));
      return held.length ? held[0] : null;
    },
    can(run) { return this.next(run) ? null : 'Quick Swap needs a second shell to swap in.'; }, // (Espada's words)
    go(run) { const S = run.game.shells, id = this.next(run); if (id) S.chamber(S.selected, id); },
  },
  veil: { // Veil: the creature aimed at loses track of you and forgets what it knew of you (the status `forget`)
    can: (run, R) => (aimed(run, R.does.reach) ? null : nothing(R)),
    go: (run, R) => {
      const c = aimed(run, R.does.reach); run.place = { target: c };
      const f = c.mem?.fact?.(run.P); if (f) { f.grudge = 0; f.threat = 0; f.aware = 0; }
      run.game.creatures.apply(c, 'forget', FORGET, 1, 'courier');
    },
  },
  bloom: { go: (run, R) => { const at = run.P.pos.clone(); run.place = { at }; run.last(thicket(run, at, R.does.reach, R.does.dur)); } }, // Overgrowth
  spin: { // Spin: Luck's re-roll given back at once (progress/dice.js Rerolls)
    can: (run) => { const L = run.game.rerolls; if (!L) return 'Spin has no re-roll to give back.'; L.roll?.(); return L.used > 0 ? null : 'Your re-roll is still unspent: Spin has nothing to give back.'; }, // (Espada's words)
    go: (run, R) => { const L = run.game.rerolls; L.used = Math.max(0, L.used - R.does.reroll); run.game.save?.dirty?.('rerolls'); },
  },
  collapse: { // Collapse: the ground brought down round you, everything under it struck and dazed
    can: (run, R) => (foes(run, R.does.reach).length ? null : nothing(R)),
    go: (run, R) => {
      const g = run.game, P = run.P; run.place = { at: P.pos.clone() };
      for (const c of foes(run, R.does.reach)) {
        const d = _a.copy(c.pos).sub(P.pos).setY(0); if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.4), d.normalize().clone(), R.does.power, 'art', 'courier', null, 'impact');
        if (c.alive) g.stun?.knock?.(c, 1, 'courier', 'collapse');
      }
    },
  },
  daybreak: { // Daybreak: a flash of daylight that blinds what is near, and the dark lit a while (render/daylight.js asks body.js daylit)
    go: (run, R) => {
      const g = run.game; run.place = { at: run.P.pos.clone() };
      for (const c of foes(run, R.does.reach)) g.creatures.apply(c, R.does.status, BLIND, 1, 'courier');
      run.dayUntil = run.now + (R.does.light * GAME_HOUR) / 1000;
    },
  },
  suspend: { // Hang Time: held in the air a while, the world round you slowed (game.time; body.js holds the fall)
    go: (run, R) => {
      const P = run.P; if (P.grounded) P.impulse(_a.set(0, LIFT, 0), 'art');
      run.hangUntil = run.now + R.does.dur; run.game.time?.slow?.('art.hang', R.does.slow);
    },
  },
  reckoning: { // Settle the Score: every creature near that hurt you dealt back its share of all it dealt you (body.js struck counts it)
    owed: (run, R) => foes(run, R.does.reach).filter((c) => (run.dealt.get(c) || 0) > 0),
    can(run, R) { return this.owed(run, R).length ? null : 'Settle the Score needs a creature nearby that has hurt you.'; }, // (Espada's words)
    go(run, R) {
      const g = run.game, P = run.P, owed = this.owed(run, R);
      run.place = { targets: owed }; // (each one dealt back: Calissa's beams drawn in from them)
      for (const c of owed) {
        const d = _a.copy(c.pos).sub(P.pos).setY(0); if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), d.normalize().clone(), Math.max(0.5, run.dealt.get(c) * R.does.share * SETTLE_BACK), 'art', 'courier');
        run.dealt.delete(c);
      }
    },
  },
};