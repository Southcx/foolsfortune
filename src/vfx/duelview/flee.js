// ---------------------------------------------------------------------------------------
// THE FLEE ON THE BOARD (the duel's view: vfx/duelview.js; Dovina's rule, progress/duel/flee.js, PUZZLE-DUELS.md section 15): the saving
// throw drawn on the tsuitate.
//   THE ODDS PLATE  while the Courier's side may flee: a small System window on the frame's top over the Courier's half, FLEE and its
//                   chance as a published rate ("FLEE 30%", `fleeOdds(state, 0)`), in the System's type (Cinzel for the word, Jersey 15
//                   for the number) as the Lockheart's reliquary publishes its break chances (lockheartreliquary/dial.js); faint while
//                   the turn is not yours or the points will not pay for it
//   THE ROLL        the 'flee' event { roll, bonus, need, mods, ok }: a d20 of Raku's dice set (vfx/bazaarpieces.js, the plum d20 with
//                   the schiller in its numerals) thrown from the Courier's figurine before the board, tumbling, coming to rest
//                   before the Courier's half with `roll` turned to you, its window over it; then its reasons counted in as the score ceremony counts (ui/scoreceremony.js):
//                   ROLL, then each modifier that is not nought (LINE held or lost, BREAK +3 a stun depth, PITY +3 a failed try, LUCK)
//                   lighting in and rolling the total up, against the 15 it must reach, and the verdict: a tick in the film, or a cross
//                   in the ember (a natural 20 or 1 stamped so). The die and the window linger a beat, then fade.
//   THE FLED        'duel.fled': the domains' clash collapses softly with no winner (no kintsugi gold), and the tsuitate folds back
//                   on its feet and sinks away.
// Materials: the plates are canvases on quads of the marks' glyph program (a map, unlit, blended); the die is the bazaar's glaze.
//
// Prior art: Dungeons & Dragons' saving throw (the d20 against a difficulty class, the natural 20 and 1), Baldur's Gate 3's dice roll
// window (the die thrown, the modifiers counted in beside it, the DC above), Balatro's count (each reason lighting and the total rolling),
// the gacha's published rates (the odds before you commit), the tsuitate folded and put away when the guests have gone.
//
//   const F = new DuelFlee(view)   F.layout(board)   F.odds(state)   F.roll(e) -> a beat's phase   F.fled(e) -> a beat's phase
//   F.update(dt)   F.clear()   F.prewarm()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bazaarMaterials, dieTpl, dieRest } from '../bazaarpieces.js';
import { fleeOdds, FLEE } from '../../progress/duel/flee.js';
import { VERD, J15, CZ, film, rng } from '../lockheartreliquary/look.js';
import { DUEL_VIEW, sm, ease, clamp01 } from './layout.js';

const K = 3; // (canvas pixels a dot: drawn crisp, read at the 480 lines)
const DIE_K = 2.4, THROW = 0.75, PER = 0.3, VERDICT = 0.4, HOLD = 0.6, LINGER = 0.9;
const REASONS = [['line', 'LINE'], ['break', 'BREAK'], ['pity', 'PITY'], ['luck', 'LUCK']];
const OK = '#ffe7a0', NO = '#ff8a5a', FAINT = 'rgba(226,243,230,.45)';
const _t = new THREE.Quaternion(), _a = new THREE.Quaternion(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

/** A canvas on a quad (w, h in dots; the quad in metres). */
function plate(w, h, mw) {
  const c = document.createElement('canvas'); c.width = w * K; c.height = h * K;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const mat = new THREE.MeshBasicMaterial({ name: 'duel-flee-plate', map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(mw, (mw * h) / w), mat); mesh.renderOrder = 6; mesh.visible = false;
  return { c, x: c.getContext('2d'), tex, mat, mesh, w, h, key: null };
}
function chamfer(x, X, Y, w, h, c) { x.beginPath(); x.moveTo(X + c, Y); x.lineTo(X + w, Y); x.lineTo(X + w, Y + h - c); x.lineTo(X + w - c, Y + h); x.lineTo(X, Y + h); x.lineTo(X, Y + c); x.closePath(); }
/** A small System window (the reliquary's plate, lockheartreliquary/dial.js plateBox): verdigris, its grain, an inner line, the film's frame. */
function windowBox(x, w, h, t) {
  const c = 4; chamfer(x, 0.5, 0.5, w - 1, h - 1, c);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgb(${VERD.top})`); g.addColorStop(1, `rgb(${VERD.bot})`); x.fillStyle = g; x.fill();
  x.save(); x.clip(); const R = rng(9); for (let i = 0; i < (w * h) / 30; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : 'rgba(226,243,230,.1)'; x.fillRect((R() * w) | 0, (R() * h) | 0, 1, 1); } x.restore();
  x.lineWidth = 1; x.strokeStyle = 'rgba(111,165,150,.55)'; chamfer(x, 2.5, 2.5, w - 5, h - 5, c - 1); x.stroke();
  const lg = x.createLinearGradient(0, 0, w, h); [0, 0.33, 0.66, 1].forEach((p, i) => lg.addColorStop(p, film(i / 4 + t * 0.05, 1))); x.strokeStyle = lg; chamfer(x, 0.5, 0.5, w - 1, h - 1, c); x.stroke();
}
function text(x, s, X, Y, font, col, align = 'left') { x.font = font; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillStyle = '#031210'; x.fillText(s, X, Y + 1); x.fillStyle = col; x.fillText(s, X, Y); }
const signed = (n) => (n >= 0 ? '+' : '-') + Math.abs(n);

export class DuelFlee {
  constructor(view) {
    this.view = view; this.group = new THREE.Group(); this.group.name = 'duel-flee'; view.frame.add(this.group);
    this.oddsP = plate(56, 22, 0.56); this.rollP = plate(76, 74, 0.62); this.group.add(this.oddsP.mesh, this.rollP.mesh);
    const T = dieTpl(20, '20', DIE_K), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(T.pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(T.nrm, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(T.uv, 2));
    this.die = new THREE.Mesh(geo, bazaarMaterials().glaze); this.die.visible = false; this.die.castShadow = false; this.group.add(this.die);
    this.run = null; this.linger = 0; this.t = 0; this.board = { w: 20, h: 20 };
  }

  layout(board) {
    this.board = { w: board.w, h: board.h }; const { cs, base, border } = DUEL_VIEW, W = board.w * cs, H = board.h * cs;
    this.oddsP.mesh.position.set(-W / 2 + 0.36, base + H + border + 0.16, DUEL_VIEW.lip + 0.03);
    // (where the die comes to lie and its window stands: before the Courier's half near the Line, mid-height, clear of the world's Courier
    // beside the frame and of the log's corner of the screen)
    this.rest = new THREE.Vector3(-W * 0.15, base + H * 0.36, 0.5);
    this.rollP.mesh.position.set(-W * 0.15, base + H * 0.6, 0.42);
  }

  /** The odds plate, drawn again only when what it says changes. */
  odds(s) {
    const P = this.oddsP, S = s?.sides?.[0], may = !!S?.flee && s.winner === null && !s.fled;
    if (!may || this.run || this.folding || this.view.folded) { P.mesh.visible = false; P.key = null; return; }
    const o = fleeOdds(s, 0), pct = Math.round(o.chance * 100), live = s.toMove === 0 && s.apLeft >= FLEE.cost, key = `${pct}|${live}`;
    P.mesh.visible = true; P.mat.opacity = live ? 1 : 0.55; if (key === P.key) return; P.key = key;
    const x = P.x; x.setTransform(K, 0, 0, K, 0, 0); x.clearRect(0, 0, P.w, P.h); windowBox(x, P.w, P.h, this.t);
    text(x, 'FLEE', 6, 15, CZ(8), live ? VERD.hi : FAINT); text(x, `${pct}%`, P.w - 5, 17, J15(15), !live ? FAINT : pct >= 50 ? '#ffc08a' : VERD.hi, 'right');
    P.tex.needsUpdate = true;
  }

  /** The roll's phase (beats.js plays it): thrown, landed on `roll`, its reasons counted in against the 15. */
  roll(e) {
    const V = this.view, reasons = REASONS.filter(([k]) => (e.mods?.[k] || 0) !== 0).map(([k, l]) => ({ k, l, n: e.mods[k] }));
    const from = V.pieces.bodyAt(e.side) ? V.headOf(e.side, new THREE.Vector3()).setZ(0.25) : this.rest.clone().add(_v.set(-0.4, 1.2, 0));
    const restQ = new THREE.Quaternion(); dieRest(20, e.roll, 0.35, restQ, DIE_K);
    restQ.premultiply(_t.setFromUnitVectors(_up, _v.set(0, 0.42, 1).normalize())); // (tipped back, its face to you: it hangs before the board, as a summoned thing of the System's)
    const R = rng(e.roll * 31 + reasons.length + 7), axis = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), turns = 9 + R() * 5;
    const count = THROW + 0.25, dur = count + reasons.length * PER + VERDICT + HOLD;
    this.run = { e, reasons, from, restQ, axis, turns, count, dur, age: 0 }; this.linger = 0;
    this.die.visible = true; this.die.scale.setScalar(1); this.rollP.mat.opacity = 1; this.oddsP.mesh.visible = false;
    return { events: [e], dur, step: (u, age) => { this.run.age = age; this.place(age); this.draw(age); }, end: () => { this.place(dur); this.draw(dur); this.linger = LINGER; } };
  }

  /** The die where its throw has it: an arc from the figurine, tumbling about one axis down to rest, one small hop as it lands. */
  place(age) {
    const R = this.run; if (!R) return;
    const u = clamp01(age / THROW), s = sm(u), hop = u < 0.78 ? Math.sin((Math.PI * u) / 0.78) * 0.9 : Math.sin((Math.PI * (u - 0.78)) / 0.22) * 0.07;
    this.die.position.lerpVectors(R.from, this.rest, s); this.die.position.y += hop;
    const spin = Math.PI * 2 * R.turns * (1 - u) ** 2.2;
    this.die.quaternion.copy(R.restQ).multiply(_a.setFromAxisAngle(R.axis, spin));
  }

  /** The reasons' window: ROLL, each reason lighting in, the total rolling up, against the 15, the verdict. */
  draw(age) {
    const R = this.run, P = this.rollP, x = P.x, e = R.e; if (age < THROW - 0.05) { P.mesh.visible = false; return; }
    P.mesh.visible = true;
    const k = age - R.count; let total = e.roll, shown = 0;
    for (let i = 0; i < R.reasons.length; i++) { const f = clamp01((k - i * PER) / (PER * 0.8)); if (f > 0) shown = i + 1; total += R.reasons[i].n * sm(f); }
    x.setTransform(K, 0, 0, K, 0, 0); x.clearRect(0, 0, P.w, P.h); windowBox(x, P.w, P.h, this.t);
    const pop = ease(clamp01((age - THROW + 0.05) / 0.25), 2.2), nat = e.roll === 20 || e.roll === 1;
    text(x, 'ROLL', 6, 13, CZ(7), VERD.mid); text(x, String(e.roll), P.w - 6, 14 - 2 * (1 - pop), J15(Math.round(13 + 2 * (1 - pop))), nat ? (e.roll === 20 ? OK : NO) : VERD.hi, 'right');
    R.reasons.forEach((r, i) => {
      if (i >= shown) return; const f = clamp01((k - i * PER) / (PER * 0.8)), y = 25 + i * 9, fly = (1 - ease(f, 1.6)) * 18;
      text(x, r.l, 6 + fly, y, CZ(6), `rgba(226,243,230,${0.4 + 0.6 * f})`); text(x, signed(r.n), P.w - 6 + fly, y, J15(10), r.n > 0 ? VERD.hi : NO, 'right');
    });
    const ly = 25 + R.reasons.length * 9 - 4; x.fillStyle = 'rgba(111,165,150,.6)'; x.fillRect(6, ly, P.w - 12, 1);
    const vk = clamp01((k - R.reasons.length * PER) / VERDICT), sum = Math.round(total);
    text(x, String(sum), 6, ly + 15, J15(15), vk > 0 ? (e.ok ? OK : NO) : VERD.hi); text(x, `/ ${FLEE.dc}`, 30, ly + 14, J15(10), VERD.mid);
    if (vk > 0) { // the verdict: a tick in the film, or a cross in the ember, stamped in
      const s = ease(vk, 2.4), cx = P.w - 14, cy = ly + 9, r = 6 * s; x.lineWidth = 2.2; x.lineCap = 'round';
      x.strokeStyle = e.ok ? film(this.t * 0.4, 1) : NO; x.beginPath();
      if (e.ok) { x.moveTo(cx - r, cy); x.lineTo(cx - r * 0.25, cy + r * 0.7); x.lineTo(cx + r, cy - r * 0.8); } else { x.moveTo(cx - r * 0.8, cy - r * 0.8); x.lineTo(cx + r * 0.8, cy + r * 0.8); x.moveTo(cx + r * 0.8, cy - r * 0.8); x.lineTo(cx - r * 0.8, cy + r * 0.8); }
      x.stroke();
      if (nat) text(x, e.roll === 20 ? 'NAT 20' : 'NAT 1', P.w / 2 + 6, ly + 15, CZ(6), e.roll === 20 ? OK : NO, 'center');
    }
    P.tex.needsUpdate = true;
  }

  /** 'duel.fled': the clash folding softly with no winner, the tsuitate folding back on its feet and sinking away. */
  fled(e) {
    const V = this.view, F = V.frame; V.board.won(0); V.clash.collapse(2.2); V.marks.stars(0, 0); V.marks.stars(1, 0); V.intentDraw.clear();
    this.folding = true; this.oddsP.mesh.visible = false;
    return { events: [e], dur: 1.4, step: (u) => { const s = sm(u); F.rotation.x = -1.35 * s; F.position.y = -0.4 * s * s; F.scale.setScalar(Math.max(0.001, 1 - 0.85 * s * s)); },
      end: () => { F.scale.setScalar(0.001); V.folded = true; this.folding = false; } };
  }

  update(dt) {
    this.t += dt;
    if (this.run && this.linger > 0) {
      this.linger -= dt; const f = clamp01(this.linger / LINGER); this.rollP.mat.opacity = Math.min(1, f * 1.6); this.die.scale.setScalar(Math.max(0.001, Math.min(1, f * 1.6)));
      if (this.linger <= 0) this.clear();
    }
  }
  clear() { this.run = null; this.linger = 0; this.folding = false; this.die.visible = false; this.rollP.mesh.visible = false; this.oddsP.mesh.visible = false; this.oddsP.key = null; }

  /** For the boot's warm-up: the plates and the die shown once. */
  prewarm() { this.die.visible = true; this.rollP.mesh.visible = true; this.oddsP.mesh.visible = true; }
}

