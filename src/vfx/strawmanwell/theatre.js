// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE THEATRE'S FRAME: the stage of Pip's toy theatre over every lane of the Well (a part of the Well's look,
// vfx/strawmanwell/look.js), dressing the placeholder colours it owns (Dovina's, world/strawmanwell/stagekit.js COLOR: `boards`, `wing`,
// `door`, `mark`) and adding what a theatre has that a placeholder lacks. Each piece is a module of theatre/:
//   the boards      the planks and Pip's chalk, the apron and its footlights (theatre/boards.js)
//   the wing flats  a stage's ends as staggered flats in a groove, the Run's wall-run flat painted as sky, the fly beam, the Brawl's
//                   blast lines in tape (theatre/wingflats.js)
//   overhead        the borders (velvet, the tape measure, ribbon), the fly lines and sandbags, all above the lane's clear line: the top
//                   of its camera band plus THEATRE_LOOK.clear, so nothing hung ever covers play (theatre/overhead.js)
//   the doors       stage doors, the tall shutters that slide up (riding her meshes), the goal pennants (theatre/doors.js)
//   backstage       the wings: Strawman's spot, the ghost light, the fly rail (theatre/backstage.js)
// and the kit's lamps warmed to the footlights' amber (tinted only: never a lamp added, CLAUDE.md, the light budget).
// DRAWS: two a lane (the solid stock, the light), and one more for each shutter and pennant (they ride what Dovina's mechanics move).
// PROGRAMS: two materials for the whole Well, shared by every lane: the solid stock (a vertex-coloured standard material mapped on the
// kit's atlas, the paint map's patch kept, so paint still shows on the boards) and the light (additive, the kit's glow).
// A placeholder this part draws again is hidden (its collider stays: a look never moves a surface); one that moves keeps moving, its
// own draw put out and the dressing a child of it.
//
// Prior art: Pollock's Toy Theatres (the printed proscenium, the wings in grooves, the borders, the footlights), the Sandbox hall's
// dressing of a placeholder room by its colours (vfx/sandbox/hall.js), Hercules (PS1)'s warm, footlit first stage.
//
//   dressTheatre(ctx) -> { update(dt), dispose() }   (ctx: look.js)   THEATRE_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sheet, atlasTexture, glowTexture } from './theatre/kit.js';
import { dressBoards } from './theatre/boards.js';
import { dressWingFlats } from './theatre/wingflats.js';
import { dressOverhead } from './theatre/overhead.js';
import { dressDoors, seen } from './theatre/doors.js';
import { dressBackstage } from './theatre/backstage.js';
import { WINGS } from '../../world/strawmanwell/layout.js';

/** The clear line over a stage (m above the top of its camera band) and over the wings (m above the floor: the wings' camera never
 *  climbs, so its borders come lower), the wings' gap over centre stage (lane m), the lamps' amber, the light's breath. */
export const THEATRE_LOOK = { clear: 3.0, wingsClear: 6.2, wingsGap: [16.5, 24.5], lamp: 0xffd0a0, breath: 0.02 };

const isMerged = (m) => m.isMesh && !m.userData.isOutline && m.geometry && !m.geometry.index && m.geometry.attributes.position?.count % 36 === 0;
const colorOf = (m) => (m.material && !Array.isArray(m.material) && m.material.color ? m.material.color.getHex() : null);
/** Is a thing still in the scene (a room torn down first has let its hulls go: they are never given back to it)? */
const live = (o) => { while (o.parent) o = o.parent; return !!o.isScene; };
/** An oriented box (boxes.js) as the world box round it. */
function aabbOf(bx) {
  const e = (k) => (Math.abs(bx.ax[k]) * bx.w + Math.abs(bx.ay[k]) * bx.h + Math.abs(bx.az[k]) * bx.d) / 2;
  return { x0: bx.c.x - e('x'), x1: bx.c.x + e('x'), y0: bx.c.y - e('y'), y1: bx.c.y + e('y'), z0: bx.c.z - e('z'), z1: bx.c.z + e('z') };
}

/** What the builders know of a lane: its numbers, its boxes by colour (world boxes), what stands where, its clear line, its spike
 *  marks, and the two sheets they draw into. */
function laneOf(ctx, id) {
  const L = ctx.lanes[id], A = ctx.at, C = ctx.color, gr = ctx.boxes.laneGroup(id); if (!gr) return null;
  const colours = new Set(Object.values(C)), merged = gr.children.filter((m) => isMerged(m) && colours.has(colorOf(m)));
  const byColour = new Map();
  for (const m of merged) { const k = colorOf(m); if (!byColour.has(k)) byColour.set(k, []); byColour.get(k).push(...ctx.boxes.boxesOf(m).map(aabbOf)); }
  const own = [];
  gr.traverse((m) => {
    if (!m.isMesh || m.userData.isOutline || m.geometry?.type !== 'BoxGeometry' || !colours.has(colorOf(m))) return;
    m.updateWorldMatrix(true, false); if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); own.push({ x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y, z0: b.min.z, z1: b.max.z });
  });
  const W = ctx.well, St = id === 'wings' ? null : W.stages?.[id];
  const spikes = id === 'wings' ? [...Object.values(W.wings?.doors || {}).map((D) => [D.x, 0]), [WINGS.strawman, 0]] : (St?.checks || []).map(([x, y]) => [x, y]);
  const lane = {
    id, L, k: L.k, len: L.len, z: L.z, X: (x) => A.x + x, Y: (y) => A.y + y, Z: (dz) => L.z + dz,
    boards: byColour.get(C.boards) || [], wing: byColour.get(C.wing) || [], marks: byColour.get(C.mark) || [],
    all: [...[...byColour.values()].flat(), ...own],
    doors: ctx.boxes.ownBoxes(id, C.door), flags: ctx.boxes.ownBoxes(id, C.mark),
    merged: merged.filter((m) => [C.boards, C.wing, C.mark].includes(colorOf(m))),
    clear: A.y + (id === 'wings' ? THEATRE_LOOK.wingsClear : L.band[1] + THEATRE_LOOK.clear),
    gap: id === 'wings' ? THEATRE_LOOK.wingsGap : null, spikes,
    solid: new Sheet(), glow: new Sheet(), hidden: [],
    hide: (m) => { if (m.visible) { ctx.boxes.hide(m); lane.hidden.push(m); } },
    occupied: (p, self) => lane.all.some((b) => b !== self && p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1 && p.z > b.z0 && p.z < b.z1),
    topAt: (x) => { let t = null; for (const b of lane.boards) if (x > b.x0 && x < b.x1 && (t == null || b.y1 > t)) t = b.y1; return t; },
  };
  return lane;
}

export function dressTheatre(ctx) {
  const g = ctx.game, P = ctx.palette, atlas = atlasTexture(P), glowTex = glowTexture();
  const solid = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.86, metalness: 0 });
  g.paintmap?.patch?.(solid);
  const light = new THREE.MeshBasicMaterial({ map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const made = [], riders = [], hidden = [], unseen = [], lamps = [];
  const put = (sheet, mat, id, name) => {
    if (sheet.empty) return;
    const m = new THREE.Mesh(sheet.geometry(), mat); m.name = name; m.userData.zone = 'strawmanwell';
    m.receiveShadow = mat === solid; m.castShadow = false; if (mat === light) m.renderOrder = 2;
    ctx.add(m, id); made.push(m);
  };
  for (const id of Object.keys(ctx.lanes)) {
    const lane = laneOf(ctx, id); if (!lane) continue;
    dressBoards(lane, P);
    dressWingFlats(lane, P);
    dressOverhead(lane, P);
    dressDoors(lane, P, solid, riders);
    if (id === 'wings') dressBackstage(lane, P, ctx);
    put(lane.solid, solid, id, `theatre.${id}`);
    put(lane.glow, light, id, `theatre.${id}.light`);
    for (const m of lane.merged) lane.hide(m);
    hidden.push(...lane.hidden);
    for (const { mesh } of lane.doors.concat(lane.flags)) if (mesh.material && mesh.material.visible === false) unseen.push(mesh);
  }
  for (const l of ctx.well.kit?.lamps || []) { lamps.push([l, l.color.getHex()]); l.color.setHex(THEATRE_LOOK.lamp); }
  let t = 0;
  return {
    update(dt) {
      t += dt;
      light.color.setScalar(1 + THEATRE_LOOK.breath * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1)) / 1.5);
      for (const r of riders) r.pivot.rotation.y = 0.2 * Math.sin(t * 2.2 + r.phase) + 0.07 * Math.sin(t * 5.3 + r.phase * 2);
    },
    dispose() {
      for (const m of made) { m.removeFromParent(); m.geometry?.dispose(); }
      for (const mesh of unseen) {
        for (const c of [...mesh.children]) if (c.name === 'theatre.shutter' || c.name === 'theatre.pennant') { c.removeFromParent(); c.traverse((o) => o.geometry?.dispose()); }
        if (live(mesh)) seen(mesh);
      }
      for (const m of hidden) m.visible = true;
      for (const [l, hex] of lamps) l.color.setHex(hex);
      atlas.dispose(); glowTex.dispose(); solid.dispose(); light.dispose();
      made.length = riders.length = hidden.length = unseen.length = lamps.length = 0;
    },
  };
}
