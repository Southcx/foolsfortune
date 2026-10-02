// ---------------------------------------------------------------------------------------
// THINGS: the models of the small things the last three tools take (a Possibilikey, an instrument for the Crucibelle, a Lockheart's
// coffin, a shard of crystal). Each is a few primitives in the tool-kit's palette, flat-shaded, sized in metres; the Pneuka Box renders
// each once into its icon (pneuka/icons.js, prerendered: the look of a PS2 inventory), and the Lockheart wears the coffin on its chain
// (`buildCoffin`, also the tool's own model).
//
// The coffin is the old six-sided coffin (wide at the shoulders, narrow at the feet), extruded, with a lid of a lighter colour, a brass
// keyhole and the emblem of its kind on the lid: an ace (the gambler's), a crook (the shepherd's), a plain cross of brass (the plain one).
// A key is a bow, a shaft and a bit, the bow's shape its kind (a heart for the brass key, a heart upside down for the inverted, a level
// for the even, two bows for the twin, a die for the loaded, a fan for the wide, rings for the echo).
//
//   buildThing(id) -> { group, dispose } | null         buildCoffin(heartId) -> { group, lid, dispose }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HEARTS, KEYS } from '../lockheart/table.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, flatShading: true, ...o });
const brassM = () => mat(0xd9b048, { metalness: 0.6, roughness: 0.35 });

function holder(parts, mats) { const group = new THREE.Group(); for (const p of parts) group.add(p); return { group, dispose() { group.traverse((o) => o.geometry?.dispose()); for (const m of mats) m.dispose(); } }; }

/** A coffin of the old shape, `h` long, extruded `d` deep (its lid the top face). */
function coffinGeo(h = 0.07, w = 0.042, d = 0.022) {
  const s = new THREE.Shape();
  const sh = h * 0.28, top = h / 2, bot = -h / 2;
  s.moveTo(-w * 0.32, top); s.lineTo(w * 0.32, top); s.lineTo(w / 2, top - sh); s.lineTo(w * 0.28, bot); s.lineTo(-w * 0.28, bot); s.lineTo(-w / 2, top - sh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: d * 0.12, bevelSize: w * 0.04, bevelSegments: 1 });
  g.translate(0, 0, -d / 2);
  return g;
}

export function buildCoffin(heartId = 'heart.plain', scale = 1) {
  const H = HEARTS[heartId] || HEARTS['heart.plain'];
  const body = mat(H.color), trim = mat(H.trim, { metalness: 0.5, roughness: 0.35 }), dark = mat(0x140c0a);
  const group = new THREE.Group();
  const box = new THREE.Mesh(coffinGeo(), body);
  group.add(box);
  // the lid: a thin coffin on the front, hinged at its head (its pivot: `lid`)
  const lid = new THREE.Group(); lid.position.set(0, 0.035, 0.0125);
  const lm = new THREE.Mesh(coffinGeo(0.068, 0.04, 0.004), trim); lm.position.set(0, -0.035, 0.002); lid.add(lm);
  // the emblem, on the lid
  const em = new THREE.Group(); em.position.set(0, -0.03, 0.006); lid.add(em);
  if (heartId === 'heart.gambler') { // an ace: a spade's point and its stem
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.014, 4), dark); sp.rotation.z = 0; sp.position.y = 0.004; em.add(sp);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.008, 0.002), dark); st.position.y = -0.006; em.add(st);
  } else if (heartId === 'heart.shepherd') { // a crook
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.024, 0.002), dark); em.add(sh);
    const hk = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0012, 4, 8, Math.PI), dark); hk.position.set(0.004, 0.012, 0); em.add(hk);
  } else { // a cross of brass
    em.add(new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.024, 0.002), dark));
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.003, 0.002), dark); c.position.y = 0.005; em.add(c);
  }
  // the keyhole, low on the lid
  const kh = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.002, 8), dark); kh.rotation.x = Math.PI / 2; kh.position.set(0, -0.058, 0.007); lid.add(kh);
  group.add(lid);
  // the bail it hangs by, at its head
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0012, 4, 10), trim); bail.position.y = 0.041; group.add(bail);
  // the glow inside (seen when the lid is open)
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.055), new THREE.MeshBasicMaterial({ color: 0xffe9c8 }));
  inside.position.set(0, 0, 0.0105); group.add(inside);
  group.scale.setScalar(scale);
  return { group, lid, inside, dispose() { group.traverse((o) => { o.geometry?.dispose(); }); body.dispose(); trim.dispose(); dark.dispose(); inside.material.dispose(); } };
}

function key(id) {
  const K = KEYS[id], m = mat(K.color, { metalness: 0.65, roughness: 0.3 }), dk = mat(0x2a1a14);
  const parts = [];
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.05, 6), m); shaft.position.y = -0.02; parts.push(shaft);
  const bit = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.01, 0.003), m); bit.position.set(0.005, -0.04, 0); parts.push(bit);
  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.004, 0.003), m); bit2.position.set(0.004, -0.032, 0); parts.push(bit2);
  const bow = (y = 0.012, flip = false, s = 1) => {
    // a heart: two rings and a point
    const g = new THREE.Group(); g.position.y = y; if (flip) g.rotation.z = Math.PI; g.scale.setScalar(s);
    for (const x of [-0.005, 0.005]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 5, 10), m); r.position.set(x, 0.003, 0); g.add(r); }
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.012, 4), m); p.rotation.z = Math.PI; p.position.y = -0.006; g.add(p);
    return g;
  };
  if (id === 'key.brass') parts.push(bow());
  else if (id === 'key.invert') parts.push(bow(0.014, true));
  else if (id === 'key.even') { const r = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.01, 0.004), m); r.position.y = 0.012; parts.push(r); const b = new THREE.Mesh(new THREE.SphereGeometry(0.003, 6, 4), mat(0x9be36a)); b.position.set(0, 0.012, 0.003); parts.push(b); }
  else if (id === 'key.twin') { const a = bow(0.012, false, 0.8); a.position.x = -0.007; const b = bow(0.012, false, 0.8); b.position.x = 0.007; parts.push(a, b); }
  else if (id === 'key.loaded') { const d = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.016), m); d.position.y = 0.012; d.rotation.set(0.4, 0.5, 0.2); parts.push(d); for (const [x, y] of [[0, 0], [0.004, 0.004], [-0.004, -0.004]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 4, 3), dk); p.position.set(x, 0.012 + y, 0.0085); parts.push(p); } }
  else if (id === 'key.wide') { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.003, 8, 1, false, 0, Math.PI), m); f.rotation.set(Math.PI / 2, 0, Math.PI / 2); f.position.y = 0.006; parts.push(f); }
  else if (id === 'key.echo') { for (const [r, y] of [[0.004, 0.008], [0.007, 0.008], [0.01, 0.008]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0013, 4, 12), m); t.position.y = y + r; parts.push(t); } }
  const h = holder(parts, [m, dk]);
  h.group.rotation.set(0.3, 0.4, -0.7);
  return h;
}

function instrument(id) {
  const parts = [], mats = [];
  const M = (c, o) => { const x = mat(c, o); mats.push(x); return x; };
  if (id === 'inst.ocarina') {
    const clay = M(0xc8805a), dk = M(0x3a2216);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), clay); body.scale.set(1.5, 0.75, 0.9); parts.push(body);
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.025, 6), clay); mouth.rotation.z = Math.PI / 2; mouth.position.x = 0.05; parts.push(mouth);
    for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 6), dk); h.position.set(-0.025 + i * 0.016, 0.022, 0); parts.push(h); }
  } else if (id === 'inst.kalimba') {
    const wood = M(0xd9b48a), steel = M(0xe0e0e8, { metalness: 0.7, roughness: 0.3 }), dk = M(0x3a2216);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.09), wood); parts.push(box);
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.002, 10), dk); hole.position.set(0, 0.009, 0.02); parts.push(hole);
    for (let i = 0; i < 7; i++) { const L = 0.05 - Math.abs(i - 3) * 0.006; const t = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.002, L), steel); t.position.set(-0.024 + i * 0.008, 0.011, -0.03 + L / 2); parts.push(t); }
  } else if (id === 'inst.lute') {
    const wood = M(0x8a4a2a), light = M(0xe8d7b6), dk = M(0x2a1a14);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), wood); body.rotation.x = -Math.PI / 2; body.scale.set(1, 1.35, 0.6); parts.push(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), light); face.scale.set(1, 1.35, 1); face.position.z = 0.001; parts.push(face);
    const rose = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), dk); rose.position.set(0, 0.01, 0.002); parts.push(rose);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.11, 0.008), wood); neck.position.set(0, 0.11, 0.002); parts.push(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.008), dk); head.position.set(0, 0.17, -0.006); head.rotation.x = -0.5; parts.push(head);
  } else return null;
  const h = holder(parts, mats);
  h.group.rotation.set(0.35, 0.5, id === 'inst.lute' ? -0.6 : 0);
  return h;
}

function shard() {
  const m = mat(0xcdb8f2, { emissive: 0x4a2f86, emissiveIntensity: 0.6, roughness: 0.2 });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.06, 6), m);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.022, 6), m); t.position.y = 0.041;
  const h = holder([s, t], [m]); h.group.rotation.set(0.2, 0.3, -0.5);
  return h;
}

/** A roll of film: a brass canister, its spool ends, and a tongue of film out of the lip. */
function film() {
  const can = mat(0x2a2420, { roughness: 0.4 }), brass = brassM(), strip = mat(0x6a4a2a, { roughness: 0.3, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.036, 12), can);
  const a = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.048, 8), brass);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.004, 12), brass); lip.position.y = 0.017;
  const tongue = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.026), strip); tongue.position.set(0.026, -0.002, 0); tongue.rotation.y = Math.PI / 2 - 0.25;
  const h = holder([body, a, lip, tongue], [can, brass, strip]); h.group.rotation.set(0.35, 0.4, 0.25);
  return h;
}

export function buildThing(id) {
  if (id === 'mat.film') return film();
  if (id.startsWith('key.')) return key(id);
  if (id.startsWith('inst.')) return instrument(id);
  if (id.startsWith('heart.')) { const c = buildCoffin(id); c.group.rotation.set(0.25, 0.45, 0.1); return c; }
  if (id === 'mat.shard') return shard();
  return null;
}
