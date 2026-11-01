// ---------------------------------------------------------------------------------------
// THE ARENA'S FIGHTER LOOKS (Dovina's placeholders dressed: world/strawmanwell/fighter/looks.js FighterLooks, the same contract; the
// Arena as a rehearsal, South 2026-11-01): what the fighter kit shows of its rules, in the rehearsal's own things.
//   the percent        the Brawl's tag (vfx/strawmanwell/percenttag.js: the overlay's count, rolling, Smash's colour ramp, the shake),
//                      the stocks over it as gilt stars of the cast board in the fighter's side's colour, one a stock
//   the shield         gauze stretched in an embroidery hoop, held square to the stalls: the hoop's maple and its brass screw, the gauze
//                      tinted the side's colour, shrinking with the shield's health and thinning as it goes, flashing white on a
//                      powershield (a scrim lit from the front)
//   the respawn plate  a stage lift's round platform of boards in a brass ring, the fighter stood on it, a follow-spot's cone from the flies
//   a shot             the psygun's shot as a hot ball in the side's colour with a halo, white and bigger once reflected
//   the boxes          in training, every active hit box and the grab's as Ultimate's training spheres (kept plain: a reading tool)
//   the frame data     in training, the last move's numbers on the stage manager's clipboard: cream paper under the steel clip, typed
// Every number shown is the kit's; nothing here decides anything. The contract is the placeholder's, so the kit never knows which it has.
//
// Prior art: Super Smash Bros.' percent and stock icons and its shield bubble; an embroidery hoop's stretched cloth and the theatre's
// scrim; the stage lift and the follow-spot; the stage manager's prompt book on its clipboard; Ultimate's training view.
//
//   const L = new ArenaFighterLooks(into)   L.tag(F)   L.update(fighters, { boxes, z })   L.shotLook(s)   L.frameData(lines, pos)
//   L.dispose()   (L.tags: Map F -> { s }: the kit hides a tag by its `s`)   ARENA_LOOKS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHIELD } from '../../../progress/platformfighter.js';
import { KIT, GRAB_BOX, BODY } from '../../../world/strawmanwell/fighter/moves.js';
import { DummyPercentTag } from '../percenttag.js';
import { glowTexture } from '../theatre/kit.js';
import { FONT } from '../../../ui/theme.js';

/** The sides' colours (yours lapis lit with the film, the foes' cinnabar: the duel's convention), the hoop, the lift, the spot. */
export const ARENA_LOOKS = {
  sides: [0x7a8cff, 0xd0503a], hoop: { maple: 0xc89a5c, brass: 0xd8a944, tube: 0.06 }, gauze: 0.42,
  lift: { r: 0.8, h: 0.14, boards: 0x8a5a34, ring: 0xd8a944 }, spot: { h: 9, r0: 0.25, r1: 1.0, a: 0.16, col: 0xffe6b0 },
};
const A = ARENA_LOOKS;
const css = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

/** The gauze: a loose weave, its threads a little uneven, lighter at the middle (lit through). */
function gauzeTexture() {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); r.addColorStop(0, 'rgba(255,255,255,0.55)'); r.addColorStop(0.8, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0.8)');
  g.fillStyle = r; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 4) { g.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(i * 1.3)})`; g.fillRect(i, 0, 1.2, S); g.fillRect(0, i, S, 1.2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function sprite(w, h, sw, sh, order = 4) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(sw, sh, 1); s.renderOrder = order;
  return { s, cv, tex };
}

/** A five-point star path at (x, y), radius r. */
function star(g, x, y, r) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }

export class ArenaFighterLooks {
  constructor(into) {
    this.into = into; this.tags = new Map(); this.shields = new Map(); this.plates = new Map(); this.boxes = []; this.shots = new Set(); this.z = 0;
    this.ballGeo = new THREE.SphereGeometry(1, 16, 12); this.gauze = gauzeTexture(); this.glow = glowTexture(); this.last = performance.now();
    this.mats = []; this.geos = [this.ballGeo];
  }
  own(x) { (x.isMaterial ? this.mats : this.geos).push(x); return x; }

  /** A fighter's tag: the rolling percent and its stock stars, under one group the kit hides by `s`. */
  tag(F) {
    let T = this.tags.get(F);
    if (!T) {
      const s = new THREE.Group(); s.name = 'arena.tag'; const pct = new DummyPercentTag(), st = sprite(192, 40, 1.15, 0.24, 4);
      s.add(pct.sprite, st.s); this.into.add(s); T = { s, pct, st, key: '' }; this.tags.set(F, T);
    }
    const key = `${Math.max(0, F.stocks)}|${F.team}`;
    if (T.key !== key) {
      T.key = key; const g = T.st.cv.getContext('2d'), n = Math.min(9, Math.max(0, F.stocks)); g.clearRect(0, 0, 192, 40);
      for (let i = 0; i < n; i++) { const x = 96 + (i - (n - 1) / 2) * 30; star(g, x, 21, 15); g.fillStyle = css(A.sides[F.team] ?? A.sides[1]); g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(13,10,18,0.85)'; g.stroke(); star(g, x - 2, 18, 6); g.fillStyle = 'rgba(255,240,200,0.75)'; g.fill(); }
      T.st.tex.needsUpdate = true;
    }
    return T;
  }

  /** A fighter's shield: gauze in an embroidery hoop, square to the stalls. */
  shield(F) {
    let S = this.shields.get(F);
    if (!S) {
      const col = A.sides[F.team] ?? A.sides[1];
      S = new THREE.Group(); S.name = 'arena.shield'; S.renderOrder = 3;
      const cloth = this.own(new THREE.MeshBasicMaterial({ color: col, map: this.gauze, transparent: true, opacity: A.gauze, depthWrite: false, side: THREE.DoubleSide }));
      const disc = new THREE.Mesh(this.own(new THREE.CircleGeometry(1, 40)), cloth); disc.renderOrder = 3;
      const hoop = new THREE.Mesh(this.own(new THREE.TorusGeometry(1, A.hoop.tube, 6, 40)), this.own(new THREE.MeshStandardMaterial({ color: A.hoop.maple, roughness: 0.6 })));
      const screw = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.12, 0.2, 0.12)), this.own(new THREE.MeshStandardMaterial({ color: A.hoop.brass, roughness: 0.35, metalness: 0.5 }))); screw.position.y = 1.06;
      S.add(disc, hoop, screw); S.userData = { cloth, hoop, screw }; this.into.add(S); this.shields.set(F, S);
    }
    return S;
  }

  /** A fighter's respawn plate: a stage lift's platform and a follow-spot's cone from above. */
  plate(F) {
    let P = this.plates.get(F);
    if (!P) {
      P = new THREE.Group(); P.name = 'arena.lift';
      const deck = new THREE.Mesh(this.own(new THREE.CylinderGeometry(A.lift.r, A.lift.r * 0.94, A.lift.h, 24)), this.own(new THREE.MeshStandardMaterial({ color: A.lift.boards, roughness: 0.8 })));
      const ring = new THREE.Mesh(this.own(new THREE.TorusGeometry(A.lift.r, 0.05, 6, 32)), this.own(new THREE.MeshStandardMaterial({ color: A.lift.ring, roughness: 0.35, metalness: 0.5 }))); ring.rotation.x = Math.PI / 2; ring.position.y = A.lift.h / 2;
      const coneGeo = this.own(new THREE.CylinderGeometry(A.spot.r0, A.spot.r1, A.spot.h, 24, 1, true)); coneGeo.translate(0, A.spot.h / 2, 0);
      const cone = new THREE.Mesh(coneGeo, this.own(new THREE.MeshBasicMaterial({ color: A.spot.col, transparent: true, opacity: A.spot.a, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
      P.add(deck, ring, cone); this.into.add(P); this.plates.set(F, P);
    }
    return P;
  }

  /** Each render frame: the tags over the heads, the shields, the lifts, and in training the boxes. */
  update(list, { boxes = false, z }) {
    const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000)); this.last = now;
    for (const F of list) {
      const T = this.tag(F), vis = F.live && F.st !== 'dead', h = F.size ?? F.h;
      T.s.visible = vis;
      if (vis) {
        T.pct.update(dt, F.percent, new THREE.Vector3(F.x, F.y + h + 0.1, z), 1);
        const p = T.pct.sprite; T.st.s.position.set(p.position.x, p.position.y + p.scale.y / 2 + 0.1, p.position.z);
      }
      const S = this.shield(F); S.visible = vis && !!F.shielding;
      if (S.visible) {
        const [r0, r1] = KIT.shieldR, k = Math.max(0, F.shield) / SHIELD.max, r = (r0 + (r1 - r0) * k) * h / BODY;
        S.scale.setScalar(r); S.position.set(F.x, F.y + h * 0.52, z + 0.35);
        const power = F.now - F.shieldAt <= 4, U = S.userData;
        U.cloth.color.setHex(power ? 0xffffff : A.sides[F.team] ?? A.sides[1]); U.cloth.opacity = power ? 0.85 : A.gauze * (0.45 + 0.55 * k);
      }
      const P = this.plate(F); P.visible = F.st === 'respawn'; if (P.visible) P.position.set(F.x, F.y - 0.08, z);
    }
    // the boxes (training only): every active hit box, and a grab's (Ultimate's training spheres, plain)
    const want = [];
    if (boxes) for (const F of list) {
      if (F.active) for (const b of F.boxes()) want.push([b, 0xff3030]);
      if (F.st === 'grab' && F.grabbing) { const [ox, oy, r] = GRAB_BOX, k = F.scale; want.push([{ x: F.x + ox * k * F.face, y: F.y + oy * k, r: r * k }, 0xb050ff]); }
    }
    while (this.boxes.length < want.length) { const m = new THREE.Mesh(this.ballGeo, this.own(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false }))); m.renderOrder = 5; this.into.add(m); this.boxes.push(m); }
    this.boxes.forEach((m, i) => { const w = want[i]; m.visible = !!w; if (w) { m.position.set(w[0].x, w[0].y, z + 0.2); m.scale.setScalar(w[0].r); m.material.color.setHex(w[1]); } });
  }

  /** A shot: a hot ball in its side's colour with a halo (hits.js asks for one a shot). */
  shotLook(s) {
    const col = A.sides[s.team] ?? A.sides[1], z = this.z ?? 0;
    const m = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({ color: col })); m.scale.setScalar(s.r);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(s.r * 5);
    const G = new THREE.Group(); G.add(m, halo); this.into.add(G); this.shots.add(G);
    return {
      place: (x) => G.position.set(x.x, x.y, z),
      reflected: (x) => { m.material.color.setHex(0xffffff); halo.material.color.setHex(0xffffff); m.scale.setScalar(x.r * 1.3); halo.scale.setScalar(x.r * 7); },
      dispose: () => { G.removeFromParent(); m.material.dispose(); halo.material.dispose(); this.shots.delete(G); },
    };
  }

  /** The training lectern's frame data on the stage manager's clipboard. */
  frameData(lines, pos) {
    const T = (this.fd ||= sprite(640, 300, 3.6, 1.69, 4)); if (!T.s.parent) this.into.add(T.s);
    T.s.position.copy(pos); T.s.visible = !!lines;
    const key = lines?.join('\n') ?? ''; if (T.key === key) return; T.key = key;
    const g = T.cv.getContext('2d'); g.clearRect(0, 0, 640, 300);
    if (!lines) { T.tex.needsUpdate = true; return; }
    g.fillStyle = '#6b4a2c'; g.beginPath(); g.roundRect(20, 18, 600, 276, 14); g.fill(); // (the board)
    g.fillStyle = '#f6f0e0'; g.fillRect(44, 44, 552, 236); g.fillStyle = 'rgba(42,26,18,0.12)'; g.fillRect(44, 274, 552, 6); // (the paper)
    g.strokeStyle = 'rgba(90,120,170,0.35)'; g.lineWidth = 2; for (let y = 104; y < 276; y += 40) { g.beginPath(); g.moveTo(60, y); g.lineTo(580, y); g.stroke(); }
    g.strokeStyle = 'rgba(184,64,46,0.45)'; g.beginPath(); g.moveTo(90, 50); g.lineTo(90, 276); g.stroke(); // (the margin)
    g.fillStyle = '#b8c0c8'; g.beginPath(); g.roundRect(240, 4, 160, 46, 10); g.fill(); g.fillStyle = '#7a828a'; g.fillRect(260, 30, 120, 8); // (the steel clip)
    g.font = `bold 28px ${FONT.sys}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#2a1a12';
    lines.slice(0, 4).forEach((l, i) => g.fillText(l, 104, 96 + i * 40));
    g.strokeStyle = 'rgba(184,64,46,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(104, 104); g.lineTo(104 + Math.min(470, g.measureText(lines[0] || '').width), 102); g.stroke(); // (the cue underlined in red pencil)
    T.tex.needsUpdate = true;
  }

  dispose() {
    for (const T of this.tags.values()) { T.s.removeFromParent(); T.pct.dispose?.(); T.st.tex.dispose(); T.st.s.material.dispose(); }
    if (this.fd) { this.fd.s.removeFromParent(); this.fd.tex.dispose(); this.fd.s.material.dispose(); }
    for (const o of [...this.shields.values(), ...this.plates.values(), ...this.boxes, ...this.shots]) o.removeFromParent();
    for (const m of this.mats) m.dispose(); for (const g of this.geos) g.dispose();
    this.gauze.dispose(); this.glow.dispose?.();
    this.tags.clear(); this.shields.clear(); this.plates.clear(); this.boxes = []; this.shots.clear(); this.fd = null;
  }
}
