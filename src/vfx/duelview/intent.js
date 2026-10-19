// ---------------------------------------------------------------------------------------
// THE FOE'S FORECAST (the duel's view: vfx/duelview.js; PUZZLE-DUELS.md 13.6: "the intent is a live forecast, not a promise"): the
// Figment's plan for its next turn (bot.plan) drawn on its own pieces, redrawn after each of your actions. Each step is a glyph in the
// foe's feeling colour over an ink keyline, on the cells it would touch, with its number on a badge (the count face); the FIRST step
// full strength with a frame round its badge, the rest at 42% (they are drawn on a board the first one changes). The cells each step
// would clear are rimmed in dashes, and the junk the plan would send waits faint on the Line's head, an arrow toward you.
//   swap  a two-headed arrow       rotate  a ring round the 2 x 2 with its head      drag, glean  the path, its head at the end
//   drop  a chevron down its lane  form, toll, hoover, flail, coup  a ring at its body      push, punt, drill, shoot, hook  an arrow
//   paint a square round the 3 x 3
// What a step would clear is found by playing the plan on a quiet copy of the duel (the kernel's `act`, never its stream: the copy has
// a stream of its own, so drawing a forecast never changes the duel's chances).
//
// Prior art: Into the Breach (the enemy's next move drawn on the board, numbered in the order it acts, its effect previewed on the
// tiles; taken whole), Slay the Spire's intents (a foe's next move over its head, a promise there; here a forecast).
//
//   const I = new DuelIntent(parent, marks)   I.show(state, plan, side, foeAspect) -> { junk }   I.clear()   I.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { act, junkOf } from '../../progress/duel/duel.js';
import { seeded } from '../../core/rng.js';
import { DUEL_VIEW, cellLocal, feelColour } from './layout.js';

const INK = 0x17111f, FAINT = 0.42, DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** A copy of a duel to play a plan on, with a stream of its own (the kernel's cloneState draws from the real one's). */
function quietCopy(s, side) {
  const c = { ...s, board: s.board.clone(), sides: s.sides.map((S) => ({ ...S, forms: [...S.forms], at: S.at && [...S.at], queue: S.queue.map((p) => ({ ...p })) })), log: [], r: seeded(911) };
  c.toMove = side; c.apLeft = 99; c.winner = null; return c;
}

/** Quads in the board's frame, gathered into one geometry (a tier: bold or faint, ink or colour). */
class Strokes {
  constructor() { this.p = []; }
  seg(a, b, w) { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * w / 2, ny = (dx / l) * w / 2, z = a.z;
    this.p.push(a.x + nx, a.y + ny, z, a.x - nx, a.y - ny, z, b.x + nx, b.y + ny, z, b.x + nx, b.y + ny, z, a.x - nx, a.y - ny, z, b.x - nx, b.y - ny, z); }
  tri(a, b, c) { this.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); }
  head(from, to, w) { const dx = to.x - from.x, dy = to.y - from.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, s = w * 2.6;
    this.tri(new THREE.Vector3(to.x + ux * s * 0.6, to.y + uy * s * 0.6, to.z), new THREE.Vector3(to.x - ux * s * 0.5 - uy * s, to.y - uy * s * 0.5 + ux * s, to.z), new THREE.Vector3(to.x - ux * s * 0.5 + uy * s, to.y - uy * s * 0.5 - ux * s, to.z)); }
  ring(c, r, w, from = 0, to = Math.PI * 2, n = 24) { for (let i = 0; i < n; i++) { const a0 = from + ((to - from) * i) / n, a1 = from + ((to - from) * (i + 1)) / n;
    this.seg(new THREE.Vector3(c.x + Math.cos(a0) * r, c.y + Math.sin(a0) * r, c.z), new THREE.Vector3(c.x + Math.cos(a1) * r, c.y + Math.sin(a1) * r, c.z), w); } }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); return g; }
}

export class DuelIntent {
  constructor(parent, marks) {
    this.group = new THREE.Group(); this.group.name = 'duel-intent'; parent.add(this.group); this.marks = marks;
    const mat = (color, opacity) => new THREE.MeshBasicMaterial({ name: 'duel-intent', color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    this.mats = { inkB: mat(INK, 0.9), colB: mat(0xffffff, 1), inkF: mat(INK, 0.9 * FAINT), colF: mat(0xffffff, FAINT) };
    this.meshes = {}; this.badges = []; this.frame = null; this.junkL = marks.label(); this.group.add(this.junkL.group); this.junkL.group.visible = false;
  }

  clear() {
    for (const k in this.meshes) { this.group.remove(this.meshes[k]); this.meshes[k].geometry.dispose(); }
    this.meshes = {}; for (const b of this.badges) b.group.visible = false; if (this.frame) this.frame.visible = false; this.junkL.group.visible = false;
  }

  /** Draw a plan (kernel actions, in order) for `side` on the duel as it stands. Returns the junk it would send. */
  show(s, plan, side = 1, foeAspect = 'fury') {
    this.clear(); if (!s || !plan?.length) return { junk: 0 };
    const cs = DUEL_VIEW.cs, B = s.board, z = DUEL_VIEW.front + 0.05, w = cs * 0.13;
    const at = (x, y, out) => { cellLocal(x, y, B, out); out.z = z; return out; };
    const tiers = { B: [new Strokes(), new Strokes()], F: [new Strokes(), new Strokes()] }; // ([ink, colour] each)
    const c = quietCopy(s, side); let junk = 0;
    feelColour(foeAspect, this.mats.colB.color); this.mats.colF.color.copy(this.mats.colB.color);
    plan.forEach((a, i) => {
      const T = i === 0 ? tiers.B : tiers.F, body = c.sides[side].at, cells = [];
      const draw = (fn) => { fn(T[0], w * 2.1, 0.004); fn(T[1], w, 0.008); };
      const arrow = (x0, y0, x1, y1, both = false) => draw((S, ww, dz) => { at(x0, y0, _a).z += dz; at(x1, y1, _b).z += dz; S.seg(_a, _b, ww); S.head(_a, _b, ww); if (both) S.head(_b, _a, ww); });
      const ring = (cx, cy, r) => draw((S, ww, dz) => { at(cx, cy, _a).z += dz; S.ring(_a.clone(), r * cs, ww); });
      const path = (P) => draw((S, ww, dz) => { for (let k = 1; k < P.length; k++) { at(P[k - 1][0], P[k - 1][1], _a).z += dz; at(P[k][0], P[k][1], _b).z += dz; S.seg(_a.clone(), _b.clone(), ww); } if (P.length > 1) S.head(_a, _b, ww); });
      if (a.kind === 'swap') { const d = DIRS[a.dir]; arrow(a.at[0], a.at[1], a.at[0] + d[0], a.at[1] + d[1], true); cells.push(a.at); }
      else if (a.kind === 'rotate') { draw((S, ww, dz) => { at(a.at[0] + 0.5, a.at[1] + 0.5, _a).z += dz; const C = _a.clone(); S.ring(C, cs * 0.78, ww, 0.3, Math.PI * 1.8); _b.set(C.x + Math.cos(Math.PI * 1.8) * cs * 0.78, C.y + Math.sin(Math.PI * 1.8) * cs * 0.78, C.z); _a.set(C.x + Math.cos(Math.PI * 1.7) * cs * 0.78, C.y + Math.sin(Math.PI * 1.7) * cs * 0.78, C.z); S.head(_a, _b, ww); }); cells.push(a.at); }
      else if (a.kind === 'drag' || a.kind === 'glean') { path(a.path); cells.push(a.path[0]); }
      else if (a.kind === 'drop') { const [gx, gy] = B.grav(a.at[0], a.at[1]); arrow(a.at[0] - gx * 0.45, a.at[1] - gy * 0.45, a.at[0] + gx * 0.35, a.at[1] + gy * 0.35); cells.push(a.at); }
      else if (['push', 'punt', 'drill'].includes(a.kind) && body) { const d = DIRS[a.dir], n = a.kind === 'push' ? 1 : a.kind === 'punt' ? 2 : 3; arrow(body[0] + d[0] * 0.5, body[1] + d[1] * 0.5, body[0] + d[0] * (n + 0.2), body[1] + d[1] * (n + 0.2)); cells.push(body); }
      else if ((a.kind === 'shoot' || a.kind === 'hook') && body) { const toward = side === 0 ? 1 : -1, x1 = side === 0 ? B.line + 0.5 : B.line - 1.5; arrow(body[0] + toward * 0.5, body[1], x1, body[1]); cells.push(body); }
      else if (a.kind === 'paint' && body) { draw((S, ww, dz) => { const P = [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(([dx, dy]) => at(body[0] + dx, body[1] + dy, new THREE.Vector3()).setZ(z + dz)); for (let k = 0; k < 4; k++) S.seg(P[k], P[(k + 1) % 4], ww); }); cells.push(body); }
      else if (body) { ring(body[0], body[1], a.kind === 'coup' ? 0.85 : 0.6); cells.push(body); }
      const ev = act(c, a) || [];
      for (const e of ev) {
        if (e.type === 'chain' && e.side === side) junk += junkOf(e.cleared, e.step);
        if ((e.type === 'clear' || e.type === 'break') && e.side === side) draw((S, ww, dz) => { at(e.at[0], e.at[1], _a).z += dz; const C = _a.clone(), h = cs * 0.42;
          for (const [sx, sy, ex, ey] of [[-1, -1, -0.2, -1], [0.2, -1, 1, -1], [1, -1, 1, -0.2], [1, 0.2, 1, 1], [1, 1, 0.2, 1], [-0.2, 1, -1, 1], [-1, 1, -1, 0.2], [-1, -0.2, -1, -1]])
            S.seg(new THREE.Vector3(C.x + sx * h, C.y + sy * h, C.z), new THREE.Vector3(C.x + ex * h, C.y + ey * h, C.z), ww * 0.6); });
      }
      // its number on a badge, up and left of its first cell; the first framed
      const cell = cells[0]; if (!cell) return;
      const L = (this.badges[i] ||= this.marks.label()); this.group.add(L.group); L.set(String(i + 1), '#' + this.mats.colB.color.getHexString()); L.group.visible = true;
      at(cell[0] - 0.55, cell[1] - 0.55, L.group.position).z += 0.03; L.group.scale.setScalar(cs * (i === 0 ? 1.15 : 0.85));
      if (i === 0) { this.frame ||= new THREE.Mesh(this.marks.rimGeo, this.mats.colB); this.frame.renderOrder = 5; this.group.add(this.frame); this.frame.visible = true; this.frame.position.copy(L.group.position); this.frame.position.z -= 0.005; this.frame.scale.setScalar(cs * 0.95); }
    });
    for (const [k, [ink, col]] of Object.entries(tiers)) {
      for (const [name, S, m, o] of [[k + 'ink', ink, k === 'B' ? this.mats.inkB : this.mats.inkF, 3], [k + 'col', col, k === 'B' ? this.mats.colB : this.mats.colF, 4]]) {
        if (!S.p.length) continue; const mesh = new THREE.Mesh(S.geometry(), m); mesh.renderOrder = o; mesh.frustumCulled = false; this.group.add(mesh); this.meshes[name] = mesh;
      }
    }
    if (junk > 0) { // (what the plan would send, faint on the Line's head, toward the other side)
      const { base, border: b, lip } = DUEL_VIEW, x = (B.line - B.w / 2) * cs + (side === 1 ? -1 : 1) * cs * 1.4;
      this.junkL.set(side === 1 ? '<' + junk : junk + '>', '#' + this.mats.colB.color.getHexString()); this.junkL.group.visible = true;
      this.junkL.group.position.set(x, base + B.h * cs + b * 3.1, lip + 0.02); this.junkL.group.scale.setScalar(cs);
    }
    return { junk };
  }

  update() {}
}
