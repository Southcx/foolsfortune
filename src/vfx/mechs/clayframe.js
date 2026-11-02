// ---------------------------------------------------------------------------------------
// THE CLAY FRAME'S BODY (plain name; docs/plans/MECHS.md 8.2 item 1, South's ask 2026-11-02: "Giant robots. Pilotable. They should have a
// cradle for the Pneuka Jar to screw into ... Neon Genesis Evangelion mixed with armored core, mixed with the giant robot sections from
// Ratchet and clank ... don't hold back on the design"): the hangar's first mech drawn as a haniwa warrior 14 m tall, the island's own
// idiom made giant: an unglazed terracotta body, armour plates glazed in ruri (cobalt) with oribe-green and gold trim over it, and the
// cradle in its chest where the Pneuka Jar is turned home.
//   THE HEAD       the haniwa's face: a terracotta drum with the three hollow cuts (the eyes and the mouth) that stand for a face, dark
//                  until sealed and lit from inside in the film's violet-white once the Jar is home; the beaked helmet (shōkaku-tsuki
//                  kabuto) glazed, its neck guard in three lames, the mizura knots of hair hanging at the cheeks
//   THE CORE       a keikō cuirass: rows of glazed lamellae round a terracotta barrel, a gold-edged gorget; in its chest THE CRADLE:
//                  a bore of dark clay with a screw thread cut round it (two turns: South's "screw into"), a gold collar on its lip
//                  and a disc of Lachrymite glass across it, the Jar seen through it while sealed. The generator a squat kiln on its
//                  back, its vents glowing; the booster two flared nozzles below it
//   THE ARMS       great layered pauldrons (sode) in ruri over terracotta arms, glazed vambraces, blocky haniwa hands
//   THE LEGS       the clay biped: a flared kusazuri skirt of glazed plates, the haniwa's wide trousers tied below the knee (ashi-yui),
//                  glazed greaves and broad sabaton feet
// The body is a tree of joints (`joints`: hips .. footR), each segment its own merged pieces in two programs (the clay matte, the glaze
// and gold glossy), so a runtime poses it by joint and the next parts (MECHS.md 8.2 item 2) swap a slot's segments in place. It stands
// in a ready stance (knees soft, hands forward) until posed. Looks only: the rules and the runtime are Dovina's (progress/mechs/,
// world/hangar/).
// Prior art: the haniwa warrior in keikō armour (Ōta, Gunma: Kofun period, a National Treasure), Neon Genesis Evangelion's Unit-01
// (a lean frame, a lit face, the entry plug turned home), Armored Core's silhouettes (big pauldrons, a back-mounted generator, nozzles),
// Giant Clank's proportions (a giant made readable at a distance: a few big shapes), the decor kit's soft primitives.
//
//   const body = makeClayFrame(game?)   body.root (a Group: put it in the world)   body.joints { hips, spine, chest, neck, head, shoulderL,
//   upperArmL, elbowL, handL, (R), hipL, kneeL, ankleL, (R) }   body.cradle { seat, port, thread, collar }   body.seal(k 0..1)
//   body.turn(turns)   body.height   body.dispose()   CLAY_FRAME_LOOK (its colours and sizes)
//   installMechLooks(game) -> game.makeMechBody(sel?) (the hangar's: the clay frame for every assembly until each part has its look)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';

/** Its colours (sRGB) and its sizes (metres): terracotta, the ruri glaze, the oribe trim, gold, the dark of a hollow, the film's light. */
export const CLAY_FRAME_LOOK = {
  clay: 0xc4733f, clayD: 0x9a5230, clayL: 0xd99a6a, ruri: 0x26387e, ruriL: 0x4864b4, ruriD: 0x172452, oribe: 0x4f8a5a, gold: 0xe0b04a,
  hollow: 0x140a08, film: 0xd8ccff, glass: 0x9fc4ff,
  hip: 6.3, thigh: 3.0, shin: 2.9, spine: 1.1, chest: 2.6, neck: 0.6, upper: 2.4, fore: 2.2, bore: 0.95, depth: 0.5, boss: 0.55, pitch: 0.12,
};
const L = CLAY_FRAME_LOOK, PI = Math.PI;

/** One segment's two pieces: `c` the clay (matte), `g` the glaze and gold (glossy). */
const seg = () => ({ c: new Piece(), g: new Piece() });

/** A helix of `turns` round +Z, radius r, advancing `pitch` a turn into -Z: the cradle's screw thread. */
function threadGeometry(r, turns, pitch, tube) {
  const pts = []; for (let i = 0; i <= 64 * turns; i++) { const a = (i / 64) * PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -(i / 64) * pitch)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64 * turns, tube, 6, false);
}

// ------------------------------------------------------------------ the segments (each in its joint's frame: +Y up its length, +Z front)
function head(S) {
  const { c, g } = S;
  c.cyl(0.78, 0.86, 1.5, { at: [0, 0.75, 0], c: L.clay }, 16); // (the face's drum)
  c.ring(0.8, 0.05, { at: [0, 0.05, 0], c: L.clayD }, 16, 3);
  for (const s of [-1, 1]) {
    c.cyl(0.18, 0.24, 0.6, { at: [s * 0.95, 0.45, 0.05], c: L.clayD }, 8); // (the mizura: hair looped and tied at the cheeks)
    c.ball(0.26, { at: [s * 0.98, 0.15, 0.05], sc: [0.8, 1.1, 0.8], c: L.clayD });
    c.ring(0.2, 0.05, { at: [s * 0.96, 0.62, 0.05], c: L.gold }, 10, 3);
  }
  // the helmet: a bowl glazed ruri, its beak pointing ahead, a gold rib, the neck guard's three lames
  g.ball(0.98, { at: [0, 1.45, -0.02], sc: [1, 0.72, 1.06], c: L.ruri }, 16, 10);
  g.geo(new THREE.ConeGeometry(0.42, 1.1, 4).rotateX(PI / 2).rotateZ(PI / 4), { at: [0, 1.55, 0.98], sc: [1, 0.35, 1], c: L.ruriL }); // (the beak)
  g.ring(0.99, 0.06, { at: [0, 1.32, -0.02], c: L.gold }, 18, 3);
  g.slab(0.12, 0.7, 1.9, { at: [0, 1.85, -0.05], c: L.gold }); // (the crest rib)
  for (let i = 0; i < 3; i++) g.geo(new THREE.CylinderGeometry(1.02 + i * 0.12, 1.08 + i * 0.14, 0.32, 18, 1, true, PI * 0.15, PI * 1.7), { at: [0, 1.1 - i * 0.28, -0.04], rot: [0, PI, 0], c: i % 2 ? L.ruriD : L.ruri });
}
/** The face's three hollows, lit from inside once sealed (their own program: `glow`). */
function faceHollows() {
  const p = new Piece();
  for (const s of [-1, 1]) p.box(0.34, 0.14, 0.2, { at: [s * 0.32, 0.92, 0.78], rot: [0, 0, s * -0.12], c: 0xffffff }, 0.06);
  p.box(0.36, 0.16, 0.2, { at: [0, 0.48, 0.8], c: 0xffffff }, 0.07);
  return p;
}
function neck(S) { S.c.cyl(0.55, 0.6, L.neck + 0.2, { at: [0, L.neck / 2, 0], c: L.clayD }, 12); S.g.ring(0.62, 0.08, { at: [0, 0.05, 0], c: L.gold }, 14, 3); }
function chest(S) {
  const { c, g } = S, H = L.chest;
  c.cyl(1.75, 1.45, H, { at: [0, H / 2, 0], sc: [1, 1, 0.82], c: L.clay }, 20);
  // the keikō cuirass: rows of glazed lamellae round the barrel, the cradle's ring left bare in the middle
  for (let row = 0; row < 4; row++) {
    const y = 0.35 + row * 0.55, r = 1.5 + row * 0.07;
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * PI * 2, x = Math.sin(a) * r * 1.05, z = Math.cos(a) * r * 0.86;
      if (Math.abs(x) < 1.35 && z > 0.6 && y > 0.6 && y < 2.1) continue; // (the cradle's face)
      g.box(0.46, 0.5, 0.12, { at: [x, y, z], rot: [-0.08, a, 0], c: (k + row) % 2 ? L.ruri : L.ruriD }, 0.04);
    }
  }
  g.cyl(1.25, 1.55, 0.35, { at: [0, H + 0.08, 0], sc: [1, 1, 0.82], c: L.ruri }, 20); // (the gorget)
  g.ring(1.27, 0.07, { at: [0, H + 0.26, 0], sc: [1, 1, 0.82], c: L.gold }, 20, 3);
  // the generator: a squat kiln on the back, its vents; the booster's two flared nozzles below it
  c.ball(1.05, { at: [0, 1.5, -1.45], sc: [1.15, 1, 0.75], c: L.clayD }, 14, 10);
  for (let i = 0; i < 4; i++) g.slab(0.18, 0.12, 0.3, { at: [-0.45 + i * 0.3, 2.25, -1.95], c: L.gold });
  for (const s of [-1, 1]) {
    c.lathe([[0.22, 0], [0.26, 0.3], [0.36, 0.6], [0.55, 0.95], [0.6, 1.0]], { at: [s * 0.62, 0.65, -1.75], rot: [PI - 0.35, 0, 0], c: L.clayD }, 12);
    g.ring(0.58, 0.05, { at: [s * 0.62, -0.25, -2.05], rot: [-0.35, 0, 0], c: L.gold }, 12, 3);
  }
}
/** The cradle on the chest's face: the bore, its thread, the gold collar, the glass; the seat a runtime puts the Jar in. */
function cradle(S) {
  const { c, g } = S, R = L.bore, B = L.boss;
  g.cyl(R + 0.6, R + 0.75, B, { at: [0, 0, -B / 2 + 0.02], rot: [PI / 2, 0, 0], c: L.ruriD }, 28); // (the boss it stands out of the chest on)
  g.geo(threadGeometry(R - 0.05, 2, L.depth / 2.4, 0.06), { at: [0, 0, -0.08], c: L.gold }); // (the thread: two turns cut round the bore)
  g.ring(R + 0.1, 0.13, { rot: [PI / 2, 0, 0], at: [0, 0, 0.06], c: L.gold }, 32, 6); // (the collar)
  g.geo(new THREE.RingGeometry(R + 0.22, R + 0.58, 32), { at: [0, 0, 0.035], c: L.oribe });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; g.ball(0.09, { at: [Math.cos(a) * (R + 0.4), Math.sin(a) * (R + 0.4), 0.09], c: L.gold }, 8, 6); } // (its studs)
}
/** The bore: dark clay seen from inside (its own program, drawn on its back faces), a floor at its foot. */
function boreMesh() {
  const R = L.bore, D = L.depth, geo = new THREE.CylinderGeometry(R, R, D, 28, 1, false).rotateX(PI / 2).translate(0, 0, -D / 2 + 0.04);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'mech-bore', color: L.hollow, roughness: 0.95, side: THREE.BackSide }));
  m.receiveShadow = true; return m;
}
function shoulder(S, s) {
  const { c, g } = S;
  c.ball(0.72, { at: [0, 0, 0], c: L.clayD }, 12, 8);
  for (let i = 0; i < 4; i++) g.box(1.7 - i * 0.1, 0.5, 1.9 - i * 0.12, { at: [s * (0.35 + i * 0.05), 0.5 - i * 0.42, 0], rot: [0, 0, s * (0.35 + i * 0.06)], c: i % 2 ? L.ruriD : L.ruri }, 0.12); // (the sode: layered plates)
  g.slab(1.75, 0.08, 0.1, { at: [s * 0.35, 0.78, 0.96], rot: [0, 0, s * 0.35], c: L.gold });
}
function upperArm(S) { S.c.cyl(0.68, 0.6, L.upper, { at: [0, -L.upper / 2, 0], c: L.clay }, 12); S.c.ball(0.62, { at: [0, -L.upper, 0], c: L.clayD }, 10, 8); }
function foreArm(S) {
  S.c.cyl(0.56, 0.5, L.fore, { at: [0, -L.fore / 2, 0], c: L.clay }, 12);
  S.g.cyl(0.74, 0.64, L.fore * 0.7, { at: [0, -L.fore * 0.55, 0], c: L.ruri }, 12); // (the vambrace)
  S.g.ring(0.72, 0.06, { at: [0, -L.fore * 0.2, 0], c: L.gold }, 12, 3);
}
function hand(S) {
  S.c.box(1.0, 1.1, 0.75, { at: [0, -0.55, 0.05], c: L.clayL }, 0.24);
  S.c.box(0.32, 0.6, 0.32, { at: [0, -0.45, 0.5], rot: [0.5, 0, 0], c: L.clayL }, 0.1); // (the thumb)
  for (let i = 0; i < 3; i++) S.c.slab(0.95, 0.025, 0.7, { at: [0, -0.75 - i * 0.15, 0.05], c: L.clayD }); // (the fingers' cuts)
}
function hips(S) {
  const { c, g } = S;
  c.cyl(1.45, 1.35, 1.0, { at: [0, 0.2, 0], sc: [1, 1, 0.8], c: L.clay }, 18);
  g.ring(1.47, 0.09, { at: [0, 0.68, 0], sc: [1, 1, 0.8], c: L.gold }, 20, 3); // (the belt)
  // the kusazuri: a flared skirt of glazed plates, open at the sides so the thighs swing
  for (const [a, w] of [[0, 1.4], [PI, 1.4], [PI * 0.25, 1.0], [-PI * 0.25, 1.0], [PI * 0.75, 1.0], [-PI * 0.75, 1.0]]) {
    for (let i = 0; i < 3; i++) g.box(w - i * 0.08, 0.6, 0.12, { at: [Math.sin(a) * (1.5 + i * 0.12), 0.3 - i * 0.5, Math.cos(a) * (1.25 + i * 0.12)], rot: [-0.25 * Math.cos(a), a, 0.25 * Math.sin(a)], c: i % 2 ? L.ruriD : L.ruri }, 0.04);
  }
}
function thigh(S) {
  S.c.cyl(1.2, 0.9, L.thigh, { at: [0, -L.thigh / 2, 0], c: L.clay }, 14); // (the haniwa's wide trousers)
  S.c.ring(0.88, 0.14, { at: [0, -L.thigh + 0.15, 0], c: L.clayD }, 14, 4); // (the ashi-yui: tied below the knee)
  S.c.ball(0.78, { at: [0, -L.thigh, 0], c: L.clayD }, 10, 8);
}
function shin(S) {
  S.c.cyl(0.72, 0.6, L.shin, { at: [0, -L.shin / 2, 0], c: L.clay }, 12);
  S.g.cyl(0.9, 0.72, L.shin * 0.8, { at: [0, -L.shin * 0.45, 0.12], sc: [1, 1, 0.9], c: L.ruri }, 12); // (the greave)
  S.g.box(0.8, 0.8, 0.35, { at: [0, -0.15, 0.75], c: L.ruriL }, 0.1); // (the knee cop)
  S.g.ring(0.78, 0.06, { at: [0, -L.shin * 0.85, 0.06], c: L.gold }, 12, 3);
}
function foot(S) {
  S.c.box(1.4, 0.6, 2.4, { at: [0, -0.2, 0.45], c: L.clayD }, 0.22);
  S.g.box(1.3, 0.3, 1.3, { at: [0, 0.05, 1.0], c: L.ruri }, 0.1); // (the sabaton)
}

/** A clay frame's body: its joints posed into a ready stance, every segment built and merged. `game` lends nothing yet (kept for a
 *  runtime's warm-up); safe headless. */
export function makeClayFrame(game = null) {
  const mats = {
    clay: new THREE.MeshStandardMaterial({ name: 'mech-clay', vertexColors: true, roughness: 0.88, metalness: 0 }),
    glaze: new THREE.MeshStandardMaterial({ name: 'mech-glaze', vertexColors: true, roughness: 0.22, metalness: 0.08 }),
    glow: new THREE.MeshBasicMaterial({ name: 'mech-glow', color: L.hollow, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ name: 'mech-glass', color: L.glass, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }),
  };
  const J = (name, parent, at, rot = [0, 0, 0]) => { const j = new THREE.Group(); j.name = `mech.${name}`; j.position.set(...at); j.rotation.set(...rot); parent?.add(j); return j; };
  const put = (joint, build, ...a) => {
    const S = seg(); build(S, ...a);
    for (const [k, mat] of [['c', mats.clay], ['g', mats.glaze]]) if (S[k].pos.length) { const m = new THREE.Mesh(S[k].done(), mat); m.castShadow = m.receiveShadow = true; joint.add(m); }
  };
  const root = new THREE.Group(); root.name = 'mech.clayFrame';
  const j = {};
  j.hips = J('hips', root, [0, L.hip, 0]);
  j.spine = J('spine', j.hips, [0, 0.7, 0], [0.06, 0, 0]);
  j.chest = J('chest', j.spine, [0, L.spine - 0.6, 0], [0.04, 0, 0]);
  j.neck = J('neck', j.chest, [0, L.chest + 0.15, 0.1]);
  j.head = J('head', j.neck, [0, L.neck, 0], [-0.08, 0, 0]);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) { // (L the frame's left, +X: the body faces +Z)
    j[`shoulder${k}`] = J(`shoulder${k}`, j.chest, [s * 2.25, L.chest - 0.45, 0]);
    j[`upperArm${k}`] = J(`upperArm${k}`, j[`shoulder${k}`], [0, 0, 0], [-0.25, 0, s * 0.18]);
    j[`elbow${k}`] = J(`elbow${k}`, j[`upperArm${k}`], [0, -L.upper, 0], [-0.75, 0, 0]);
    j[`hand${k}`] = J(`hand${k}`, j[`elbow${k}`], [0, -L.fore, 0], [0, s * -0.3, 0]);
    j[`hip${k}`] = J(`hip${k}`, j.hips, [s * 0.95, -0.2, 0], [-0.18, 0, s * 0.04]);
    j[`knee${k}`] = J(`knee${k}`, j[`hip${k}`], [0, -L.thigh, 0], [0.34, 0, 0]);
    j[`ankle${k}`] = J(`ankle${k}`, j[`knee${k}`], [0, -L.shin, 0], [-0.16, 0, 0]);
  }
  put(j.hips, hips); put(j.chest, chest); put(j.neck, neck); put(j.head, head);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    put(j[`shoulder${k}`], shoulder, s); put(j[`upperArm${k}`], upperArm); put(j[`elbow${k}`], foreArm); put(j[`hand${k}`], hand);
    put(j[`hip${k}`], thigh); put(j[`knee${k}`], shin); put(j[`ankle${k}`], foot);
  }
  // the face's hollows, lit once sealed
  const eyes = new THREE.Mesh(faceHollows().done(), mats.glow); eyes.position.z = 0.01; j.head.add(eyes);
  // the cradle on the chest's face, its seat inside and the glass across it
  const C = J('cradle', j.chest, [0, 1.35, 1.32 + L.boss]);
  put(C, cradle); const bore = boreMesh(); C.add(bore);
  const seat = J('cradle.seat', C, [0, 0, -0.3]); // (the Pneuka Jar is parented here by the runtime; a stand-in until it is)
  const stand = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.4], [0.28, -0.37], [0.42, -0.15], [0.45, 0.07], [0.32, 0.3], [0.22, 0.4], [0.26, 0.46], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 16), new THREE.MeshStandardMaterial({ name: 'mech-jar-standin', color: 0xe8d8c0, roughness: 0.4 }));
  stand.visible = false; seat.add(stand);
  const port = new THREE.Mesh(new THREE.CircleGeometry(L.bore + 0.02, 32), mats.glass); port.position.z = 0.04; port.renderOrder = 3; C.add(port);
  const threadTurn = C.children.find((m) => m.isMesh && m.material === mats.glaze);

  let sealed = 0, turns = 0;
  const glowOn = new THREE.Color(L.film), glowOff = new THREE.Color(L.hollow);
  const body = {
    root, joints: j, mats, height: L.hip + 0.7 + L.spine - 0.6 + L.chest + 0.15 + L.neck + 2.2,
    cradle: { seat, port, collar: threadTurn, standIn: stand },
    /** Sealed 0..1: the face's hollows lit from inside, the glass clearing, the stand-in Jar shown while no runtime has seated one. */
    seal(k) { sealed = THREE.MathUtils.clamp(k, 0, 1); mats.glow.color.copy(glowOff).lerp(glowOn, sealed); mats.glass.opacity = 0.35 - 0.2 * sealed; stand.visible = sealed > 0 && seat.children.length === 1; },
    /** The thread turned home (0..2 turns): the seat screwed in along the bore, a pitch a turn. */
    turn(t) { turns = THREE.MathUtils.clamp(t, 0, 2); seat.rotation.z = turns * PI * 2; seat.position.z = 0.25 - (turns / 2) * L.depth * 0.75; }, // (from the collar's lip to its seat: in along the thread)
    get sealed() { return sealed; }, get turns() { return turns; },
    dispose() { bore.material.dispose(); root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); for (const m of Object.values(mats)) m.dispose(); stand.material.dispose(); root.removeFromParent(); },
  };
  body.turn(0); body.seal(0);
  return body;
}

/** The hangar asks here for a mech's body by its assembly (`sel`, progress/mechs/frame.js): the clay frame for every one for now. */
export function installMechLooks(game) { game.makeMechBody = (sel = null) => makeClayFrame(game); return game.makeMechBody; }
