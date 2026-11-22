// ---------------------------------------------------------------------------------------
// THE RECITAL'S INSTRUMENT (plain name: the mandolin-guitar; South, 2026-11-22: "a really sick looking acoustic-electric mandolin-guitar
// with five strings"): the instrument the Crucibelle's combat recital is played on (tools/crucibelle/recital.js). An F-style mandolin's
// body grown to a guitar's size: a teardrop with the scroll curling off its upper bout and one cutaway, a carved spruce top in a sunburst
// over flamed maple sides, cream binding; an oval soundhole with a rosette of Lachryma lit from inside; an archtop's floating bridge and a
// brass tailpiece; a magnetic pickup with five poles and two knobs (the acoustic-electric's half), its output jack on the lower bout,
// where the cable to the bell plugs in; a long neck with brass frets and glowing Lachryma inlays, a scroll headstock with five tuners
// (three and two). Five strings, each its note (the five notes of the bell, tools/crucibelle/songs.js DEGREE_COLOR as their light),
// each shaking when struck.
// Modelled in its own frame: +X along the neck toward the headstock, +Z out of the top, +Y across the body (the treble side); metres;
// the body's centre at the origin.
//
// Prior art: the Gibson F-5 mandolin (the scroll, the points, the f-style body), the Ovation and Takamine acoustic-electrics (the
// pickup in a hollow body, a jack on the end), the five-course instruments (the cittern, the bandolim's pairs), Brütal Legend's Clementine
// and Ozzy's axes (an instrument as a weapon, drawn to be seen).
//
//   const m = new RecitalGuitar()   m.group   m.pluck(i, k)   m.update(dt)   m.jackWorld(out)   m.strumWorld(out)   m.neckWorld(out)
//   GUITAR (its measures)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DEGREE_COLOR } from './songs.js';

export const GUITAR = { body: 0.5, width: 0.36, depth: 0.075, neck: 0.46, nut: 0.045, heel: 0.062, strings: 5, lach: 0x7fe6ff };

/** The body's outline (x along, y across): a teardrop, the scroll's curl on the upper treble bout, a cutaway under it. */
function bodyShape() {
  const s = new THREE.Shape(), L = GUITAR.body / 2, W = GUITAR.width / 2;
  s.moveTo(-L, 0);
  s.bezierCurveTo(-L, W * 1.15, -L * 0.1, W * 1.1, L * 0.35, W * 0.62); // (lower bass bout up to the waist)
  s.bezierCurveTo(L * 0.55, W * 0.45, L * 0.62, W * 0.55, L * 0.72, W * 0.42); // (the bass point)
  s.bezierCurveTo(L * 0.85, W * 0.3, L * 0.9, W * 0.2, L * 0.95, GUITAR.heel / 2);
  s.lineTo(L * 0.95, -GUITAR.heel / 2);
  s.bezierCurveTo(L * 0.8, -W * 0.25, L * 0.75, -W * 0.15, L * 0.6, -W * 0.35); // (the cutaway, treble side)
  s.bezierCurveTo(L * 0.72, -W * 0.75, L * 0.5, -W * 0.95, L * 0.38, -W * 0.72); // (the scroll's outer curl)
  s.bezierCurveTo(L * 0.3, -W * 0.6, L * 0.42, -W * 0.55, L * 0.36, -W * 0.5); // (its inner turn)
  s.bezierCurveTo(L * 0.1, -W * 0.55, -L * 0.1, -W * 1.15, -L, 0); // (the treble lower bout home)
  return s;
}

export class RecitalGuitar {
  constructor() {
    const g = (this.group = new THREE.Group()), G = GUITAR;
    const mat = (o) => new THREE.MeshStandardMaterial({ roughness: 0.45, ...o });
    // the body: sides and back (flamed maple, sunburst), the top a little proud of them, the binding a cream rim between
    const shape = bodyShape();
    const ext = (sh, d, bevel) => { const e = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 18 }); e.translate(0, 0, -d / 2); return e; };
    const back = ext(shape, G.depth, 0.006);
    const burst = (geo, inner, outer) => { const p = geo.attributes.position, c = new Float32Array(p.count * 3), a = new THREE.Color(inner), b = new THREE.Color(outer), t = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const r = Math.min(1, Math.hypot(p.getX(i) / (G.body / 2), p.getY(i) / (G.width / 2))); t.copy(a).lerp(b, Math.pow(r, 1.8)); c.set([t.r, t.g, t.b], i * 3); }
      geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo; };
    g.add(new THREE.Mesh(burst(back, 0x9a3c14, 0x24100a), mat({ vertexColors: true, roughness: 0.3, metalness: 0.05 })));
    const binding = new THREE.Mesh(ext(shape, 0.004, 0.004), mat({ color: 0xf1e6cc, roughness: 0.5 })); binding.position.z = G.depth / 2 + 0.004; binding.scale.set(1.012, 1.012, 1); g.add(binding);
    const top = ext(shape, 0.004, 0.002); top.translate(0, 0, G.depth / 2 + 0.009);
    g.add(new THREE.Mesh(burst(top, 0xf0c070, 0x5a220c), mat({ vertexColors: true, roughness: 0.25 })));
    const zt = G.depth / 2 + 0.014; // (the top's face)
    // the soundhole: dark oval, a rosette of Lachryma round it lit from inside, a ring of brass
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshBasicMaterial({ color: 0x050308 })); hole.scale.set(1.25, 1, 1); hole.position.set(G.body * 0.12, 0, zt + 0.0005); g.add(hole);
    this.rosette = new THREE.Mesh(new THREE.RingGeometry(0.048, 0.06, 32), new THREE.MeshBasicMaterial({ color: G.lach, toneMapped: false })); this.rosette.scale.set(1.25, 1, 1); this.rosette.position.set(G.body * 0.12, 0, zt + 0.001); g.add(this.rosette);
    const glowIn = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: G.lach, transparent: true, opacity: 0.5, toneMapped: false })); glowIn.position.set(G.body * 0.12, 0, zt - 0.02); g.add(glowIn); this.glowIn = glowIn;
    // the pickup between the soundhole and the bridge: a black bar, five brass poles, two knobs and a switch
    const black = mat({ color: 0x0c0a0c, roughness: 0.4 }), brass = mat({ color: 0xd8b04a, metalness: 0.85, roughness: 0.25 }), chrome = mat({ color: 0xd9dde2, metalness: 0.9, roughness: 0.2 });
    const pu = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.01), black); pu.position.set(-G.body * 0.08, 0, zt + 0.005); g.add(pu);
    const poles = []; for (let i = 0; i < 5; i++) { const p = new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 8); p.rotateX(Math.PI / 2); p.translate(-G.body * 0.08, (i - 2) * 0.013, zt + 0.011); poles.push(p); }
    g.add(new THREE.Mesh(mergeGeometries(poles), chrome));
    for (const [x, y] of [[-G.body * 0.32, -0.09], [-G.body * 0.38, -0.05]]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.014, 12), brass); k.rotation.x = Math.PI / 2; k.position.set(x, y, zt + 0.007); g.add(k); }
    // the floating bridge and the tailpiece
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.085, 0.014), mat({ color: 0x2a1208 })); bridge.position.set(-G.body * 0.2, 0, zt + 0.007); g.add(bridge);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.006), brass); tail.position.set(-G.body * 0.42, 0, zt + 0.004); tail.geometry.translate(0, 0, 0); g.add(tail);
    // the output jack on the lower bout's end (the cable's plug), a brass collar
    const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.02, 10), brass); jack.rotation.z = Math.PI / 2; jack.position.set(-G.body / 2 - 0.006, -0.03, 0); g.add(jack);
    this.jack = new THREE.Vector3(-G.body / 2 - 0.02, -0.03, 0);
    // the neck: maple, the fretboard ebony over it, brass frets, Lachryma inlays; the heel into the body's top
    const neckX0 = G.body * 0.45, neckL = G.neck;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(neckL, 1, 0.022), mat({ color: 0x8a4a1c, roughness: 0.4 }));
    const np = neck.geometry.attributes.position; for (let i = 0; i < np.count; i++) { const x = np.getX(i), t = x / neckL + 0.5; np.setY(i, np.getY(i) * (G.heel + (G.nut - G.heel) * t)); }
    neck.geometry.computeVertexNormals(); neck.position.set(neckX0 + neckL / 2, 0, zt - 0.004); g.add(neck);
    const board = new THREE.Mesh(new THREE.BoxGeometry(neckL + 0.06, 1, 0.006), mat({ color: 0x120a08, roughness: 0.6 }));
    const bp = board.geometry.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), t = x / (neckL + 0.06) + 0.5; bp.setY(i, bp.getY(i) * (G.heel + (G.nut - G.heel) * t)); }
    board.geometry.computeVertexNormals(); board.position.set(neckX0 + neckL / 2 - 0.03, 0, zt + 0.01); g.add(board);
    const frets = [], inl = [];
    for (let f = 1; f <= 18; f++) { const x = neckX0 + neckL - neckL * (1 - Math.pow(2, -f / 12)) * 1.6; if (x < neckX0 - 0.02) break; const w = G.heel + (G.nut - G.heel) * ((x - neckX0) / neckL); const b = new THREE.BoxGeometry(0.0022, w, 0.003); b.translate(x, 0, zt + 0.0145); frets.push(b);
      if ([3, 5, 7, 9, 12, 15].includes(f)) { const d = new THREE.CircleGeometry(0.004, 10); d.translate(x + 0.012, f === 12 ? 0.012 : 0, zt + 0.0135); inl.push(d); if (f === 12) { const d2 = new THREE.CircleGeometry(0.004, 10); d2.translate(x + 0.012, -0.012, zt + 0.0135); inl.push(d2); } } }
    g.add(new THREE.Mesh(mergeGeometries(frets), brass));
    this.inlays = new THREE.Mesh(mergeGeometries(inl), new THREE.MeshBasicMaterial({ color: G.lach, toneMapped: false })); g.add(this.inlays);
    // the headstock: a scroll paddle, five tuners (three on the bass side, two on the treble) with pearl buttons
    const hx = neckX0 + neckL;
    const hs = new THREE.Shape(); hs.moveTo(0, -G.nut / 2); hs.bezierCurveTo(0.05, -0.04, 0.1, -0.05, 0.13, -0.03); hs.bezierCurveTo(0.16, -0.01, 0.15, 0.03, 0.12, 0.045); hs.bezierCurveTo(0.08, 0.06, 0.03, 0.04, 0, G.nut / 2); hs.lineTo(0, -G.nut / 2);
    const head = ext(hs, 0.016, 0.003); head.translate(hx, 0, zt - 0.004);
    g.add(new THREE.Mesh(burst(head, 0x5a220c, 0x24100a), mat({ vertexColors: true, roughness: 0.3 })));
    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.004, G.nut, 0.006), mat({ color: 0xf1e6cc })); nut.position.set(hx, 0, zt + 0.013); g.add(nut);
    const pegs = [];
    [[0.035, 0.038], [0.07, 0.044], [0.105, 0.04], [0.05, -0.04], [0.095, -0.04]].forEach(([x, y]) => {
      const post = new THREE.CylinderGeometry(0.003, 0.003, 0.02, 6); post.rotateX(Math.PI / 2); post.translate(hx + x, y * 0.7, zt + 0.012); pegs.push(post);
      const key = new THREE.BoxGeometry(0.012, 0.018, 0.004); key.translate(hx + x, y + Math.sign(y) * 0.012, zt - 0.01); pegs.push(key);
    });
    g.add(new THREE.Mesh(mergeGeometries(pegs), chrome));
    // the five strings: tailpiece to nut, each its own mesh (each shakes alone), lit faintly in its note's colour
    this.strings = [];
    const x0 = -G.body * 0.4, x1 = hx, len = x1 - x0;
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0009 + (4 - i) * 0.00025, 0.0009 + (4 - i) * 0.00025, len, 4, 8), new THREE.MeshBasicMaterial({ color: 0xe8e2d6 }));
      s.geometry.rotateZ(Math.PI / 2); s.position.set((x0 + x1) / 2, 0, zt + 0.02);
      this.strings.push({ m: s, y0: 0, y1: 0, k: 0, ph: 0, col: new THREE.Color(DEGREE_COLOR[i]), base: new THREE.Color(0xe8e2d6) });
      g.add(s);
    }
    this.layStrings(x0, x1, zt);
    this.strumAt = new THREE.Vector3(G.body * 0.12, -0.02, zt + 0.06); // (the strumming hand over the soundhole)
    this.neckAt = new THREE.Vector3(hx - 0.1, 0.01, zt - 0.03); // (the fretting hand round the neck, near the nut)
    this.t = 0; this.glow = 0;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  /** Each string from its point at the bridge to its point at the nut (they fan with the neck's taper). */
  layStrings(x0, x1, zt) {
    const G = GUITAR;
    this.strings.forEach((s, i) => {
      s.y0 = (i - 2) * 0.014; s.y1 = (i - 2) * (G.nut - 0.01) / 4;
      const dx = x1 - x0, dy = s.y1 - s.y0; s.m.position.set((x0 + x1) / 2, (s.y0 + s.y1) / 2, zt + 0.02); s.m.rotation.z = Math.atan2(dy, dx); s.len = Math.hypot(dx, dy);
    });
  }
  /** String i struck (0..4), k its strength. */
  pluck(i, k = 1) { const s = this.strings[i]; if (s) { s.k = Math.max(s.k, k); } this.glow = Math.max(this.glow, 0.6 + 0.4 * k); }
  update(dt) {
    this.t += dt; this.glow = Math.max(0, this.glow - dt * 1.8);
    for (const s of this.strings) {
      s.k = Math.max(0, s.k - dt * 2.4);
      const a = s.k * 0.0025 * Math.sin(this.t * 90 + s.ph); s.m.scale.set(1, 1 + s.k * 1.5, 1); s.m.position.z = GUITAR.depth / 2 + 0.034 + a;
      s.m.material.color.copy(s.base).lerp(s.col, Math.min(1, s.k * 1.2));
    }
    this.glowIn.material.opacity = 0.35 + 0.6 * this.glow;
    const c = 0.6 + 0.4 * this.glow; this.rosette.material.color.setHex(GUITAR.lach).multiplyScalar(c); this.inlays.material.color.setHex(GUITAR.lach).multiplyScalar(c);
  }
  jackWorld(out) { return out.copy(this.jack).applyMatrix4(this.group.matrixWorld); }
  strumWorld(out) { return out.copy(this.strumAt).applyMatrix4(this.group.matrixWorld); }
  neckWorld(out) { return out.copy(this.neckAt).applyMatrix4(this.group.matrixWorld); }
}
