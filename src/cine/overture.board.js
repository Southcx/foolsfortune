// ---------------------------------------------------------------------------------------
// THE OVERTURE'S BOARD: the storyboard (docs/boards/OVERTURE.md) as data for the trailer's director (cine/overture.js), a camera shot
// at a time. Times are seconds from the
// overture's first note (E minor, 150 bpm: a bar 1.6 s); each camera shot's camera is the segment of the same id in cine/sequences.js
// ('overture'), keyed to its PLACE (`here`, facing its yaw) or to the Courier (`courier`).
//
//   { t, id, place, hold: [keys], enter(api, at), frame(api, u, s), tint }
//     place   a PLACES name (where the Courier is put and what the camera is keyed to; `put: false` keys without moving them)
//     hold    keys held from its start to its end (the real controls: the moves are the moves, not a pose)
//     enter   once as it begins; frame each frame after, with u (0..1 through it) and s (its seconds); `api` is its own
//             (what it keeps on it is gone at the next), `api.after(fn)` undoes a thing as the next begins, `api.keep(o)` at the trailer's end
//
// Places are found in the world, never written as coordinates here: the course's rooms, the kiln, the folk, the Dunes, the Weir, the
// Well, the Siege (the facts from main.js, world/, npc/, tools/).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { oddsOf, rates as wheelRates, spin as wheelSpin } from '../tools/lockheart/table.js';

export const OVERTURE_TITLE = 'Fortune Favours the Fool';
export const BAR = 1.6;
export const HANDOVER = 70.4;  // ASCEND: the title's own scene from here (the precipice)
export const ROAR = 79.2;      // the title's kiln intro (the roar rising): the logo comes up in raw clay
export const STRIKE = 81.6;    // THE STRIKE: gold in one frame
export const END = 84.0;       // the music box: the title is the title

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const room = (i) => (g) => { const cp = g.course.cps.find((c) => c.room === i) || g.course.cps[i]; return cp && { pos: cp.v.clone(), yaw: cp.yaw }; };
const near = (fn, d = 2.2, side = 0) => (g) => { const n = fn(g); if (!n) return null; const f = V(Math.sin(n.yaw), 0, Math.cos(n.yaw)); return { pos: n.pos.clone().addScaledVector(f, d).add(V(f.z * side, 0, -f.x * side)), yaw: n.yaw + Math.PI }; };
const folk = (id) => (g) => { const n = g.folk?.byId?.[id]; return n && { pos: n.pos.clone(), yaw: n.yaw }; };

/** Named spots in the world, each { pos, yaw }. */
export const PLACES = {
  kilnMouth: () => ({ pos: V(-2.6, 0, 9.4), yaw: Math.PI / 2 }),                         // (the workshop: the kiln's glowing mouth at 0,0,10.5, facing -Z)
  kilnFront: () => ({ pos: V(0, 0, 8.9), yaw: Math.PI }),                                // (the kiln's own dressing spot: courier/moves/kiln.js)
  saggar: near(folk('saggar'), 2.0, 0.6),
  pip: near(folk('pip'), 1.8, -0.7),
  wallrun: room(4), slide: room(1), mantle: room(2), zigzag: room(5),
  hub: (g) => ({ pos: g.course.hubSpawn.v.clone(), yaw: g.course.hubSpawn.yaw }),
  hubFar: (g) => ({ pos: g.course.hubSpawn.v.clone().add(V(0, 0, 14)), yaw: Math.PI }),
  crystals: (g) => { const c = g.crystals?.list?.[0]; if (!c) return null; const d = g.dunes.spawnPoint(); const yaw = Math.atan2(c.ground.x - d.x, c.ground.z - d.z); const p = c.ground.clone().addScaledVector(V(Math.sin(yaw), 0, Math.cos(yaw)), -(c.r + 3)); p.y = g.dunes.heightAt(p.x, p.z); return { pos: p, yaw }; },
  shore: (g) => ({ pos: g.dunes.spawnPoint(), yaw: 0 }),
  pier: (g) => ({ pos: g.course.weirSpawn.v.clone().add(V(3, 0, 6)), yaw: 0 }),
  well: (g) => { const W = g.weir?.pools?.find((p) => p.id === 'well'); return W ? { pos: V((W.x0 + W.x1) / 2, W.surface + 2.2, (W.z0 + W.z1) / 2), yaw: 0 } : null; },
  siege: (g) => ({ pos: g.course.siegeSpawn.v.clone(), yaw: g.course.siegeSpawn.yaw }),
};

const jellyAhead = (api, d = 3.2, side = 0) => { const g = api.game, P = g.player, f = V(Math.sin(P.yaw), 0, Math.cos(P.yaw)); const p = P.pos.clone().addScaledVector(f, d).add(V(f.z * side, 0, -f.x * side)); const c = g.jellies.spawn(p, { yaw: P.yaw + Math.PI }); api.after(() => { g.jellies.vanish(c, 'environment', 'overture'); g.jellies.dispose(c); }); return c; }; // (gone for good as the next begins: the next bar's jelly is the only one)
const draw = (api, id) => { const g = api.game, t = g.techs.get(id); const b = g.belt?.get(id); if (!t || !b) return; if (!g.belt.isWorn(id)) { g.belt.wear?.(id); api.keep({ dispose: () => g.belt.takeOff?.(id) }); } if (id === 'psygun') { g.weapon.drawTarget = 1; g.weapon.manualHolster = false; } else t.drawTarget = 1; g.belt.draw(b); };
const fxAt = (api, name, p, o = {}) => api.game.vfx?.play(name, { pos: p, cine: true, ...o });
const hand = (g) => g.player.renderPos.clone().add(V(0, 1.1, 0)).addScaledVector(V(Math.sin(g.player.yaw), 0, Math.cos(g.player.yaw)), 0.4);
const mood = (api, m) => (m ? api.game.mood.set('overture', { ease: 12, tintK: 0.6, ...m }) : api.game.mood.free('overture'));
const TYPE_TINT = { impact: 0xf2ddb0, ego: 0x2f5fd0, influence: 0xf08aa8, illusion: 0x6a5acd, delirium: 0x6a3a90 };
const typeBar = (type, status) => ({
  enter(api) { mood(api, { dim: 0.35, tint: TYPE_TINT[type], tintK: 0.35 }); const c = jellyAhead(api); api.jelly = c; },
  frame(api, u) {
    const g = api.game, c = api.jelly;
    if (!c?.alive) return;
    if (u > 0.25 && !api.hit) { api.hit = true; const p = c.pos.clone().add(V(0, (c.height || 1) * 0.5, 0)); g.vfx?.hit?.({ ent: c, pos: p, type, cine: true }); fxAt(api, `damage.${type}`, p, { scale: 1.3 }); if (status) g.creatures.apply(c, status, 6, 1, 'environment'); }
  },
});

// THE SOLO: the Lockheart's Opening staged, not played: its own sequence (cine/sequences.js 'lockheart.opening') stepped on the
// music, its wheel spun to nothing (no keys used, no outcome: the trailer gives nothing away), the music never ducked
const solo = (api) => {
  const g = api.game, O = g.overture;
  if (O.solo && !O.solo.stopped) return O.solo;
  const P = g.player, yaw = P.yaw, at = P.pos.clone(), f = V(Math.sin(yaw), 0, Math.cos(yaw));
  const coffin = at.clone().addScaledVector(f, 0.36).add(V(0, 1.5, 0)), wheel = at.clone().addScaledVector(f, 1.2).add(V(0, 6.2, 0));
  O.soloAt = { at, coffin, wheel, yaw };
  O.solo = g.cine.play('lockheart.opening', { yaw, id: 'overture.solo', anchors: { courier: () => at, coffin: () => coffin, wheel: () => wheel } });
  api.keep({ dispose: () => endSolo(api) });
  return O.solo;
};
const endSolo = (api) => { const O = api.game.overture; O.solo?.stop(); O.solo = null; api.game.cinema?.cut('overture.solo'); };
const spinWheel = (api) => {
  const g = api.game, W = g.techs.get('lockheart')?.wheel, S = g.overture.soloAt;
  if (!W || !S || W.busy) return;
  const { table } = oddsOf('heart.plain', ['key.brass']);
  const cam = S.at.clone().add(V(-Math.sin(S.yaw) * 2.4, 0.6, -Math.cos(S.yaw) * 2.4));
  const face = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam, S.wheel, V(0, 1, 0)));
  try { W.spin(wheelRates(table), wheelSpin(table), S.wheel, face, () => {}, 4.2); } catch (e) { console.error(e); }
};

/** The board, a camera shot at a time. */
export const BOARD = [
  // ---- FUSE: black; the mend's gold cracks across the mask
  { t: 0.0, id: 'fuse', place: 'kilnFront', enter(api) { mood(api, { dim: 0.97, tint: 0x000000, tintK: 1 }); }, frame(api, u, s) { if (s > 0.05 && !api.cracked) { api.cracked = true; const h = api.game.player.renderPos.clone().add(V(0, 1.5, 0)); fxAt(api, 'overture.crack', h, { from: h.clone().add(V(-0.25, 0.12, 0.3)), to: h.clone().add(V(0.25, -0.1, 0.3)) }); } } },
  { t: 1.6, id: 'fuseHit', place: 'kilnFront', put: false, enter(api) { mood(api, { dim: 0.85, tint: 0x2a1408, tintK: 0.8 }); fxAt(api, 'overture.crack', api.game.player.renderPos.clone().add(V(0, 1.5, 0.3)), { from: api.game.player.renderPos.clone().add(V(-0.3, 1.7, 0.3)), to: api.game.player.renderPos.clone().add(V(0.3, 1.3, 0.3)) }); } },
  { t: 2.4, id: 'fill', place: 'kilnFront', put: false },
  // ---- RIFF: the core movement in four cuts
  { t: 3.2, id: 'wallrun', place: 'wallrun', hold: ['KeyW', 'ShiftLeft'], enter(api) { mood(api, null); }, frame(api, u, s) { if (s > 0.25 && !api.j1) { api.j1 = true; api.press('Space'); } } },
  { t: 4.8, id: 'slide', place: 'slide', hold: ['KeyW', 'ShiftLeft'], frame(api, u, s) { if (s > 0.45) api.hold('KeyC'); } },
  { t: 6.4, id: 'dash', place: 'slide', hold: ['KeyW'], frame(api, u, s) { if (s > 0.1 && !api.j1) { api.j1 = true; api.press('Space'); } if (s > 0.35 && !api.d1) { api.d1 = true; api.press('ShiftLeft'); } } },
  { t: 8.0, id: 'mantle', place: 'mantle', hold: ['KeyW'], frame(api, u, s) { if (s > 0.15 && !api.j1) { api.j1 = true; api.press('Space'); } if (s > 1.15) api.let('KeyW'); } },
  // ---- VERSE: the island, a place a bar, travelling left to right
  { t: 9.6, id: 'kiln', place: 'kilnMouth', hold: ['KeyW'] },
  { t: 11.2, id: 'saggar', place: 'saggar', enter(api) { const g = api.game, n = g.folk?.byId?.saggar; if (n) { g.folk.setMood?.(n, 'happy', 1); g.glyphs?.pop('bang1', g.folk.head(n, V()).add(V(0, 0.32 * n.scale, 0)), { burst: true }); } } },
  { t: 12.8, id: 'folk', place: 'pip', enter(api) { const g = api.game, n = g.folk?.byId?.pip; g.techs.get('emote')?.request?.('wave'); if (n) { g.folk.setMood?.(n, 'happy', 1); g.glyphs?.pop('note', g.folk.head(n, V()).add(V(0, 0.32 * n.scale, 0))); } } },
  { t: 14.4, id: 'dunes', place: 'crystals', hold: ['KeyW'] },
  { t: 16.0, id: 'skiff', place: 'shore', enter(api) { const sk = api.game.techs.get('skiff'); sk?.mount?.(); api.after(() => { sk?.stow?.(); api.game.techs?.reset?.(); }); }, frame(api, u, s) { if (s > 0.3) api.hold('KeyW'); } },
  { t: 17.6, id: 'weir', place: 'pier', frame(api, u, s) { const g = api.game; if (s > 0.6 && !api.fish && g.weir?.fish?.length) { api.fish = true; const f = g.weir.fish.find((x) => x.sp) || g.weir.fish[0]; g.portrait?.show?.(f, 0xffd76a); api.after(() => g.portrait?.hide?.(true)); } if (s > 1.4 && api.fish && !api.fishOff) { api.fishOff = true; g.portrait?.hide?.(); } } },
  { t: 19.2, id: 'basement', place: 'zigzag', hold: ['KeyW'], enter(api) { mood(api, { dim: 0.55, tint: 0x1a0c06, tintK: 0.4 }); } },
  { t: 20.8, id: 'dive', place: 'well', enter(api) { mood(api, null); } },
  // ---- CLIMB: the six tools drawn, one a half bar, the Mind's ring round them, faster to the snare roll
  { t: 22.4, id: 'climb', place: 'hub', enter(api) { mood(api, { dim: 0.8, tint: 0x120a26, tintK: 0.8 }); },
    frame(api, u, s) {
      const g = api.game, order = ['veritome', 'dreamvane', 'crucibelle', 'sondelass', 'soulbrush', 'psygun'];
      const k = Math.floor(s / 0.8);
      if (k < order.length && api.drawn !== k) { api.drawn = k; draw(api, order[k]); fxAt(api, 'overture.draw', hand(g)); }
      if (s > 4.8 && !api.ring) { api.ring = fxAt(api, 'overture.ring', g.player.renderPos.clone().add(V(0, 0.9, 0)), { scale: 1 }); if (api.ring) api.after(() => api.ring.stop?.()); }
      if (api.ring) api.ring.k = 0.5 + Math.min(1, (s - 4.8) / 1.6);
    } },
  // ---- CHORUS: one damage type a bar, then the spectacle
  { t: 28.8, id: 'impact', place: 'crystals', ...typeBar('impact'), tint: TYPE_TINT.impact, enter(api) { slam(api); typeBar('impact').enter(api); } }, // (the verse drops into the wall: the cut, then the tear)
  { t: 30.4, id: 'ego', place: 'crystals', ...typeBar('ego', 'doubt') },
  { t: 32.0, id: 'influence', place: 'crystals', ...typeBar('influence', 'charm') },
  { t: 33.6, id: 'illusion', place: 'crystals', ...typeBar('illusion', 'blind'), enter(api) { typeBar('illusion').enter(api); api.game.flash?.fire?.(); } },
  { t: 35.2, id: 'delirium', place: 'crystals', ...typeBar('delirium', 'confusion'), frame(api, u) { typeBar('delirium', 'confusion').frame(api, u); if (u > 0.25 && api.jelly?.alive) api.game.jellies.burst?.(api.jelly, V(0, 1, 0), 'environment', 'overture'); } },
  { t: 36.8, id: 'cut', place: 'crystals', enter(api) { mood(api, null); draw(api, 'sondelass'); },
    frame(api, u, s) {
      const g = api.game;
      if (s > 0.5 && !api.cut) {
        api.cut = true;
        const P = g.player, f = V(Math.sin(P.yaw), 0, Math.cos(P.yaw)), at = P.pos.clone().addScaledVector(f, 1.4).add(V(0, 1.0, 0));
        fxAt(api, 'cut', at, { from: at.clone().add(V(-0.7, 0.5, 0)), to: at.clone().add(V(0.7, -0.5, 0)), dir: f });
        g.time?.pulse?.('overture', 0.05, 0.12);
      }
    } },
  { t: 38.4, id: 'psygun', place: 'crystals', frame(api, u, s) { const g = api.game; if (s > 0.2 && !api.lob) { api.lob = true; const P = g.player, f = V(Math.sin(P.yaw), 0, Math.cos(P.yaw)); const at = P.pos.clone().addScaledVector(f, 5); g.shells?.explodeBomb?.(at.add(V(0, 0.2, 0)), V(0, 1, 0)); } } },
  { t: 40.0, id: 'lineup', place: 'crystals', enter(api) { const g = api.game; api.ring = fxAt(api, 'overture.ring', g.player.renderPos.clone().add(V(0, 0.9, 0))); if (api.ring) api.after(() => api.ring.stop?.()); } },
  // ---- SOLO: the Lockheart's Opening, its own sequence (it holds the camera); the dive scream drops into the deep
  { t: 41.6, id: 'solo', place: 'shore', enter(api) { mood(api, null); solo(api).go('invoke'); } },
  { t: 43.2, id: 'key1', place: 'shore', put: false, enter(api) { solo(api).go('key', { i: 0, tint: 0xffd76a }); } },
  { t: 43.8, id: 'key2', place: 'shore', put: false, enter(api) { solo(api).go('key', { i: 1, tint: 0xf08aa8 }); } },
  { t: 44.4, id: 'key3', place: 'shore', put: false, enter(api) { solo(api).go('key', { i: 2, tint: 0x8ad0ff }); } },
  { t: 45.0, id: 'key4', place: 'shore', put: false, enter(api) { solo(api).go('key', { i: 3, tint: 0xffffff }); } },
  { t: 45.6, id: 'ascend', place: 'shore', put: false, enter(api) { solo(api).go('ascend'); } },
  { t: 46.4, id: 'wheel', place: 'shore', put: false, enter(api) { solo(api).go('wheel'); spinWheel(api); } },  // (the tapped sextuplets)
  { t: 48.0, id: 'land', place: 'shore', put: false, enter(api) { solo(api).go('land'); } },                     // (the twin leads: the pillar)
  { t: 52.8, id: 'deep', place: 'shore', put: false, enter(api) { endSolo(api); smear(api, { amt: 0.7, zoom: 0.012, spin: 0.004 }); api.game.glitch?.pulse({ mosh: 0.5, split: 0.4, dur: 1.4 }); } }, // (the dive scream: down past the island, smeared and moshed)
  // ---- BREAK: stop time; each hit a still
  { t: 54.4, id: 'still1', place: 'mantle', enter(api) { api.game.ultimate?.abort?.(); }, frame(api, u, s) { if (s > 0.1 && !api.p) { api.p = true; api.still(); } } },
  { t: 54.7, id: 'still2', place: 'saggar', frame(api, u, s) { if (s > 0.1 && !api.p) { api.p = true; api.still(); } } },
  { t: 55.2, id: 'still3', place: 'crystals', frame(api, u, s) { if (s > 0.1 && !api.p) { api.p = true; api.still(); } } },
  { t: 55.6, id: 'still4', place: 'pier', frame(api, u, s) { if (s > 0.1 && !api.p) { api.p = true; api.still(); } } },
  { t: 56.0, id: 'riffle', place: 'pier', put: false, frame(api, u) { api.riffle(u); } },
  // ---- CHORUS 2: everything
  { t: 57.6, id: 'siege', place: 'siege', enter(api) { api.clearStills(); slam(api); } }, // (chorus 2: everything, and the wall again)
  { t: 59.2, id: 'god', place: 'siege', put: false, enter(api) { const g = api.game; g.god?.enter?.(); api.after(() => g.god?.forceOff?.()); }, frame(api, u, s) { if (s > 0.6 && !api.raid) { api.raid = true; api.game.god?.raids?.spawn?.(); } } },
  { t: 60.8, id: 'bell', place: 'hub', enter(api) { draw(api, 'crucibelle'); }, frame(api, u, s) { if (s > 0.6 && !api.tolled) { api.tolled = true; api.game.techs.get('crucibelle')?.toll?.(); } } },
  { t: 62.4, id: 'chest', place: 'hub',
    enter(api) { const g = api.game, P = g.player, f = V(Math.sin(P.yaw), 0, Math.cos(P.yaw)); const c = g.chests.spawn(4, P.pos.clone().addScaledVector(f, 2.2), { yaw: P.yaw + Math.PI }); api.chest = c; api.after(() => g.chests.remove(c, false)); },
    frame(api, u) {
      const g = api.game, c = api.chest; if (!c) return;
      c.rig.busy = true; c.rig.setGlaze(Math.min(4, u * 7)); c.rig.setGlow(Math.min(1, u * 2));
      if (u > 0.55 && !api.opened) { api.opened = true; c.rig.setOpen(true); c.rig.poke({ lid: 24, squash: 18, hop: 6 }); const top = c.rig.root.position.clone().add(V(0, 0.9, 0)); g.cubes?.burst?.(top, 40, { count: 30, up: 7, spread: 1.6, from: 'chest' }); g.chests.ringBurst?.(top, 0xffffff, 5, 0.6, true); }
    } },
  { t: 64.0, id: 'refire', place: 'kilnFront', enter(api) { const g = api.game; g.vessel?.preview?.({ ...g.vessel.look, body: 'yohen', mask: 'yohen', trim: 'kinrande' }); api.after(() => g.vessel?.revert?.()); } },
  { t: 65.6, id: 'spire', place: 'shore', enter(api) { draw(api, 'dreamvane'); } },
  { t: 67.2, id: 'suits', place: 'saggar', enter(api) { api.game.techs.get('emote')?.request?.('dance'); }, frame(api, u) { const C = [0x2e7d4f, 0xc8402a, 0x3a5fc8, 0xd8c8a8], b = Math.floor(u * 4); mood(api, { dim: 0.3, tint: C[Math.floor(u * 8) % 4], tintK: 0.5, ease: 30 }); if (api.beat !== b) { api.beat = b; api.game.glitch?.pulse({ split: 0.55, dur: 0.3 }); } } }, // (glam theatre: the stage lights' colours, a chromatic hit on each beat)
  { t: 68.8, id: 'run', place: 'slide', hold: ['KeyW', 'ShiftLeft'], enter(api) { mood(api, null); } },
];

// THE GLAM THEATRE (the owner, 2026-10-06: the playlist's soft verses dropping into walls, silence used as a hit, .hack's glitch): at the
// music's drops the picture cuts to a dark beat and slams back torn (vfx/glitch.js), and the dive is smeared by the frame accumulation.
function slam(api) { api.game.glitch?.moment({ drop: 1, beats: 2, then: { split: 0.85, tear: 0.7, mosh: 0.25, crush: 0.6, dur: 0.75 } }); }
function smear(api, a) { const A = api.game.post?.accum; if (!A) return; Object.assign(A, a); api.after(() => { A.amt = 0; }); }
