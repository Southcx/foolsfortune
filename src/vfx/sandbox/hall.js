// ---------------------------------------------------------------------------------------
// THE SANDBOX'S HALL DRESSED (plain name; the room, its colliders, lamps, labels and rules are the runtime's and Dovina's,
// world/sandbox/, progress/sandbox.js; docs/plans/SANDBOX.md 5): the god hand's physics room in the workshop's Clay dress, the basement's
// sibling to the hub. Her merged boxes are kept for their colliders and drawn here again in room glazes (vfx/roomglazes.js, the room
// glaze atlas of vfx/surfaces.js), her stand-ins for the lecterns and the pen's posts hidden and built as what they are:
//   - THE FLOOR: the workshop's fired tiles (the palette's floor), the paint map's as every floor is; the yard outlined in a border of
//     tenmoku tiles, the pen's ring laid in shino tiles under its posts.
//   - THE WALLS: salt-glazed brick (the hub's walls: a grey stoneware box), a dado of oribe tiles round their foot, her band at 4 m
//     fired in oribe too; pilasters of ash-glazed firebrick between the lamps; dark beams under the roof.
//   - THE LECTERNS (rack, pen, ground): a turned clay pedestal dipped in tenmoku, its reading board slanted to whoever stands at it, and
//     on the board its verb's sign in its domain's glaze (the god hand's art icons, ui/icons/artart.js: the rack Telekinesis's boulder,
//     the pen Herd's crook, the ground Shape's raised and lowered ground). Signs, not words: her floor labels stay beside them.
//   - THE PEN'S POSTS: clay bollards in shino, domed, a rope of hemp swagged post to post (none across the way in at its south).
//   - THE PITCH'S LOW WALLS: fired with the kilns' natural ash glaze (its green glass pooled on the top, run down the sides), a pier at
//     each corner and on it a potted tree: kemari's four (the Heian court's kicking game, whose court was marked by four trees at its
//     corners, the kakari): the pine at the north-west, the cherry at the north-east, the willow at the south-east, the maple at the
//     south-west. Low enough for the hand's cutaway (under 3.9 m). Looks only: the trees take no ball (a collider would be Dovina's).
// DRAWS: her floor, walls and band again in their glazes (3, for her 3), the pitch's walls and piers in ash (1, for her 1), the lecterns
// and the yard's border in tenmoku (1, for her 2), the posts and the pen's ring in shino (1, for her 1), the kit's vertex-coloured mesh
// (rope, beams, pots, trees: 1), the lecterns' signs (1 decal); outline hulls on the ash, tenmoku, shino and kit meshes. Every material
// is one the level already draws with (the paint map's dressed standard, the kit's, the numerals' decal): no program added.
//
// Prior art: the hub's salt-glazed box and the workshop's tiles (this house), the Touchstone's dressing over a placeholder room
// (vfx/touchstonelook.js), the kemari court (Kyoto's Tanzan and Shimogamo shrines keep it played: the mari-niwa's four trees), the
// lectern of a church and a library, the rope-and-bollard barrier of a museum, the anagama's ash glaze (vfx/roomglazes.js 'ash').
//
//   const h = new SandboxHall(game)   h.build(room) (her group, built)   h.teardown()   h.group   HALL_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Tris } from '../racewaypark.js';
import { dress } from '../surfaces.js';
import { ROOM_GLAZES, ROOM_GLAZE_ID } from '../roomglazes.js';
import { uiIcon } from '../../ui/icons/icons.js';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { addOutline, OUTLINES } from '../../render/outline.js';
import { SANDBOX } from '../../progress/sandbox.js';
import { PALETTE, T } from '../../core/config.js';

/** Her colours (world/sandbox/sandbox.js C, yard.js POST, pitch.js C): how her merged meshes are found. */
const HERS = { floor: 0xcdb78a, wall: 0x9c5a3e, band: 0x7a4430, lectern: 0x6b4a36, gold: 0xd9a441, post: 0xb07a55, pitchWall: 0x9a6b4b };
/** The numbers (local metres from SANDBOX.at). */
export const HALL_LOOK = {
  glaze: { floor: PALETTE.floor, wall: ROOM_GLAZE_ID.hubWall, band: ROOM_GLAZES.oribe.body, ash: ROOM_GLAZE_ID.kiln, tenmoku: ROOM_GLAZES.tenmoku.body, shino: ROOM_GLAZES.shino.body },
  dado: { h: 1.1, t: 0.06 }, pilaster: { w: 0.9, t: 0.3, h: 9.5, every: 8 }, beam: { w: 0.5, h: 0.6, every: 6 },
  lectern: { foot: 0.36, waist: 0.17, top: 0.98, board: [0.84, 0.07, 0.62], tilt: 0.28, sign: 0.4 },
  post: { r: 0.21, h: 0.74, cap: 0.24, rope: 0.026, ropeY: 0.66, sag: 0.13 },
  pier: { w: 0.78, h: 0.72 },
  // kemari's four, at the pitch's corners (north is -z): the pine, the cherry, the willow, the maple; each its pot's glaze
  trees: [
    { kind: 'pine', corner: [-1, -1], pot: 0x2a4fa0 }, { kind: 'cherry', corner: [1, -1], pot: 0xf2efe6 },
    { kind: 'willow', corner: [1, 1], pot: 0x9cc3b8 }, { kind: 'maple', corner: [-1, 1], pot: 0x1c120c },
  ],
  col: { rope: 0xc9a46a, ropeDark: 0x8a6a3a, beam: 0x3a2418, bark: 0x4a3226, barkDark: 0x2e2018, pine: [0x2f5a3a, 0x3c6b44, 0x27492f], cherry: [0xf2b8c8, 0xe89ab0, 0xf7d0dc], maple: [0xc0392b, 0xd8572a, 0xe07a30], willow: [0x7da84a, 0x9cbf5a, 0x6a9440], soil: 0x3a2618 },
  signs: { rack: ['telekinesis', 'psychokinesis'], pen: ['herd', 'possession'], ground: ['shape', 'alteration'] },
};
const H = HALL_LOOK, S = SANDBOX, V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** A geometry for a dressed mesh: position and normal only (her merged boxes' attributes: dress maps by the object's position). */
function plain(geo) { const g = geo.index ? geo.toNonIndexed() : geo; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (g !== geo) geo.dispose(); return g; }
const boxAt = (x, y, z, w, h, d, rotY = 0) => { const b = new THREE.BoxGeometry(w, h, d); if (rotY) b.rotateY(rotY); return plain(b.translate(x, y, z)); };

/** A blob of a canopy (an icosahedron squashed and turned), each face its own shade of the leaves. */
function blob(Tr, c, r, sq, cols, seed) {
  const g = new THREE.IcosahedronGeometry(r, 1).scale(1, sq, 1).rotateY(hash(seed) * 6.28).translate(c.x, c.y, c.z), p = g.attributes.position;
  for (let i = 0; i < p.count; i += 3) Tr.tri(V(p.getX(i), p.getY(i), p.getZ(i)), V(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)), V(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)), cols[Math.floor(hash(seed + i * 0.37) * cols.length) % cols.length]);
  g.dispose();
}
/** A tapered trunk from a to b (six sides), its foot r0 and its top r1. */
function trunk(Tr, a, b, r0, r1, col, dark) {
  const ax = new THREE.Vector3().subVectors(b, a), len = ax.length(), g = new THREE.CylinderGeometry(r1, r0, len, 6, 1, true);
  g.translate(0, len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), ax.normalize())).translate(a.x, a.y, a.z);
  Tr.add(g, col); g.dispose();
  const cap = new THREE.CircleGeometry(r1, 6).rotateX(-Math.PI / 2).translate(b.x, b.y, b.z); Tr.add(cap, dark); cap.dispose();
}
/** A pot (a glazed tub, its rim lipped, the soil in it) at (x, y, z), its glaze `col`. */
function pot(Tr, x, y, z, col) {
  const g = new THREE.CylinderGeometry(0.34, 0.25, 0.46, 10, 1).translate(x, y + 0.23, z); Tr.add(g, col); g.dispose();
  const lip = new THREE.CylinderGeometry(0.37, 0.37, 0.06, 10, 1).translate(x, y + 0.46, z); Tr.add(lip, new THREE.Color(col).multiplyScalar(0.78).getHex()); lip.dispose();
  const soil = new THREE.CircleGeometry(0.33, 10).rotateX(-Math.PI / 2).translate(x, y + 0.44, z); Tr.add(soil, H.col.soil); soil.dispose();
}
/** One of kemari's four in its pot at (x, y, z): its trunk and its crown as the tree it is. */
function tree(Tr, kind, x, y, z, potCol, seed) {
  const C = H.col; pot(Tr, x, y, z, potCol);
  const base = V(x, y + 0.44, z), lean = V((hash(seed) - 0.5) * 0.4, 0, (hash(seed + 1) - 0.5) * 0.4);
  if (kind === 'pine') {
    // the pine pruned to clouds (niwaki): a crooked trunk, three flat pads off it
    const mid = base.clone().add(V(0.25, 0.8, 0)).add(lean), top = mid.clone().add(V(-0.35, 0.75, 0.1));
    trunk(Tr, base, mid, 0.11, 0.08, C.bark, C.barkDark); trunk(Tr, mid, top, 0.08, 0.05, C.bark, C.barkDark);
    for (const [p, r, k] of [[mid.clone().add(V(0.45, 0.05, 0.1)), 0.55, 0], [top.clone().add(V(0.05, 0.12, 0)), 0.6, 1], [mid.clone().add(V(-0.5, 0.35, -0.15)), 0.45, 2]]) blob(Tr, p, r, 0.38, C.pine, seed + k * 5);
  } else if (kind === 'willow') {
    // the willow: a tall trunk, a crown, and its strands hanging nearly to the pot
    const top = base.clone().add(V(0, 1.85, 0)).add(lean);
    trunk(Tr, base, top, 0.1, 0.07, C.bark, C.barkDark);
    blob(Tr, top.clone().add(V(0, 0.15, 0)), 0.6, 0.55, C.willow, seed);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + hash(seed + i) * 0.2, r = 0.42 + 0.2 * hash(seed + i * 3), len = 1.0 + 0.5 * hash(seed + i * 7);
      const o = top.clone().add(V(Math.cos(a) * r, 0.05, Math.sin(a) * r)), w = 0.07, t = V(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(w / 2);
      const b = o.clone().add(V(Math.cos(a) * 0.12, -len, Math.sin(a) * 0.12)), col = C.willow[i % C.willow.length];
      Tr.quad(o.clone().sub(t), o.clone().add(t), b.clone().add(t), b.clone().sub(t), col); Tr.quad(o.clone().sub(t), b.clone().sub(t), b.clone().add(t), o.clone().add(t), col);
    }
  } else {
    // the cherry and the maple: a trunk forking, a round crown of three or four blobs (the cherry in blossom, the maple in its reds)
    const top = base.clone().add(V(0, 1.1, 0)).add(lean), cols = kind === 'cherry' ? C.cherry : C.maple;
    trunk(Tr, base, top, 0.11, 0.07, C.bark, C.barkDark);
    for (const [dx, dz] of [[0.35, 0.1], [-0.3, -0.15]]) trunk(Tr, top, top.clone().add(V(dx, 0.45, dz)), 0.06, 0.035, C.bark, C.barkDark);
    for (const [p, r, k] of [[V(0.35, 0.6, 0.1), 0.55, 0], [V(-0.35, 0.55, -0.15), 0.5, 1], [V(0, 0.85, 0), 0.6, 2], [V(0.05, 0.45, 0.4), 0.42, 3]]) blob(Tr, top.clone().add(p), r, 0.8, cols, seed + k * 5);
  }
}
/** A rope swagged from a to b, sagging `sag` at its middle (a thin tube). */
function rope(Tr, a, b, sag, r, col) {
  const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(a.clone().lerp(b, u).add(V(0, -sag * 4 * u * (1 - u), 0))); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, r, 4, false); Tr.add(g, col); g.dispose();
}

// ---------------------------------------------------------------- the lecterns' signs: one atlas, a cell a lectern
const SIGN_CELL = 128;
function signAtlas() {
  const ids = Object.keys(H.signs), c = document.createElement('canvas'); c.width = SIGN_CELL * ids.length; c.height = SIGN_CELL;
  const g = c.getContext('2d'); g.lineJoin = 'round';
  ids.forEach((id, i) => {
    const [art, dom] = H.signs[id], D = DOMAIN_LOOK[dom], cx = i * SIGN_CELL + SIGN_CELL / 2, cy = SIGN_CELL / 2, R = SIGN_CELL * 0.42;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = '#120c0a'; g.fill();
    for (const [w, col] of [[14, '#120c0a'], [7, D?.colours?.body ?? '#c9a882']]) { g.beginPath(); g.arc(cx, cy, R - 6, 0, Math.PI * 2); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
    const icon = uiIcon(`godart.${art}`, D?.pal ?? 'gold'), k = Math.max(1, Math.floor((R * 1.3) / Math.max(icon.width, icon.height)));
    g.imageSmoothingEnabled = false; g.drawImage(icon, Math.round(cx - (icon.width * k) / 2), Math.round(cy - (icon.height * k) / 2), icon.width * k, icon.height * k); g.imageSmoothingEnabled = true;
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export class SandboxHall {
  constructor(game) { this.game = game; this.group = null; this.meshes = []; this.outlines = []; this.mats = []; this.hidden = []; this.geos = []; }

  /** A dressed material of a colour (the level's own: dressed by vfx/surfaces.js, the paint map's as its floors are). */
  glazed(color) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true });
    const out = this.game.paintmap?.patch(dress(m, color)) ?? dress(m, color); this.mats.push(out);
    return out;
  }
  put(geo, mat, { outline = false, shadow = true, own = true } = {}) {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; m.userData.zone = 'sandbox'; this.group.add(m); this.meshes.push(m);
    if (own) this.geos.push(geo);
    if (mat.isMeshStandardMaterial) this.game.present?.shadeOne?.(m, true, T.visual.smooth !== false);
    if (outline) { const o = addOutline(m); if (o) this.outlines.push(o); }
    return m;
  }

  /** Her merged meshes by their colours: { floor: [mesh], wall: [...], ... } (a colour not found is left to show as it was). */
  find(room) {
    const out = {};
    for (const m of room.children) {
      if (!m.isMesh || m.userData.isOutline || !m.material?.color) continue;
      const hex = m.material.color.getHex(), k = Object.keys(HERS).find((key) => HERS[key] === hex);
      if (k) (out[k] ||= []).push(m);
    }
    return out;
  }
  hide(m) { if (m?.visible) { m.visible = false; this.hidden.push(m); } }

  build(room) {
    this.teardown();
    const g = this.game, X = S.at.x, Y = S.at.y, Z = S.at.z, W = S.size, found = this.find(room);
    const grp = (this.group = new THREE.Group()); grp.name = 'sandbox-hall-look'; grp.userData.zone = 'sandbox';
    const hers = (k) => (found[k] || []).map((m) => { this.hide(m); return m.geometry; });
    // the floor, the walls and the band: her geometry, fired in the room glazes (hers hidden, kept for the paint map's charts and colliders)
    for (const geo of hers('floor')) this.put(geo, this.glazed(H.glaze.floor), { shadow: false, own: false });
    for (const geo of hers('wall')) this.put(geo, this.glazed(H.glaze.wall), { shadow: false, own: false });
    // the oribe: her band and a dado of tiles round the walls' foot
    const sx = W.w / 2, sz = W.d / 2, D = H.dado, oribe = hers('band').map((q) => plain(q.clone()));
    for (const s of [-1, 1]) oribe.push(boxAt(X + s * (sx - D.t / 2), Y + D.h / 2, Z, D.t, D.h, W.d));
    oribe.push(boxAt(X, Y + D.h / 2, Z - sz + D.t / 2, W.w, D.h, D.t));
    for (const s of [-1, 1]) oribe.push(boxAt(X + s * (2 + (sx - 2) / 2), Y + D.h / 2, Z + sz - D.t / 2, sx - 2, D.h, D.t));
    this.put(mergeGeometries(oribe), this.glazed(H.glaze.band), { shadow: false }); oribe.forEach((q) => q.dispose());
    // the ash: her pitch's low walls, the corner piers, and the pilasters between the lamps
    const P = S.pitch, Pi = H.pier, ash = hers('pitchWall').map((q) => plain(q.clone())), corners = [];
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = P.x + cx * (P.w / 2 + 0.2), z = P.z + cz * (P.d / 2 + 0.2); corners.push([x, z, cx, cz]);
      ash.push(boxAt(X + x, Y + Pi.h / 2, Z + z, Pi.w, Pi.h, Pi.w));
    }
    const Pl = H.pilaster;
    for (let x = -sx + Pl.every / 2; x < sx; x += Pl.every) for (const s of [-1, 1]) ash.push(boxAt(X + x, Y + Pl.h / 2, Z + s * (sz - Pl.t / 2), Pl.w, Pl.h, Pl.t));
    for (let z = -sz + Pl.every / 2; z < sz; z += Pl.every) for (const s of [-1, 1]) ash.push(boxAt(X + s * (sx - Pl.t / 2), Y + Pl.h / 2, Z + z, Pl.t, Pl.h, Pl.w));
    this.put(mergeGeometries(ash), this.glazed(H.glaze.ash), { outline: true }); ash.forEach((q) => q.dispose());
    // the tenmoku: the lecterns (hers hidden) and the yard's border
    hers('lectern'); hers('gold');
    const Lc = H.lectern, ten = [], signs = [];
    Object.entries(S.lecterns).forEach(([id, L0], i) => {
      const lx = X + L0.x, lz = Z + L0.z;
      const lathe = new THREE.LatheGeometry([[Lc.foot, 0], [Lc.foot + 0.02, 0.05], [Lc.foot - 0.04, 0.1], [Lc.waist + 0.04, 0.22], [Lc.waist, 0.45], [Lc.waist + 0.02, 0.68], [0.3, 0.84], [0.34, 0.9], [0.0, 0.92]].map(([r, y]) => new THREE.Vector2(r, y)), 12);
      ten.push(plain(lathe.translate(lx, Y, lz)));
      const [bw, bh, bd] = Lc.board, board = new THREE.BoxGeometry(bw, bh, bd).rotateX(Lc.tilt).translate(lx, Y + Lc.top, lz);
      ten.push(plain(board));
      ten.push(plain(new THREE.BoxGeometry(bw, 0.05, 0.05).rotateX(Lc.tilt).translate(lx, Y + Lc.top - Math.sin(Lc.tilt) * (bd / 2) + 0.03, lz + Math.cos(Lc.tilt) * (bd / 2))));
      signs.push({ i, at: V(lx, Y + Lc.top + bh / 2 + 0.004, lz) });
    });
    // (its east edge kept clear of the pen's ring, as the rack's own plan keeps the stock: world/sandbox/yard.js plan)
    const Yd = S.yard, bt = 0.3, yx0 = Yd.x - Yd.w / 2, yx1 = Math.min(Yd.x + Yd.w / 2, S.pen.x - S.pen.r - 0.7), ym = (yx0 + yx1) / 2, yw = yx1 - yx0;
    for (const [x, z, w, d] of [[ym, Yd.z - Yd.d / 2, yw + bt, bt], [ym, Yd.z + Yd.d / 2, yw + bt, bt], [yx0, Yd.z, bt, Yd.d], [yx1, Yd.z, bt, Yd.d]]) ten.push(boxAt(X + x, Y + 0.006, Z + z, w, 0.012, d));
    this.put(mergeGeometries(ten), this.glazed(H.glaze.tenmoku), { outline: true }); ten.forEach((q) => q.dispose());
    // the shino: the pen's bollards (hers hidden) and its ring of tiles
    hers('post');
    const Po = H.post, Pn = S.pen, N = 20, shino = [], kit = new Tris(), posts = [];
    for (let k = 0; k < N; k++) {
      if (k === N / 4) { posts.push(null); continue; }
      const a = (k / N) * Math.PI * 2, x = X + Pn.x + Math.cos(a) * Pn.r, z = Z + Pn.z + Math.sin(a) * Pn.r; posts.push(V(x, Y, z));
      shino.push(plain(new THREE.CylinderGeometry(Po.r, Po.r + 0.03, Po.h, 8).translate(x, Y + Po.h / 2, z)));
      shino.push(plain(new THREE.SphereGeometry(Po.cap, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, Y + Po.h, z)));
    }
    shino.push(plain(new THREE.RingGeometry(Pn.r - 0.55, Pn.r + 0.55, 40, 1).rotateX(-Math.PI / 2).translate(X + Pn.x, Y + 0.008, Z + Pn.z)));
    this.put(mergeGeometries(shino), this.glazed(H.glaze.shino), { outline: true }); shino.forEach((q) => q.dispose());
    // the kit: the pen's rope (post to post, none across the way in), the beams, kemari's four trees on their piers
    for (let k = 0; k < N; k++) { const a = posts[k], b = posts[(k + 1) % N]; if (a && b) rope(kit, a.clone().setY(Y + Po.ropeY), b.clone().setY(Y + Po.ropeY), Po.sag, Po.rope, H.col.rope); }
    const Bm = H.beam;
    for (let x = -sx + Bm.every / 2; x < sx; x += Bm.every) kit.add(new THREE.BoxGeometry(Bm.w, Bm.h, W.d).translate(X + x, Y + W.h - Bm.h / 2, Z), H.col.beam);
    H.trees.forEach((t, i) => { const c = corners.find((q) => q[2] === t.corner[0] && q[3] === t.corner[1]); if (c) tree(kit, t.kind, X + c[0], Y + Pi.h, Z + c[1], t.pot, 11 + i * 7); });
    this.put(kit.geometry(), this.kitMat = new THREE.MeshStandardMaterial({ name: 'sandbox-hall-kit', color: 0xffffff, vertexColors: true, roughness: 0.8, metalness: 0, flatShading: true }), { outline: true });
    this.mats.push(this.kitMat);
    // the lecterns' signs on their boards
    this.signMap = signAtlas();
    const sm = new THREE.MeshBasicMaterial({ name: 'sandbox-hall-signs', map: this.signMap, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.mats.push(sm);
    const n = Object.keys(H.signs).length, pos = [], uv = [], idx = [], q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Lc.tilt);
    signs.forEach(({ i, at }) => {
      const b = pos.length / 3, s = Lc.sign / 2;
      for (const [dx, dz, u, v] of [[-s, s, i / n, 0], [s, s, (i + 1) / n, 0], [s, -s, (i + 1) / n, 1], [-s, -s, i / n, 1]]) { const p = V(dx, 0, dz).applyQuaternion(q).add(at); pos.push(p.x, p.y, p.z); uv.push(u, v); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeBoundingSphere();
    this.put(sg, sm, { shadow: false });
    g.scene.add(grp);
    return found;
  }

  teardown() {
    if (!this.group) return;
    for (const o of this.outlines) OUTLINES.delete(o);
    this.game.scene?.remove(this.group);
    for (const geo of this.geos) geo.dispose();
    for (const m of this.mats) m.dispose();
    this.signMap?.dispose();
    for (const m of this.hidden) m.visible = true;
    this.group = null; this.meshes = []; this.outlines = []; this.mats = []; this.hidden = []; this.geos = []; this.signMap = null;
  }
}
