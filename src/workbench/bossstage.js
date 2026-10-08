// ---------------------------------------------------------------------------------------
// THE CROSSING'S BIG OBJECTS ON THE WORKBENCH: the legs' bosses staged before the runtime that sails them is built (docs/plans/
// RAIL-OVERHAUL.md section 6; the brief of 2026-10-08: "visible now"). The False Light with her wreck field, Old Nobody as a space, and
// the Drowned Light with its reef, its wrecks and their ghosts, on a patch of the crude sea, under the storm's light (gold-white above,
// the crude below), every boss part cycling intact, damaged, broken on a sixteen-second loop:
//
//   0 .. 4    intact: the windups shown (the ports opening, the gills breathing, the eye and the tusks; the Drowned Light waking and its
//             warning line); the False Light's lamp sealed
//   4 .. 8    damaged: every part; the Drowned Light's beam hot and sweeping
//   8 .. 12   broken: the rigging cut (the topmasts by the board, the colours struck, the lamp opened and burning, its warning line then
//             its beam), the gunports and the keel broken; Old Nobody's gills shut (it quickens); the Drowned Light's windows broken
//   12 .. 16  the cores go: the False Light's lamp damaged then broken, the wreck field spilling; the Drowned Light's lamp broken, the
//             ghosts fading; Old Nobody's eye and tusks broken
//
// Prior art: this workbench's own stage builders (stages.js: `ship:sloop`, `slice:sea`: an object, a `tick` and a `settle`), Unity's prefab
// stage and Unreal's asset preview scene (a thing seen alone, from any side, on a loop), and a fighting game's training mode (every
// state of a character shown one after another so none is left unseen).
//
//   buildBossStage(id) -> Object3D | null   ids: 'crossing:bosses' (all three), 'crossing:bosses.falselight', '.oldnobody', '.drownedlight'
//   obj.userData.tick(t)   obj.userData.settle(t) (run up to t, so a still shows the eased state)   obj.userData.objects { name: Object3D }
//   obj.userData.looks { falselight, wreckfield, oldnobody, drownedlight } (the looks themselves: their parts, for trying a state by hand)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BrigLook } from '../vfx/brig.js';
import { LeviathanLook } from '../vfx/leviathan.js';
import { DrownedLight } from '../vfx/drownedlighthouse.js';
import { WreckField } from '../vfx/wreckfield.js';
import { CrudeSea } from '../vfx/crudesea.js';

export const BOSS_STAGE_IDS = ['crossing:bosses', 'crossing:bosses.falselight', 'crossing:bosses.oldnobody', 'crossing:bosses.drownedlight'];
const LOOP = 16;

export function buildBossStage(id) {
  if (!BOSS_STAGE_IDS.includes(id)) return null;
  const which = id.split('.')[1] || 'all', all = which === 'all', root = new THREE.Group(); root.name = `stage:${id}`;
  // the storm's light over the crude (the workbench's own lamps stay; this is the sky's colour on them)
  root.add(new THREE.HemisphereLight(0xfff0d8, 0x140c20, 0.9));
  const size = all ? 300 : 160, sea = new CrudeSea({ size, cells: size / 2 }); root.add(sea.mesh);
  const seaW = { heightAt: (x, z) => sea.heightAt(x - root.position.x, z - root.position.z) + root.position.y }; // (the patch in the world: the workbench may have moved the stage)
  const objects = {}, looks = {}, steps = [];
  if (all || which === 'falselight') {
    const B = new BrigLook({}), W = new WreckField({ length: 90, width: 26 });
    const x = all ? -48 : 0; B.group.position.set(x, 0, 0); W.group.position.set(x, 0, -14); W.group.rotation.y = Math.PI; root.add(B.group, W.group);
    objects.falselight = B.group; objects.wreckfield = W.group; looks.falselight = B; looks.wreckfield = W;
    steps.push((t, dt) => falseLight(B, W, t, dt, seaW));
  }
  if (all || which === 'oldnobody') {
    const L = new LeviathanLook({}); L.group.position.set(0, -1.6, all ? 6 : 0); root.add(L.group); objects.oldnobody = L.group; looks.oldnobody = L;
    steps.push((t, dt) => oldNobody(L, t, dt, seaW));
  }
  if (all || which === 'drownedlight') {
    const D = new DrownedLight({}); D.group.position.set(all ? 62 : 0, 0, 0); root.add(D.group); objects.drownedlight = D.group; looks.drownedlight = D;
    steps.push((t, dt) => drownedLight(D, t, dt, seaW));
  }
  let prev = 0;
  const tick = (t) => { const dt = THREE.MathUtils.clamp(t - prev, 0, 0.1); prev = t; sea.update(t); for (const s of steps) s(t, dt); };
  root.userData = { tick, objects, looks, settle: (t) => { prev = Math.max(0, t - 2); for (let k = prev; k < t; k += 1 / 30) tick(k); tick(t); } };
  return root;
}

const phase = (t) => { const k = t % LOOP; return { k, ph: Math.floor(k / 4), u: (k % 4) / 4 }; };
const STATE = ['intact', 'damaged', 'broken', 'broken'];

function falseLight(B, W, t, dt, sea) {
  const { k, ph, u } = phase(t);
  if (B._ph !== ph) { B._ph = ph; if (ph === 0) B.reset(); for (const p of B.parts.list('')) if (p.name !== 'lamp' && p.name !== 'rigging') p.set(STATE[ph]); }
  for (const [i, p] of B.parts.list('gunport.').entries()) if (p.alive) p.windup(ph === 0 ? Math.max(0, Math.sin((u * 2 - i * 0.12) * Math.PI)) : 0); // (the ports open in a ripple: the broadside's windup)
  const lamp = B.part('lamp');
  if (ph === 2) B.lamp.set({ yaw: -0.5 + u * 1.0, warn: u < 0.5 ? 1 : 0, hot: u >= 0.5 ? 1 : 0, pitch: 0.05 }); else B.lamp.set({ warn: 0, hot: 0 });
  if (ph === 3) lamp.set(u < 0.5 ? 'damaged' : 'broken');
  if (Math.floor(k * 3) !== B._hit) { B._hit = Math.floor(k * 3); const ps = B.parts.list('').filter((p) => p.open); ps[B._hit % Math.max(1, ps.length)]?.hit(1); } // (a hit somewhere, three a second: the pulse)
  B.set({ heel: Math.sin(t * 0.7) * 0.05, pitch: Math.sin(t * 0.9) * 0.03 }); B.sink(ph === 3 ? u * 0.6 : 0); B.update(dt);
  W.spill(ph === 3 ? u : ph === 2 ? 0.15 : 0); W.update(dt, sea);
}

function oldNobody(L, t, dt, sea) {
  const { ph, u } = phase(t);
  if (L._ph !== ph) { L._ph = ph; if (ph === 0) L.reset(); for (const p of L.parts.list('gill.')) p.set(ph === 0 ? 'intact' : ph === 1 ? 'damaged' : 'broken'); for (const p of [...L.parts.list('tooth.'), L.part('eye')]) p.set(STATE[Math.max(0, ph - 1)]); }
  L.breathe(0.5 + 0.5 * Math.sin(t * 2.2)); L.maw(ph >= 2 ? 0.6 + 0.4 * Math.sin(u * Math.PI) : 0.15); L.throat(ph === 2 && u > 0.6 ? 1 : 0);
  L.part('eye').windup(ph === 0 ? Math.max(0, Math.sin(u * Math.PI)) : 0); L.fin(1, Math.sin(t * 0.8) * 0.5); L.fin(-1, Math.sin(t * 0.8 + 1) * 0.5);
  if (Math.floor(t * 2) !== L._hit) { L._hit = Math.floor(t * 2); const ps = L.parts.list('').filter((p) => p.open); ps[L._hit % Math.max(1, ps.length)]?.hit(1); }
  L.set({ swim: 0.5, bend: Math.sin(t * 0.25) * 0.06 }); L.update(dt, sea);
}

function drownedLight(D, t, dt, sea) {
  const { ph, u } = phase(t);
  if (D._ph !== ph) { D._ph = ph; if (ph === 0) D.reset(); for (const p of D.parts.list('window.')) p.set(STATE[ph]); D.part('lamp').set(ph < 2 ? 'intact' : ph === 2 ? 'damaged' : 'broken'); }
  for (const [i, p] of D.parts.list('window.').entries()) p.windup(ph === 0 && i % 2 === 0 ? Math.max(0, Math.sin(u * Math.PI)) : 0);
  const wake = ph === 0 ? Math.min(1, u * 2) : 1, sweep = -1.1 + ((t * 0.35) % 2.2);
  D.set({ wake, yaw: sweep, pitch: 0.06, warn: ph === 0 && u > 0.5 ? 1 : 0, hot: ph === 1 || ph === 2 ? 1 : 0, ghosts: ph === 3 ? 1 - u : 1 });
  D.update(dt, sea);
}
