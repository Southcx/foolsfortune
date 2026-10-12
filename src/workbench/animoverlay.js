// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S OVERLAYS: marks laid over the Anim Lab's Courier at the frame on show, from measures that read the posed body. The hook
// the pose audit fills (a held tool through the body, a limb through the body, a joint past its range: scripts/poseaudit.mjs, on its own
// branch), and the one overlay the Anim Lab brings to prove it, the bones' axes.
//
// An overlay measures; the Anim Lab draws. Every overlay gets the same marks, so a new measure needs no drawing of its own, and the
// world carries no words or numbers (CLAUDE.md, Feedback: marks sit on the thing):
//   { id, label,
//     measure(ctx) -> [mark]                  the frame on show, posed: ctx = { rig (the Character: bones, limits), tool (the model in the
//                                             hand, or null), toolId, frame, take }; called once a frame shown, cached by frame
//     timeline?(take, at) -> Float32Array(n)  each frame's worst, 0..1, for the scrub bar (`at(k)` poses frame k and returns its ctx) }
//   a mark: { kind: 'axes', bone, size? }                      a bone's own axes (x red, y green, z blue)
//           { kind: 'point', at: Vector3, severity, size? }    where something went through (a penetration's deepest point)
//           { kind: 'segment', a, b, severity }                what went through, from and to (a blade's span inside the body)
//           { kind: 'joint', bone, severity, size? }           a joint past its range: a ring about it
//   severity 0..1: amber to red.
//
// Prior art: the debug draw of every engine (Unreal's DrawDebugLine and its skeleton view in Persona, Unity's Gizmos: immediate lines
// and shapes, no text), and the editor's view toggles (Persona's Show > Bones, Blender's overlays popover).
//
//   ANIM_OVERLAYS.add(overlay)  .remove(id)  .get(id)  .list()      const layer = new OverlayLayer(parent)  layer.draw(marks)  layer.clear()
//   BONE_AXES (the overlay the Anim Lab brings)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The bones' own axes, at each bone (the fingers' and toes' shorter): the default overlay, and the proof of the hook. */
export const BONE_AXES = {
  id: 'bones', label: 'BONE AXES',
  measure: ({ rig }) => Object.values(rig.bones).map((bone) => ({ kind: 'axes', bone, size: /^(f_|thumb|toe)/.test(bone.name) ? 0.025 : 0.07 })),
};

const list = new Map([[BONE_AXES.id, BONE_AXES]]);
/** The overlays the Anim Lab can show (the pose audit adds its own: ANIM_OVERLAYS.add({ id: 'poseaudit', label, measure, timeline })). */
export const ANIM_OVERLAYS = {
  add(o) { if (o?.id && typeof o.measure === 'function') list.set(o.id, o); return o; },
  remove(id) { list.delete(id); },
  get(id) { return list.get(id) || null; },
  list() { return [...list.values()]; },
};

const MAX_SEG = 2048; // (line segments a frame: axes are three a bone)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const AXIS = [[1, 0, 0, 0xff5a4a], [0, 1, 0, 0x7cdc6a], [0, 0, 1, 0x6aa8ff]];
const severityColour = (k, out) => out.setHex(0xffc65c).lerp(_c.setHex(0xff3030), THREE.MathUtils.clamp(k ?? 1, 0, 1));

/** Where the marks are drawn: one batch of lines (axes and segments), and a few points and rings, over the body (no depth test). */
export class OverlayLayer {
  constructor(parent) {
    this.group = new THREE.Group(); this.group.name = 'animlab.overlay'; parent.add(this.group);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, depthWrite: false, transparent: true, opacity: 0.9 }));
    this.lines.frustumCulled = false; this.lines.renderOrder = 40; this.group.add(this.lines);
    this.pointGeo = new THREE.OctahedronGeometry(1, 0); this.ringGeo = new THREE.TorusGeometry(1, 0.12, 6, 24);
    this.points = []; this.rings = [];
  }

  /** A pooled mesh (`pool`: points or rings), shown, coloured by severity. */
  take(pool, geo, i) {
    let m = pool[i];
    if (!m) { m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false, transparent: true, opacity: 0.85 })); m.renderOrder = 41; m.frustumCulled = false; pool.push(m); this.group.add(m); }
    m.visible = true;
    return m;
  }

  /** Draw these marks (world space: the stage keeps the layer in the frame the rig is posed in). */
  draw(marks) {
    const P = this.lines.geometry.attributes.position, C = this.lines.geometry.attributes.color;
    let n = 0, np = 0, nr = 0;
    const seg = (a, b, col) => { if (n >= MAX_SEG) return; a.toArray(P.array, n * 6); b.toArray(P.array, n * 6 + 3); col.toArray(C.array, n * 6); col.toArray(C.array, n * 6 + 3); n++; };
    for (const m of marks || []) {
      if (m.kind === 'axes' && m.bone) {
        m.bone.matrixWorld.decompose(_a, _q, _s);
        for (const [x, y, z, hex] of AXIS) seg(_a, _b.set(x, y, z).applyQuaternion(_q).multiplyScalar(m.size ?? 0.07).add(_a), _c.setHex(hex));
      } else if (m.kind === 'segment' && m.a && m.b) seg(m.a, m.b, severityColour(m.severity, new THREE.Color()));
      else if (m.kind === 'point' && m.at) {
        const p = this.take(this.points, this.pointGeo, np++);
        p.position.copy(m.at); p.scale.setScalar(m.size ?? 0.03); severityColour(m.severity, p.material.color);
      } else if (m.kind === 'joint' && m.bone) {
        const r = this.take(this.rings, this.ringGeo, nr++);
        m.bone.matrixWorld.decompose(r.position, r.quaternion, _s); r.rotateX(Math.PI / 2); r.scale.setScalar(m.size ?? 0.06); severityColour(m.severity, r.material.color);
      }
    }
    P.needsUpdate = true; C.needsUpdate = true;
    this.lines.geometry.setDrawRange(0, n * 2);
    for (let i = np; i < this.points.length; i++) this.points[i].visible = false;
    for (let i = nr; i < this.rings.length; i++) this.rings[i].visible = false;
  }

  clear() { this.draw([]); }

  dispose() {
    this.group.removeFromParent(); this.lines.geometry.dispose(); this.lines.material.dispose(); this.pointGeo.dispose(); this.ringGeo.dispose();
    for (const m of [...this.points, ...this.rings]) m.material.dispose();
  }
}
