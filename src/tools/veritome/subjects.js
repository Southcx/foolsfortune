// ---------------------------------------------------------------------------------------
// SUBJECTS: what the Veritome's lens can see and name. Every kind of thing worth a photograph is a SUBJECT here, with a way to find
// every one of it in the world: where it is, how big, what it is doing (a clapperjar in the air, mending, hoarding; a pot written
// heavy). A photograph is scored over the subjects in its frame (photo.js); the Compendium keeps the best photograph of each kind;
// a card's sitting is a subject in a state (arcana.js).
//
// A creature (a clapperjar, a fish) also says whether it is AWARE of the Courier (it can see them) and ENGAGED with them (it is taunting,
// fleeing, cowering, scalded, knocked: in the thick of it with them). Only an aware, engaged creature can be held by a charged shot
// (Fatal Frame's ghosts are photographed while they come at you); an unaware one is photographed candidly, and a candid photograph is
// how its habits are learned (bestiary.js).
//
// Prior art: the Hyrule Compendium of Breath of the Wild (photograph a thing and it is entered; the photograph is the entry), and
// Pokémon Snap's subjects, which are scored for what they are doing as much as for being in the frame.
//
//   SUBJECTS[id] = { name, find(game) -> [{ pos, r, ref, states: Set, sub?, aware?, engaged? }] }     (sub: a fish's species)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUNE, POND, WELL } from '../../world/dunes/dunes.js';
import { OX, OY, OZ, PALM_SPOTS, TALLY_AT } from '../sondelass/angling/weir.js';
import { Cog, Shuttle } from '../../world/props/movers.js';
import { inscribed } from '../soulbrush/inscribe.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const inDunes = (g) => !!g.dunes?.active;
/** What a clapperjar is doing when it is in the thick of it with the Courier (a charged shot can hold it then). */
export const ENGAGED = new Set(['taunt', 'flee', 'stumble', 'hide', 'cower', 'scalded', 'knocked', 'stunned', 'raid', 'guard']);

export const SUBJECTS = {
  slipjelly: { name: 'slip jelly', find: (g) => (g.jellies?.list || []).filter((c) => c.alive).map((c) => {
    const states = new Set([c.state]);
    if (c.air) states.add('air');
    if (c.stash > 0) states.add('carry'); // (it has eaten Lachryma, and carries it)
    for (const k of c.status?.keys() || []) states.add(k);
    return { pos: c.pos.clone().setY(c.pos.y + 0.75), r: 0.8, ref: c, states, aware: !!c.aggro, engaged: c.aggro && ['chase', 'wind', 'recover'].includes(c.state), facing: new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw)) };
  }) },
  clapper: { name: 'clapperjar', find: (g) => (g.clappers?.list || []).filter((c) => c.alive).map((c) => {
    const st = new Set([c.state]);
    if (!c.grounded || c.state === 'knocked') st.add('air');
    if ((c.stash || 0) >= 3 || c.raider) st.add('greed');
    if (c.raider) st.add('raider');
    if (c.ally) st.add('ally');
    if (c.state === 'mendGo') st.add('mend');
    // infighting: a turned jar on a raider's heels, or a raider it has just knocked down
    if ((c.state === 'guard' && c.chasing?.alive && c.chasing.pos.distanceTo(c.pos) < 2.5) || (c.raider && c.state === 'knocked' && (c.raiderStunned || 0) > 0)) st.add('infight');
    const aware = !!g.clappers?.canSeePlayer?.(c), engaged = aware && ENGAGED.has(c.state);
    if (aware) st.add('aware');
    return { pos: c.pos.clone().setY(c.pos.y + 0.35), r: 0.45, ref: c, states: st, aware, engaged, facing: new THREE.Vector3(Math.sin(c.heading), 0, Math.cos(c.heading)) };
  }) },
  fish: { name: 'fish', find: (g) => (g.weir?.fish || []).filter((f) => f.alive && !f.dying && f.mesh?.group?.visible !== false && f.mesh.group.scale.x > 0.4).map((f) => {
    const st = new Set([f.state]);
    if (g.angler?.fight?.fish === f) st.add('fight');
    if (f.pos.y > (f.pool?.surface ?? -1e9)) st.add('air');
    return { pos: f.pos.clone(), r: Math.max(0.2, f.length * 0.5), ref: f, sub: f.sp.id, states: st, aware: f.state === 'flee', engaged: false, facing: new THREE.Vector3(Math.sin(f.heading), 0, Math.cos(f.heading)) };
  }) },
  pot: { name: 'pot', find: (g) => [...(g.breakables?.items || [])].filter((e) => e.alive && !e.def?.lantern && !e.def?.trial).map((e) => {
    const t = e.body.translation(), st = new Set([e.kind, ...inscribed(e)]);
    if (e.ember || e.def?.ember) st.add('ember');
    if (e.crackStage > 0) st.add('cracked');
    if (e.gold) st.add('gold');
    return { pos: V(t.x, t.y + e.P.height * 0.45, t.z), r: Math.max(e.P.rMax, e.P.height * 0.5), ref: e, states: st };
  }) },
  lantern: { name: 'lantern', find: (g) => [...(g.breakables?.items || [])].filter((e) => e.alive && e.def?.lantern).map((e) => { const t = e.body.translation(); return { pos: V(t.x, t.y + e.P.height * 0.45, t.z), r: e.P.rMax + 0.1, ref: e, states: new Set() }; }) },
  hanging: { name: 'hanging pot', find: (g) => [...(g.breakables?.items || [])].filter((e) => e.alive && e.def?.hang).map((e) => { const t = e.body.translation(); return { pos: V(t.x, t.y + e.P.height * 0.45, t.z), r: e.P.rMax + 0.1, ref: e, states: new Set() }; }) },
  shards: { name: 'breaking', find: (g) => (g.breakables?.shards || []).filter((s) => s.age < 1.2 && s.body?.isValid?.()).map((s) => { const t = s.body.translation(); return { pos: V(t.x, t.y, t.z), r: 0.25, ref: s, states: new Set() }; }) },
  wreck: { name: 'wreck', find: (g) => (g.breakables?.wrecks || []).map((w) => ({ pos: w.pos.clone().setY(w.pos.y + 0.2), r: Math.max(0.35, w.rMax || 0.4), ref: w, states: new Set() })) },
  chest: { name: 'chest', find: (g) => (g.chests?.list || []).filter((c) => c.rig?.root).map((c) => ({ pos: c.rig.root.position.clone().setY(c.rig.root.position.y + 0.5 * c.rig.scale), r: 0.8 * c.rig.scale, ref: c, states: new Set([c.state]) })) },
  gong: { name: 'gong', find: (g) => (g.trial?.gong ? [{ pos: g.trial.gong.getWorldPosition(V(0, 0, 0)).setY(g.trial.gong.position.y + 1.1), r: 0.85, ref: g.trial.gong, states: new Set() }] : []) },
  cog: { name: 'cog', find: (g) => (g.movers?.list || []).filter((m) => m instanceof Cog).map((m) => ({ pos: m.center.clone(), r: (m.R || 2) * 0.9, ref: m, states: new Set() })) },
  cart: { name: 'carriage', find: (g) => (g.movers?.list || []).filter((m) => m instanceof Shuttle).map((m) => ({ pos: m.group.getWorldPosition(new THREE.Vector3()), r: 1.2, ref: m, states: new Set() })) },
  skiff: { name: 'skiff', find: (g) => { const s = g.techs?.get('surfer')?.skiff; return s?.group?.visible ? [{ pos: s.group.position.clone().setY(s.group.position.y + 1.2), r: 2.2, ref: s, states: new Set() }] : []; } },
  tower: { name: 'kiln', find: () => [{ pos: V(0, 2.2, 12.6), r: 2.4, ref: 'kiln', states: new Set(), from: 'below' }] },
  palm: { name: 'palm', find: (g) => (inDunes(g) ? PALM_SPOTS.map(([x, z]) => ({ pos: V(OX + x, OY + 3.6, OZ + z), r: 2.2, ref: `palm${x},${z}`, states: new Set() })) : []) },
  well: { name: 'the well', find: (g) => (inDunes(g) ? [{ pos: V(DUNE.x + (WELL.x0 + WELL.x1) / 2, DUNE.y + WELL.surface, DUNE.z + (WELL.z0 + WELL.z1) / 2), r: 4, ref: 'well', states: new Set() }] : []) },
  tally: { name: 'the tally', find: (g) => (inDunes(g) ? [{ pos: V(...TALLY_AT), r: 1.6, ref: 'tally', states: new Set() }] : []) },
  pond: { name: 'the oasis', find: (g) => (inDunes(g) ? [{ pos: V(DUNE.x + POND.x, DUNE.y + POND.surface, DUNE.z + POND.z), r: 9, ref: 'pond', states: new Set() }] : []) },
  water: { name: 'water', find: (g) => (g.water?.volumes || []).map((v, i) => ({ pos: V((v.x0 + v.x1) / 2, v.surface, (v.z0 + v.z1) / 2), r: Math.min(6, Math.max(v.x1 - v.x0, v.z1 - v.z0) / 2), ref: `water${i}`, states: new Set([v.kind || 'water']) })) },
};
export const SUBJECT_IDS = Object.keys(SUBJECTS);
