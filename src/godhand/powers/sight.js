// ---------------------------------------------------------------------------------------
// DIVINATION'S GOD POWERS (docs/plans/GODHAND.md section 8), as handlers for the runner (godhand/powers.js). Seeing is not an act on
// the island: none of these raises the island's dissonance.
//   STRATA  hold LMB and drag: the ground along the stroke is drawn as a section held up over it, layer by layer (the authored ground,
//           the firm and loose layers, Lachryma), and stays a few real seconds after.
//   COURSE  while it is chosen: where a drop let go under the hand would run, drawn downhill to where it would pool. LMB marks it.
//   READ    while it is chosen: each creature near your Pneuka Jar shows what it means to do next, a line to it (a blow on its way, red; a
//           hunt, to its quarry; a walk, where it is headed). LMB marks what is read.
// Prior art: From Dust's terrain cutaway; Dwarf Fortress's layer view; Hitman's instinct and XCOM's enemy intent lines.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { groundOf } from '../matter.js';

const LAYERS = [[0x3a3330, 'base'], [groundOf().firm.colour, 'firm'], [groundOf().loose.colour, 'loose'], [0x7fd0e0, 'w']]; // (the island's own layers: matter.js GROUND)
const CAP = 160;
const _m = new THREE.Matrix4(), _c = new THREE.Color(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();
let section = null, courseLine = null, readLines = null, courseT = 0, sectionLife = 0;

function sectionMesh(P) {
  if (section) return section;
  section = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }), CAP * LAYERS.length);
  section.frustumCulled = false; section.renderOrder = 8; section.count = 0;
  P.game.scene.add(section);
  return section;
}

/** The section along a to b: a column every half metre, its layers stacked, held up `lift` metres over the highest ground. */
function drawSection(P, a, b) {
  const F = P.F, S = sectionMesh(P); if (!F) return 0;
  const len = Math.min(a.distanceTo(b), P.ramp('strata', 'len')), n = Math.min(CAP, Math.max(2, Math.round(len / 0.5)));
  const dx = (b.x - a.x) / Math.max(1e-6, a.distanceTo(b)), dz = (b.z - a.z) / Math.max(1e-6, a.distanceTo(b));
  let top = -Infinity; const cols = [];
  for (let i = 0; i < n; i++) {
    const x = a.x + dx * len * (i / (n - 1)), z = a.z + dz * len * (i / (n - 1)), k = F.cellAt(x, z);
    if (k < 0 || F.void[k]) continue;
    cols.push([x, z, k]); top = Math.max(top, F.top(k) + F.w[k]);
  }
  const lift = 2.5, base0 = Math.min(...cols.map(([, , k]) => F.base[k])) - 1.5, yaw = Math.atan2(-dz, dx);
  _q.setFromAxisAngle(_p.set(0, 1, 0), yaw);
  let j = 0; const frame = []; // (the outline for the looks: each column's foot, top and the ground under it)
  for (const [x, z, k] of cols) {
    let y = top + lift - (F.base[k] - base0) - F.firm[k] - F.loose[k] - F.w[k]; // (the section's foot, so the columns keep their heights)
    frame.push([x, z, y, top + lift, F.top(k) + F.w[k]]);
    for (const [hex, L] of LAYERS) {
      const h = L === 'base' ? F.base[k] - base0 : F[L][k]; if (h <= 0.005) continue;
      _m.compose(_p.set(x, y + h / 2, z), _q, _s.set(0.5, h, 0.12)); S.setMatrixAt(j, _m); S.setColorAt(j, _c.setHex(hex)); j++; y += h;
    }
  }
  S.count = j; S.instanceMatrix.needsUpdate = true; if (S.instanceColor) S.instanceColor.needsUpdate = true;
  S.visible = true;
  P.game.godhandLooks?.strata(S, frame); // (its frame in the labradorite's line: vfx/godhand/marks.js)
  return len;
}

/** Downhill from a point over the matter's surface (the Lachryma's top), cell to lowest neighbour, until it pools or leaves the field. */
export function courseFrom(F, x, z, steps) {
  const out = []; let k = F.cellAt(x, z); if (k < 0) return out;
  const n = F.n, surf = (q) => F.top(q) + F.w[q], seen = new Set();
  for (let s = 0; s < steps && k >= 0 && !seen.has(k); s++) {
    seen.add(k); out.push(new THREE.Vector3(F.xOf(k), surf(k) + 0.15, F.zOf(k)));
    const i = k % n, j = (k / n) | 0; let best = -1, bh = surf(k) - 1e-4;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
      const q = jj * n + ii; if (F.void[q]) continue; const h = surf(q); if (h < bh) { bh = h; best = q; }
    }
    k = best;
  }
  return out;
}

export const SIGHT = {
  strata: {
    hold(P, L) { drawSection(P, L.a, L.b); sectionLife = 4; },
    end(P, L) { const len = drawSection(P, L.a, L.b); sectionLife = 4; P.emit('strata', { len: +len.toFixed(1), act: false }); },
    passive(P, dt) { if (section?.visible && !P.L && (sectionLife -= dt) <= 0) section.visible = false; },
  },

  course: {
    passive(P, dt) {
      const F = P.F, K = P.god.cursor;
      if ((courseT -= dt) > 0 || !F || !K.ok) return;
      courseT = 0.1;
      const pts = courseFrom(F, K.point.x, K.point.z, Math.round(P.ramp('course', 'steps')));
      const LK = P.game.godhandLooks; if (LK) { LK.course(pts, P.domainColour('course'), 0.1); return; } // (the run and its pool: vfx/godhand/marks.js)
      if (!courseLine) courseLine = P.line([new THREE.Vector3(), new THREE.Vector3()], P.domainColour('course'));
      courseLine.geometry.setFromPoints(pts.length > 1 ? pts : [K.point, K.point]); courseLine.visible = true;
    },
    begin(P, L) { const F = P.F; if (!F) return false; const pts = courseFrom(F, L.a.x, L.a.z, Math.round(P.ramp('course', 'steps'))); P.line(pts, 0xffffff, 6); P.emit('course', { steps: pts.length, act: false }); return false; },
  },

  read: {
    passive(P, dt) {
      const g = P.game, r = P.ramp('read', 'r'), list = P.near(P.god.jar.pos, r).slice(0, 32), pos = [], col = [];
      for (const c of list) {
        const from = _p.copy(c.pos).setY(c.pos.y + 1), w = c.windup;
        let to = null, hex = 0x7fe0ff;
        if (w) { to = w.at; hex = 0xff4a3a; }
        else if (c.brain?.action?.hunt && c.foe?.pos) { to = c.foe.pos; hex = 0xffb060; }
        else if (c.want && c.want.lengthSq() > 0.05) to = _s.copy(c.pos).addScaledVector(c.want, 2);
        if (!to) continue;
        pos.push(from.x, from.y, from.z, to.x, (to.y ?? c.pos.y) + 0.6, to.z); _c.setHex(hex); col.push(_c.r, _c.g, _c.b, _c.r, _c.g, _c.b);
        g.godhandLooks?.readArrow(pos, col, from, { x: to.x, y: (to.y ?? c.pos.y) + 0.6, z: to.z }, _c); // (its head: what it means to do, pointed)
      }
      if (!readLines) {
        readLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthTest: false }));
        readLines.frustumCulled = false; readLines.renderOrder = 9; g.scene.add(readLines);
      }
      readLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      readLines.geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      readLines.visible = true; readLines.userData.t = g.events?.time ?? 0;
      readLines.userData.n = list.length;
    },
    begin(P) { P.emit('read', { n: readLines?.userData.n ?? 0, act: false }); return false; },
  },
};

/** The passive marks go when their power is not chosen (godhand/powers.js calls this every frame with the chosen id). */
export function hideSight(id, P) {
  if (id !== 'course') { if (courseLine) courseLine.visible = false; P?.game.godhandLooks?.hideCourse(); }
  if (id !== 'read' && readLines) readLines.visible = false;
  if (id !== 'strata' && section && sectionLife <= 0) section.visible = false;
}
