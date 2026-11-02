// ---------------------------------------------------------------------------------------
// THE CLAY FRAME'S BODY (plain name; docs/plans/MECHS.md 8.2 item 1, South's asks 2026-11-02: "Giant robots. Pilotable. They should
// have a cradle for the Pneuka Jar to screw into ... don't hold back on the design"; then, of the first pass: "muted earth tones or
// Lachryma/labradorite for the pauldrons ... get weird with the proportions, big broad chest, long arms. Big hands. deep groove hard
// surface modeling, but also looking like sleek porcelain ceramic ... Spherical joints sitting in sockets"): the hangar's first mech,
// drawn as the Courier's own make at giant scale (a porcelain ball-jointed figure, gold balls seated in socket cups) in the island's
// idiom (the haniwa's hollow lit eyes and beaked helmet, kintsugi's gold seams), about 14.5 m tall.
//   PROPORTION     the heroic ratio pushed: a chest 5.2 m across at the shoulders over hips 2.8 m wide and a waist 1.7 m, a head a
//                  quarter of the chest's width, arms 8 m long whose big hands hang to the knee, legs thick in the calf
//   THE CHEST      the big shape: an inverted trapezoid of porcelain plates (the breastplate split at the keel, the back's two halves,
//                  the abdomen's two wrapped bands) over a dark umber core, so every seam between them is a real groove; its sockets
//                  for the shoulders and the neck are cups of ivory. In it THE CRADLE: a raised ivory boss (an annulus, open in the
//                  middle, a groove cut round its face like an engraved cartouche), the bore of dark clay with a screw thread cut
//                  round it (two turns: South's "screw into"), a gold collar on its lip and a disc of Lachrymite glass across it, the
//                  Jar seen through it while sealed. The generator a kiln dome on its back, its two nozzles under it
//   THE ARMS       a great pauldron of Lachryma's stone over each shoulder (a dome, two lames and two fins up off its crown, the
//                  labradorite's dark with the film's schiller baked in plate by plate and a thin-film sheen over it), lathed
//                  porcelain arms with a waist cut in each, a terracotta vambrace, a palm of two-jointed fingers
//   THE LEGS       a pelvis of plates with the kusazuri's tassets in terracotta and ochre, thick lathed thighs and shins, a knee cop,
//                  a greave, a wedge foot whose toe cap is its own plate
//   THE HEAD       the haniwa: three hollows cut in an umber face, dark until sealed and lit from inside in the film's violet-white,
//                  under an ivory beaked helmet with its neck guard's lames, the mizura at the cheeks, a crest of the stone
// Palette: bone and ivory porcelain, warm grey, umber, terracotta, ochre and slate; gold and bronze only at the joints and the seams.
// The body is a tree of joints (`joints`: hips .. ankleR), each segment merged by program (porcelain, gold, labradorite), so a runtime
// poses it by joint; it stands in a heroic ready stance (chest high, arms hanging long and a little forward, knees soft) until posed.
// The segment builders are in clayframeparts.js. Looks only: the rules and the runtime are Dovina's (progress/mechs/, world/hangar/).
// Prior art (what was taken, and from where):
//   - Big, medium, small: one dominant mass (the chest and pauldrons), a few medium ones (head, hips, forearms, hands), the details
//     small and many; tiers kept distinct (the shape-hierarchy rule of vehicle and mech concept art: Clip Studio's "Learn basic
//     vehicle design fundamentals", tips.clip-studio.com/articles/5316; Polycount critiques of mid-shape-only silhouettes).
//   - Read at a glance: Kunio Okawara's rule that a design should be decipherable at a glance (his autobiography, citing Pokémon), and
//     his "realistic joints, panels" (Gundam's real-robot turn): the joints and panel breaks are shown, not hidden.
//   - Enormous power restrained: Ikuto Yamashita's Evangelion (essay, NGE manga vol. 1; en.wikipedia.org/wiki/Ikuto_Yamashita):
//     limbs longer and leaner than a man's, a narrow waist, so the frame reads as a giant and not a man in a suit.
//   - Broad shoulders, sturdy legs, a centred core: Shoji Kawamori's Armored Core frames (the series overview at
//     erickimphotography.com/armored-core-aesthetic-overview): the pauldrons' fins and the back's generator break the silhouette.
//   - A line weight per tier: the outer silhouette heavy, the panel grooves fine (Autodesk's "Mech Drawing"); here the grooves are
//     real gaps over a dark core, as a model kit's panel lines are cut.
//   - The ball-jointed doll: a ball seated in a cup, its joints part of the character (BJD makers; the Courier's own gold joints).
//   - The haniwa warrior in keikō armour (Ōta, Gunma: Kofun period), kintsugi, and the decor kit's soft primitives.
//
//   const body = makeClayFrame(game?)   body.root (a Group: put it in the world)   body.joints { hips, spine, chest, neck, head, shoulderL,
//   upperArmL, elbowL, handL, (R), hipL, kneeL, ankleL, (R) }   body.cradle { seat, port, collar, standIn }   body.seal(k 0..1)
//   body.turn(turns)   body.height   body.dispose()   CLAY_FRAME_LOOK (its colours and sizes)
//   installMechLooks(game) -> game.makeMechBody(sel?) (the hangar's: the clay frame for every assembly until each part has its look)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';
import * as P from './clayframeparts.js';
import { CLAY_FRAME_LOOK } from './clayframeparts.js';

export { CLAY_FRAME_LOOK };
const L = CLAY_FRAME_LOOK, PI = Math.PI;

/** One segment's three pieces: `p` the porcelain, `g` the gold, `l` the labradorite. */
const seg = () => ({ p: new Piece(), g: new Piece(), l: new Piece() });

/** A clay frame's body: its joints posed into a ready stance, every segment built and merged. `game` lends nothing yet (kept for a
 *  runtime's warm-up); safe headless. */
export function makeClayFrame(game = null) {
  const mats = {
    porcelain: new THREE.MeshPhysicalMaterial({ name: 'mech-porcelain', vertexColors: true, roughness: 0.24, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.1, side: THREE.DoubleSide }),
    gold: new THREE.MeshStandardMaterial({ name: 'mech-gold', vertexColors: true, roughness: 0.3, metalness: 0.65, emissive: 0x1c1206 }),
    lab: new THREE.MeshPhysicalMaterial({ name: 'mech-labradorite', vertexColors: true, roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12,
      iridescence: 0.7, iridescenceIOR: 1.7, iridescenceThicknessRange: [280, 820], side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ name: 'mech-glow', color: L.hollow, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ name: 'mech-glass', color: L.glass, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }),
  };
  const J = (name, parent, at, rot = [0, 0, 0]) => { const j = new THREE.Group(); j.name = `mech.${name}`; j.position.set(...at); j.rotation.set(...rot); parent?.add(j); return j; };
  const put = (joint, build, ...a) => {
    const S = seg(); build(S, ...a); const out = {};
    for (const [k, mat] of [['p', mats.porcelain], ['g', mats.gold], ['l', mats.lab]]) if (S[k].pos.length) { const m = new THREE.Mesh(S[k].done(), mat); m.castShadow = m.receiveShadow = true; joint.add(m); out[k] = m; }
    return out;
  };
  const root = new THREE.Group(); root.name = 'mech.clayFrame';
  const j = {};
  // the stance: chest lifted, arms hanging long and a little forward, knees soft, feet a little apart
  j.hips = J('hips', root, [0, L.hip, 0]);
  j.spine = J('spine', j.hips, [0, 0.55, 0], [-0.04, 0, 0]);
  j.chest = J('chest', j.spine, [0, L.spine, 0], [-0.03, 0, 0]);
  j.neck = J('neck', j.chest, [0, L.chest + 0.05, 0.12], [0.06, 0, 0]);
  j.head = J('head', j.neck, [0, L.neck, 0], [0.04, 0, 0]);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) { // (L the frame's left, +X: the body faces +Z)
    j[`shoulder${k}`] = J(`shoulder${k}`, j.chest, [s * L.shoulderX, L.shoulderY, 0]);
    j[`upperArm${k}`] = J(`upperArm${k}`, j[`shoulder${k}`], [0, 0, 0], [-0.08, 0, s * 0.11]);
    j[`elbow${k}`] = J(`elbow${k}`, j[`upperArm${k}`], [0, -L.upper, 0], [-0.18, 0, -s * 0.04]);
    j[`hand${k}`] = J(`hand${k}`, j[`elbow${k}`], [0, -L.fore, 0], [0, s * (-PI / 2 + 0.45), 0]);
    j[`hip${k}`] = J(`hip${k}`, j.hips, [s * 1.1, -0.35, 0], [-0.2, 0, s * 0.05]);
    j[`knee${k}`] = J(`knee${k}`, j[`hip${k}`], [0, -L.thigh, 0], [0.38, 0, 0]);
    j[`ankle${k}`] = J(`ankle${k}`, j[`knee${k}`], [0, -L.shin, 0], [-0.18, 0, -s * 0.05]);
  }
  put(j.hips, P.hips); put(j.spine, P.spine); put(j.chest, P.chest); put(j.neck, P.neck); put(j.head, P.head);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    put(j[`shoulder${k}`], P.shoulder, s); put(j[`upperArm${k}`], P.upperArm, s); put(j[`elbow${k}`], P.foreArm, s); put(j[`hand${k}`], P.hand, s);
    put(j[`hip${k}`], P.thigh, s); put(j[`knee${k}`], P.shin, s); put(j[`ankle${k}`], P.foot, s);
  }
  // the face's hollows, lit once sealed
  const eyes = new THREE.Mesh(P.faceHollows().done(), mats.glow); j.head.add(eyes);
  // the cradle on the chest's face (its boss stands out of the breastplate, so nothing of the chest fills the bore), its seat inside
  // and the glass across it
  const C = J('cradle', j.chest, [0, L.cradleY, L.front + L.boss]);
  const cm = put(C, P.cradle); const bore = P.boreMesh(); C.add(bore);
  const seat = J('cradle.seat', C, [0, 0, 0]); // (the Pneuka Jar is parented here by the runtime; a stand-in until it is)
  const stand = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.4], [0.28, -0.37], [0.42, -0.15], [0.45, 0.07], [0.32, 0.3], [0.22, 0.4], [0.26, 0.46], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 16), new THREE.MeshStandardMaterial({ name: 'mech-jar-standin', color: 0xe8d8c0, roughness: 0.4 }));
  stand.visible = false; seat.add(stand);
  const port = new THREE.Mesh(new THREE.CircleGeometry(L.bore + 0.02, 36), mats.glass); port.position.z = 0.04; port.renderOrder = 3; C.add(port);

  let sealed = 0, turns = 0;
  const glowOn = new THREE.Color(L.film), glowOff = new THREE.Color(L.hollow);
  root.updateMatrixWorld(true);
  const body = {
    root, joints: j, mats, height: +new THREE.Box3().setFromObject(root).max.y.toFixed(2),
    cradle: { seat, port, collar: cm.g, standIn: stand },
    /** Sealed 0..1: the face's hollows lit from inside, the glass clearing, the stand-in Jar shown while no runtime has seated one. */
    seal(k) { sealed = THREE.MathUtils.clamp(k, 0, 1); mats.glow.color.copy(glowOff).lerp(glowOn, sealed); mats.glass.opacity = 0.35 - 0.2 * sealed; stand.visible = sealed > 0 && seat.children.length === 1; },
    /** The thread turned home (0..2 turns): the seat screwed in along the bore, from the collar's lip to its floor. */
    turn(t) { turns = THREE.MathUtils.clamp(t, 0, 2); seat.rotation.z = turns * PI * 2; seat.position.z = 0.35 - (turns / 2) * L.depth * 0.85; },
    get sealed() { return sealed; }, get turns() { return turns; },
    dispose() { bore.material.dispose(); root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); for (const m of Object.values(mats)) m.dispose(); stand.material.dispose(); root.removeFromParent(); },
  };
  body.turn(0); body.seal(0);
  return body;
}

/** The hangar asks here for a mech's body by its assembly (`sel`, progress/mechs/frame.js): the clay frame for every one for now. */
export function installMechLooks(game) { game.makeMechBody = (sel = null) => makeClayFrame(game); return game.makeMechBody; }
