// ---------------------------------------------------------------------------------------
// A MECH'S HELM / A PLUME (plain names; South, 2026-11-02: "variant helms that are like a fusion of sengoku samurai army leaders with
// incredibly ornate features, and eastern european medieval knight helms with extravagant feather plumes (with physics bones to sway)"):
// a helm worn over any mech head (vfx/mechs/partsbody.js `joints.head`), the head's own shell set aside while it is worn, its plumes
// a chain of bones each, sprung toward their rest shape and swung by the frame's own motion (verlet, as hair and capes are). Four:
//   kabuto     the daimyo's: a ribbed lacquer bowl (suji-bachi) with a gold tehen rosette, a five-lame shikoro flared wide and its
//              fukigaeshi turned back at the temples, a great gold crescent maedate (Date Masamune's), a menpo with a gold moustache
//              and the eyes lit; a horsehair tuft swinging off the back
//   antlers    the general's: a smooth momonari bowl under Honda Tadakatsu's deer antlers in black lacquer, the shikoro long, and a
//              crest of three tall feathers out of a gold socket (the knights' plume set on the kabuto)
//   szyszak    the winged hussar's (Polish-Lithuanian, the Hungarian zischägge): a fluted round bowl with a crest ridge and a spike,
//              a peak, a sliding nasal, cheek plates and the lobster-tail of lames; a bunch of five ostrich plumes at the crown
//   bascinet   the gilded knight's: a tall pointed bowl, the pig-faced visor with its breaths, a gold-edged aventail of lames, the
//              kuwagata's hoe horns in gold (the kabuto's crest on the knight's helm), three long feathers down the back from the apex
// Built in the parts body's own programs (its porcelain vertex-coloured: lacquer, iron and bone; its gold; its labradorite; its glow
// for the eyes, lit with the cradle), in a frame the head's size (fitted to the head shell's box). A plume is one ribbon mesh in the
// world (two crossed strips a feather on a feather card's alpha), rewritten each frame from its bones.
// Prior art: the kabuto (suji-bachi, momonari, shikoro, fukigaeshi, maedate: Date Masamune's crescent, Honda Tadakatsu's antlers,
// Kuroda's and Kato's tall hats as the extravagance), the menpo; the szyszak and the hussars' plumes (the Polish winged hussars),
// the Hungarian zischägge, the pig-faced bascinet, the Burgundian and German crests and plumes of the tournament; the verlet chains
// of hair and capes (Jakobsen, "Advanced Character Physics", 2001), and the tie in a skinned bone chain (spring bones: VRM's).
//
//   HELMS[id] = { label }   wearHelm(body, id | null) -> handle | null (the helm worn, the head's shell set aside; null takes it off)
//   handle.update(rawDt)   handle.dispose()   installMechHelms(game) -> game.mechHelm(id) (the hangar's mech; `/helm id`)   HELM_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';

/** The colours: the lacquer, the iron, the bone of the menpo, the gold; the plumes' (muted earth tones and one dark stone). */
export const HELM_LOOK = {
  lacquer: 0x2a1c18, lacquerR: 0x6e2a1e, iron: 0x4c4a4c, bone: 0xe6dccb, ivory: 0xd2c3a6, cord: 0x8a3a24, ochre: 0xb48a46,
  plume: { ivory: 0xece2cf, ochre: 0xc89a52, rust: 0xa45c3c, slate: 0x6c7076, umber: 0x5a4030, lab: 0x3a4658 },
  gravity: 9.8, damping: 0.94, stiff: [0.32, 0.05],
};
const L = HELM_LOOK, PI = Math.PI;

export const HELMS = {
  kabuto: { label: "Daimyo's kabuto" },
  antlers: { label: 'Antlered kabuto' },
  szyszak: { label: "Hussar's szyszak" },
  bascinet: { label: 'Gilded bascinet' },
};

// ------------------------------------------------------------------ shapes, in head units (the skull's radius 1, the brow at y 0, the face +Z)
/** A bowl of `ribs` lacquer ridges (a suji-bachi), radius r, height h, its rim at y 0. */
function bowl(p, r, h, c, ribs = 0, pointed = 0) {
  const prof = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * PI / 2; prof.push([Math.max(0.001, Math.cos(a) * r * (1 - pointed * (i / 10) ** 2)), Math.sin(a) * h + pointed * h * 0.6 * (i / 10) ** 3]); }
  p.lathe(prof, { c }, 28);
  for (let i = 0; i < ribs; i++) { const a = (i / ribs) * PI * 2; p.lathe(prof.map(([x, y]) => [x * 1.012, y]).slice(0, 9), { c: L.ochre, rot: [0, a, 0], sc: [0.035, 1, 1] }, 3); }
}
/** The shikoro: `n` lames hanging from the bowl's rim, each wider and lower, open at the face (from `-gap` to `gap` round +Z). */
function shikoro(p, r, n, drop, flare, c, cord, gap = 1.1) {
  for (let i = 0; i < n; i++) {
    const R = r * (1.02 + i * flare), y = -i * drop, len = PI * 2 - gap * 2;
    const g = new THREE.CylinderGeometry(R, R + flare * r * 0.9, drop * 1.05, 28, 1, true, gap, len);
    p.geo(g, { at: [0, y - drop / 2, 0], c: i % 2 ? c : L.lacquerR });
    p.geo(new THREE.TorusGeometry(R + flare * r * 0.9, 0.025, 4, 28, len).rotateX(PI / 2).rotateY(-(PI / 2 + gap)), { at: [0, y - drop, 0], c: cord });
  }
}
/** The fukigaeshi: the shikoro's top lames turned back at the temples, a gold-rimmed wing each side. */
function fukigaeshi(p, g, r) {
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.55, 0.12), new THREE.Vector2(0.62, -0.32), new THREE.Vector2(0.05, -0.4)]);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
    p.geo(geo.clone(), { at: [s * r * 0.92, 0.02, r * 0.32], rot: [0, s * -0.9 + (s < 0 ? PI : 0), 0], c: L.lacquer });
    g.geo(new THREE.TorusGeometry(0.1, 0.03, 4, 10), { at: [s * r * 1.08, -0.08, r * 0.5], rot: [0, s * 0.6, 0] });
  }
}
/** A menpo: the face mask, a gold moustache, two hollow eyes lit in `glow` (the haniwa's hollows kept, a mask over them). */
function menpo(p, g, glow, r) {
  p.lathe([[0.001, -0.85], [0.42, -0.8], [0.62, -0.5], [0.66, -0.15], [0.62, 0.05]], { c: L.iron, at: [0, 0, r * 0.32], sc: [1, 1, 0.55] }, 18);
  p.box(0.34, 0.16, 0.22, { at: [0, -0.32, r * 0.68], c: L.iron }, 0.06); // (the nose)
  for (const s of [-1, 1]) {
    g.rod([s * 0.06, -0.5, r * 0.7], [s * 0.42, -0.42, r * 0.56], 0.04, {}, 5); g.rod([s * 0.42, -0.42, r * 0.56], [s * 0.56, -0.3, r * 0.44], 0.03, {}, 5);
    glow.box(0.3, 0.1, 0.06, { at: [s * 0.3, -0.06, r * 0.84], rot: [0, 0, s * -0.18] }, 0.03);
  }
  g.box(0.5, 0.05, 0.08, { at: [0, -0.58, r * 0.7] }, 0.02);
}
/** Deer antlers in black lacquer, a tine every so far, from the bowl's temples. */
function antlers(p, r) {
  for (const s of [-1, 1]) {
    const pts = [[s * r * 0.55, 0.55, 0.15], [s * 1.1, 1.3, 0.05], [s * 1.6, 2.2, -0.25], [s * 1.7, 3.1, -0.55], [s * 1.5, 3.8, -0.85]];
    for (let i = 1; i < pts.length; i++) p.rod(pts[i - 1], pts[i], 0.11 - i * 0.015, { c: L.lacquer }, 6);
    for (const [i, out, up] of [[1, 0.55, 0.7], [2, 0.6, 0.85], [3, 0.4, 0.7]]) { const a = pts[i]; p.rod(a, [a[0] + s * out * 0.3, a[1] + up, a[2] + 0.35], 0.06, { c: L.lacquer }, 5); }
  }
}

// ------------------------------------------------------------------ the helms
function build(id, r) {
  const p = new Piece(), g = new Piece(), lab = new Piece(), glow = new Piece(), plumes = [];
  if (id === 'kabuto') {
    bowl(p, r, r * 0.95, L.lacquer, 24);
    g.ring(0.22, 0.06, { at: [0, r * 0.95, 0] }, 16); g.ball(0.14, { at: [0, r * 0.97, 0] }, 12, 8); // (the tehen)
    g.box(r * 2.04, 0.12, 0.2, { at: [0, 0.02, r * 0.9], rot: [0.2, 0, 0] }, 0.04); // (the brow's band, the mabisashi's edge)
    p.box(r * 2.1, 0.05, 0.75, { at: [0, 0.06, r * 0.95], rot: [-0.32, 0, 0], c: L.lacquer }, 0.02); // (the peak)
    shikoro(p, r, 5, 0.26, 0.14, L.lacquer, L.cord);
    fukigaeshi(p, g, r);
    g.geo(new THREE.TorusGeometry(1.25, 0.09, 6, 28, PI * 0.95).rotateZ(PI * 0.025), { at: [0, 0.65, r * 1.0], sc: [1.25, 1, 0.5] }); // (the crescent maedate)
    lab.box(0.24, 0.3, 0.08, { at: [0, 0.38, r * 1.02] }, 0.05); // (its mount: a plate of the stone)
    menpo(p, g, glow, r);
    plumes.push({ at: [0, r * 0.6, -r * 0.8], dir: [0, 0.3, -1], len: 2.4, n: 7, w: 0.5, c: L.plume.ivory, kind: 'tuft', count: 5, spread: 0.35 });
  } else if (id === 'antlers') {
    bowl(p, r, r * 1.05, L.lacquerR);
    p.box(r * 2.1, 0.05, 0.6, { at: [0, 0.06, r * 0.95], rot: [-0.28, 0, 0], c: L.lacquer }, 0.02);
    shikoro(p, r, 6, 0.28, 0.1, L.lacquer, L.ochre);
    fukigaeshi(p, g, r);
    antlers(p, r);
    g.cyl(0.12, 0.18, 0.5, { at: [0, r * 1.15, -0.1] }, 12); // (the plume's socket)
    menpo(p, g, glow, r);
    plumes.push({ at: [0, r * 1.38, -0.1], dir: [0, 1, -0.25], len: 4.2, n: 8, w: 0.6, c: L.plume.ochre, kind: 'feather', count: 3, spread: 0.22 });
  } else if (id === 'szyszak') {
    bowl(p, r, r * 1.0, L.iron, 16);
    p.box(0.1, r * 0.25, r * 1.6, { at: [0, r * 0.98, 0], c: L.iron }, 0.04); // (the crest ridge)
    g.cone(0.08, 0.7, { at: [0, r * 1.25, 0] }, 8); g.ball(0.11, { at: [0, r * 1.0, 0] }, 10, 6); // (the spike)
    p.box(r * 2.0, 0.05, 0.85, { at: [0, 0.0, r * 0.98], rot: [-0.18, 0, 0], c: L.iron }, 0.02); // (the peak)
    g.box(0.12, 1.25, 0.08, { at: [0, -0.32, r * 1.08] }, 0.03); g.ball(0.13, { at: [0, 0.32, r * 1.08] }, 10, 6); // (the sliding nasal)
    for (const s of [-1, 1]) { p.box(0.08, 0.95, 0.75, { at: [s * r * 0.92, -0.5, r * 0.42], rot: [0, 0, s * 0.12], c: L.iron }, 0.04); g.ball(0.07, { at: [s * r * 0.97, -0.25, r * 0.55] }, 8, 6); }
    for (let i = 0; i < 5; i++) p.geo(new THREE.CylinderGeometry(r * (0.95 + i * 0.05), r * (1.0 + i * 0.06), 0.24, 22, 1, true, PI / 2 + 0.3, PI * 1.0 - 0.6), { at: [0, -0.08 - i * 0.2, -0.05 * i], rot: [0.12 * i, 0, 0], c: i % 2 ? L.iron : 0x5c5a5c }); // (the lobster-tail)
    p.box(r * 1.5, 0.9, 0.1, { at: [0, -0.5, r * 0.86], c: L.lacquer }, 0.04); // (the dark under it, where the eyes are)
    for (const s of [-1, 1]) glow.box(0.32, 0.1, 0.06, { at: [s * 0.3, -0.18, r * 0.92] }, 0.03);
    g.cyl(0.15, 0.1, 0.45, { at: [0, r * 0.95, -r * 0.55], rot: [-0.5, 0, 0] }, 10); // (the plume holder)
    plumes.push({ at: [0, r * 1.15, -r * 0.65], dir: [0, 1, -0.45], len: 3.6, n: 8, w: 0.9, c: L.plume.ivory, kind: 'ostrich', count: 5, spread: 0.42, tint: [L.plume.ivory, L.plume.rust, L.plume.ivory, L.plume.slate, L.plume.ivory] });
  } else {
    bowl(p, r, r * 1.35, L.ivory, 0, 0.7);
    g.box(r * 2.0, 0.1, 0.2, { at: [0, 0.02, r * 0.88] }, 0.03);
    // the pig-faced visor: a snout of plates, its breaths, the sights lit
    p.lathe([[0.001, -1.0], [0.3, -0.92], [0.55, -0.55], [0.62, -0.1], [0.5, 0.15]], { c: L.ivory, at: [0, 0, r * 0.45], rot: [PI / 2 - 0.1, 0, 0], sc: [1.4, 1, 1.15] }, 18);
    for (let i = 0; i < 6; i++) p.cyl(0.04, 0.04, 0.12, { at: [(i - 2.5) * 0.12, -0.38, r * 1.33], rot: [PI / 2, 0, 0], c: L.lacquer }, 6);
    for (const s of [-1, 1]) glow.box(0.42, 0.07, 0.08, { at: [s * 0.28, 0.02, r * 1.16], rot: [0, s * -0.3, 0] }, 0.03);
    g.rod([-0.6, 0.15, r * 1.0], [0.6, 0.15, r * 1.0], 0.03, {}, 4);
    // the aventail: lames of gold-edged plate round the neck
    for (let i = 0; i < 4; i++) { p.geo(new THREE.CylinderGeometry(r * (1.0 + i * 0.07), r * (1.06 + i * 0.08), 0.24, 26, 1, true), { at: [0, -0.15 - i * 0.22, 0], c: i % 2 ? L.ivory : L.bone }); g.geo(new THREE.TorusGeometry(r * (1.06 + i * 0.08), 0.02, 3, 26).rotateX(PI / 2), { at: [0, -0.27 - i * 0.22, 0] }); }
    // the kuwagata: the hoe horns in gold, the stone between them
    for (const s of [-1, 1]) { g.rod([s * 0.2, 0.25, r * 0.95], [s * 0.75, 1.2, r * 0.9], 0.07, {}, 6); g.rod([s * 0.75, 1.2, r * 0.9], [s * 0.9, 2.1, r * 0.75], 0.05, {}, 6); }
    lab.ball(0.2, { at: [0, 0.3, r * 1.0] }, 12, 8);
    g.cyl(0.08, 0.14, 0.35, { at: [0, r * 1.62, -0.1], rot: [-0.4, 0, 0] }, 10);
    plumes.push({ at: [0, r * 1.7, -0.2], dir: [0, 0.55, -1], len: 4.6, n: 9, w: 1.0, c: L.plume.rust, kind: 'feather', count: 3, spread: 0.3, droop: 1, tint: [L.plume.rust, L.plume.lab, L.plume.ochre] });
  }
  return { p, g, lab, glow, plumes };
}

// ------------------------------------------------------------------ the plume: bones sprung to their rest, one ribbon mesh
let CARD = null;
/** The feather card: a rachis, barbs swept up it, the edge ragged (alpha); `ostrich` rows of long drooping barbs. One canvas, two columns. */
function featherCard() {
  if (CARD || typeof document === 'undefined') return CARD;
  const W = 128, H = 512, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H;
  const x = cv.getContext('2d'); x.clearRect(0, 0, W * 2, H);
  for (const [col, fluffy] of [[0, false], [1, true]]) {
    const cx = col * W + W / 2; let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 6; y < H - 4; y += fluffy ? 2 : 1.5) {
      const v = y / H, half = (W / 2 - 4) * Math.sin(Math.min(1, v * 1.15) * PI * 0.9 + 0.12) * (fluffy ? 1 : 0.8);
      for (const d of [-1, 1]) { const len = half * (0.7 + rnd() * 0.3); x.strokeStyle = `rgba(255,255,255,${0.55 + rnd() * 0.45})`; x.lineWidth = fluffy ? 1.4 : 1;
        x.beginPath(); x.moveTo(cx, y); x.quadraticCurveTo(cx + d * len * 0.6, y - (fluffy ? -4 : 8), cx + d * len, y + (fluffy ? 14 : -10)); x.stroke(); }
    }
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, H); x.stroke();
  }
  CARD = new THREE.CanvasTexture(cv); CARD.colorSpace = THREE.SRGBColorSpace; return CARD;
}

class Plume {
  /** specs in head units (this.k metres a unit), rooted in `head` (an Object3D the helm sits in). */
  constructor(specs, head, k, scene) {
    this.head = head; this.k = k; this.feathers = [];
    const C = new THREE.Color();
    for (const S of specs) for (let f = 0; f < (S.count || 1); f++) {
      const n = S.n, seg = (S.len * k) / n, off = ((f - ((S.count || 1) - 1) / 2) * (S.spread || 0));
      const dir = new THREE.Vector3(...S.dir).normalize(), side = new THREE.Vector3(1, 0, 0);
      const rest = [], at = new THREE.Vector3(S.at[0] + off * 0.6, S.at[1], S.at[2]).multiplyScalar(k);
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -off * 0.9).applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.abs(off) * 0.25);
      for (let i = 0; i <= n; i++) { rest.push(at.clone()); const bend = (S.droop ?? 0.55) * (i / n) ** 1.5; at.addScaledVector(d.clone().lerp(new THREE.Vector3(0, -0.4, -1).normalize(), bend).normalize(), seg); }
      C.set((S.tint || [])[f] ?? S.c);
      this.feathers.push({ n, seg, rest, w: (S.w * k) * (1 - Math.abs(off) * 0.2), col: C.clone(), fluffy: S.kind === 'ostrich' || S.kind === 'tuft', p: rest.map((v) => v.clone()), q: rest.map((v) => v.clone()), side });
    }
    const verts = this.feathers.reduce((a, F) => a + (F.n + 1) * 4, 0);
    const pos = new Float32Array(verts * 3), uv = new Float32Array(verts * 2), col = new Float32Array(verts * 3), idx = [];
    let v = 0;
    for (const F of this.feathers) {
      F.v0 = v; const u0 = F.fluffy ? 0.5 : 0;
      for (let i = 0; i <= F.n; i++) for (let s = 0; s < 4; s++) { uv[(v + i * 4 + s) * 2] = u0 + ((s & 1) ? 0.5 : 0); uv[(v + i * 4 + s) * 2 + 1] = i / F.n; F.col.toArray(col, (v + i * 4 + s) * 3); }
      for (let i = 0; i < F.n; i++) for (const strip of [0, 2]) { const a = v + i * 4 + strip, b = a + 1, c2 = a + 4, d2 = a + 5; idx.push(a, b, c2, b, d2, c2); }
      v += (F.n + 1) * 4;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'mech-plume', map: featherCard(), vertexColors: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9 }));
    this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.name = 'mech-plume';
    scene.add(this.mesh); this.primed = false;
  }
  update(dt) {
    const H = this.head; H.updateWorldMatrix(true, false);
    const M = H.matrixWorld, pos = this.mesh.geometry.attributes.position, A = pos.array;
    const dt2 = Math.min(dt, 1 / 30) ** 2, gy = -L.gravity * dt2, t = (this._t ||= new THREE.Vector3()), dv = (this._d ||= new THREE.Vector3());
    const right = (this._r ||= new THREE.Vector3()).set(1, 0, 0).transformDirection(M), s1 = (this._s1 ||= new THREE.Vector3()), s2 = (this._s2 ||= new THREE.Vector3());
    this.mesh.visible = !!this.visible;
    for (const F of this.feathers) {
      if (!this.primed) { const sc = dv.setFromMatrixScale(M).x; F.segW = F.seg * sc; F.wW = F.w * sc; for (let i = 0; i <= F.n; i++) { F.p[i].copy(F.rest[i]).applyMatrix4(M); F.q[i].copy(F.p[i]); } }
      F.p[0].copy(F.rest[0]).applyMatrix4(M); F.q[0].copy(F.p[0]);
      for (let i = 1; i <= F.n; i++) {
        const P = F.p[i], Q = F.q[i]; dv.subVectors(P, Q).multiplyScalar(L.damping); Q.copy(P); P.add(dv); P.y += gy;
        const st = THREE.MathUtils.lerp(L.stiff[0], L.stiff[1], i / F.n);
        t.copy(F.rest[i]).sub(F.rest[i - 1]).transformDirection(M).multiplyScalar(F.segW).add(F.p[i - 1]); P.lerp(t, st); // (sprung toward its rest bend)
        dv.subVectors(P, F.p[i - 1]); const len = dv.length() || 1; P.copy(F.p[i - 1]).addScaledVector(dv, F.segW / len); // (each bone its length)
      }
      for (let i = 0; i <= F.n; i++) {
        const a = F.p[Math.max(0, i - 1)], b = F.p[Math.min(F.n, i + 1)]; dv.subVectors(b, a).normalize();
        const w = F.wW * 0.5 * (F.fluffy ? 1 : Math.sin(Math.min(1, i / F.n * 1.15) * PI * 0.92 + 0.15)) + F.wW * 0.04;
        s1.crossVectors(dv, right).normalize(); s2.crossVectors(dv, s1).normalize();
        const o = (F.v0 + i * 4) * 3, P = F.p[i];
        A[o] = P.x - s2.x * w; A[o + 1] = P.y - s2.y * w; A[o + 2] = P.z - s2.z * w; A[o + 3] = P.x + s2.x * w; A[o + 4] = P.y + s2.y * w; A[o + 5] = P.z + s2.z * w;
        A[o + 6] = P.x - s1.x * w * 0.7; A[o + 7] = P.y - s1.y * w * 0.7; A[o + 8] = P.z - s1.z * w * 0.7; A[o + 9] = P.x + s1.x * w * 0.7; A[o + 10] = P.y + s1.y * w * 0.7; A[o + 11] = P.z + s1.z * w * 0.7;
      }
    }
    this.primed = true; pos.needsUpdate = true; this.mesh.geometry.computeVertexNormals(); this.mesh.geometry.computeBoundingSphere();
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// ------------------------------------------------------------------ wearing one
const _b = new THREE.Box3(), _m = new THREE.Matrix4();
/** The helm `id` worn over `body`'s head (its shell set aside, kept for taking it off); null takes the worn one off. */
export function wearHelm(body, id, scene) {
  body.helm?.dispose(); body.helm = null;
  const head = body.joints?.head || body.joints?.neck; if (!head || !id || !HELMS[id]) return null;
  // fit: the head shell's box in the head's own frame (its meshes only, not a joint below it)
  head.updateWorldMatrix(true, true); _m.copy(head.matrixWorld).invert(); _b.makeEmpty();
  const shell = [];
  for (const o of head.children) if (o.isMesh) { shell.push(o); const g = o.geometry; g.computeBoundingBox(); _b.union(g.boundingBox.clone().applyMatrix4(o.matrix)); }
  if (_b.isEmpty()) _b.set(new THREE.Vector3(-0.6, 0, -0.6), new THREE.Vector3(0.6, 1.2, 0.6));
  const half = Math.max(_b.max.x - _b.min.x, _b.max.z - _b.min.z) / 2, k = half * 0.74, r = 1.55; // (k: metres a head unit; the bowl a little over the skull)
  const root = new THREE.Group(); root.name = 'mech-helm';
  root.position.set((_b.min.x + _b.max.x) / 2, _b.min.y + (_b.max.y - _b.min.y) * 0.38, (_b.min.z + _b.max.z) / 2); root.scale.setScalar(k);
  const B = build(id, r), mats = body.mats || {};
  B.p.ball(r * 0.6, { at: [0, -0.45, -0.1], c: L.lacquer }, 16, 12); // (the face's dark under every helm: the head's own shell is set aside)
  const mat = {
    p: mats.porcelain || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }),
    g: mats.gold || new THREE.MeshStandardMaterial({ color: 0xd9ab4c, metalness: 0.85, roughness: 0.3 }),
    lab: mats.lab || mats.labradorite || new THREE.MeshStandardMaterial({ color: 0x2a3441, metalness: 0.3, roughness: 0.25 }),
    glow: mats.glow || new THREE.MeshBasicMaterial({ color: 0xd8ccff }),
  };
  const own = Object.entries(mat).filter(([key]) => !(mats.porcelain && key === 'p') && !(mats.gold && key === 'g') && !(mats.lab || mats.labradorite ? key === 'lab' : false) && !(mats.glow && key === 'glow')).map(([, m]) => m);
  for (const [P, m] of [[B.p, mat.p], [B.g, mat.g], [B.lab, mat.lab], [B.glow, mat.glow]]) {
    if (!P.pos.length) continue; const geo = P.done();
    const tone = P === B.g ? 0xd9ab4c : P === B.lab ? 0x2a3441 : P === B.glow ? 0xffffff : null; // (a vertex-coloured program takes its colour per vertex)
    if (tone != null && m.vertexColors && geo.attributes.color) { const C = new THREE.Color(tone), a = geo.attributes.color; for (let i = 0; i < a.count; i++) a.setXYZ(i, C.r, C.g, C.b); }
    const mesh = new THREE.Mesh(geo, m); mesh.castShadow = m !== mat.glow; mesh.receiveShadow = true; root.add(mesh);
  }
  head.add(root);
  for (const o of shell) o.visible = false;
  const plume = new Plume(B.plumes, root, 1, scene || body.group.parent || body.group); // (its bones in the helm's frame: k is the root's scale)
  const handle = {
    id, root, plume,
    update(rawDt) { plume.visible = root.visible && !!body.group.parent && body.group.visible !== false; let o = body.group; while (o && plume.visible) { if (o.visible === false) plume.visible = false; o = o.parent; } plume.update(rawDt); },
    dispose() { root.parent?.remove(root); root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); for (const m of own) m.dispose(); plume.dispose(); for (const o of shell) o.visible = true; },
  };
  body.helm = handle;
  return handle;
}

/** The hangar's mech wearing a helm (its plumes stepped in the marks); `/helm id` to try one. The choice is a look for now (not kept). */
export function installMechHelms(game) {
  let want = null;
  const mech = () => game.hangar?.pilot?.mech || null;
  game.mechHelm = (id) => { want = id && HELMS[id] ? id : null; const B = mech(); if (B) wearHelm(B, want, game.scene); return want; };
  game.systems?.add?.('marks', (dt, raw) => {
    const B = mech(); if (!B) return;
    if ((B.helm?.id ?? null) !== want || (B.helm && B.helm.root.parent == null)) wearHelm(B, want, game.scene);
    B.helm?.update(raw ?? dt);
  }, { clock: 'raw', name: 'mechHelms' });
  game.chat?.add?.('helm', { help: `a helm on the hangar's mech: /helm ${Object.keys(HELMS).join(' | ')} (none: the head's own)`, run: ([id]) => {
    const got = game.mechHelm(id || null); game.events?.emit('mech.helm', { helm: got, by: 'courier' }); } });
  return game.mechHelm;
}
