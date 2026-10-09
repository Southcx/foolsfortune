// ---------------------------------------------------------------------------------------
// THE PENDULUM: what the Crucibelle adds to the wire compass while it is in the hands (vfx/wirecompass.js is its tape), in the same hand
// as the vane's marks (vfx/vanehud.js): lines only, no words, no numbers, hung on the tape and drawn additively. It is the bell's beat for
// the eye, so a player who cannot hear the music can still play the bell (docs/plans/CRUCIBELLE-UI.md). Gone when the bell is stowed,
// and never in the rhythm mode (that has its own note chart).
//
//   THE BELL'S MARK  the Crucibelle in a few lines on the tape's centre, mouth up, held by its crown ring, as it is held in the hand.
//   THE PENDULUM     hung from that ring below the tape, as the fob hangs below the hand on the bell itself (the metronome, model.js),
//                    swinging so each end of its arc lands on an eighth of the bell's beat (the music's, or its own 96 bpm, drawn
//                    fainter). A pendulum's ease: fastest through the middle, slowing into each end. At each bar's downbeat the bob's
//                    line thickens and that end's mark stands taller: shape and motion only, never a flash, never a pulse of light.
//   THE NOTCH        a channel at each end of the arc, as wide in angle as the bell's on-beat window really is (the angle the bob
//                    sweeps while it is within the window), so a note pressed while the bob is in a notch is on the beat.
//   THE NEUMES       a note pressed is written on the arc where the bob was, as its neume (a shape for each of the five, NEUMES):
//                    solid inside the notch (a brighten that settles), hollow outside it; an octave up (RMB) doubles its line.
//   THE MOTIF        then it rises to the tape and the notes trail along it to the left, heighted by pitch over the tape's line: the
//                    phrase written out. When the motif makes a song, its neumes draw together into the song's neume (the song's notes
//                    joined in one ligature) and that is taken down into the bell's mark: the song cast. A motif the bell takes but
//                    cannot pay for (too dry) drops away instead.
//   FEVER            the bob is an ember: its glow and a line of smoke rising off it (the swing's own trail) grow with fever; at the
//                    fever's peak the smoke rings out once round the tape, two heads travelling out from the centre.
//
// Read, not driven: the bell's own clock and judgement (`crucibelle.grid()`, `now()`, `fever`), its events (`crucibelle.note`,
// `song.play`, `crucibelle.fever`) and its songs (tools/crucibelle/songs.js). Settings: `visual.pendulumSize`, `visual.compassContrast`
// (the lines fainter or brighter, and the keyline under them growing with it). Drawn with the compass's own material (vfx/wirecompass.js
// `compassMaterial`, the pen's colours per vertex): pale light with a dark keyline on a dark sky, dark ink with a pale one on a bright
// sky, as the tape is (R11: light lines alone vanish on a noon sky). The tape
// opens a gap below its line for the swing, and round the bell's mark (wirecompass.js `hole`). The Half Time knack (`game.knacks.on('halfTime')`, progress/knacks.js): the ends land on every other
// eighth, the quarters, never a slower tempo, and a third notch in the middle marks the off-eighth the bell still counts.
//
// Prior art, as on a museum label:
//   Maelzel's metronome (1815): the swinging rod whose ends are the beat, and the ease of a real pendulum slowing into each end.
//   The conductor's baton: the downbeat is the heaviest stroke of the bar and lands in the same place every bar.
//   The Botafumeiro of Santiago de Compostela: a censer swung as a pendulum, its smoke drawing the swing behind it.
//   Rhythm Heaven: every cue it gives the ear it also gives the eye, which is why it can be played deaf.
//   Crypt of the NecroDancer's beat bar (the beat travelling to a mark you press on) and Patapon's border pulse (the rhythm on the
//   frame of the screen, fever as fire).
//   Skyward Sword's dowsing and the vane on the compass (vfx/vanehud.js): the tool's own marks hung on the HUD's one device.
//   Shape-note singing (Little and Smith's The Easy Instructor, 1801; Aikin's seven shapes, 1846): a notehead whose shape is its degree,
//   so a singer who cannot read a staff can read the tune. The five neumes are Aikin's heads, read in a minor key from la.
//   Neumes themselves (the chant's signs, written without a staff, then heighted over one line: Guido of Arezzo's), and their
//   ligatures, several notes as one sign: the song's neume.
//
//   const ch = new CrucibelleHud(game, compass)    ch.update(dt)    (after the compass)    ch.read() -> what the eye sees (tests)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { SONGS, DEGREE_COLOR, match } from '../tools/crucibelle/songs.js';
import { WINDOW as BELL_WINDOW } from '../tools/crucibelle/crucibelle.js';
import { compassMaterial, keyStrength } from './wirecompass.js';

const R = 10;              // (the tape's radius: wirecompass.js)
const LINES = 480;         // (the HUD is drawn in pixels of the sixth generation's 480 lines, whatever the resolution: render/present.js)
// The bell's on-beat window, seconds either side of an eighth, is the bell's own (WINDOW, tools/crucibelle/crucibelle.js), so the notch never lies.
const AMP = 0.62;          // the swing's half-arc, radians (the fob's is 0.55)
const LEN = 64;            // the pendulum's length, pixels
const NEUME = 6.5;         // a neume's half-size, pixels: 13 across, 17 with the octave's line
const MOTIF_MAX = 8;       // (the bell keeps the last eight notes)
const MAXV = 6000;

// ---- the shapes, as closed outlines on a unit square (x right, y up)
const ring = (n, rx, ry = rx, cx = 0, cy = 0, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n }, (_, i) => { const a = a0 + ((a1 - a0) * i) / (a1 - a0 === Math.PI * 2 ? n : n - 1); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
/** The five neumes, one for each degree of the bell's scale (keys 1 to 5), Aikin's shape-note heads read in the minor from la: */
export const NEUMES = [
  // 1, the root (la): the square. The tonic of a minor tune is la in shape notes, and la's head is the square: the floor it stands on.
  { id: 'square', pts: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], c: [0, 0] },
  // 2, the minor third (do): the triangle, point up. Do, the relative major's home, the note that lifts the tune.
  { id: 'triangle', pts: [[0, 1], [0.98, -0.78], [-0.98, -0.78]], c: [0, -0.19] },
  // 3, the fourth (re): the bowl, flat side up. Re's half-moon: the fourth hangs, a cup waiting to be filled.
  { id: 'bowl', pts: ring(13, 1, 1.45, 0, 0.6, 0, -Math.PI), c: [0, 0.6 - (4 * 1.45) / (3 * Math.PI)] },
  // 4, the fifth (mi): the diamond. Mi's cut stone: after the root the strongest note, the point of the tune.
  { id: 'diamond', pts: [[0, 1.05], [0.85, 0], [0, -1.05], [-0.85, 0]], c: [0, 0] },
  // 5, the minor seventh (sol): the circle. Sol's round head, the sun's: the top of the scale, rolling home to the root above.
  { id: 'circle', pts: ring(18, 0.9), c: [0, 0] },
];
/** A song's neume: its notes' heads, heighted by degree, side by side and joined in one ligature (the chant's compound neume). Unit
 *  half-width; returns the heads' places and size. Each song's falls out of its notes, so it is its own and it can be read:
 *  THE SONG OF SEEING (5 3 1) falls in leaps, the climacus; THE SONG OF SEEMING (2 4 2 4) flickers between two, the double image;
 *  THE RALLY (1 3 5) climbs, the scandicus, a banner raised; THE LULLABY (5 4 3 2 1) steps all the way down, a cradle rocked to the
 *  floor; THE CALL (1 1 5 5) knocks twice low and answers twice high. */
export function songNeume(id) {
  const notes = SONGS[id]?.notes || [], n = notes.length, step = n > 1 ? 1.8 / (n - 1) : 0, s = Math.min(0.3, 0.7 / n + 0.08);
  return { s, heads: notes.map((d, i) => ({ d, x: -0.9 + i * step, y: (d - 3) * 0.32 })) };
}
// the ember: a flame, round below and pointed above (no neume has this shape)
const FLAME = [[0, 1.1], ...ring(12, 0.7, 0.7, 0, -0.2, Math.PI * 0.2, -Math.PI * 1.2)];
// the bell's mark, mouth up: its profile's right side, mirrored (pixels; the crown ring's centre is the pivot at 0, 0)
const BELL_SIDE = [[1.6, 3.6], [2.6, 5], [3, 8], [3.6, 10.5], [5.2, 12.6], [6.6, 13.6]];

const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const ease = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x); };
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const BRASS = rgb(0xd9b048), SMOKE = rgb(0x8a8090), SMOKE_HOT = rgb(0xb49be6), NOTE_RGB = DEGREE_COLOR.map(rgb);

/** A pen of line segments into one dynamic buffer (positions, and each line's colour and weight: the compass material's `aCol`), drawn
 *  in one call. */
class Pen {
  constructor(max) {
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.n = 0; this.max = max;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(max), 1)); // (read by the compass's material, unused with a pen's colours)
    this.geo.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(max * 2), 2)); // (no keyline offset: the pen's keylines are drawn moved)
  }
  reset() { this.n = 0; }
  seg(x0, y0, x1, y1, c, k, z0 = 0, z1 = 0) {
    if (k <= 0.004 || this.n + 2 > this.max) return;
    const p = this.pos, q = this.col, i = this.n * 3, j = this.n * 4;
    p[i] = x0; p[i + 1] = y0; p[i + 2] = z0; p[i + 3] = x1; p[i + 4] = y1; p[i + 5] = z1;
    q[j] = q[j + 4] = c[0]; q[j + 1] = q[j + 5] = c[1]; q[j + 2] = q[j + 6] = c[2]; q[j + 3] = q[j + 7] = k;
    this.n += 2;
  }
  /** A closed outline `pts` (unit), scaled by `s` about its centre `c`, `grow` times larger, at x, y. */
  shape(pts, x, y, s, c, k, grow = 1, ctr = [0, 0]) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      this.seg(x + (ctr[0] + (a[0] - ctr[0]) * grow) * s, y + (ctr[1] + (a[1] - ctr[1]) * grow) * s, x + (ctr[0] + (b[0] - ctr[0]) * grow) * s, y + (ctr[1] + (b[1] - ctr[1]) * grow) * s, c, k);
    }
  }
  arc(cx, cy, r, a0, a1, c, k, n = 12) {
    for (let i = 0; i < n; i++) { const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n; this.seg(cx + Math.sin(t0) * r, cy - Math.cos(t0) * r, cx + Math.sin(t1) * r, cy - Math.cos(t1) * r, c, k); }
  }
  commit() { this.geo.setDrawRange(0, this.n); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aCol.needsUpdate = true; }
}
const lineMat = () => compassMaterial({ vert: true });

export class CrucibelleHud {
  constructor(game, compass) {
    this.game = game; this.compass = compass;
    this.group = new THREE.Group(); this.group.renderOrder = 36; this.group.userData.zoneFree = true; // (the HUD: never hidden by a render zone)
    this.pen = new Pen(MAXV);
    this.lines = new THREE.LineSegments(this.pen.geo, lineMat()); this.lines.renderOrder = 36; this.lines.frustumCulled = false;
    // the keyline: the same lines in the opposite tone (dark under light, pale under ink), a pixel out each way, under them, each line's
    // as strong as the line; drawn with the lines' own shader program, not one of its own
    this.keyMat = compassMaterial({ key: true, vert: true });
    this.keys = [[1, 0], [-1, 0], [0, 1], [0, -1]].map((o) => { const m = new THREE.LineSegments(this.pen.geo, this.keyMat); m.userData.o = o; m.renderOrder = 35; m.frustumCulled = false; this.group.add(m); return m; });
    this.group.add(this.lines);
    // the fever's peak ringing round the tape, in the world (the tape is a ring round the eye)
    this.ringPen = new Pen(256);
    this.ring = new THREE.LineSegments(this.ringPen.geo, lineMat()); this.ring.renderOrder = 36; this.ring.frustumCulled = false; this.ring.userData.zoneFree = true;
    game.scene.add(this.group, this.ring);
    this.alpha = 0; this.lastT = null; this.prevAbs = 0; this.towardEnd = false; this.view = null;
    this.motif = []; this.leaving = []; this.cast = null; this.taking = null; this.taken = null; this.pending = null; this.lastNote = -1e9; this.ringT = -1;
    this.smoke = []; this.heat = 0;
    this.fwd = new THREE.Vector3();
    const E = game.events;
    E?.on('crucibelle.note', (e) => this.onNote(e));
    E?.on('song.play', (e) => { this.pending = e.song; if (this.taking?.id === e.song) this.castNow(); });
    E?.on('crucibelle.fever', () => { this.ringT = this.bell?.now() ?? this.lastT ?? -1; });
  }

  get bell() { return this.game.crucibelle || null; }

  /** The swing at time `t` on the bell's grid `G`: the angle and everything the eye can read off it. */
  swing(t, G) {
    const e = G.spb / 2, ph = (t - G.t0) / e, half = !!this.game.knacks?.on?.('halfTime');
    const sw = half ? ph / 2 : ph, th = AMP * Math.cos(Math.PI * sw);
    const wE = Math.min(BELL_WINDOW / e, half ? 1 : 0.5);
    const notch = AMP * Math.cos(Math.PI * Math.min(half ? wE / 2 : wE, 0.5));
    const centre = half ? AMP * Math.sin(Math.PI * Math.min(wE / 2, 0.5)) : 0;
    const per = 2 * (G.beats || 4), pb = ((ph % per) + per) % per, toBar = Math.min(pb, per - pb);
    const barAt = pb < per / 2 ? ph - pb : ph + per - pb, side = Math.cos(Math.PI * (half ? barAt / 2 : barAt)) >= 0 ? 1 : -1;
    const abs = Math.abs(th), inNotch = abs >= notch - 1e-6 || (half && abs <= centre + 1e-6);
    return { ph, th, notch, centre, half, inNotch, toBar, side, down: smooth(1 - toBar / 1.5) };
  }

  // ---------------------------------------------------------------- what the bell says
  onNote(e) {
    const cb = this.bell; if (!cb) return;
    // (judged at the press: the bell keeps the time it judged with as lastNote, set before the event; a song cast between takes a while)
    const now = cb.now(), t = Number.isFinite(cb.lastNote) && now - cb.lastNote < 0.25 && cb.lastNote <= now ? cb.lastNote : now;
    const G = cb.grid(), s = this.swing(t, G), d = e.degree;
    if (!(d >= 1 && d <= 5)) return;
    // (the octave: the bell reads RMB at the same press, tools/crucibelle/crucibelle.js use(); the event does not say it yet)
    const high = e.octave ?? !!this.game.input?.isDown?.('Mouse2');
    if (t - this.lastNote > G.spb * 4) this.dropMotif(t); // (a long pause starts the motif again, as the bell's does)
    this.lastNote = t;
    const r = LEN + 20, arc = [Math.sin(s.th) * r, -Math.cos(s.th) * r];
    const n = { d, high, on: !!e.onBeat, born: t, th: s.th, arc, x: arc[0], y: arc[1], agree: s.inNotch === !!e.onBeat };
    this.motif.push(n);
    if (this.motif.length > MOTIF_MAX) this.leaving.push({ ...this.motif.shift(), left: t });
    this.notes = (this.notes || 0) + 1; this.disagree = (this.disagree || 0) + (n.agree ? 0 : 1);
    const song = match(this.motif.map((m) => m.d));
    if (!song) { this.pending = null; return; }
    // the bell took the motif: cast if song.play comes in the same press (before this event or after it), else too dry, it falls (update)
    const k = SONGS[song].notes.length, items = this.motif.splice(this.motif.length - k, k);
    this.dropMotif(t);
    this.taking = { id: song, born: t, items: items.map((m) => ({ ...m, from: [m.x, m.y] })) };
    if (this.pending === song) this.castNow();
  }
  castNow() { this.cast = this.taking; this.taking = null; this.pending = null; this.casts = (this.casts || 0) + 1; }
  dropMotif(t) { for (const m of this.motif) this.leaving.push({ ...m, left: t }); this.motif = []; }

  /** Where the k-th newest neume of the motif sits: along the tape to the left of the bell's mark, heighted by its degree. */
  slot(k, d) { return [-24 - k * 17, 8 + (d - 1) * 4.5]; }

  // ---------------------------------------------------------------- every frame
  update(dt) {
    const g = this.game, C = this.compass, cb = this.bell, cam = g.camera;
    const t = cb ? cb.now() : (this.lastT ?? 0) + dt;
    // (the bell's clock changed hands: the audio clock begun, which always starts behind the page's; a stall only ages things out)
    if (this.lastT != null && (t < this.lastT - 0.05 || t - this.lastT > 30)) { this.motif = []; this.leaving = []; this.cast = this.taking = null; this.smoke = []; this.ringT = -1; this.taken = null; this.lastNote = -1e9; }
    const rdt = this.lastT == null ? 0 : THREE.MathUtils.clamp(t - this.lastT, 0, 0.1);
    this.lastT = t;
    const on = !!(cb && cb.held && C?.tape?.visible && !g.rhythm?.active);
    this.alpha += ((on ? 1 : 0) - this.alpha) * (1 - Math.exp(-dt * 6));
    const shown = this.alpha > 0.01;
    this.group.visible = shown; this.ring.visible = shown && this.ringT >= 0;
    if (!cb) return;
    if (!cb.held && this.motif.length) this.dropMotif(t); // (stowed: the bell forgets the motif)
    if (this.taking) { for (const m of this.taking.items) this.leaving.push({ ...m, left: t, fall: true }); this.taking = null; } // (taken, never sung)
    this.pending = null;
    const G = cb.grid(), s = this.swing(t, G), abs = Math.abs(s.th);
    this.towardEnd = abs > this.prevAbs; this.prevAbs = abs;
    const M = g.music?.grid?.(), own = !M || M.t0 !== G.t0 || M.spb !== G.spb;
    this.view = { ...s, own, shown, towardEnd: this.towardEnd, t };
    if (!shown) { this.smoke.length = 0; if (C?.hole) C.hole(0, 0.1); return; }

    // ---- placed: on the tape's centre, facing the eye, in pixels of 480 lines
    const f = cam.getWorldDirection(this.fwd); f.y = 0; f.normalize();
    this.group.position.set(cam.position.x + f.x * R, C.tape.position.y, cam.position.z + f.z * R);
    this.group.quaternion.copy(cam.quaternion);
    const dist = cam.position.distanceTo(this.group.position), px = (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) / LINES;
    const size = THREE.MathUtils.clamp(T.visual.pendulumSize ?? 1, 0.5, 2.5), con = THREE.MathUtils.clamp(T.visual.compassContrast ?? 1, 0.25, 3);
    this.group.scale.setScalar(px * size);
    if (C.hole) C.hole(this.alpha, Math.atan(((Math.sin(AMP) * (LEN + 20) + NEUME + 4) * size * px) / R), Math.atan((8 * size * px) / R)); // (the tape opens for the swing, and round the bell's mark)
    for (const k of this.keys) k.position.set(k.userData.o[0] / size, k.userData.o[1] / size, 0); // (a pixel out, whatever the size)
    this.lines.material.uniforms.uAlpha.value = this.alpha * Math.min(1, con);
    this.keyMat.uniforms.uAlpha.value = this.alpha * keyStrength(con); // (a keyline at 1 too: light lines alone vanish on the Dunes' noon sky)
    for (const k of this.keys) k.visible = this.keyMat.uniforms.uAlpha.value > 0.01;
    const lift = Math.max(1, con), faint = (own ? 0.6 : 1) * lift;

    const P = this.pen; P.reset();
    this.heat += (cb.fever - this.heat) * (1 - Math.exp(-rdt * 5));
    const heat = this.heat;
    // ---- the bell's mark: mouth up on its crown ring (the pivot), taking a song in
    const took = this.taken ? smooth(1 - (t - this.taken) / 0.9) * smooth((t - this.taken) / 0.15) : 0;
    if (this.taken && t - this.taken > 1) this.taken = null;
    const bk = (0.55 + 0.6 * took) * lift;
    P.shape(ring(12, 1.6), 0, 0, 1, BRASS, bk);
    for (const sx of [1, -1]) for (let i = 0; i < BELL_SIDE.length - 1; i++) P.seg(BELL_SIDE[i][0] * sx, BELL_SIDE[i][1], BELL_SIDE[i + 1][0] * sx, BELL_SIDE[i + 1][1], BRASS, bk);
    P.shape(ring(14, 6.6, 1.3, 0, 13.6), 0, 0, 1, BRASS, bk);
    P.seg(-1.6, 3.6, 1.6, 3.6, BRASS, bk);
    if (took > 0) P.shape(ring(12, 4.6 * took + 1, 0.8 * took + 0.2, 0, 12.6), 0, 0, 1, BRASS, took * lift);

    // ---- the arc, its notches and its end marks. A notch is the arc forking into a groove the bob runs into (open toward the middle,
    // so it is never taken for a neume), from the window's edge to the end mark
    const L = LEN, arcK = 0.42 * faint, A = AMP, nf = s.notch, gK = arcK * 1.5;
    const groove = (a0, a1, forkA, forkB) => {
      const d = Math.sign(a1 - a0) * 0.035, q0 = forkA ? a0 + d : a0, q1 = forkB ? a1 - d : a1;
      for (const o of [-3, 3]) { P.arc(0, 0, L + o, q0, q1, BRASS, gK, 6); }
      for (const [on, a, q] of [[forkA, a0, q0], [forkB, a1, q1]]) if (on) for (const o of [-3, 3]) P.seg(Math.sin(a) * L, -Math.cos(a) * L, Math.sin(q) * (L + o), -Math.cos(q) * (L + o), BRASS, gK);
    };
    const mid = s.half && s.centre > 0.004 ? s.centre : 0;
    if (mid) { groove(-mid, mid, true, true); P.arc(0, 0, L, mid, nf, BRASS, arcK, 10); P.arc(0, 0, L, -nf, -mid, BRASS, arcK, 10); }
    else P.arc(0, 0, L, -nf, nf, BRASS, arcK, 22);
    for (const side of [1, -1]) {
      const a0 = side * nf, a1 = side * A;
      groove(a0, side * (A + 0.05), true, false);
      const tall = side === s.side ? 7 + 9 * s.down : 7, sa = Math.sin(a1), ca = -Math.cos(a1);
      P.seg(sa * (L - 7), ca * (L - 7), sa * (L + tall), ca * (L + tall), BRASS, 0.85 * faint);
      if (side === s.side && s.down > 0.02) { const o = 1.1, nx = Math.cos(a1) * o, ny = Math.sin(a1) * o; P.seg(sa * (L - 7) + nx, ca * (L - 7) + ny, sa * (L + tall) + nx, ca * (L + tall) + ny, BRASS, 0.85 * faint * smooth(s.down * 2)); P.seg(sa * (L - 7) - nx, ca * (L - 7) - ny, sa * (L + tall) - nx, ca * (L + tall) - ny, BRASS, 0.85 * faint * smooth(s.down * 2 - 1)); }
    }

    // ---- the rod and the bob, an ember with weight (an outline nested in it), its line thickened into the downbeat
    const th = s.th, bs = 6, bx = Math.sin(th) * L, by = -Math.cos(th) * L, ux = Math.cos(th), uy = Math.sin(th);
    const rodK = 0.8 * faint, r0 = 1.6, r1 = L - bs * 0.95;
    const rod = (o, k) => P.seg(Math.sin(th) * r0 + ux * o, -Math.cos(th) * r0 + uy * o, Math.sin(th) * r1 + ux * o, -Math.cos(th) * r1 + uy * o, BRASS, k);
    rod(0, rodK);
    if (s.down > 0.01) { rod(1, rodK * smooth(s.down * 2)); rod(-1, rodK * smooth(s.down * 2 - 1)); }
    const ember = [1, 0.45 + 0.4 * heat, 0.2 + 0.6 * heat], emberDim = [0.85, 0.36, 0.14];
    const ec = emberDim.map((v, i) => v + (ember[i] - v) * Math.min(1, heat * 1.4));
    const ek = (1 + 0.4 * heat) * faint, fc = [0, -0.2];
    P.shape(FLAME, bx, by, bs, ec, ek, 1, fc); P.shape(FLAME, bx, by, bs, ec, ek * 0.8, 0.5, fc);
    if (s.down > 0.01) { P.shape(FLAME, bx, by, bs, ec, ek * smooth(s.down * 2), (bs + 1.1) / bs, fc); P.shape(FLAME, bx, by, bs, ec, ek * smooth(s.down * 2 - 1), (bs + 2.2) / bs, fc); }
    if (heat > 0.02) P.shape(FLAME, bx, by, bs, ec, 0.45 * heat * faint, 1.8, fc);
    // the smoke: a thin line rising off the bob, the swing's own trail bending it (a censer's), as long as the fever is high
    if (heat > 0.03) this.smoke.push({ x: bx, y: by + bs * 1.1, age: 0 });
    const life = 0.06 + 0.32 * heat, sc = heat > 0.6 ? SMOKE_HOT : SMOKE;
    const drag = 1 - Math.exp(-rdt * 9); // (drawn along after the bob, so the line stands over it and bends behind the swing)
    for (const p of this.smoke) { p.age += rdt; p.y += rdt * 90; p.x += (bx - p.x) * drag + Math.sin(p.age * 14 + p.y * 0.3) * rdt * 6; }
    while (this.smoke.length && (this.smoke[0].age > life || this.smoke.length > 60)) this.smoke.shift();
    for (let i = this.smoke.length - 1; i > 0; i--) { const a = this.smoke[i], b = this.smoke[i - 1]; P.seg(a.x, a.y, b.x, b.y, sc, (1 - b.age / life) * (0.3 + 0.6 * heat) * lift); }

    // ---- the motif: each neume on the arc, then risen to its place along the tape
    const n = this.motif.length;
    this.motif.forEach((m, i) => {
      const age = t - m.born, [sx, sy] = this.slot(n - 1 - i, m.d), u = ease((age - 0.45) / 0.4);
      m.x += ((m.arc[0] + (sx - m.arc[0]) * u) - m.x) * (age < 0.9 ? 1 : 1 - Math.exp(-rdt * 10));
      m.y += ((m.arc[1] + (sy - m.arc[1]) * u) - m.y) * (age < 0.9 ? 1 : 1 - Math.exp(-rdt * 10));
      this.neume(m, m.x, m.y, NEUME * (1 - 0.2 * u), age, 1);
      if (i > 0 && u > 0.99 && t - this.motif[i - 1].born > 0.9) { const a = this.motif[i - 1]; P.seg(a.x + 4, a.y, m.x - 4, m.y, NOTE_RGB[m.d - 1], 0.18 * lift); }
    });
    // what is left behind: a motif begun again drifts off to the left; a song too dry to sing falls
    this.leaving = this.leaving.filter((m) => {
      const k = (t - m.left) / 0.6; if (k >= 1) return false;
      this.neume(m, m.x - (m.fall ? 0 : 30 * k), m.y - (m.fall ? 24 * k * k : 0), NEUME * 0.8, 9, 1 - k);
      return true;
    });
    // the song cast: the motif's neumes drawn together into the song's neume, then taken down into the bell's mark
    if (this.cast) {
      const c = this.cast, k = t - c.born, SN = songNeume(c.id), W = 30, cy0 = -32; // (in the swing's bowl: above the tape is the top of the view)
      const gather = ease(k / 0.45), shrink = ease((k - 0.8) / 0.5), sc2 = W * (1 - 0.85 * shrink), cy = cy0 + (11 - cy0) * shrink, fade = 1 - smooth((k - 1.15) / 0.2);
      const at = SN.heads.map((h, i) => { const it = c.items[i] || c.items[c.items.length - 1]; return [it.from[0] + (h.x * sc2 - it.from[0]) * gather, it.from[1] + (cy + h.y * sc2 - it.from[1]) * gather]; });
      const last = NOTE_RGB[SN.heads[SN.heads.length - 1].d - 1], lig = smooth((k - 0.3) / 0.35);
      for (let i = 1; i < at.length; i++) { const [x0, y0] = at[i - 1], [x1, y1] = at[i]; P.seg(x0, y0, x0 + (x1 - x0) * lig, y0 + (y1 - y0) * lig, last, 0.8 * fade * lift); }
      SN.heads.forEach((h, i) => { const it = c.items[i] || { high: false, on: true }; this.neume({ d: h.d, high: it.high, on: true }, at[i][0], at[i][1], NEUME * (1 - gather) + SN.s * sc2 * gather, 9, fade); });
      if (k > 1.0 && !this.taken) this.taken = t;
      if (k > 1.4) this.cast = null;
    }
    P.commit();

    // ---- the fever's peak: the smoke rings out once round the tape, two heads going out from the centre (in the world)
    this.ring.visible = this.ringT >= 0;
    if (this.ringT >= 0) {
      const k = (t - this.ringT) / 1.8, Q = this.ringPen; Q.reset();
      if (k >= 1 || k < 0) this.ringT = -1;
      else {
        const bf = Math.atan2(f.x, -f.z), phi = Math.PI * (1 - (1 - k) * (1 - k)), y = 0, hgt = 0.45 * (1 - k);
        this.ring.position.set(cam.position.x, C.tape.position.y, cam.position.z);
        for (const sd of [1, -1]) {
          const fade = (1 - k) * (1 - smooth((phi - 1.0) / 0.9)) * lift;
          for (let i = 0; i < 8; i++) { const b0 = bf + sd * (phi - 0.04 * (i + 1)), b1 = bf + sd * (phi - 0.04 * i); Q.seg(Math.sin(b0) * R, y, Math.sin(b1) * R, y, SMOKE_HOT, fade * (1 - i / 8), -Math.cos(b0) * R, -Math.cos(b1) * R); }
          const bh = bf + sd * phi; Q.seg(Math.sin(bh) * R, -hgt, Math.sin(bh) * R, hgt, SMOKE_HOT, fade, -Math.cos(bh) * R, -Math.cos(bh) * R);
        }
        Q.commit(); this.ring.material.uniforms.uAlpha.value = this.alpha * Math.min(1, con);
      }
    }
  }

  /** One neume at x, y (pixels), `s` its half-size: solid (outlines nested in) on the beat and brightening as it lands, hollow off
   *  it; an octave up, its line doubled outside. `age` in seconds since it was pressed, `k` its fade. */
  neume(m, x, y, s, age, k) {
    const N = NEUMES[m.d - 1], c = NOTE_RGB[m.d - 1], lift = Math.max(1, T.visual.compassContrast ?? 1);
    const land = m.on ? 1 + 0.7 * Math.exp(-Math.max(0, age) * 6) : 0.62;
    const kk = k * land * lift, P = this.pen;
    P.shape(N.pts, x, y, s, c, kk, 1, N.c);
    if (m.on) for (const g2 of [0.66, 0.33]) P.shape(N.pts, x, y, s, c, kk * 0.9, g2, N.c);
    if (m.high) P.shape(N.pts, x, y, s, c, kk * 0.85, 1 + 2.2 / Math.max(2, s), N.c);
  }

  /** What the eye can read off the pendulum now (for a test that plays by sight alone): the bob's angle, the notch it falls in, whether
   *  it is swinging toward an end. Radians; `amp` the arc's half-angle; `notch` where each end's notch begins; `centre` the Half Time
   *  notch's half-width (0 without it). */
  read() {
    const v = this.view; if (!v) return { shown: false };
    return { shown: v.shown && this.alpha > 0.5, t: v.t, angle: +v.th.toFixed(4), amp: AMP, notch: +v.notch.toFixed(4), centre: +v.centre.toFixed(4), inNotch: v.inNotch, towardEnd: v.towardEnd,
      own: v.own, half: v.half, down: +v.down.toFixed(3), side: v.side, motif: this.motif.map((m) => m.d), casting: this.cast?.id || null, falling: this.leaving.filter((m) => m.fall).length, notes: this.notes || 0, disagree: this.disagree || 0, casts: this.casts || 0 };
  }
}
