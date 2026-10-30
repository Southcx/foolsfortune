// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES, IN THE WORLD (progress/mimicry.js, the rules; docs/plans/MIMICRY.md): a puzzle stone in the Dunes, F at it, and
// the god hand opens over a 12 m patch of the island's real matter laid out beside it. In MIMIC the System works the patch step by step
// (each step held a beat, its mark on the ground), then puts it back: "Your turn." In MATCH and UNDO the target is only shown. The target
// stands over the patch as a ghost while you work; the patch is scored as you go, and a clean copy left alone a moment, or the hand put
// away, ends it. The puzzle's powers are lent and its toolkit fixed while it is open (`lends`, `tool`: progress/godpowers.js asks).
// The looks here are placeholders (a clay stone, a gold wire ghost, a readout tag): Calissa's to dress (`game.mimicryLooks` if built).
//
// Prior art: Islands of Insight's enclave stones (F at a stone, its puzzle laid out round it), Puzzle Pirates' duty stations, the house's
// Solar Skiffing trial (world/dunes/solar.js: begun at a thing in the world, its course laid on the Dunes' own ground).
//
//   game.mimicry = new Mimicry(game)   (boot/rooms.js)   .update(dt) (boot/frame.js)   .active   .lends(power) -> bool   .tool(power, key)
//   events: mimic.open { puzzle, mode, site }   mimic.turn { puzzle }   mimic.solve { puzzle, label, mode, tier, match, stars, strokes,
//   par, made, powers, domains, first, day }   mimic.leave { puzzle, match }   (each with by: 'courier'; tracking/mimicry.js books them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MIMIC, MIMIC_SITES, MIMIC_LADDER, MIMIC_PUZZLES, MIMIC_TOOL, mimicOpen, framesOn, dayPuzzle, lay, snap, restore, matchOf, gradeOf, siteAt, siteOf, eachCell } from '../../progress/mimicry.js';
import { DUNES_AREAS } from '../../progress/areas.js';
import { today } from '../../core/calendar.js';
import { DUNE } from '../dunes/dunes.js';
import { ECON } from '../../progress/econ/table.js';
import { ARTS } from '../../godhand/arts.js';

const STROKES = { 'god.shape': 'shape', 'god.carve': 'carve', 'god.scoop': 'scoop', 'god.pour': 'scoop', 'god.transmute': 'transmute', 'god.fold': 'fold', 'god.stamp': 'stamp', 'god.slab': 'slab' };
const TICK = 0.5, IDLE = 2; // (real seconds between scorings; a clean copy left alone this long is finished)

export class Mimicry {
  constructor(game) {
    this.game = game; this.S = null;
    this.stones = MIMIC_SITES.map((site) => this.stone(site));
    this.dress();
    game.interact?.add('mimicry', () => this.offer());
    for (const ev of Object.keys(STROKES)) game.events?.on?.(ev, (e) => this.stroke(ev, e));
  }
  get active() { return !!this.S; }
  /** A power the open puzzle lends (only its own, only while it is open). */
  lends(power) { return !!this.S && this.S.P.powers.includes(power); }
  /** The puzzle's fixed toolkit number for a power (null: the ramp's own). */
  tool(power, key) { return this.S && this.S.P.powers.includes(power) ? (MIMIC_TOOL[power]?.[key] ?? null) : null; }

  /** A stone, as placed by its site: where it stands, and its patch beside it. */
  stone(site) {
    const g = this.game, p = siteAt(site, DUNE), y = g.dunes?.heightAt?.(p.x, p.z) ?? DUNE.y;
    const out = p.out, c = { x: p.x + out.x * (MIMIC.half + 3), z: p.z + out.z * (MIMIC.half + 3) }; // (the patch beside it, away from the oasis)
    return { site, pos: new THREE.Vector3(p.x, y, p.z), patch: { x: c.x, z: c.z, y: g.dunes?.heightAt?.(c.x, c.z) ?? y } };
  }
  /** The stones drawn (a placeholder: a clay standing stone with a gold band each), every stone's body one mesh and every band another,
   *  so all of them cost two draws wherever they stand in view (the gate, 2026-10-30: eight meshes and eight materials before). */
  dress() {
    const bodies = [], bands = [];
    for (const { pos } of this.stones) {
      bodies.push(new THREE.CylinderGeometry(0.35, 0.5, 1.8, 7).translate(pos.x, pos.y + 0.9, pos.z));
      bands.push(new THREE.TorusGeometry(0.44, 0.05, 6, 20).rotateX(Math.PI / 2).translate(pos.x, pos.y + 1.35, pos.z));
    }
    const group = (this.group = new THREE.Group()); group.name = 'mimicry-stones'; group.userData.zone = 'dunes';
    group.add(new THREE.Mesh(mergeGeometries(bodies), new THREE.MeshStandardMaterial({ color: 0x9a6a4a, roughness: 0.85 })));
    group.add(new THREE.Mesh(mergeGeometries(bands), new THREE.MeshStandardMaterial({ color: 0xffd36a, emissive: 0x6a4a10, roughness: 0.4 })));
    for (const q of [...bodies, ...bands]) q.dispose();
    this.game.scene?.add(group);
  }

  offer() {
    const g = this.game, P = g.player; if (this.S || g.god?.controlling || !g.dunes?.active) return null;
    let best = null;
    for (const st of this.stones) { const d = Math.hypot(P.pos.x - st.pos.x, P.pos.z - st.pos.z); if (d < 2.6 && (!best || d < best.d)) best = { pos: st.pos.clone().setY(st.pos.y + 2.2), d, ref: `mimic.${st.site.id}` }; }
    return best;
  }
  /** Which puzzle a stone sets: its own rungs first (the lowest open and unsolved), then the game day's (the Weir's stone). */
  pick(st) {
    const L = this.game.ledger, g = this.game;
    for (const id of st.site.rungs || []) if (mimicOpen(id, L, g) && !((L?.get?.(`god.mimic.solved.${id}`) || 0) > 0)) return MIMIC_PUZZLES[id];
    if (st.site.day) return dayPuzzle(today());
    const open = (st.site.rungs || []).filter((id) => mimicOpen(id, L, g)); // (all solved: the one with the fewest stars again)
    return open.length ? MIMIC_PUZZLES[open.reduce((a, b) => ((L?.best?.(`god.mimic.stars.${a}`) || 0) <= (L?.best?.(`god.mimic.stars.${b}`) || 0) ? a : b))] : null;
  }

  start(st) {
    const g = this.game, P = this.pick(st);
    if (!P) { // (its rungs wait on the ladder: name the stone where the next open one is)
      const next = MIMIC_LADDER.find((id) => mimicOpen(id, g.ledger, g) && !((g.ledger?.get?.(`god.mimic.solved.${id}`) || 0) > 0)), at = next && siteOf(next);
      g.log?.say('warn', at ? `The stone is quiet. Begin at the puzzle stone in ${DUNES_AREAS[at.area]?.name ?? 'the Dunes'}.` : 'The stone is quiet.', { key: 'mimic.locked', throttle: 3 }); return;
    }
    const at = st.patch, F = g.matter?.ensure?.(new THREE.Vector3(at.x, at.y, at.z));
    if (!F) return;
    const fr = framesOn(F, P, at); // (made on a copy of the island's own field: its grid and its slope)
    restore(F, at, fr.start);
    if (!g.god?.controlling) g.god?.toggle?.();
    if (!g.god?.controlling) { g.log?.say('warn', 'You need solid ground to take the hand.', { key: 'mimic.ground', throttle: 3 }); return; }
    g.god.cam?.focus?.set(at.x, at.y, at.z); // (the view on the patch, not on the Courier beside the stone)
    const first = ARTS.findIndex((a) => a.id === P.powers[0]); if (first >= 0) g.god.arts?.select?.(first); // (the puzzle's first power in hand)
    this.S = { P, st, at, F, fr, t: 0, tick: 0, idle: 0, strokes: 0, made: 0, match: 0, demo: P.mode === 'mimic' ? { i: 0, t: MIMIC.replay } : null };
    this.ghost(fr.target, F, at);
    g.events?.emit('mimic.open', { puzzle: P.id, label: P.label, line: P.line, mode: P.mode, site: st.site.id, powers: P.powers, by: 'courier' });
  }

  /** The target over the patch as a gold wire net at its ground's height (a placeholder for Calissa's ghost). */
  ghost(T, F, at) {
    this.clearGhost();
    const m = T.m, pts = [], c = MIMIC.cell, x0 = at.x - MIMIC.half, z0 = at.z - MIMIC.half;
    const h = (i, j) => { const o = Math.min(m - 1, j) * m + Math.min(m - 1, i), k = F.cellAt(x0 + (i + 0.5) * c, z0 + (j + 0.5) * c); return (k >= 0 ? F.base[k] : at.y) + T.firm[o] + T.loose[o] + T.w[o] + 0.05; };
    for (let j = 0; j < m; j += 2) for (let i = 0; i < m - 2; i += 2) pts.push(x0 + (i + 0.5) * c, h(i, j), z0 + (j + 0.5) * c, x0 + (i + 2.5) * c, h(i + 2, j), z0 + (j + 0.5) * c);
    for (let i = 0; i < m; i += 2) for (let j = 0; j < m - 2; j += 2) pts.push(x0 + (i + 0.5) * c, h(i, j), z0 + (j + 0.5) * c, x0 + (i + 0.5) * c, h(i, j + 2), z0 + (j + 2.5) * c);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.wire = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55, depthWrite: false }));
    this.wire.userData.zone = 'dunes'; this.game.scene?.add(this.wire);
  }
  clearGhost() { if (this.wire) { this.game.scene?.remove(this.wire); this.wire.geometry.dispose(); this.wire.material.dispose(); this.wire = null; } }

  stroke(ev, e) {
    const S = this.S; if (!S || S.demo || e?.by !== 'courier' || e?.repeat) return;
    if (!S.P.powers.includes(STROKES[ev]) && !(STROKES[ev] === 'shape' || STROKES[ev] === 'scoop')) return; // (the first rungs' verbs always count: a stray stroke is a stroke)
    S.strokes++; S.made += e.made || 0; S.idle = 0;
  }

  update(dt) {
    const g = this.game, it = g.interact?.cur, PL = g.player;
    if (!this.S && it?.id === 'mimicry' && PL?.peekLatch?.('KeyF')) { PL.latch('KeyF'); const st = this.stones.find((s) => `mimic.${s.site.id}` === it.ref); if (st) this.start(st); }
    const S = this.S; if (!S) return;
    const raw = g.rawDt ?? dt; S.t += raw;
    eachCell(S.F, S.at, (k) => { S.F.kept[k] = 1; }); // (the mending passes the patch by while the puzzle is open: godhand/matter.js kept)
    if (S.demo) { // (the System's own steps, one a beat, then the patch put back)
      if ((S.demo.t -= raw) > 0) return;
      if (S.demo.i < S.P.steps.length) { lay(S.F, [S.P.steps[S.demo.i]], S.at); g.events?.emit('mimic.step', { puzzle: S.P.id, i: S.demo.i, op: S.P.steps[S.demo.i].op, by: 'courier' }); S.demo.i++; S.demo.t = MIMIC.replay; return; }
      restore(S.F, S.at, S.fr.start); S.demo = null; g.events?.emit('mimic.turn', { puzzle: S.P.id, by: 'courier' }); return;
    }
    if (!g.god?.controlling) { this.finish(true); return; } // (the hand put away: judged as it stands)
    S.idle += raw;
    if ((S.tick -= raw) > 0) return;
    S.tick = TICK; S.match = matchOf(snap(S.F, S.at), S.fr.target, S.fr.start);
    if (S.match >= MIMIC.clean && S.idle >= IDLE) this.finish(false);
  }

  finish(left) {
    const g = this.game, S = this.S; if (!S) return;
    this.S = null; this.clearGhost();
    const G = gradeOf({ match: S.match, strokes: S.strokes, par: S.P.par, made: S.made, allow: S.fr.made });
    if (!G.solved) { g.events?.emit('mimic.leave', { puzzle: S.P.id, match: G.match, by: 'courier' }); return; }
    const L = g.ledger, first = !((L?.get?.(`god.mimic.solved.${S.P.id}`) || 0) > 0), day = S.P.id === 'day' ? today() : null;
    g.events?.emit('mimic.solve', { puzzle: S.P.id, label: S.P.label, mode: S.P.mode, tier: S.P.tier, match: G.match, stars: G.stars, strokes: S.strokes, par: S.P.par, made: +S.made.toFixed(2), powers: S.P.powers, domains: S.P.domains, first, day, by: 'courier' });
    const pay = first && day == null ? MIMIC.pay[S.P.tier] : day != null && (L?.best?.(`god.mimic.paid.${day}`) || 0) < 1 ? MIMIC.pay.day : 0; // (a puzzle's first solve; the game day's once that game day)
    if (pay > 0) { if (day != null) L?.hi?.(`god.mimic.paid.${day}`, 1); g.cubes?.burst?.(S.st.pos.clone().setY(S.st.pos.y + 1.6), Math.round(pay * ECON.perMinute), { from: 'mimic' }); }
    if (left) return;
    if (g.god?.controlling) g.god.toggle?.(); // (a clean copy: the hand is put away for you, back at the stone)
  }
}
