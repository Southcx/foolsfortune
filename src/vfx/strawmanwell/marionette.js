// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE MARIONETTE (a part of the Well's look, vfx/strawmanwell/look.js; Dovina's note of 2026-10-31, wave 3):
// the chase stage's giant puppet (Dovina's placeholder and rules, world/strawmanwell/stages/chasemarionette.js `Marionette`, held by the
// chase module as `MOD.chase.puppet`) dressed as Strawman's own puppet of himself, sewn by Pip at the toy theatre's scale from the
// sewing basket: a burlap sack body with Strawman's red-on-cream target and its stitched seams, straw bursting at the neck and the
// cuffs, a round sack head with stitched X eyes and a running-stitch mouth, a brass thimble for its block hat, charcoal sleeves on
// wooden peg joints with cream mitten hands, maple dowel legs with button knees and thread-spool feet, and overhead the walnut
// airplane control bar with brass eyelets the cream strings run from. When the puppet tangles (its phase `tangled`) it is the
// placeholder's own motion that sags it; the dress rides its parts.
//   how     each frame the part looks for the chase module's puppet; a new one is dressed (its placeholder meshes hidden, the dress
//           parented to its body, head, arms, legs and bar so the rules' motion carries it), the strings recoloured thread; a puppet
//           gone (the stage cleared, a retry's rebuild) lets the dress's own materials go (the puppet's dispose takes its geometry).
// Looks only: nothing here moves it, reaches for the Courier or touches a collider.
//
// Prior art: the Strawman's own make (vfx/strawman.js: the burlap, the target, the X eyes, the spiral cuffs), Pinocchio's Stromboli
// marionettes and the Bunraku-sized puppets of Royal de Luxe's giants (a puppet the size of a house, its strings from a crane), the
// airplane control bar of the string puppeteer, Pip's sewing kit (vfx/strawmanwell/props.js: thimbles, spools, buttons, pins).
//
//   dressMarionette(ctx) -> { update(dt), dispose() }   MARIONETTE_LOOK (its colours and sizes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MOD } from '../../world/strawmanwell/stagemods.js';

export const MARIONETTE_LOOK = { straw: 0xe0b85a, strawDark: 0xa98534, red: 0xb8322a, cream: 0xefe2c4, charcoal: 0x35302c, button: 0x2f6f8a, thread: 0xf2e6c8 };
const M = MARIONETTE_LOOK;

/** The sack's front (Strawman's target on burlap, its seams stitched) and the face (X eyes, the running stitch), drawn once a puppet. */
function sackCanvas(face) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  g.fillStyle = '#b8945e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 3) { g.fillStyle = `rgba(90,62,30,${0.08 + (i % 6 ? 0.05 : 0.12)})`; g.fillRect(0, i, S, 1); g.fillRect(i, 0, 1, S); } // (the weave)
  g.strokeStyle = '#4a321c'; g.lineWidth = 3; g.setLineDash([9, 7]); g.strokeRect(10, 10, S - 20, S - 20); g.setLineDash([]);
  if (!face) {
    for (const [r, c] of [[88, '#efe2c4'], [64, '#b8322a'], [40, '#efe2c4'], [18, '#b8322a']]) { g.fillStyle = c; g.beginPath(); g.arc(S / 2, S / 2, r, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#5a1810'; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.arc(S / 2, S / 2, 88, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  } else {
    g.strokeStyle = '#1c1410'; g.lineCap = 'round'; g.lineWidth = 12;
    for (const x of [80, 176]) { g.beginPath(); g.moveTo(x - 22, 82); g.lineTo(x + 22, 126); g.moveTo(x + 22, 82); g.lineTo(x - 22, 126); g.stroke(); }
    g.lineWidth = 7; g.beginPath(); g.moveTo(70, 178); g.quadraticCurveTo(128, 204, 186, 178); g.stroke();
    g.lineWidth = 4; for (let x = 80; x <= 176; x += 16) { g.beginPath(); g.moveTo(x, 176 + Math.sin((x - 70) / 116 * Math.PI) * 13 - 9); g.lineTo(x, 176 + Math.sin((x - 70) / 116 * Math.PI) * 13 + 9); g.stroke(); }
    g.fillStyle = 'rgba(200,96,106,0.35)'; for (const x of [52, 204]) { g.beginPath(); g.arc(x, 160, 18, 0, Math.PI * 2); g.fill(); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** A tuft of straw: thin cones splayed outward round a ring of radius r, in the straw's two colours. */
function straw(r, n, len, mats, up = 1) {
  const g = new THREE.Group(), geo = new THREE.ConeGeometry(0.05, len, 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.3, m = new THREE.Mesh(geo, mats[i % 2]);
    m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    m.rotation.set(Math.sin(a) * 0.9 * up, 0, -Math.cos(a) * 0.9 * up); m.rotation.x += (i % 4) * 0.08; g.add(m);
  }
  return g;
}

function dress(P, palette) {
  const own = [], tex = [];
  const mat = (o) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o }); own.push(m); return m; };
  const front = sackCanvas(false), face = sackCanvas(true); tex.push(front, face);
  const burlap = mat({ color: palette.burlap ?? 0xb8945e }), body = mat({ map: front }), faceM = mat({ map: face });
  const char = mat({ color: M.charcoal }), cream = mat({ color: M.cream }), maple = mat({ color: palette.maple ?? 0xc89a5c, roughness: 0.6 });
  const walnut = mat({ color: palette.walnut ?? 0x6b4226, roughness: 0.55 }), brass = mat({ color: palette.brass ?? 0xd8a944, metalness: 0.75, roughness: 0.35 });
  const button = mat({ color: M.button, roughness: 0.4 }), red = mat({ color: M.red });
  const strawM = [mat({ color: M.straw }), mat({ color: M.strawDark })];
  const mesh = (geo, m, parent, pos = [0, 0, 0], rot = null) => { const x = new THREE.Mesh(geo, m); x.position.set(...pos); if (rot) x.rotation.set(...rot); x.castShadow = true; parent.add(x); return x; };
  // the body: a sack, cinched at the neck and the hem, its target on the front (a soft cylinder of burlap, the target a decal panel)
  const sack = new THREE.CylinderGeometry(1.05, 1.3, 3.2, 14, 3); const sp = sack.attributes.position;
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i) / 1.6, k = 1 - 0.12 * Math.abs(y) ** 3 + 0.05 * Math.sin(i * 1.7); sp.setX(i, sp.getX(i) * k); sp.setZ(i, sp.getZ(i) * k * 0.72); }
  sack.computeVertexNormals();
  mesh(sack, burlap, P.body);
  mesh(new THREE.PlaneGeometry(1.7, 1.7), body, P.body, [0, 0.1, 0.92]);
  mesh(new THREE.TorusGeometry(0.8, 0.09, 6, 16), mat({ color: M.cream }), P.body, [0, 1.55, 0], [Math.PI / 2, 0, 0]); // (the cinch cord)
  const neck = straw(0.55, 14, 0.7, strawM); neck.position.y = 1.7; P.body.add(neck);
  const hem = straw(0.95, 16, 0.6, strawM, -1); hem.position.y = -1.6; hem.rotation.x = Math.PI; P.body.add(hem);
  // the head: a round sack, its face sewn on, a brass thimble for its hat, a red patch
  const skull = new THREE.SphereGeometry(1.0, 16, 12); skull.scale(1, 0.92, 0.85);
  mesh(skull, burlap, P.head);
  mesh(new THREE.CircleGeometry(0.78, 20), faceM, P.head, [0, 0, 0.84]);
  const thimble = mesh(new THREE.CylinderGeometry(0.55, 0.68, 1.2, 18, 1, false), brass, P.head, [0, 1.25, -0.05], [-0.08, 0, 0.06]);
  mesh(new THREE.SphereGeometry(0.55, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass, thimble, [0, 0.6, 0]);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + r * 0.17, rr = 0.56 + r * 0.035; mesh(new THREE.SphereGeometry(0.05, 4, 3), walnut, thimble, [Math.cos(a) * rr, 0.42 - r * 0.28, Math.sin(a) * rr]); } // (the dimples)
  mesh(new THREE.BoxGeometry(0.42, 0.34, 0.04), red, P.head, [-0.55, -0.35, 0.64], [0, -0.55, 0.2]);
  // the arms: charcoal sleeves on a peg joint, a spiral cuff, straw at the wrist, a cream mitten
  P.arms.forEach((A) => {
    mesh(new THREE.SphereGeometry(0.34, 10, 8), maple, A); // (the shoulder peg)
    mesh(new THREE.CylinderGeometry(0.3, 0.36, 2.2, 10), char, A, [0, -1.15, 0]);
    mesh(new THREE.TorusGeometry(0.35, 0.07, 5, 14), cream, A, [0, -2.1, 0], [Math.PI / 2, 0, 0]);
    const cuff = straw(0.22, 8, 0.4, strawM, -1); cuff.position.y = -2.2; cuff.rotation.x = Math.PI; A.add(cuff);
    const mit = new THREE.SphereGeometry(0.4, 10, 8); mit.scale(0.9, 1.1, 0.7); mesh(mit, cream, A, [0, -2.55, 0]);
    mesh(new THREE.SphereGeometry(0.16, 8, 6), cream, A, [0.3, -2.4, 0.1]); // (the thumb)
  });
  // the legs: maple dowels, a button at the knee, a thread spool for a foot
  P.legs.forEach((G, i) => {
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.7, 10), maple, G, [0, -0.85, 0]);
    mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 14), button, G, [0, -0.7, 0.18], [Math.PI / 2, 0, 0]);
    const spool = new THREE.Group(); spool.position.set(0, -1.75, 0.15); G.add(spool);
    mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), maple, spool, [0, 0.25, 0]); mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), maple, spool, [0, -0.25, 0]);
    mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.42, 14), i ? red : mat({ color: palette.teal ?? 0x2f7f7a }), spool);
  });
  // the control bar: a walnut airplane cross with brass eyelets where the strings tie
  mesh(new THREE.BoxGeometry(4.6, 0.24, 0.26), walnut, P.bar);
  mesh(new THREE.BoxGeometry(0.26, 0.24, 2.6), walnut, P.bar);
  mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.9, 8), walnut, P.bar, [0, 0.55, 0]); // (the handle)
  for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) mesh(new THREE.TorusGeometry(0.1, 0.035, 5, 10), brass, P.bar, [x, -0.16, 0], [Math.PI / 2, 0, 0]);
  return { own, tex };
}

export function dressMarionette(ctx) {
  let puppet = null, kept = null;
  const letGo = () => { if (!kept) return; for (const m of kept.own) m.dispose(); for (const t of kept.tex) t.dispose(); kept = null; };
  return {
    update() {
      const p = MOD.chase?.puppet ?? null;
      if (p === puppet) return;
      letGo(); puppet = p; if (!p) return;
      for (const m of p.mats) m.visible = false; // (the placeholder's boxes, its own materials: hidden, kept for its dispose)
      p.lineMat?.color.setHex(M.thread);
      try { kept = dress(p, ctx.palette ?? {}); } catch (e) { console.warn('wellLook marionette', e); for (const m of p.mats) m.visible = true; }
    },
    dispose() { letGo(); puppet = null; },
  };
}
