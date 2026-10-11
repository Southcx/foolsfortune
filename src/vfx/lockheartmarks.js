// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S MARKS: what the Lockheart shows while it is in the hands (docs/plans/MELEE-LOADOUT.md section 4: every tool its own
// UI, the Dreamvane the model). World marks, no words and no numbers (CLAUDE.md, Feedback); read from the tool (`game.lockheart`: its
// charge, its coffin's measure, whether it hoovers; the Pneuka Box's keyring), never driving it. Gone the moment it is stowed or another
// tool is drawn (the belt says which is in the hands), and while the coffin is opening (the wheel, the ultimate's show).
//
//   THE GAUGE         one small picture standing beside the coffin, in the icons' hand (ui/icons/hand.js: a light shape keylined dark,
//                     palette-swapped, the maker's twelve greys): a PADLOCK whose body fills with Lachryma from the foot as the coffin
//                     fills toward its own measure (the coffin's `fill`, not the cap: full is "enough to open"), the keyhole cut dark
//                     through it, and under it FOUR SOCKETS, one for each place on the keyring: gold where a Possibilikey hangs,
//                     hollow grey where none does (the Charges keyword's upright pips). The padlock's iron is grey while the coffin
//                     cannot open; the moment it can (a coffin worn, full, a Possibilikey on the ring, and for the Warden's coffin a
//                     Figment laid low before it) the shackle springs up, the iron turns gold and the keyhole is lit from within (gold:
//                     a thing that is yours to use, docs/ART.md section 5): one picture of the answer, its reasons in it. Shown at a whole number of the 480 lines'
//                     pixels an art pixel (2), never resampled, set on the pixel grid; beside the coffin on the side away from the
//                     body, so the body never hides it; drawn a little nearer the eye than it stands (the glyphs' bias, vfx/glyphs.js),
//                     so a wall hides it and the Courier does not. A sprite of the glyphs' own program.
//   THE HOOVER'S REACH  while LMB is held and it draws: its cone laid on the ground before the coffin, as far and as wide as it draws
//                     loose Lachryma (HOOVER: 7 m, 0.7 rad either side of the aim), the nearer arc where a mind laid low is drained
//                     (3.6 m), and three arcs running IN to the coffin (what it draws comes to it), in the Vacuum's violet: the same
//                     shape the pier draws for the Lockheart's mount (vfx/mountpreview.js drawCone), so the tool reads the same ashore
//                     and at sea. The rail-mark program's wire (vfx/railmark.js): screen-space lines held between one and three pixels,
//                     the Mind's schiller in their heart, depth-tested and lifted a hand off the ground (what stands in front hides it),
//                     following the ground's height under it (rays down, once a cell of a coarse world grid, kept).
//
// No program of its own (casebook rule 124): the gauge is a sprite on the glyphs' program, the reach a MarkBuffer on the rail mark's;
// two draws while both show, none while the Lockheart is put away.
//
// Prior art: Luigi's Mansion's Poltergust 3000 (the vacuum's draw seen as a cone of what it pulls, the tool's gauge on the tool), Dead
// Space's diegetic gauges (the plasma cutter's ammunition a hologram on the weapon itself, Isaac's health on his spine), the padlock and
// open shackle of every interface's locked and unlocked (the choice card's own lock chip, ui/icons/chipart.js), and the Charges keyword's
// pips (CLARITY.md section 5).
//
//   const L = new LockheartMarks(game)   L.update(rawDt)   (each frame, after the tools)   L.read() -> what is shown (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { toneGrid } from '../ui/icons/hand.js';
import { ICON_PALS } from '../ui/icons/icons.js';
import { MarkBuffer, wireStrip } from './railmark.js';
import { MOUNT_LOOK } from './mountpreview.js';
import { nearer } from './glyphs.js';
import { HOOVER } from '../tools/lockheart/lockheart.js';
import { HEARTS } from '../tools/lockheart/table.js';

const ART_PX = 2;          // the 480 lines' pixels an art pixel (a whole number)
const ROWS = 7;            // the padlock's body inside its iron: the coffin's fill in seven steps
const SOCKETS = 4;         // the keyring's places (pneuka/box.js FITTINGS.keys.max)
const GAP = 4;             // pixels between the coffin's edge and the gauge, beside it
const BODY = 0.36;         // metres either side of the body's middle it stands clear of (the shoulders, the hair)
const BIAS = 0.9;          // metres nearer the eye it is drawn (the glyphs' bias): the Courier's own body never hides it
const POP = 0.32;          // real seconds of the shackle's spring when it comes to open
const LIFT = 0.05;         // metres the reach lies over the ground
const MAIN = { m: 0.06, lo: 1.5, hi: 3.0, wire: true }, THIN = { m: 0.03, lo: 1.2, hi: 2.0, wire: false }; // (half-widths: metres held between pixels; the pier's, so it holds on noon sand)
const CELL = 0.75;         // metres: the world grid the ground's height under the reach is found on, once a cell
const TAU = Math.PI * 2;

/** The gauge's picture for a state, as the hand's rows (ui/icons/hand.js) and a palette a pixel ('m' the iron, 'f' Lachryma, 'k' a
 *  Possibilikey, 's' an empty socket): 13 wide, 18 tall. `level` rows of the body full (0..ROWS), `keys` on the ring, `open` the
 *  shackle up. The iron is one bevelled shape (its face and its edge); the Lachryma rises over the face from the foot; the keyhole is
 *  cut through both, darkest; a Possibilikey's pip is gold, lit at its head, an empty socket a dull grey. */
export function gaugeArt(level, keys, open) {
  const W = 13, rows = [], pal = [];
  const put = (y, x, c, p) => { rows[y][x] = c; pal[y][x] = p; };
  for (let y = 0; y < 18; y++) { rows.push(Array(W).fill('.')); pal.push(Array(W).fill('m')); }
  // the shackle: closed in the body; open, lifted a pixel and its right leg out
  const s = open ? 0 : 1;
  for (let x = 3; x <= 9; x++) put(s, x, '#', 'm');
  for (const x of [2, 3, 9, 10]) put(s + 1, x, '#', 'm');
  for (let y = s + 2; y <= 4; y++) { put(y, 2, '#', 'm'); if (!open || y < s + 3) put(y, 10, '#', 'm'); }
  // the body: the iron's face, the Lachryma over it from the foot
  for (let y = 5; y <= 13; y++) for (let x = 0; x < W; x++) {
    const inside = y > 5 && y < 13 && x > 0 && x < W - 1;
    if (inside && 12 - y < level) put(y, x, '+', 'f'); else put(y, x, '#', 'm');
  }
  // the keyhole, cut through: a round and its slot
  for (const [y, x0, x1] of [[7, 6, 6], [8, 5, 7], [9, 5, 7], [10, 6, 6], [11, 6, 6]]) for (let x = x0; x <= x1; x++) put(y, x, open ? 'a' : '0', open ? 'k' : 'm'); // (lit gold from within when it can open)
  // the sockets: a Possibilikey's pip (lit at its head), or an empty one
  for (let i = 0; i < SOCKETS; i++) for (let y = 15; y <= 17; y++) for (const x of [1 + i * 3, 2 + i * 3]) put(y, x, i < keys ? 'a98'[y - 15] : '433'[y - 15], i < keys ? 'k' : 's');
  return { rows: rows.map((r) => r.join('')), pal: pal.map((r) => r.join('')) };
}

/** Lachryma's own ramp for the fill: the mind's violet two steps down, so the body's middle tone (10) is its deep violet (0x7650b8),
 *  darker than the iron's face it rises over (lightness, not hue alone, tells them apart: docs/ART.md section 1). */
const FILL = ICON_PALS.mind.map((_, t) => ICON_PALS.mind[Math.max(0, t - 2)]);

/** The gauge painted at 1x into `canvas`: the hand's tones through each pixel's palette (the iron grey, or gold when it can open;
 *  Lachryma the violet; a Possibilikey gold; an empty socket grey). The keyline (one pixel round, tone 0) takes the iron's darkest. */
function paintGauge(canvas, level, keys, open) {
  const { rows, pal } = gaugeArt(level, keys, open), { w, h, tones } = toneGrid(rows);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const P = { m: ICON_PALS[open ? 'gold' : 'grey'], f: FILL, k: ICON_PALS.gold, s: ICON_PALS.grey };
  const g = canvas.getContext('2d'), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = tones[y * w + x]; if (t < 0) continue;
    const [r, gg, b] = (P[pal[y - 1]?.[x - 1]] || P.m)[t], o = (y * w + x) * 4; // (the hand pads a pixel round: the keyline's room)
    img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _v = new THREE.Vector3();
const _o = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0), _px = new THREE.Vector2(), _c = new THREE.Color();
const ease = (v, to, rate, dt) => v + (to - v) * (1 - Math.exp(-rate * dt));
const frac = (x) => x - Math.floor(x);
const backOut = (u) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;

export class LockheartMarks {
  constructor(game) {
    this.game = game;
    // the gauge: a sprite of the glyphs' own settings (vfx/glyphs.js), its picture a 1x canvas, magnified by whole pixels only
    this.canvas = document.createElement('canvas'); this.canvas.width = 15; this.canvas.height = 20;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.magFilter = this.tex.minFilter = THREE.NearestFilter; this.tex.generateMipmaps = false;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.NormalBlending, fog: false }));
    this.sprite.onBeforeRender = nearer; this.sprite.userData.bias = BIAS; this.sprite.userData.zoneFree = true;
    this.sprite.renderOrder = 45; this.sprite.visible = false; this.sprite.name = 'lockheart-gauge'; // (drawn after the Courier's outlines and hair: biased nearer, nothing of theirs is over it)
    game.scene?.add(this.sprite);
    // the hoover's reach: the rail mark's wire, depth-tested on the ground
    this.buf = new MarkBuffer(160, { renderOrder: 39 });
    this.buf.mat.depthTest = true; // (a state, not a program: casebook rule 124)
    this.buf.mesh.name = 'lockheart-reach'; this.buf.mesh.visible = false;
    game.scene?.add(this.buf.mesh);
    this.rgb = [1, 1, 1]; _c.set(MOUNT_LOOK.lockheart.color); this.rgb = [_c.r, _c.g, _c.b];
    this.cells = new Map(); this.pts = []; this.apex = new THREE.Vector3(); // (the ground's heights found, by cell)
    this.alpha = 0; this.reachA = 0; this.t = 0; this.sig = ''; this.ready = false; this.popT = 1; this.quarryT = 0; this.quarry = false;
    this.at = null; this.side = -1; // (the gauge's place on the screen, eased: pixels of the lines drawn; and which side of the body)
  }

  /** Is the Lockheart in the hands (the belt's say), and its coffin to be read? */
  drawn() {
    const g = this.game, L = g.lockheart, t = g.belt?.inHand;
    return !!L && t?.id === 'lockheart' && L.drawT > 0.6 && !!L.cof && !L.cine && !L.wheel?.busy && !L.queue?.length && !g.god?.controlling && !document.body.classList.contains('cine');
  }

  /** Whether the coffin would open now (its own gate, tools/lockheart/lockheart.js open and summon): a coffin, full, a Possibilikey on
   *  the ring, and for a summoning coffin a Figment laid low before it (asked five times a second). */
  canOpen(dt) {
    const L = this.game.lockheart, keys = this.game.pneuka?.fitted('keys').length || 0;
    if (!L.heart || !keys || !L.full) return false;
    if (HEARTS[L.heart]?.mode !== 'summoning') return true;
    if ((this.quarryT -= dt) <= 0) { this.quarryT = 0.2; this.quarry = !!L.quarry(); }
    return this.quarry;
  }

  update(dt) {
    const g = this.game, L = g.lockheart, cam = g.camera;
    if (!L || !cam) return;
    this.t = (this.t + dt) % 600;
    const on = this.drawn();
    if (on || this.alpha > 0.02) cam.updateWorldMatrix(true, false); // (where it looks this frame; its parents only: the camera carries the first-person tools)
    this.alpha = ease(this.alpha, on ? 1 : 0, on ? 10 : 14, dt);
    this.sprite.visible = this.alpha > 0.02;
    if (!on && this.alpha <= 0.02) this.at = null;
    if (this.sprite.visible) this.gauge(dt, on);
    this.reachA = ease(this.reachA, on ? L.hooverW : 0, 12, dt);
    if (this.reachA > 0.02 && L.cof) this.reach(); else if (this.buf.mesh.visible) { this.buf.count = 0; this.buf.flush(); this.buf.mesh.visible = false; }
  }

  /** The gauge: its picture for the state, and its place beside the coffin, on the pixel grid. */
  gauge(dt, on) {
    const g = this.game, L = g.lockheart, cam = g.camera, P = g.player;
    if (!L.cof) { this.sprite.visible = false; return; }
    if (on) {
      const level = Math.round(Math.min(1, L.charge / Math.max(1, L.fill)) * ROWS), keys = Math.min(SOCKETS, g.pneuka?.fitted('keys').length || 0);
      const ready = this.canOpen(dt);
      if (ready && !this.ready) this.popT = 0; // (it has come to open: the shackle springs)
      this.ready = ready;
      const sig = `${level}|${keys}|${ready}`;
      if (sig !== this.sig) { this.sig = sig; paintGauge(this.canvas, level, keys, ready); this.tex.needsUpdate = true; }
    }
    this.popT = Math.min(1, this.popT + dt / POP);
    // where it stands: the coffin on the screen, then out from the body's side by the gauge's width (third person), or out from the
    // middle of the view (first person), set on the pixel grid
    g.renderer?.getDrawingBufferSize(_px);
    const Wp = _px.x || 768, Hp = _px.y || 480, cw = this.canvas.width * ART_PX, ch = this.canvas.height * ART_PX;
    L.cof.group.getWorldPosition(_a);
    const toPx = (v, out) => { _v.copy(v).project(cam); return out.set((_v.x + 1) * 0.5 * Wp, (1 - _v.y) * 0.5 * Hp, _v.z); };
    const c = toPx(_a, _b), cz = c.z;
    if (this.cofId !== L.coffinId) { this.cofId = L.coffinId; this.cofR = new THREE.Box3().setFromObject(L.cof.group).getBoundingSphere(new THREE.Sphere()).radius; } // (its size, once a coffin)
    const cd = Math.max(0.05, -_o.copy(_a).applyMatrix4(cam.matrixWorldInverse).z), cr = (this.cofR * cam.projectionMatrix.elements[5] * 0.5 * Hp) / cd; // (its radius on the screen)
    let gx, gy = c.y - ch * 0.15;
    // (which side: the hand that holds it, their left, as the screen shows it; kept until it is plainly the other, so a coffin swinging
    // across the body's middle never sends the gauge from side to side)
    if (P.fpWeight > 0.5) {
      if (Math.abs(c.x - Wp / 2) > 6) this.side = c.x < Wp / 2 ? -1 : 1;
      gx = c.x + this.side * (cr + GAP + cw / 2);
    } else {
      const yaw = P.bodyYaw ?? P.yaw;
      _v.copy(P.renderPos).setY(P.renderPos.y + 1.0);
      const depth = Math.max(0.3, -_o.copy(_v).applyMatrix4(cam.matrixWorldInverse).z), pxm = (cam.projectionMatrix.elements[5] * 0.5 * Hp) / depth; // (at the body's depth: its breadth on the screen)
      const bx = toPx(_v, _r).x, lx = toPx(_v.copy(P.renderPos).add(_o.set(Math.cos(yaw) * 0.5, 1.0, -Math.sin(yaw) * 0.5)), _r).x - bx;
      if (Math.abs(lx) > 6) this.side = lx < 0 ? -1 : 1;
      const body = BODY * pxm;
      gx = this.side < 0 ? Math.min(c.x - cr - GAP - cw / 2, bx - body - cw / 2) : Math.max(c.x + cr + GAP + cw / 2, bx + body + cw / 2);
    }
    gx = THREE.MathUtils.clamp(gx, cw / 2 + 2, Wp - cw / 2 - 2); gy = THREE.MathUtils.clamp(gy, ch / 2 + 2, Hp - ch / 2 - 2);
    if (!this.at) this.at = new THREE.Vector2(gx, gy);
    else { this.at.x = ease(this.at.x, gx, 14, dt); this.at.y = ease(this.at.y, gy, 14, dt); }
    // on the grid: its left and top edges on whole pixels, so every art pixel is ART_PX of them exactly
    const sx = Math.round(this.at.x - cw / 2) + cw / 2, sy = Math.round(this.at.y - ch / 2) + ch / 2;
    _v.set((sx / Wp) * 2 - 1, 1 - (sy / Hp) * 2, cz).unproject(cam);
    this.sprite.position.copy(_v);
    const depth = Math.max(0.05, -_o.copy(_v).applyMatrix4(cam.matrixWorldInverse).z), k = (2 * depth) / (cam.projectionMatrix.elements[5] * Hp); // (metres a pixel at its depth)
    const pop = this.popT < 1 ? backOut(this.popT) : 1;
    this.sprite.scale.set(cw * k * pop, ch * k * pop, 1);
    this.sprite.material.opacity = Math.min(1, this.alpha);
  }

  /** The hoover's reach on the ground: the cone's edges, its far arc, the drain's nearer arc, three arcs running in. */
  reach() {
    const g = this.game, L = g.lockheart, P = g.player, cam = g.camera, B = this.buf;
    g.renderer?.getDrawingBufferSize(_px);
    const pxk = cam.projectionMatrix.elements[5] * 0.5 * (_px.y || 480);
    const yaw = P.yaw; _f.set(Math.sin(yaw), 0, Math.cos(yaw)); _r.set(-_f.z, 0, _f.x);
    const apex = this.apex.copy(P.fpWeight < 0.5 && L.mouthAt ? L.mouthAt : L.cof.group.getWorldPosition(_a)); // (the coffin's mouth, on the ground below it)
    const feet = P.pos.y; apex.y = this.groundAt(apex.x, apex.z, feet);
    const R = HOOVER.range, half = HOOVER.cone, alpha = this.reachA * (0.84 + 0.16 * Math.sin((this.t * TAU) / 2.4));
    const at = (r, a, out) => { const s = Math.sin(a), c = Math.cos(a); out.set(apex.x + (_f.x * c + _r.x * s) * r, 0, apex.z + (_f.z * c + _r.z * s) * r); out.y = this.groundAt(out.x, out.z, feet) + LIFT; return out; };
    const pts = this.pts, put = (i, r, a) => at(r, a, (pts[i] ||= new THREE.Vector3()));
    const line = (n, f, look, a) => { for (let i = 0; i < n; i++) f(i); wireStrip(B, pts, n, { look, a, rgb: this.rgb, camera: cam, pxk }); };
    B.count = 0;
    for (const s of [-1, 1]) line(9, (i) => put(i, 0.35 + (R - 0.35) * (i / 8), s * half), MAIN, alpha);
    line(25, (i) => put(i, R, -half + (2 * half * i) / 24), MAIN, alpha);
    line(15, (i) => put(i, HOOVER.drain, -half + (2 * half * i) / 14), THIN, alpha * 0.55);
    for (let k = 0; k < 3; k++) { // (arcs running in, toward the coffin: what it draws comes to it)
      const f = frac(this.t / 1.5 + k / 3), r = 0.5 + (R - 0.5) * (1 - f);
      line(15, (i) => put(i, r, -half + (2 * half * i) / 14), THIN, alpha * 0.75 * Math.sin(Math.PI * f) ** 1.2);
    }
    B.flush(); B.mesh.visible = B.count > 0;
  }

  /** The ground's height at (x, z) near the feet: the four corners of its cell of a world grid (CELL m), each found once by a ray down to
   *  what does not move and kept (keyed by the feet's height too, by halves of a metre), read between them. Ground is within a step up
   *  and a fall down of the feet and met from above: a ray begun inside a wall, or a lectern's top, is not ground, and the reach lies at
   *  the feet's height there, hidden by what stands in it. Steady, a sweep of the aim casts a few rays a frame, standing still none. */
  groundAt(x, z, feet) {
    const fx = x / CELL, fz = z / CELL, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz, fq = Math.round(feet * 2);
    const h = (i, j) => {
      const k = `${i},${j},${fq}`; let y = this.cells.get(k);
      if (y === undefined) {
        if (this.cells.size > 4000) this.cells.clear();
        const hit = this.game.physics?.raycast(_o.set(i * CELL, feet + 0.6, j * CELL), _down, 3.2, undefined, undefined, (c) => !c.isSensor() && (!c.parent() || c.parent().isFixed()));
        y = hit && hit.distance > 0.02 && hit.normal.y > 0.6 ? hit.point.y : null; this.cells.set(k, y);
      }
      return y ?? feet;
    };
    return (h(ix, iz) * (1 - u) + h(ix + 1, iz) * u) * (1 - v) + (h(ix, iz + 1) * (1 - u) + h(ix + 1, iz + 1) * u) * v;
  }

  /** What the eye is shown (tests, the sheets). */
  read() {
    return { gauge: this.sprite.visible, alpha: +this.alpha.toFixed(2), state: this.sig, ready: this.ready, reach: this.buf.mesh.visible, marks: this.buf.count,
      at: this.at ? [Math.round(this.at.x), Math.round(this.at.y)] : null, side: this.side };
  }
}
