// ---------------------------------------------------------------------------------------
// THE BRACELET (working name, Espada's and the owner's to rule; docs/plans/BRACELET.md): one ring worn by the Vessoul in every form, its
// look. At the god hand's wrist a bracelet, round the Pneuka Jar's neck a choker, at the Courier's left wrist a slim band (shown only).
// One job: the ring's body and its glow. What it is worn on and what drives it is vfx/braceletwear.js.
//
//   THE BODY   a band of clay with seven sockets round it, one a domain (progress/domains.js order), and a gold kintsugi join between the first
//              and the last: a small gold knot, kintsugi's gold tied. A socket whose domain is under level 30 is closed: raised bisque,
//              unfired-looking (BISQUE). An open one is glazed in its domain's kiln glaze, its tile's character as the texture
//              (ui/domainlook.js glazeTile, DOMAIN_LOOK). Gold beads part the sockets. A charm sits proud of its socket
//              (vfx/braceletcharms.js), told by its shape. The Courier's band is the slim one: flush sockets, no charms shown.
//   THE GLOW   one mark, read four ways, never text (BRACELET.md decision 5):
//                - its brightness is the share of the pool a power is spending (`spend` 0..1);
//                - its colour is the glaze of the domain in use (its accent, or its body);
//                - a slow red pulse is the Dissonance Level (0..5): each step quicker and deeper;
//                - a gold line running once round the ring is a charm triggering (`charm(id)`).
//              Drawn as a soft ribbon over the band (an additive strip whose edges fade in its own texture, so at 480 lines it never
//              crawls), the socket in use lit from within (its emissive), and round the Pneuka Jar a brief aura: a soft ring sprite.
//   THE DRAW   (Petra's measure, 2026-10-13: 17 calls a bracelet) the whole body is ONE merged mesh: band, sockets, beads, knot and the
//              charms worn, each part's colour, roughness, metalness and glow carried per vertex, the seven glazes one atlas. It is
//              re-merged from cached parts only when a socket opens or closes or a charm is set. The glow ribbon is the second call;
//              the charm's gold line and the Jar's aura draw only while they show. One program of its own (`bracelet-body`), warmed
//              at boot by braceletwear.js's prewarm.
//
// Prior art: Vagrant Story's gem slots (a weapon's sockets, each gem bending it), Final Fantasy VII's materia slots (the linked pair read
// on the bangle itself), Hollow Knight's charm notches (few notches, a build); .hack's Twilight Bracelet for the glow worn as a state;
// the kintsugi knot at the join (no clasp slot: the owner, 2026-10-13). The draw: static batching as Unity's (parts merged once, their
// differences moved into vertex data) and a texture atlas with gutters (id Tech's and every sprite packer's padding against mip bleed).
//
//   const B = new Bracelet(game, { form: 'hand' | 'jar' | 'courier', aura? })
//   B.attach(boneOrObject, offset?: Vector3, scale?: number, { yaw? })   (the ring's axis is the parent's +Y; unit radius 1 x scale)
//   B.setSockets({ [domain]: open bool })   B.setLevels({ [domain]: level })   B.setCharm(socket, id | null)  (socket: a domain)
//   B.glow({ spend, domain, dissonance })     B.charm(id)     B.pulse(k)     B.update(dt)     B.object     B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DOMAINS } from '../progress/domains.js';
import { DOMAIN_LOOK, glazeTile, BISQUE, THE_WORLD_GOLD } from '../ui/domainlook.js';
import { charmGeometry, charmMaterials } from './braceletcharms.js';

export const SOCKETS = Object.keys(DOMAINS); // (the seven, in the domains' own order; the join is the eighth place, holding nothing)
export const SOCKET_OPENS_AT = 30; // (a domain's level that opens its socket: BRACELET.md decision 1)
const PLACES = SOCKETS.length + 1; // (the join sits at place 0, the sockets at 1..7)
const STEP = (Math.PI * 2) / PLACES;
const REJECTION_RED = new THREE.Color(1.0, 0.12, 0.08);
const GOLD = new THREE.Color(THE_WORLD_GOLD);
const _red = new THREE.Color();

/** Each form's proportions at unit radius (the band's half-height and thickness, the sockets' rise, whether charms show) and its
 *  segments (cut to what reads at 480 lines: at most 2,000 triangles a bracelet with every charm and the glow, the Courier's well under
 *  1,000: the owner, 2026-10-13). */
const FORMS = {
  hand: { h: 0.17, t: 0.12, rise: 0.035, charms: true, glowW: 0.5, seg: { band: 24, sock: 3, bead: [6, 3], knot: [32, 3], glow: 32 } },
  jar: { h: 0.17, t: 0.11, rise: 0.035, charms: true, glowW: 0.5, seg: { band: 24, sock: 3, bead: [6, 3], knot: [32, 3], glow: 32 } },
  courier: { h: 0.3, t: 0.16, rise: 0.012, charms: false, glowW: 0.75, seg: { band: 20, sock: 2, bead: [4, 2], knot: [20, 3], glow: 24 } }, // (slim in metres: tall for its radius so it still reads at 480 lines)
};

// ---- the glaze atlas: the seven tiles stacked in cells with gutters (each tile's edge rows stretched into them, so a mip never borrows
// a neighbour's colour), and an eighth cell of white for every part that is not a glaze ------------------------------------------------
const TILE_W = 48, TILE_H = 12, CELL = 32, PAD = (CELL - TILE_H) / 2, ATLAS_H = CELL * 8;
const tileV = (i) => [1 - (i * CELL + PAD + TILE_H) / ATLAS_H, 1 - (i * CELL + PAD) / ATLAS_H]; // (bottom, top: the canvas flipped)
const WHITE_V = 1 - (7 * CELL + CELL / 2) / ATLAS_H;

let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const atlas = document.createElement('canvas'); atlas.width = TILE_W; atlas.height = ATLAS_H;
  const ag = atlas.getContext('2d'); ag.imageSmoothingEnabled = false;
  const glaze = {};
  SOCKETS.forEach((d, i) => {
    const tile = glazeTile(d, { w: TILE_W, h: TILE_H }), y = i * CELL;
    ag.drawImage(tile, 0, 0, TILE_W, 1, 0, y, TILE_W, PAD); // (the gutters: the tile's top and bottom rows stretched)
    ag.drawImage(tile, 0, TILE_H - 1, TILE_W, 1, 0, y + PAD + TILE_H, TILE_W, PAD);
    ag.drawImage(tile, 0, y + PAD);
    const L = DOMAIN_LOOK[d].colours;
    glaze[d] = { accent: new THREE.Color(L.accent || L.body), body: new THREE.Color(L.body) };
  });
  ag.fillStyle = '#ffffff'; ag.fillRect(0, 7 * CELL, TILE_W, CELL);
  const atlasTex = new THREE.CanvasTexture(atlas);
  atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.wrapS = THREE.RepeatWrapping; atlasTex.anisotropy = 2; // (linear and mipmapped: the glaze's grain blurs, never sparkles)
  const soft = document.createElement('canvas'); soft.width = 4; soft.height = 64; // (across the glow's ribbon: zero at both edges, full in the middle)
  const sg = soft.getContext('2d'), grad = sg.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(0.5, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 4, 64);
  const softTex = new THREE.CanvasTexture(soft);
  const ring = document.createElement('canvas'); ring.width = ring.height = 128; // (the aura: a soft ring, bright at 70% of its radius)
  const rg = ring.getContext('2d'), rr = rg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rr.addColorStop(0, 'rgba(255,255,255,0)'); rr.addColorStop(0.5, 'rgba(255,255,255,0.15)'); rr.addColorStop(0.7, 'rgba(255,255,255,1)'); rr.addColorStop(0.85, 'rgba(255,255,255,0.25)'); rr.addColorStop(1, 'rgba(255,255,255,0)');
  rg.fillStyle = rr; rg.fillRect(0, 0, 128, 128);
  const ringTex = new THREE.CanvasTexture(ring);
  const [porcelain, charmGold] = charmMaterials();
  const surf = (color, roughness, metalness, emissive = 0x000000, emissiveIntensity = 0) => ({ color: new THREE.Color(color), roughness, metalness, emis: new THREE.Color(emissive).multiplyScalar(emissiveIntensity) });
  SHARED = {
    glaze, atlasTex, softTex, ringTex, pieces: new Map(),
    // each part's surface, as the materials it was drawn with before the merge
    clay: surf(0x7a5640, 0.85, 0), // (the band's body: a darker fired clay under the sockets)
    bisque: surf(BISQUE, 0.95, 0), // (a closed socket: unglazed)
    glazed: surf(0xffffff, 0.22, 0), // (an open socket: its tile in the atlas)
    gold: surf(THE_WORLD_GOLD, 0.32, 0.7, THE_WORLD_GOLD, 0.22),
    porcelain: surf(porcelain.color, porcelain.roughness, porcelain.metalness, porcelain.emissive, porcelain.emissiveIntensity),
    charmGold: surf(charmGold.color, charmGold.roughness, charmGold.metalness, charmGold.emissive, charmGold.emissiveIntensity),
  };
  return SHARED;
}

/** A closed band's cross-section turned round the ring (a rectangle with its corners chamfered; `phi` for an arc). */
function bandGeometry(r0, r1, h, segs, phiStart = 0, phiLength = Math.PI * 2) {
  const c = Math.min(r1 - r0, 2 * h) * 0.3, pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 1; i++) { const a = a0 + i * (Math.PI / 2); pts.push(new THREE.Vector2(cx + Math.cos(a) * c, cy + Math.sin(a) * c)); } };
  corner(r1 - c, -h + c, -Math.PI / 2); corner(r1 - c, h - c, 0); corner(r0 + c, h - c, Math.PI / 2); corner(r0 + c, -h + c, Math.PI);
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, segs, phiStart, phiLength), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) + h) / (2 * h)); // (the tile's height up the band's face, not round its cross-section: the whole glaze shows on the front)
  return g;
}

/** A part made ready to merge: non-indexed, its surface written per vertex (colour, `surf` = roughness, metalness, socket, `emis`), its
 *  uv moved into the atlas (a glaze's cell, or the white one). */
function dressed(geo, S, { cell = -1, socket = -1 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), n = g.attributes.position.count;
  const col = new Float32Array(n * 3), surf = new Float32Array(n * 3), emis = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const src = g.attributes.uv, [v0, v1] = cell >= 0 ? tileV(cell) : [0, 0];
  for (let i = 0; i < n; i++) {
    col[i * 3] = S.color.r; col[i * 3 + 1] = S.color.g; col[i * 3 + 2] = S.color.b;
    surf[i * 3] = S.roughness; surf[i * 3 + 1] = S.metalness; surf[i * 3 + 2] = socket;
    emis[i * 3] = S.emis.r; emis[i * 3 + 1] = S.emis.g; emis[i * 3 + 2] = S.emis.b;
    if (cell >= 0 && src) { uv[i * 2] = src.getX(i); uv[i * 2 + 1] = v0 + src.getY(i) * (v1 - v0); } else { uv[i * 2] = 0.5; uv[i * 2 + 1] = WHITE_V; }
  }
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('surf', new THREE.BufferAttribute(surf, 3)); g.setAttribute('emis', new THREE.BufferAttribute(emis, 3));
  g.clearGroups();
  return g;
}

/** The parts of a form, in the ring's frame, made once and kept (every bracelet of that form merges from them). */
function piece(form, key, make) {
  const P = shared().pieces, k = `${form}:${key}`;
  if (!P.has(k)) P.set(k, make());
  return P.get(k);
}
const sockMid = (i) => (i + 1) * STEP;

function partsOf(form, sockets) {
  const F = FORMS[form], S = shared(), Z = F.seg, ri = 1 - F.t * 0.5, ro = 1 + F.t * 0.5, arc = STEP * 0.78;
  const parts = [piece(form, 'static', () => {
    const list = [dressed(bandGeometry(ri, ro, F.h * 0.82, Z.band), S.clay)]; // (the band's body, whole round)
    const bead = new THREE.SphereGeometry(F.h * 0.42, Z.bead[0], Z.bead[1]); // (the gold beads between the sockets)
    for (let i = 1; i < PLACES; i++) { const a = (i + 0.5) * STEP; list.push(dressed(bead.clone().translate(Math.sin(a) * (ro + F.rise * 0.4), 0, Math.cos(a) * (ro + F.rise * 0.4)), S.gold)); }
    list.push(dressed(new THREE.TorusKnotGeometry(F.h * 0.62, F.h * 0.2, Z.knot[0], Z.knot[1], 2, 3).scale(1, 1, 0.55).translate(0, 0, ro + F.rise), S.gold)); // (the join's knot, place 0)
    return mergeGeometries(list, false);
  })];
  SOCKETS.forEach((d, i) => {
    const s = sockets[d], open = s.open;
    parts.push(piece(form, `${d}:${open ? 'open' : 'shut'}`, () => dressed(bandGeometry(ri - F.rise * 0.5, ro + F.rise, F.h, Z.sock, sockMid(i) - arc / 2, arc), open ? S.glazed : S.bisque, open ? { cell: i, socket: i } : {})));
    if (open && s.charm && F.charms) {
      const geo = charmGeometry(s.charm);
      if (geo) parts.push(piece(form, `${d}:charm:${s.charm}`, () => {
        const m = new THREE.Matrix4().makeRotationY(sockMid(i)).multiply(new THREE.Matrix4().makeTranslation(0, 0, ro + F.rise)).multiply(new THREE.Matrix4().makeScale(F.h / 0.17, F.h / 0.17, F.h / 0.17));
        const out = [];
        for (const [gi, grp] of geo.groups.entries()) {
          const part = new THREE.BufferGeometry(), pos = geo.attributes.position, nor = geo.attributes.normal;
          part.setAttribute('position', new THREE.BufferAttribute(pos.array.slice(grp.start * 3, (grp.start + grp.count) * 3), 3));
          part.setAttribute('normal', new THREE.BufferAttribute(nor.array.slice(grp.start * 3, (grp.start + grp.count) * 3), 3));
          out.push(dressed(part.applyMatrix4(m), gi === 0 ? S.porcelain : S.charmGold));
        }
        return mergeGeometries(out, false);
      }));
    }
  });
  return parts;
}

/** The body's one material: a MeshStandardMaterial whose roughness, metalness and emissive come from the vertex, and whose socket in
 *  use is lit from within by a uniform (`uLit`, on the vertices whose socket is `uLitSock`). */
function bodyMaterial(uniforms) {
  const m = new THREE.MeshStandardMaterial({ map: shared().atlasTex, vertexColors: true, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 surf;\nattribute vec3 emis;\nvarying vec3 vSurf;\nvarying vec3 vEmis;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurf = surf; vEmis = emis;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSurf;\nvarying vec3 vEmis;\nuniform vec3 uLit;\nuniform float uLitSock;')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vSurf.x;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vSurf.y;')
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = vEmis + uLit * (1.0 - step(0.5, abs(vSurf.z - uLitSock)));');
  };
  m.customProgramCacheKey = () => 'bracelet-body';
  return m;
}

/** A strip round the ring at radius r, `w` tall, its segments in order so a draw range can run along it (`turns` times round). */
function ribbonGeometry(r, w, segs, turns = 1) {
  const n = segs * turns, pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / segs) * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r;
    pos.push(x, -w / 2, z, x, w / 2, z); uv.push(i / segs, 0, i / segs, 1);
    if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

const glowMat = (map) => new THREE.MeshBasicMaterial({ map, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false });

export class Bracelet {
  constructor(game, { form = 'hand', aura = form === 'jar' } = {}) {
    this.game = game; this.form = FORMS[form] ? form : 'hand';
    const F = FORMS[this.form], S = shared(), ro = 1 + F.t * 0.5;
    this.object = new THREE.Group(); this.object.name = `Bracelet.${this.form}`;
    this.ring = new THREE.Group(); this.object.add(this.ring); // (turned by `yaw`: where the join faces)
    this.sockets = {};
    SOCKETS.forEach((d, i) => { this.sockets[d] = { mid: sockMid(i), open: false, charm: null }; });
    // the body: one mesh, re-merged when a socket or a charm changes
    this.uniforms = { uLit: { value: new THREE.Color(0, 0, 0) }, uLitSock: { value: -9 } };
    this.bodyMat = bodyMaterial(this.uniforms);
    this.body = new THREE.Mesh(new THREE.BufferGeometry(), this.bodyMat); this.body.name = 'Bracelet.body'; this.ring.add(this.body);
    this.shape = '';
    this.rebuild();
    // the glow: a soft ribbon just over the band, and the charm's gold line (two turns long, so its run never wraps)
    this.glowMat = glowMat(S.softTex);
    this.glowMesh = new THREE.Mesh(ribbonGeometry(ro + F.rise + 0.012, F.h * 2 * (1 + F.glowW), F.seg.glow), this.glowMat);
    this.glowMesh.renderOrder = 3; this.ring.add(this.glowMesh);
    this.flashSegs = F.seg.glow;
    this.flashMat = glowMat(S.softTex); this.flashMat.color.copy(GOLD).multiplyScalar(2.2);
    this.flashMesh = new THREE.Mesh(ribbonGeometry(ro + F.rise + 0.02, F.h * 1.3, this.flashSegs, 2), this.flashMat);
    this.flashMesh.renderOrder = 4; this.flashMesh.visible = false; this.flashMesh.frustumCulled = false; this.ring.add(this.flashMesh);
    // the aura round the Pneuka Jar: a soft ring sprite at the ring's heart, brief, while a power is spending (drawn only while it shows)
    if (aura) {
      this.auraMat = new THREE.SpriteMaterial({ map: S.ringTex, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
      this.aura = new THREE.Sprite(this.auraMat); this.aura.scale.setScalar(6.5); this.aura.renderOrder = 2; this.aura.visible = false; this.object.add(this.aura);
    }
    this.object.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    // the state the glow eases toward
    this.state = { spend: 0, domain: null, dissonance: 0 };
    this.lit = 0; this.kick = 0; this.col = new THREE.Color(); this.t = 0; this.flashT = -1; this.flashFrom = 0;
  }

  /** The body merged again from the cached parts, when what shows has changed (a socket opened or closed, a charm set). */
  rebuild() {
    const show = FORMS[this.form].charms;
    const shape = SOCKETS.map((d) => { const s = this.sockets[d]; return s.open ? `1${show && s.charm ? s.charm : ''}` : '0'; }).join(',');
    if (shape === this.shape) return this;
    this.shape = shape;
    const old = this.body.geometry;
    this.body.geometry = mergeGeometries(partsOf(this.form, this.sockets), false);
    this.body.geometry.computeBoundingSphere();
    old.dispose();
    return this;
  }

  /** Worn on a bone or an object: the ring's axis is the parent's +Y, its centre at `offset`, its radius `scale` (the parent's units). */
  attach(parent, offset = new THREE.Vector3(), scale = 1, { yaw = 0, tilt = null } = {}) {
    this.object.removeFromParent();
    this.object.position.copy(offset); this.object.scale.setScalar(scale); this.ring.rotation.y = yaw;
    if (tilt) this.object.rotation.set(tilt.x || 0, tilt.y || 0, tilt.z || 0);
    parent?.add(this.object);
    return this;
  }

  /** Which sockets are open (glazed): a map of domain to true/false. */
  setSockets(open = {}) {
    for (const d of SOCKETS) if (d in open) this.sockets[d].open = !!open[d];
    return this.rebuild();
  }
  /** The sockets opened by the domains' levels (a socket opens at level 30). */
  setLevels(levels = {}) { return this.setSockets(Object.fromEntries(Object.entries(levels).map(([d, l]) => [d, l >= SOCKET_OPENS_AT]))); }

  /** A charm set in a domain's socket, or taken out (null). Shown only in an open socket, never on the Courier's band. */
  setCharm(socket, id) {
    const s = this.sockets[socket]; if (!s) return this;
    s.charm = id || null; // (an id with no piece is still held, for its flash; it just shows nothing)
    return this.rebuild();
  }

  /** The glow's state: how much of the pool a power is spending (0..1), the domain in use, the Dissonance Level (0..5; `rejection` is its old name). Any may be left out. */
  glow({ spend, domain, dissonance, rejection } = {}) {
    if (dissonance === undefined) dissonance = rejection;
    const S = this.state;
    if (spend !== undefined) S.spend = THREE.MathUtils.clamp(+spend || 0, 0, 1);
    if (domain !== undefined) S.domain = DOMAIN_LOOK[domain] ? domain : null;
    if (dissonance !== undefined) S.dissonance = THREE.MathUtils.clamp(Math.round(+dissonance || 0), 0, 5);
    return this;
  }
  /** A power used: the glow kicks up by `k` (0..1) and falls back over about a real second (the aura rides it). */
  pulse(k = 0.6) { this.kick = Math.max(this.kick, THREE.MathUtils.clamp(k, 0, 1)); return this; }

  /** A charm triggering: a gold line runs once round the ring, from the socket that holds it. */
  charm(id) {
    let from = 0;
    for (const [, s] of Object.entries(this.sockets)) if (s.charm && s.charm === id) { from = s.mid; break; }
    this.flashFrom = from; this.flashT = 0;
    return this;
  }

  update(dt = 1 / 60) {
    dt = Math.min(0.1, Math.max(0, dt)); this.t += dt;
    const S = this.state, G = shared().glaze;
    this.kick = Math.max(0, this.kick - dt * 1.1);
    const want = Math.max(S.spend, this.kick);
    this.lit += (want - this.lit) * Math.min(1, dt * 8);
    // the domain's colour, brightness by spend; an ember at rest so the ring never reads as dead
    const base = S.domain ? G[S.domain].accent : GOLD;
    this.col.copy(base).multiplyScalar(0.05 + this.lit * 1.5);
    // the Dissonance Level's pulse: slow and shallow at 1, quicker and deeper by 5
    if (S.dissonance > 0) {
      const hz = 0.22 + 0.13 * S.dissonance, depth = 0.18 + 0.16 * S.dissonance;
      const p = 0.5 - 0.5 * Math.cos(this.t * hz * Math.PI * 2);
      this.col.lerp(REJECTION_RED, Math.min(1, depth * p * 0.9)).add(_red.copy(REJECTION_RED).multiplyScalar(depth * p * 0.9));
    }
    this.glowMat.color.copy(this.col);
    // the socket in use lit from within (its glaze's accent, on that socket's vertices only)
    const U = this.uniforms, inUse = S.domain && this.sockets[S.domain]?.open;
    U.uLitSock.value = inUse ? SOCKETS.indexOf(S.domain) : -9;
    if (inUse) U.uLit.value.copy(G[S.domain].accent).multiplyScalar(0.15 + this.lit * 0.9);
    // the aura: only while a power spends, a soft ring in the glow's colour
    if (this.aura) {
      const a = Math.max(0, this.lit - 0.04);
      this.aura.visible = a > 0.01; this.auraMat.color.copy(this.col); this.auraMat.opacity = Math.min(0.85, a * 0.9);
      this.aura.scale.setScalar(6.5 * (1 + 0.06 * Math.sin(this.t * 2.4)));
    }
    // the charm's gold line: a quarter of the ring long, once round over 0.7 real seconds, fading at its end
    if (this.flashT >= 0) {
      this.flashT += dt;
      const D = 0.7, k = this.flashT / D, n = this.flashSegs;
      if (k >= 1) { this.flashT = -1; this.flashMesh.visible = false; }
      else {
        const len = Math.round(n * 0.25), head = Math.round(k * n), s0 = Math.round((this.flashFrom / (Math.PI * 2)) * n) % n, tail = Math.max(0, head - len);
        this.flashMesh.geometry.setDrawRange((s0 + tail) * 6, (head - tail) * 6);
        this.flashMat.color.copy(GOLD).multiplyScalar(2.4 * Math.min(1, (1 - k) * 3));
        this.flashMesh.visible = true;
      }
    }
  }

  /** For the warm-up: every look shown at once (open sockets, a charm in each, the flash and the aura). */
  showAll() {
    SOCKETS.forEach((s, i) => { this.sockets[s].open = true; this.sockets[s].charm = ['TWIN', 'WIDE', 'ECHO', 'QUIET', 'THRIFT', 'LINGER', 'GENTLE'][i]; });
    this.rebuild();
    this.flashMesh.visible = true; this.flashMesh.geometry.setDrawRange(0, 96);
    if (this.aura) { this.aura.visible = true; this.auraMat.opacity = 0.5; }
    return this;
  }

  dispose() {
    this.object.removeFromParent();
    this.body.geometry.dispose(); this.glowMesh.geometry.dispose(); this.flashMesh.geometry.dispose();
    this.bodyMat.dispose(); this.glowMat.dispose(); this.flashMat.dispose(); this.auraMat?.dispose();
  }
}
