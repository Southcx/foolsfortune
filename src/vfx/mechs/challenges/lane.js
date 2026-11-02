// ---------------------------------------------------------------------------------------
// THE SMASH CHALLENGES' DRESS: THE LANE'S PIECES (plain name; docs/plans/MECHS.md 11.1; the runtime Dovina's, world/hangar/challenges.js):
// what each of her placeholders is drawn as, one builder a piece, at the mech's scale (a 14 m frame throwing a water tower), every
// piece hung as a child of her placeholder so her placement, her pivots and her clearing carry it. One job: the pieces' shapes and
// their materials; when they are worn and what happens to them is the dresser's (vfx/mechs/challenges/index.js).
//   THE LECTERN   `challenge.lectern`: an octagonal pedestal glazed celadon over a tenmoku foot, a gold desk tilted to the frame, and
//                 on two lacquered posts a gold-leaf sign board at the frame's eye (11 m) in the house's type, both faces
//   THE LINE      `challenge.line`: the throw line painted vermilion across the lane between two white edges, three chevrons painted
//                 down the lane past it, and over it a vermilion torii as the start gantry, three signal lamps hung from its tie beam
//   THE TARGET    `challenge.ring.0` (Bullseye's bull; the other rings hidden): a giant archery target painted on the yard's clay
//                 in Strawman's cream and red (10 and 50 cream, 25 red), the bull gold leaf, each ring's edge a glazed ink line, a
//                 clay curb round it
//   A PIN         `challenge.pin.<i>`: a giant bowling pin thrown in white porcelain, chunky, two vermilion bands at its neck, a
//                 kokeshi's black hair on its head and a kokeshi's face toward the line; pivoted at its foot as her group is
//   THE TOWER     every water tower prop: a staved tank in iron hoops under a conical shingled roof, four timber legs braced
//                 crosswise (the legs a group of their own, hidden while it rolls as the bowling ball)
// Prior art: The Incredible Hulk: Ultimate Destruction's Gamma Golf and its bowling lane, a torii as a gate (Fushimi Inari's
// vermilion), the kyūdō range's mato (concentric rings, its target set in a bank of clay), kokeshi dolls (Tōhoku's turned wood, the
// painted face and the black hair), the American railroad water tower (staved tank, hoops, conical roof).
//
//   const K = laneKit()   K.lectern() K.line() K.target(radii) K.pin() K.tower() -> Group   K.lamps (the line's lamp materials, latest)
//   K.dispose()   LANE_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from '../../../ui/theme.js';
import { PINS, LANE } from '../../../progress/mechs/challenges.js';
import { PROP_LOOK } from '../../../world/hangar/props.js';

/** The colours and sizes (m): the glazes, the gold, the vermilion, the board's height, the torii's. */
export const LANE_LOOK = {
  celadon: 0x8fb8a0, tenmoku: 0x3a2016, gold: 0xd9a441, vermilion: 0xd23a22, cream: 0xefe2c4, red: 0xb8322a, ink: 0x1c1410, porcelain: 0xf6f2ea,
  lacquer: 0x1a1210, wood: 0x7a5434, iron: 0x3a3632, roof: 0x5a3a2a,
  board: { w: 10, h: 2.6, y: 11 }, torii: { h: 19, span: LANE.width / 2 + 2.5, r: 0.7 }, lamp: [0xff3a2a, 0xff3a2a, 0xffd36a],
};
const K = LANE_LOOK, PI = Math.PI;

/** Pieces merged by material: add(geo, key, at, rot, scale) then done(group, mats). */
class Bin {
  constructor() { this.m = {}; }
  add(g, key, at = [0, 0, 0], rot = [0, 0, 0], s = 1) {
    const M = new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), Array.isArray(s) ? new THREE.Vector3(...s) : new THREE.Vector3(s, s, s));
    (this.m[key] ||= []).push(g.index ? g.toNonIndexed().applyMatrix4(M) : g.applyMatrix4(M)); if (g.index) g.dispose();
  }
  done(group, mats, name) {
    for (const [k, list] of Object.entries(this.m)) {
      for (const g of list) { if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
      const g = mergeGeometries(list, false); for (const x of list) x.dispose(); if (!g) continue;
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mats[k]); m.name = `${name}.${k}`; m.castShadow = true; m.receiveShadow = true; group.add(m);
    }
    this.m = {}; return group;
  }
}

/** A canvas texture drawn once by `draw(g, w, h)`, redrawn when the faces load. */
function canvasTex(w, h, draw, keep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
  paint(); try { document.fonts?.ready?.then(paint); } catch { /* (headless) */ }
  keep.push(t); return t;
}

export function laneKit() {
  const texs = [], geos = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, ...o });
  const glaze = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, ...o });
  // ---------------------------------------------------------------- the canvases
  const signTex = canvasTex(1024, 268, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f6d27a'); gr.addColorStop(0.5, '#d9a441'); gr.addColorStop(1, '#a8741e');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,240,200,${0.05 + (k % 5) * 0.02})`; g.fillRect((k * 173) % W, 0, 2 + (k % 7), H); } // (the leaf's squares)
    g.strokeStyle = '#7a1e12'; g.lineWidth = 14; g.strokeRect(10, 10, W - 20, H - 20); g.strokeStyle = '#2a1408'; g.lineWidth = 3; g.strokeRect(26, 26, W - 52, H - 52);
    g.fillStyle = '#2a1408'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 104px ${FONT.title}`; g.fillText('SMASH CHALLENGES', W / 2, H * 0.42, W - 90);
    g.fillStyle = '#7a1e12'; g.font = `40px ${FONT.sys}`; g.fillText('THE LANE  ·  F BESIDE THE DESK', W / 2, H * 0.78, W - 120);
  }, texs);
  const lineTex = canvasTex(64, 1024, (g, W, H) => {
    g.fillStyle = '#efe6d4'; g.fillRect(0, 0, W, H); g.fillStyle = '#d23a22'; g.fillRect(10, 0, W - 20, H);
    for (let k = 0; k < 140; k++) { g.fillStyle = `rgba(40,16,8,${0.06 + (k % 4) * 0.03})`; g.fillRect((k * 37) % W, (k * 83) % H, 3, 6 + (k % 9)); } // (the paint worn by the frame's feet)
  }, texs);
  const chevTex = canvasTex(256, 256, (g, W) => {
    g.fillStyle = '#d23a22'; g.strokeStyle = '#efe6d4'; g.lineWidth = 10; g.lineJoin = 'miter';
    g.beginPath(); g.moveTo(40, 20); g.lineTo(200, 128); g.lineTo(40, 236); g.lineTo(40, 176); g.lineTo(120, 128); g.lineTo(40, 80); g.closePath(); g.fill(); g.stroke();
  }, texs);
  const targetTex = canvasTex(1024, 1024, (g, W) => {
    const c = W / 2, R = c - 4, rad = (r) => (r / 28.6) * R;
    g.fillStyle = '#b06a44'; g.fillRect(0, 0, W, W); // (the yard's clay round it)
    const band = (r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, rad(r1), 0, PI * 2); g.arc(c, c, rad(r0), 0, PI * 2, true); g.fill(); };
    band(18, 28, '#efe2c4'); band(10, 18, '#9a1a12'); band(4, 10, '#efe2c4'); band(0, 4, '#e8b440');
    for (let k = 0; k < 900; k++) { const a = k * 2.399, r = Math.sqrt(k / 900) * R; g.fillStyle = `rgba(${k % 3 ? '80,40,20' : '255,240,210'},0.06)`; g.fillRect(c + Math.cos(a) * r, c + Math.sin(a) * r, 6 + (k % 5) * 3, 3); } // (the clay under the paint)
    g.strokeStyle = '#1c1410'; for (const r of [4, 10, 18, 28]) { g.lineWidth = r === 28 ? 14 : 9; g.beginPath(); g.arc(c, c, rad(r), 0, PI * 2); g.stroke(); }
    g.strokeStyle = 'rgba(255,240,210,0.5)'; g.lineWidth = 3; for (const r of [4, 10, 18]) { g.beginPath(); g.arc(c, c, rad(r) - 6, 0, PI * 2); g.stroke(); } // (the glaze's catch-light inside each line)
  }, texs);
  const faceTex = canvasTex(256, 256, (g) => { // (a kokeshi's face: the brows, the narrow eyes, a small red mouth, the cheeks)
    g.strokeStyle = '#1c1410'; g.lineCap = 'round'; g.lineWidth = 7;
    for (const x of [86, 170]) { g.beginPath(); g.arc(x, 112, 22, PI * 1.15, PI * 1.85); g.stroke(); g.beginPath(); g.arc(x, 128, 18, PI * 0.15, PI * 0.85); g.stroke(); }
    g.fillStyle = '#d23a22'; g.beginPath(); g.ellipse(128, 182, 12, 8, 0, 0, PI * 2); g.fill();
    g.fillStyle = 'rgba(230,90,80,0.35)'; for (const x of [62, 194]) { g.beginPath(); g.arc(x, 160, 20, 0, PI * 2); g.fill(); }
  }, texs);
  const staveTex = canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = '#8a5e3a'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 16) { g.fillStyle = `rgba(${x % 32 ? '50,28,14' : '200,150,100'},0.18)`; g.fillRect(x, 0, 16, H); g.fillStyle = 'rgba(30,16,8,0.6)'; g.fillRect(x, 0, 2, H); }
    for (let k = 0; k < 80; k++) { g.fillStyle = 'rgba(40,20,10,0.15)'; g.fillRect((k * 59) % W, (k * 31) % H, 1, 10 + (k % 12)); }
  }, texs);
  staveTex.wrapS = staveTex.wrapT = THREE.RepeatWrapping;
  const mats = {
    celadon: glaze(K.celadon), tenmoku: glaze(K.tenmoku, { roughness: 0.25 }), gold: std({ color: K.gold, metalness: 0.9, roughness: 0.3 }),
    lacquer: glaze(K.lacquer, { roughness: 0.2 }), sign: new THREE.MeshStandardMaterial({ map: signTex, metalness: 0.5, roughness: 0.38, side: THREE.DoubleSide }),
    vermilion: glaze(K.vermilion, { roughness: 0.4 }), black: glaze(K.ink, { roughness: 0.15 }),
    paint: std({ map: lineTex, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, emissive: new THREE.Color(K.vermilion), emissiveIntensity: 0.0 }),
    chevron: std({ map: chevTex, transparent: true, alphaTest: 0.5, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }),
    target: std({ map: targetTex, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }),
    leaf: std({ color: 0xf0bc48, metalness: 0.35, roughness: 0.3, emissive: new THREE.Color(0x8a5a10), emissiveIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -10 }),
    clay: std({ color: 0x9a5a38, roughness: 0.9 }),
    porcelain: glaze(K.porcelain, { roughness: 0.22, sheen: 0.3 }), face: new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, depthWrite: false, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    stave: std({ map: staveTex, roughness: 0.85 }), iron: std({ color: K.iron, metalness: 0.6, roughness: 0.5 }), roof: std({ color: K.roof, roughness: 0.9, flatShading: true }),
    wood: std({ color: K.wood, roughness: 0.9 }),
  };
  const kit = { mats, lamps: null, geos };
  const keepGeo = (g) => { geos.push(g); return g; };

  /** The lectern over her pedestal (its origin on the ground). */
  kit.lectern = () => {
    const G = new THREE.Group(); G.name = 'challenge.dress.lectern'; const B = new Bin(), oct = (rt, rb, h) => new THREE.CylinderGeometry(rt, rb, h, 8);
    B.add(oct(2.9, 3.2, 0.9), 'tenmoku', [0, 0.45, 0], [0, PI / 8, 0]);
    B.add(oct(2.3, 2.6, 0.5), 'tenmoku', [0, 1.15, 0], [0, PI / 8, 0]);
    B.add(oct(1.55, 1.85, 3.2), 'celadon', [0, 3, 0], [0, PI / 8, 0]);
    B.add(oct(2.2, 1.7, 0.6), 'celadon', [0, 4.9, 0], [0, PI / 8, 0]);
    B.add(oct(2.5, 2.5, 0.16), 'gold', [0, 4.62, 0], [0, PI / 8, 0]); B.add(oct(2.9, 2.9, 0.16), 'gold', [0, 0.95, 0], [0, PI / 8, 0]);
    B.add(new THREE.BoxGeometry(3.6, 0.3, 2.6), 'gold', [0, 5.55, 0.2], [-0.28, 0, 0]); // (the desk, tilted to the frame)
    B.add(new THREE.BoxGeometry(3.8, 0.12, 0.3), 'lacquer', [0, 5.62, 1.45], [-0.28, 0, 0]);
    for (const s of [-1, 1]) { // (the posts carrying the board at the frame's eye)
      B.add(new THREE.CylinderGeometry(0.32, 0.38, 11.4, 10), 'lacquer', [s * 4.4, 5.7, -0.4]);
      B.add(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), 'gold', [s * 4.4, 0.15, -0.4]);
      B.add(new THREE.SphereGeometry(0.5, 12, 8), 'gold', [s * 4.4, 11.6, -0.4]);
      B.add(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 10), 'gold', [s * 4.4, 3.4, -0.4]);
    }
    B.add(new THREE.BoxGeometry(K.board.w + 0.5, K.board.h + 0.5, 0.25), 'lacquer', [0, K.board.y, -0.4]);
    B.done(G, mats, 'challenge.dress.lectern');
    for (const s of [1, -1]) { const p = new THREE.Mesh(keepGeo(new THREE.PlaneGeometry(K.board.w, K.board.h)), mats.sign); p.position.set(0, K.board.y, -0.4 + s * 0.14); p.rotation.y = s > 0 ? 0 : PI; G.add(p); }
    return G;
  };

  /** The throw line, its chevrons and the start torii (the line's mesh is centred 0.1 m up: the ground at y -0.1). */
  kit.line = () => {
    const G = new THREE.Group(); G.name = 'challenge.dress.line'; const T = K.torii, y0 = -0.1;
    const band = new THREE.Mesh(keepGeo(new THREE.PlaneGeometry(2.4, LANE.width + 2)), mats.paint); band.rotation.x = -PI / 2; band.position.y = y0 + 0.04; band.receiveShadow = true; G.add(band);
    for (const [x, s] of [[6, 3.2], [11, 3.8], [17, 4.4]]) { const c = new THREE.Mesh(keepGeo(new THREE.PlaneGeometry(s, s)), mats.chevron); c.rotation.set(-PI / 2, 0, 0); c.position.set(x, y0 + 0.04, 0); c.receiveShadow = true; G.add(c); }
    const B = new Bin();
    for (const s of [-1, 1]) {
      B.add(new THREE.CylinderGeometry(T.r * 0.85, T.r, T.h, 14), 'vermilion', [0, y0 + T.h / 2, s * T.span]);
      B.add(new THREE.CylinderGeometry(T.r * 1.35, T.r * 1.45, 1.4, 14), 'black', [0, y0 + 0.7, s * T.span]); // (the pillars' black feet)
    }
    B.add(new THREE.BoxGeometry(1.5, 1.1, T.span * 2 + 7), 'black', [0, y0 + T.h + 0.55, 0]); // (the kasagi, its ends lifted below)
    B.add(new THREE.BoxGeometry(1.7, 0.9, T.span * 2 + 5), 'vermilion', [0, y0 + T.h - 0.3, 0]);
    for (const s of [-1, 1]) B.add(new THREE.BoxGeometry(1.5, 0.9, 3), 'black', [0, y0 + T.h + 0.85, s * (T.span + 3.2)], [s * 0.18, 0, 0]);
    B.add(new THREE.BoxGeometry(1.1, 0.9, T.span * 2 + 2.6), 'vermilion', [0, y0 + T.h - 3.6, 0]); // (the nuki, the tie beam the lamps hang from)
    B.add(new THREE.BoxGeometry(0.7, 2.7, 1.2), 'black', [0, y0 + T.h - 2, 0]); // (the gakuzuka post between them)
    for (let i = 0; i < 3; i++) { const z = (i - 1) * 3.4; B.add(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), 'iron', [0, y0 + T.h - 4.75, z]); B.add(new THREE.CylinderGeometry(1, 1, 0.5, 16), 'black', [-0.4, y0 + T.h - 5.6, z], [0, 0, PI / 2]); }
    B.done(G, mats, 'challenge.dress.torii');
    kit.lamps = K.lamp.map((c, i) => { // (the three signal lamps, their lenses toward the frame behind the line)
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(0.2), toneMapped: false });
      const d = new THREE.Mesh(keepGeo(new THREE.CircleGeometry(0.82, 18)), m); d.rotation.y = -PI / 2; d.position.set(-0.68, y0 + T.h - 5.6, (i - 1) * 3.4); G.add(d); d.userData.lit = c; return d;
    });
    G.userData.lamps = kit.lamps; G.userData.paint = mats.paint;
    return G;
  };

  /** The target over the bull (its mesh 0.1 m thick, a few cm up): the painted face, the bull's gold leaf, its curb. */
  kit.target = (outer = 28) => {
    const G = new THREE.Group(), R = outer + 0.6; G.name = 'challenge.dress.target';
    const face = new THREE.Mesh(keepGeo(new THREE.CircleGeometry(R, 96)), mats.target); face.rotation.x = -PI / 2; face.position.y = 0.04; face.receiveShadow = true; G.add(face);
    const bull = new THREE.Mesh(keepGeo(new THREE.CircleGeometry(3.85, 48)), mats.leaf); bull.rotation.x = -PI / 2; bull.position.y = 0.07; G.add(bull);
    const B = new Bin();
    B.add(new THREE.TorusGeometry(R + 0.3, 0.6, 6, 96), 'clay', [0, 0.1, 0], [PI / 2, 0, 0], [1, 1, 0.5]);
    B.add(new THREE.TorusGeometry(4.05, 0.18, 5, 48), 'gold', [0, 0.1, 0], [PI / 2, 0, 0], [1, 1, 0.5]);
    B.done(G, mats, 'challenge.dress.target');
    return G;
  };

  /** One pin, its foot at the group's origin, its face toward -x (the line). */
  const pinGeo = (() => {
    const h = PINS.h, prof = [[0, 0], [0.95, 0], [1.22, 0.45], [1.48, 1.7], [1.5, 2.7], [1.22, 3.9], [0.84, 4.9], [0.72, 5.45], [0.78, 6.05], [0.95, 6.7], [0.98, 7.15], [0.86, 7.6], [0.5, 7.92], [0, h]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = keepGeo(new THREE.LatheGeometry(prof, 28));
    const bandG = (y0, y1) => keepGeo(new THREE.LatheGeometry([[0.8, y0], [0.83, (y0 + y1) / 2], [0.8, y1]].map(([r, y]) => new THREE.Vector2(r, y)), 28));
    const hair = keepGeo(new THREE.SphereGeometry(1.0, 24, 12, 0, PI * 2, 0, PI * 0.42).translate(0, 6.85, 0));
    const fringe = keepGeo(new THREE.SphereGeometry(1.01, 24, 6, PI * 0.8, PI * 1.4, PI * 0.38, PI * 0.1).translate(0, 6.85, 0)); // (the fringe round the back and sides)
    return { body, bands: [bandG(5.2, 5.55), bandG(5.75, 5.95)], hair, fringe, face: keepGeo(new THREE.PlaneGeometry(1.3, 1.3)) };
  })();
  kit.pin = () => {
    const G = new THREE.Group(); G.name = 'challenge.dress.pin'; const add = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; G.add(o); return o; };
    add(pinGeo.body, mats.porcelain); for (const b of pinGeo.bands) add(b, mats.vermilion); add(pinGeo.hair, mats.black); add(pinGeo.fringe, mats.black);
    const f = add(pinGeo.face, mats.face); f.castShadow = false; f.position.set(-0.985, 6.72, 0); f.rotation.y = -PI / 2;
    return G;
  };

  /** A water tower over the prop's placeholder (its foot at its origin): `legs` a group of its own. */
  kit.tower = () => {
    const L = PROP_LOOK.tower, G = new THREE.Group(), B = new Bin(), yT = L.legs + L.h / 2; G.name = 'challenge.dress.tower';
    const tank = new THREE.CylinderGeometry(L.r + 0.12, L.r + 0.2, L.h, 20, 1, true); const U = tank.attributes.uv; for (let i = 0; i < U.count; i++) U.setX(i, U.getX(i) * 4);
    B.add(tank, 'stave', [0, yT, 0]);
    B.add(new THREE.CircleGeometry(L.r + 0.2, 20), 'wood', [0, yT - L.h / 2, 0], [PI / 2, 0, 0]);
    for (const f of [-0.42, -0.14, 0.14, 0.42]) B.add(new THREE.TorusGeometry(L.r + 0.2 + (0.5 - Math.abs(f)) * 0.04, 0.08, 5, 24), 'iron', [0, yT + f * L.h, 0], [PI / 2, 0, 0]);
    B.add(new THREE.ConeGeometry(L.r + 0.7, 1.8, 20, 1), 'roof', [0, yT + L.h / 2 + 0.9, 0]);
    B.add(new THREE.SphereGeometry(0.3, 10, 6), 'iron', [0, yT + L.h / 2 + 1.9, 0]);
    B.done(G, mats, 'challenge.dress.tank');
    const legs = new THREE.Group(); legs.name = 'challenge.dress.towerLegs'; G.add(legs); const BL = new Bin(), a = L.r * 0.7;
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) BL.add(new THREE.BoxGeometry(0.5, L.legs, 0.5), 'wood', [x * a, L.legs / 2, z * a]);
    for (const [ax, rotY] of [[[0, -a], 0], [[0, a], 0], [[-a, 0], PI / 2], [[a, 0], PI / 2]]) for (const s of [-1, 1]) {
      BL.add(new THREE.BoxGeometry(0.16, Math.hypot(2 * a, L.legs * 0.8), 0.16), 'wood', [ax[0], L.legs * 0.5, ax[1]], [0, rotY, s * Math.atan2(2 * a, L.legs * 0.8)]); // (the cross braces)
    }
    BL.done(legs, mats, 'challenge.dress.towerLegs');
    G.userData.legs = legs; return G;
  };

  /** Every dressed piece's meshes share these: let go when the dresser is. */
  kit.dispose = () => { for (const t of texs) t.dispose(); for (const g of geos) g.dispose(); for (const m of Object.values(mats)) m.dispose(); };
  return kit;
}

/** A dressed piece's own merged geometry let go (its shared materials are the kit's). */
export function disposeDress(G) { G?.removeFromParent(); G?.traverse((o) => { if (o.isMesh && /\.(\w+)$/.test(o.name) && o.geometry && !o.userData.shared) o.geometry.dispose(); }); }
