// ---------------------------------------------------------------------------------------
// THE FIGHTER KIT'S PLACEHOLDER LOOKS (docs/plans/FIGHTER.md 5, 7: the percent's readout, the shields, the straw fighters are
// Calissa's to dress): what the Arena shows of its rules until then, plainly.
//   the percent's tag   over each fighter, the overlay's tag in the System's type (dummy.js's): its percent, white to red as it climbs,
//                       and its stocks as dots under it; the Courier's too (the visible source of the Arena's percent in the pool's place)
//   a shield            a bubble round the body while it is held, smaller as its health goes, flashing on a powershield
//   the respawn plate   a disc under a fighter waiting on its way back in
//   a shot              the psygun's shot as a small lit ball, whiter once reflected
//   the boxes           in training, every active hit box as a red sphere (Ultimate's training view), the grab's in purple
//   the frame data      in training, the last move's numbers as a tag at the lectern
//
// Prior art: the Brawl's percent tag (world/strawmanwell/dummy.js); Smash's damage meter and shield bubble; Ultimate's and UnclePunch's
// training readouts.
//
//   const L = new FighterLooks(into)   L.tag(F)   L.update(fighters, { boxes, z })   L.shotLook(s)   L.frameData(text, pos)   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHIELD } from '../../../progress/platformfighter.js';
import { FONT } from '../../../ui/theme.js';
import { KIT, GRAB_BOX, BODY } from './moves.js';

const TEAM = [0x9b86ff, 0xd0503a]; // (the sides' colours: yours lapis lit with the film, the foes' cinnabar: fxkit.js's convention, the duel's)

function sprite(w, h, sw, sh) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(sw, sh, 1); s.renderOrder = 4;
  return { s, cv, tex };
}

export class FighterLooks {
  constructor(into) {
    this.into = into; this.tags = new Map(); this.shields = new Map(); this.plates = new Map(); this.boxes = []; this.shots = new Set();
    this.ballGeo = new THREE.SphereGeometry(1, 16, 12);
  }

  /** The percent's tag: drawn again only when its number or stocks change. */
  tag(F) {
    let T = this.tags.get(F); if (!T) { T = sprite(160, 72, 1.7, 0.77); this.into.add(T.s); this.tags.set(F, T); }
    const n = Math.round(F.percent), key = `${n}|${F.stocks}|${F.st === 'out'}`; if (T.key === key) return T; T.key = key;
    const x = T.cv.getContext('2d'), k = Math.min(1, n / 150);
    x.clearRect(0, 0, 160, 72); x.font = `bold 38px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 7; x.strokeStyle = 'rgba(20,10,6,0.85)'; x.strokeText(`${n}%`, 80, 28);
    x.fillStyle = `rgb(255,${Math.round(240 - 170 * k)},${Math.round(220 - 190 * k)})`; x.fillText(`${n}%`, 80, 28);
    const col = '#' + TEAM[F.team].toString(16).padStart(6, '0');
    for (let i = 0; i < Math.max(F.stocks, 0) && i < 9; i++) { x.beginPath(); x.arc(80 + (i - (F.stocks - 1) / 2) * 18, 60, 6, 0, Math.PI * 2); x.fillStyle = col; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(20,10,6,0.85)'; x.stroke(); }
    T.tex.needsUpdate = true; return T;
  }

  shield(F) {
    let S = this.shields.get(F);
    if (!S) { S = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({ color: TEAM[F.team], transparent: true, opacity: 0.32, depthWrite: false })); S.renderOrder = 3; this.into.add(S); this.shields.set(F, S); }
    return S;
  }
  plate(F) {
    let P = this.plates.get(F);
    if (!P) { P = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xd9a441, emissive: 0x6a4a10, roughness: 0.4, metalness: 0.5 })); this.into.add(P); this.plates.set(F, P); }
    return P;
  }

  /** Each render frame: the tags over the heads, the shields, the plates, and in training the boxes. */
  update(list, { boxes = false, z }) {
    for (const F of list) {
      const T = this.tag(F), vis = F.live && F.st !== 'dead';
      T.s.visible = vis; T.s.position.set(F.x, F.y + (F.size ?? F.h) + 0.55, z + 0.5);
      const S = this.shield(F); S.visible = vis && F.shielding;
      if (S.visible) {
        const [r0, r1] = KIT.shieldR, r = (r0 + (r1 - r0) * Math.max(0, F.shield) / SHIELD.max) * (F.size ?? F.h) / BODY;
        S.scale.setScalar(r); S.position.set(F.x, F.y + (F.size ?? F.h) * 0.52, z);
        S.material.opacity = F.now - F.shieldAt <= 4 ? 0.7 : 0.18 + 0.2 * (F.shield / SHIELD.max);
      }
      const P = this.plate(F); P.visible = F.st === 'respawn'; if (P.visible) P.position.set(F.x, F.y - 0.08, z);
    }
    // the boxes (training only): every active hit box, and a grab's
    const want = [];
    if (boxes) for (const F of list) {
      if (F.active) for (const b of F.boxes()) want.push([b, 0xff3030]);
      if (F.st === 'grab' && F.grabbing) { const [ox, oy, r] = GRAB_BOX, k = F.scale; want.push([{ x: F.x + ox * k * F.face, y: F.y + oy * k, r: r * k }, 0xb050ff]); }
    }
    while (this.boxes.length < want.length) { const m = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false })); m.renderOrder = 5; this.into.add(m); this.boxes.push(m); }
    this.boxes.forEach((m, i) => { const w = want[i]; m.visible = !!w; if (w) { m.position.set(w[0].x, w[0].y, z + 0.2); m.scale.setScalar(w[0].r); m.material.color.setHex(w[1]); } });
  }

  /** A shot's ball (hits.js asks for one per shot). */
  shotLook(s) {
    const m = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({ color: TEAM[s.team] })); m.scale.setScalar(s.r); this.into.add(m); this.shots.add(m);
    const z = this.z ?? 0;
    return {
      place: (x) => m.position.set(x.x, x.y, z),
      reflected: (x) => { m.material.color.setHex(0xffffff); m.scale.setScalar(x.r * 1.3); },
      dispose: () => { m.removeFromParent(); m.material.dispose(); this.shots.delete(m); },
    };
  }

  /** The training lectern's frame data: lines of text on a tag. */
  frameData(lines, pos) {
    const T = (this.fd ||= sprite(640, 150, 5.2, 1.22)); if (!T.s.parent) this.into.add(T.s);
    T.s.position.copy(pos); T.s.visible = !!lines;
    const key = lines?.join('\n') ?? ''; if (T.key === key) return; T.key = key;
    const x = T.cv.getContext('2d'); x.clearRect(0, 0, 640, 150);
    if (!lines) { T.tex.needsUpdate = true; return; }
    x.fillStyle = 'rgba(14,10,24,0.72)'; x.fillRect(0, 0, 640, 150);
    x.font = `bold 26px ${FONT.sys}`; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillStyle = '#efe6ff';
    lines.slice(0, 4).forEach((l, i) => x.fillText(l, 14, 10 + i * 34));
    T.tex.needsUpdate = true;
  }

  dispose() {
    for (const T of [...this.tags.values(), this.fd].filter(Boolean)) { T.s.removeFromParent(); T.tex.dispose(); T.s.material.dispose(); }
    for (const m of [...this.shields.values(), ...this.plates.values(), ...this.boxes, ...this.shots]) { m.removeFromParent(); m.material.dispose(); if (m.geometry !== this.ballGeo) m.geometry.dispose(); }
    this.ballGeo.dispose(); this.tags.clear(); this.shields.clear(); this.plates.clear(); this.boxes = []; this.shots.clear(); this.fd = null;
  }
}
