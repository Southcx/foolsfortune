// ---------------------------------------------------------------------------------------
// THE BRACELET (working name, Espada's and the owner's to rule; docs/plans/BRACELET.md): one ring worn by the Vessoul in every form, its
// look. At the god hand's wrist a bracelet, round the Pneuka Jar's neck a choker, at the Courier's left wrist a slim band (shown only).
// One job: the ring's body and its glow. What it is worn on and what drives it is vfx/braceletwear.js.
//
//   THE BODY   a band of clay with seven sockets round it, one a domain (progress/domains.js order), and the clasp between the first
//              and the last: a small gold knot, kintsugi's gold tied. A socket whose domain is under level 30 is closed: raised bisque,
//              unfired-looking (BISQUE). An open one is glazed in its domain's kiln glaze, its tile's character as the texture
//              (ui/domainlook.js glazeTile, DOMAIN_LOOK). Gold beads part the sockets. A charm sits proud of its socket
//              (vfx/braceletcharms.js), told by its shape. The Courier's band is the slim one: flush sockets, no charms shown.
//   THE GLOW   one mark, read four ways, never text (BRACELET.md decision 5):
//                - its brightness is the share of the pool a power is spending (`spend` 0..1);
//                - its colour is the glaze of the domain in use (its accent, or its body);
//                - a slow red pulse is rejection's step (0..5): each step quicker and deeper;
//                - a gold line running once round the ring is a charm triggering (`charm(id)`).
//              Drawn as a soft ribbon over the band (an additive strip whose edges fade in its own texture, so at 480 lines it never
//              crawls), the socket in use lit from within (its emissive), and round the Pneuka Jar a brief aura: a soft ring sprite.
//
// Prior art: Vagrant Story's gem slots (a weapon's sockets, each gem bending it), Final Fantasy VII's materia slots (the linked pair read
// on the bangle itself), Hollow Knight's charm notches (few notches, a build); .hack's Twilight Bracelet for the glow worn as a state;
// the kintsugi knot for the clasp. Materials only (MeshStandardMaterial, MeshBasicMaterial, SpriteMaterial): no shader of its own.
//
//   const B = new Bracelet(game, { form: 'hand' | 'jar' | 'courier', aura? })
//   B.attach(boneOrObject, offset?: Vector3, scale?: number, { yaw? })   (the ring's axis is the parent's +Y; unit radius 1 x scale)
//   B.setSockets({ [domain]: open bool })   B.setLevels({ [domain]: level })   B.setCharm(socket, id | null)  (socket: a domain or 'clasp')
//   B.glow({ spend, domain, rejection })     B.charm(id)     B.update(dt)     B.object     B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DOMAINS } from '../progress/domains.js';
import { DOMAIN_LOOK, glazeTile, BISQUE, THE_WORLD_GOLD } from '../ui/domainlook.js';
import { charmGeometry, charmMaterials } from './braceletcharms.js';

export const SOCKETS = Object.keys(DOMAINS); // (the seven, in the domains' own order; the clasp is the eighth place)
export const SOCKET_OPENS_AT = 30; // (a domain's level that opens its socket: BRACELET.md decision 1)
const PLACES = SOCKETS.length + 1; // (the clasp sits at place 0, the sockets at 1..7)
const STEP = (Math.PI * 2) / PLACES;
const REJECTION_RED = new THREE.Color(1.0, 0.12, 0.08);
const GOLD = new THREE.Color(THE_WORLD_GOLD);
const _red = new THREE.Color();

/** Each form's proportions at unit radius: the band's half-height and thickness, the sockets' rise, and whether charms show. */
const FORMS = {
  hand: { h: 0.17, t: 0.12, rise: 0.035, charms: true, glowW: 0.5 },
  jar: { h: 0.17, t: 0.11, rise: 0.035, charms: true, glowW: 0.5 },
  courier: { h: 0.3, t: 0.16, rise: 0.012, charms: false, glowW: 0.75 }, // (slim in metres: tall for its radius so it still reads at 480 lines)
};

// ---- shared pieces (made once, kept: their programs live while they do) ------------------------------------------------------------
let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const glaze = {};
  for (const d of SOCKETS) {
    const tex = new THREE.CanvasTexture(glazeTile(d, { w: 48, h: 12 }));
    tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 2; // (linear and mipmapped: the glaze's grain blurs, never sparkles)
    const L = DOMAIN_LOOK[d].colours;
    glaze[d] = { map: tex, accent: new THREE.Color(L.accent || L.body), body: new THREE.Color(L.body) };
  }
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
  SHARED = {
    glaze, softTex, ringTex,
    clay: new THREE.MeshStandardMaterial({ color: 0x7a5640, roughness: 0.85 }), // (the band's body: a darker fired clay under the sockets)
    bisque: new THREE.MeshStandardMaterial({ color: BISQUE, roughness: 0.95 }), // (a closed socket: unglazed)
    gold: new THREE.MeshStandardMaterial({ color: THE_WORLD_GOLD, roughness: 0.32, metalness: 0.7, emissive: THE_WORLD_GOLD, emissiveIntensity: 0.22 }),
  };
  return SHARED;
}

/** A closed band's cross-section turned round the ring (a rounded rectangle; `phi` for an arc). */
function bandGeometry(r0, r1, h, segs, phiStart = 0, phiLength = Math.PI * 2) {
  const c = Math.min(r1 - r0, 2 * h) * 0.3, pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = a0 + (i / 3) * (Math.PI / 2); pts.push(new THREE.Vector2(cx + Math.cos(a) * c, cy + Math.sin(a) * c)); } };
  corner(r1 - c, -h + c, -Math.PI / 2); corner(r1 - c, h - c, 0); corner(r0 + c, h - c, Math.PI / 2); corner(r0 + c, -h + c, Math.PI);
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, segs, phiStart, phiLength), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) + h) / (2 * h)); // (the tile's height up the band's face, not round its cross-section: the whole glaze shows on the front)
  return g;
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

const glowMat = (map) => new THREE.MeshBasicMaterial({ map, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });

export class Bracelet {
  constructor(game, { form = 'hand', aura = form === 'jar' } = {}) {
    this.game = game; this.form = FORMS[form] ? form : 'hand';
    const F = FORMS[this.form], S = shared();
    this.object = new THREE.Group(); this.object.name = `Bracelet.${this.form}`;
    this.ring = new THREE.Group(); this.object.add(this.ring); // (turned by `yaw`: where the clasp faces)
    this.geos = [];
    const keep = (g) => (this.geos.push(g), g);
    const ri = 1 - F.t * 0.5, ro = 1 + F.t * 0.5;
    // the band's body, whole round
    this.band = new THREE.Mesh(keep(bandGeometry(ri, ro, F.h * 0.82, 48)), S.clay); this.ring.add(this.band);
    // the sockets: a raised arc each, its material bisque (closed) or its own glaze (open)
    this.sockets = {}; this.glazeMats = {};
    const arc = STEP * 0.78;
    SOCKETS.forEach((d, i) => {
      const mid = (i + 1) * STEP, G = S.glaze[d];
      const mat = new THREE.MeshStandardMaterial({ map: G.map, roughness: 0.22, metalness: 0, emissive: G.accent, emissiveIntensity: 0 });
      this.glazeMats[d] = mat;
      const mesh = new THREE.Mesh(keep(bandGeometry(ri - F.rise * 0.5, ro + F.rise, F.h, 10, mid - arc / 2, arc)), S.bisque);
      const holder = new THREE.Group(); holder.rotation.y = mid; holder.add(new THREE.Object3D()); // (the socket's frame: +Z out of the ring)
      const seat = holder.children[0]; seat.position.set(0, 0, ro + F.rise);
      this.ring.add(mesh, holder);
      this.sockets[d] = { mesh, seat, mid, open: false, charm: null, charmMesh: null };
    });
    // the gold beads between the sockets, and the clasp's knot at place 0
    const bead = keep(new THREE.SphereGeometry(F.h * 0.42, 10, 8));
    for (let i = 1; i < PLACES; i++) {
      const a = (i + 0.5) * STEP, m = new THREE.Mesh(bead, S.gold);
      m.position.set(Math.sin(a) * (ro + F.rise * 0.4), 0, Math.cos(a) * (ro + F.rise * 0.4)); this.ring.add(m);
    }
    const knotGeo = keep(new THREE.TorusKnotGeometry(F.h * 0.62, F.h * 0.2, 48, 6, 2, 3));
    const knot = new THREE.Mesh(knotGeo, S.gold); knot.position.set(0, 0, ro + F.rise); knot.scale.set(1, 1, 0.55); this.ring.add(knot);
    const claspSeat = new THREE.Object3D(); claspSeat.position.set(0, 0, ro + F.rise + F.h * 0.25); this.ring.add(claspSeat);
    this.sockets.clasp = { mesh: knot, seat: claspSeat, mid: 0, open: true, charm: null, charmMesh: null, clasp: true };
    // the glow: a soft ribbon just over the band, and the charm's gold line (two turns long, so its run never wraps)
    this.glowMat = glowMat(S.softTex);
    this.glowMesh = new THREE.Mesh(keep(ribbonGeometry(ro + F.rise + 0.012, F.h * 2 * (1 + F.glowW), 64)), this.glowMat);
    this.glowMesh.renderOrder = 3; this.ring.add(this.glowMesh);
    this.flashSegs = 64;
    this.flashMat = glowMat(S.softTex); this.flashMat.color.copy(GOLD).multiplyScalar(2.2);
    this.flashMesh = new THREE.Mesh(keep(ribbonGeometry(ro + F.rise + 0.02, F.h * 1.3, this.flashSegs, 2)), this.flashMat);
    this.flashMesh.renderOrder = 4; this.flashMesh.visible = false; this.flashMesh.frustumCulled = false; this.ring.add(this.flashMesh);
    // the aura round the Pneuka Jar: a soft ring sprite at the ring's heart, brief, while a power is spending
    if (aura) {
      this.auraMat = new THREE.SpriteMaterial({ map: S.ringTex, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
      this.aura = new THREE.Sprite(this.auraMat); this.aura.scale.setScalar(6.5); this.aura.renderOrder = 2; this.aura.visible = false; this.object.add(this.aura);
    }
    this.object.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    // the state the glow eases toward
    this.state = { spend: 0, domain: null, rejection: 0 };
    this.lit = 0; this.kick = 0; this.col = new THREE.Color(); this.t = 0; this.flashT = -1; this.flashFrom = 0;
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
    for (const d of SOCKETS) if (d in open) {
      const s = this.sockets[d]; s.open = !!open[d];
      s.mesh.material = s.open ? this.glazeMats[d] : shared().bisque;
      if (s.charmMesh) s.charmMesh.visible = s.open && FORMS[this.form].charms;
    }
    return this;
  }
  /** The sockets opened by the domains' levels (a socket opens at level 30). */
  setLevels(levels = {}) { return this.setSockets(Object.fromEntries(Object.entries(levels).map(([d, l]) => [d, l >= SOCKET_OPENS_AT]))); }

  /** A charm set in a socket (a domain, or 'clasp'), or taken out (null). Shown only in an open socket, never on the Courier's band. */
  setCharm(socket, id) {
    const s = this.sockets[socket]; if (!s) return this;
    if (s.charmMesh) { s.charmMesh.removeFromParent(); s.charmMesh = null; }
    s.charm = id || null;
    const geo = id && charmGeometry(id);
    if (geo) {
      const m = new THREE.Mesh(geo, charmMaterials()); m.castShadow = false;
      const k = FORMS[this.form].h / 0.17; m.scale.setScalar(k * (s.clasp ? 0.9 : 1));
      m.visible = s.open && FORMS[this.form].charms;
      s.seat.add(m); s.charmMesh = m;
    }
    return this;
  }

  /** The glow's state: how much of the pool a power is spending (0..1), the domain in use, rejection's step (0..5). Any may be left out. */
  glow({ spend, domain, rejection } = {}) {
    const S = this.state;
    if (spend !== undefined) S.spend = THREE.MathUtils.clamp(+spend || 0, 0, 1);
    if (domain !== undefined) S.domain = DOMAIN_LOOK[domain] ? domain : null;
    if (rejection !== undefined) S.rejection = THREE.MathUtils.clamp(Math.round(+rejection || 0), 0, 5);
    return this;
  }
  /** A power used: the glow kicks up by `k` (0..1) and falls back over about a real second (the aura rides it). */
  pulse(k = 0.6) { this.kick = Math.max(this.kick, THREE.MathUtils.clamp(k, 0, 1)); return this; }

  /** A charm triggering: a gold line runs once round the ring, from the socket that holds it (or the clasp). */
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
    // rejection's pulse: slow and shallow at step 1, quicker and deeper by step 5
    if (S.rejection > 0) {
      const hz = 0.22 + 0.13 * S.rejection, depth = 0.18 + 0.16 * S.rejection;
      const p = 0.5 - 0.5 * Math.cos(this.t * hz * Math.PI * 2);
      this.col.lerp(REJECTION_RED, Math.min(1, depth * p * 0.9)).add(_red.copy(REJECTION_RED).multiplyScalar(depth * p * 0.9));
    }
    this.glowMat.color.copy(this.col);
    // the socket in use lit from within
    for (const d of SOCKETS) { const m = this.glazeMats[d]; m.emissiveIntensity = d === S.domain && this.sockets[d].open ? 0.15 + this.lit * 0.9 : 0; }
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
    this.setSockets(Object.fromEntries(SOCKETS.map((d) => [d, true])));
    ['clasp', ...SOCKETS].forEach((s, i) => this.setCharm(s, ['TWIN', 'WIDE', 'ECHO', 'QUIET', 'THRIFT', 'LINGER', 'GENTLE', 'TWIN'][i]));
    this.flashMesh.visible = true; this.flashMesh.geometry.setDrawRange(0, 96);
    if (this.aura) { this.aura.visible = true; this.auraMat.opacity = 0.5; }
    return this;
  }

  dispose() {
    this.object.removeFromParent();
    for (const g of this.geos) g.dispose();
    for (const m of Object.values(this.glazeMats)) m.dispose();
    this.glowMat.dispose(); this.flashMat.dispose(); this.auraMat?.dispose();
  }
}
