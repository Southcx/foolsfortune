// ---------------------------------------------------------------------------------------
// THE DRAG'S PREVIEW (plain name; South, 2026-11-06: "I know you can make the card interactions with the board much better with dragging
// and contextual previews"): what a card held over a target would do, shown in the world at the target before you let go, looks only
// (drag.js says what; this draws it). A plate of words and numbers standing over the target (the tile's sum going to its new one, "21" in
// the turning owner's colour, BUST in red with the sum going to 0, a hurt's "-7" and its "x2", the Hungry Die's fed count and its next
// size); a court card's ghost token on its tile and its march drawn as chevrons down its column for its speed; numbers in the board's
// stroke type (pieces.js strokeText), words in its light spaced sans, on black glass with a thin ivory rule (boardplates.js's grammar).
//
// Prior art: Into the Breach's previews drawn on the tile before you commit, Hearthstone's and Slay the Spire's damage numbers on a
// targeted minion, Balatro's hand preview, Advance Wars' move path arrows.
//
//   new DragPreview(kit, root, camera)   .show({ at, segs, path, pathColor, dir, ghost, rise, dz (the plate moved toward you, m), screen ({ x, y } page px: pinned there instead) })   .hide()   .tick(dt, t)
//   segs: [{ n }, { arrow }, { t }] each with `color` (CSS); path: [Vector3] the tiles a march crosses; ghost: { suit, owner, rank, speed, at }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LOOK, strokeText, strokeWidth, makeToken } from './pieces.js';

const _p = new THREE.Vector3();
export const PREVIEW = { scale: 1, phone: 0.7, rise: 1.6, chevrons: 8, font: '300 58px "Helvetica Neue", Helvetica, Arial, sans-serif' };

/** A plate of segments on a canvas over the page, pinned to its point in the world each frame (crisp: the tilt-shift and the 480-line
 *  present never take it, as the roll's number: boardplates.js), redrawn only when they change. */
function plateEl() {
  const W = 768, H = 168, cv = document.createElement('canvas'), c = cv.getContext('2d'); cv.width = W; cv.height = H;
  Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: `${W / 2}px`, height: `${H / 2}px`, pointerEvents: 'none', zIndex: '9002', display: 'none', transformOrigin: '50% 100%' });
  document.body.appendChild(cv); let last = '';
  return { el: cv, set(segs) {
    const key = JSON.stringify(segs); if (key === last) return; last = key;
    const h = 92, gap = 26; c.font = PREVIEW.font; c.letterSpacing = '6px';
    const ws = segs.map((s) => (s.n != null ? strokeWidth(s.n, h) : s.arrow ? h * 0.8 : c.measureText(String(s.t).toUpperCase()).width));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (segs.length - 1), pad = 34, f = Math.min(1, (W - 4 - pad * 2) / total), pw = Math.min(W - 4, total * f + pad * 2); // (a long plate drawn smaller, never cut)
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(4,3,8,0.86)'; c.fillRect((W - pw) / 2, 8, pw, H - 16); c.strokeStyle = 'rgba(236,230,214,0.6)'; c.lineWidth = 2; c.strokeRect((W - pw) / 2 + 1, 9, pw - 2, H - 18);
    c.save(); c.translate(W / 2, H / 2); c.scale(f, f); c.translate(-W / 2, -H / 2);
    let x = (W - total) / 2; const y = H / 2;
    segs.forEach((s, i) => {
      const col = s.color || LOOK.ink; c.strokeStyle = col; c.fillStyle = col;
      if (s.n != null) strokeText(c, s.n, x, y, h, { lw: 8, align: 'left' });
      else if (s.arrow) { c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + ws[i], y); c.moveTo(x + ws[i] - 22, y - 18); c.lineTo(x + ws[i], y); c.lineTo(x + ws[i] - 22, y + 18); c.stroke(); }
      else { c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(String(s.t).toUpperCase(), x, y + 4); }
      x += ws[i] + gap;
    });
    c.restore();
    c.letterSpacing = '0px';
  } };
}

export class DragPreview {
  constructor(kit, root, camera) {
    this.kit = kit; this.root = root; this.camera = camera; this.plate = plateEl(); kit.own({ dispose: () => this.plate.el.remove() }); this.at = new THREE.Vector3(); this.k = 0;
    const s = new THREE.Shape(); s.moveTo(-0.42, 0.12); s.lineTo(0, -0.26); s.lineTo(0.42, 0.12); s.lineTo(0.42, 0.3); s.lineTo(0, -0.08); s.lineTo(-0.42, 0.3); s.closePath();
    const geo = kit.own(new THREE.ShapeGeometry(s));
    this.chev = Array.from({ length: PREVIEW.chevrons }, () => { const m = new THREE.Mesh(geo, kit.own(new THREE.MeshBasicMaterial({ color: LOOK.ours, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, toneMapped: false }))); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 12; root.add(m); return m; });
    this.path = []; this.ghost = null; this.ghostKey = null;
  }
  /** One frame's preview (call every frame it holds; `hide` when nothing is over a target). */
  show({ at, segs = null, path = null, pathColor = LOOK.ours, dir = -1, ghost = null, rise = PREVIEW.rise, dz = 0, screen = null }) {
    this.on = true; this.at.copy(at); this.rise = rise; this.dz = dz; this.screen = screen;
    if (segs?.length) this.plate.set(segs); this.hasPlate = !!segs?.length;
    this.path = path || []; this.chev.forEach((m, i) => { m.visible = i < this.path.length; if (m.visible) { m.material.color.set(pathColor); m.rotation.z = dir < 0 ? Math.PI : 0; } });
    const gk = ghost ? `${ghost.suit}|${ghost.owner}|${ghost.rank}|${ghost.speed}` : null;
    if (gk !== this.ghostKey) { this.dropGhost(); this.ghostKey = gk; if (ghost) this.ghost = this.makeGhost(ghost); }
    if (this.ghost) this.ghost.group.position.copy(ghost.at);
  }
  hide() { this.on = false; this.plate.el.style.display = 'none'; for (const m of this.chev) m.visible = false; this.dropGhost(); this.k = 0; }
  /** A token's ghost: its own model, its materials copied and made glass (so the board's own tokens never change). */
  makeGhost(G) {
    const p = makeToken(this.kit, G.suit, G.owner, G.rank, G.speed);
    p.group.traverse((o) => { if (!o.material) return; const m = this.kit.own(o.material.clone()); m.transparent = true; m.opacity = o.isSprite ? 0.9 : 0.72; m.depthWrite = false; o.material = m; });
    p.group.scale.setScalar(1.45); this.root.add(p.group); return p;
  }
  dropGhost() { if (this.ghost) { this.root.remove(this.ghost.group); this.ghost = null; } this.ghostKey = null; }
  tick(dt, t) {
    if (!this.on) return; this.k = Math.min(1, this.k + dt * 6); const e = 1 - (1 - this.k) ** 3, P = this.plate;
    const v = _p.copy(this.at); v.y += this.rise + Math.sin(t * 2.4) * 0.03; v.z += this.dz || 0; v.project(this.camera);
    const st = P.el.style, sx = this.screen ? this.screen.x : (v.x * 0.5 + 0.5) * innerWidth, sy = this.screen ? this.screen.y : (-v.y * 0.5 + 0.5) * innerHeight; st.display = this.hasPlate && (this.screen || v.z < 1) ? 'block' : 'none';
    const half = (P.el.width / 4) * (innerHeight < 500 ? PREVIEW.phone : PREVIEW.scale), cx = Math.max(half + 8, Math.min(innerWidth - half - 8, sx)); // (kept on the page)
    st.transform = `translate(${cx - P.el.width / 4}px, ${sy - P.el.height / 2}px) scale(${((innerHeight < 500 ? PREVIEW.phone : PREVIEW.scale) * (0.6 + 0.4 * e)).toFixed(3)})`; st.opacity = e.toFixed(3);
    this.path.forEach((p, i) => { const m = this.chev[i], pulse = 0.5 + 0.5 * Math.sin(t * 6 - i * 0.9); m.position.copy(p); m.position.y += 0.06; m.material.opacity = (0.55 + 0.45 * pulse) * e; m.scale.setScalar(0.9 + 0.2 * pulse); });
    if (this.ghost) { this.ghost.group.position.y += 0.12 + Math.sin(t * 3) * 0.05; for (const [m, axis] of this.ghost.spin) m.rotation[axis] += dt; }
  }
}
