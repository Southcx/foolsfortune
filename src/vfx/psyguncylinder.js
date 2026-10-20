// ---------------------------------------------------------------------------------------
// THE PSYGUN'S CYLINDER (board v9, signed off by the owner 2026-10-18: "Flex on satisfying animation when it comes to cycling the
// chambers"; OVERLAY.md 10.5g, the mechanics 18): the psygun's only UI (its DOM shells row retired, 2026-10-18). A case-hardened steel
// cylinder in the overlay's own scene (render/overlayscene.js), bottom-right beside the Lachrimeter's tube, whose shape is its chamber count, each
// loaded chamber a glazed cap in its shell's colour, its depth a ring of pips, the chosen one ringed in labradorite under a brass pawl;
// tied to the tube's bulb by the spiritual link (vfx/spirituallink.js), a bead along it for every shot. The model and its plate are
// vfx/psyguncylindermodel.js; this is its life: every beat the mock times, a pure function of its time since the event that began it.
//   the draw / the stow   it grows whole and its ring lights / the light goes down; it shows only while the psygun is drawn
//   the turn              the wheel: a hair back, the swing, a 13% overshoot, the click at 92 ms; onto a hollow chamber a dead stop at 130
//   a flick               a digit far off: a detent every 85 ms, the last landing with the turn's spring
//   a shot                the chamber kicks and flares, the hammer falls in 12 ms and recocks, a pip goes dark
//   THE AUTO-TURN         a chamber's last shell: the hammer falls, the spent case flicks out with a glint, the recoil snaps the cylinder
//                         past any hollow bores (a tick each) to the next loaded one, the click at 94 ms, a 17% overshoot, its flare
//   the heart (LeMat)     the six sink, the heart's sleeve pushes out, the ring drops to it; out of it, the reverse
//   the dry click         the hammer on a hollow chamber: a shiver, a dull puff, the link slack; no bead
//   hung open / home      every chamber empty: the crane swings out and it hangs open while plain shots go on; a reload swings it home and spins it
//   the size rule         whole on every turn and on the draw, settling to its corner 1.2 real s after a beat ends (in 350 ms)
// The variants' own (OVERLAY.md 19, board v10): every turn at its psygun's pace (kinds.js `play.turn`: the click at 80 ms on THE PSYGUN,
// 92 the base, 250 the Carbine's; the same overshoot and spring, its time scaled); the Pentagun's points (`play.pentacleLit`) lit at their
// corners in their damage types' colours and the pentacle drawn through them on the fifth; the Pepperbox's both barrels (`psygun.barrels`):
// every loaded ring chamber flares, the blast throws the cylinder one whole turn (40 to 520 ms), each flaring as it passes the barrel.
// A tier IV under the hammer (the Caster's own) holds no reserve (shells.js holds the reserve, by fireCost): its ring is crazed, and a
// small vessel inset beside the plate glints the region `vesselDamage.tollRegion()` names (every region when it would shatter).
// It narrates nothing: the plate's words are labels in the System's type, the count its count.
//
// Prior art: the mock (scratchpad r9-cylinder: its BEATS, ported beat for beat, and its beat table for Wanda); the single-action's hand
// and pawl, turned by cocking the hammer (the auto-turn's drive); the LeMat's hammer nose (the heart, always chosen); the swing-out crane;
// Disney's anticipation, follow-through and overshoot; Overwatch's and Persona 5's cylinder menus; Destiny's ammo pips.
//
//   const C = new PsygunCylinder(game)   game.psygunCylinder   (main.js, after the tube and the link; it registers itself with
//   game.overlayScene and listens on the bus: psygun.turn, psygun.change, psygun.chamber, shell.fire, shell.dry, shot.fire)
//   C.state { shown, size, beat, gun, open }   (a probe's)   C.root (its slot's object)
//   It emits `psygun.cylinder` { kind: 'open' | 'home' } when it swings out hung open and when a reload swings it home (Wanda's beats
//   with no event of their own).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { buildCylinder, buildPentacle, posePentacle, layoutOf, drawPlate, drawInset, colourOf, CYL_T, F, K } from './psyguncylindermodel.js';
import { capacityOf } from '../tools/psygun/kinds.js';
import { fireCost, shellById } from '../progress/combat/castershells.js';
import { REGIONS } from '../courier/vessel/damage.js';
import { T } from '../core/config.js';
import { theme, THEMES } from '../ui/theme.js';

const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (v) => { v = cl(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u;
const eob = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const eioc = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// the beats' curves (the mock's): the wheel's step, a dead stop, the pawl, the hammer
const stepCurve = (t) => { const a = 0.05; if (t < a) return -0.07 * Math.sin((Math.PI / 2) * (t / a)); const u = t - a; return 1 - 1.07 * Math.exp(-u / 0.04) * Math.cos((TAU * u) / 0.17); };
const dryCurve = (t) => { const a = 0.04; if (t < a) return -0.04 * Math.sin((Math.PI / 2) * (t / a)); return 1 - 1.04 * Math.exp(-(t - a) / 0.032); };
function pawlCurve(t, tc, dead) { if (t < tc) return Math.sqrt(cl((t - 0.03) / (tc - 0.03))); const u = t - tc; if (u < 0.012) return 1 - u / 0.012; return dead ? 0 : 0.3 * Math.exp(-(u - 0.012) / 0.04) * Math.abs(Math.sin((TAU * (u - 0.012)) / 0.07)); }
const hamCurve = (t, back = 0.08, dur = 0.08) => (t < 0.012 ? t / 0.012 : t < back ? 1 : 1 - eob(cl((t - back) / dur)));
const BASE_CLICK = 0.0925; // (the turn's click on board v9: a variant's `play.turn` scales the turn's beats to its own)
const PACED = new Set(['turn', 'flick', 'heartIn', 'heartOut']);
const DUR = { barrels: 0.85, draw: 0.5, stow: 0.4, turn: 0.42, shot: 0.56, autoshot: 0.9, plain: 0.45, dry: 0.5, reload: 1.25, reloadOpen: 1.6, heartIn: 0.6, heartOut: 0.6 };
const SHOW = new Set(['draw', 'turn', 'flick', 'autoshot', 'reload', 'reloadOpen', 'heartIn', 'heartOut']); // (the whole cylinder shows on these)
const HOLD = 1.2, RISE = 0.12, SETTLE = 0.35; // (the size rule: real s)
// where it stands, in lines of the 480-line present from the bottom-right corner, left of the tube (its published width): corner and whole
const CLEAR = 18, TUBE_W = 2.9 * 32, PPU = { corner: 30, whole: 56 }, AT = { corner: [36, 44], whole: [74, 100] }, PLATE = { w: 110, h: 40, gap: 4, foot: 6 };
const PLAIN = { id: 'plain', name: 'PLAIN' };
const _v = new THREE.Vector3();

export class PsygunCylinder {
  constructor(game) {
    this.game = game; this.S = game.overlayScene;
    this.state = { shown: false, size: 0, beat: 'idle', gun: null, open: false };
    this.clock = 0; this.hold = -9; this.size = 0; this.vis = false; this.autoPending = false; this.beadAge = 9;
    this.beat = null; this.known = null; this.gunKey = '';
    if (!this.S) return;
    this.root = new THREE.Group(); this.root.name = 'psygunCylinder';
    this.holder = new THREE.Group(); this.root.add(this.holder);
    const quad = (w, h) => { const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: t, depthTest: false, depthWrite: false })); m.renderOrder = 10; m.frustumCulled = false; this.root.add(m); return { c, t, m, w, h }; };
    this.plate = quad(PLATE.w, PLATE.h); this.inset = quad(36, 52); this.inset.m.visible = false; this.plateKey = '';
    this.slot = this.S.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    this.rebuild();
    const on = (n, f) => game.events?.on(n, f);
    on('psygun.change', () => this.rebuild());
    on('psygun.chamber', () => this.rebuild());
    on('psygun.turn', (e) => this.onTurn(e));
    on('shell.fire', (e) => this.onShell(e));
    on('psygun.barrels', () => { if (this.vis && this.B) { this.begin('barrels', null, { ...this.known, counts: this.prevCounts || this.known.counts }, this.read()); this.hold = this.clock + this.beat.dur + HOLD; } }); // (the counts before the volley: every barrel fires in one frame)
    on('psygun.pentacle', () => { this.starT = 0; });
    on('shell.dry', () => { if (this.vis) { this.begin('dry', null, this.known); this.game.spiritualLink?.slack(); } });
    on('shot.fire', () => { if (!this.vis) return; this.bead(T.lachryma?.shotCost ?? 4, null); if (!this.beat || !['autoshot', 'reloadOpen'].includes(this.beat.type) || this.beat.t > 0.4) this.begin('plain', null, this.known); });
  }

  // ---------- the game's shells, read ----------
  get sh() { return this.game.shells; }
  read() { // (the state the game is in now, as the cylinder keeps it: the ring chamber under the hammer, the heart, the counts, open)
    const sh = this.sh, V = this.V, n = V.n, sel = sh.selected, heart = V.solo || (V.heart && sel === n);
    const counts = sh.types.map((t) => sh.counts[t.id] ?? 0);
    const open = !counts.some((c) => c > 0);
    return { sel: V.solo ? 0 : heart ? (sh.ringBefore ?? this.known?.sel ?? 0) : sel, heart: !!heart, counts, open, drawn: true };
  }
  rebuild() {
    const sh = this.sh; if (!sh?.gun || !this.S) return;
    const gun = sh.gun, ids = sh.types.map((t) => t.id), key = `${gun.id}:${ids.join(',')}`;
    if (key === this.gunKey && this.B) return; this.gunKey = key;
    if (this.B) { this.holder.remove(this.B.mount); this.B.dispose(); }
    this.V = layoutOf(gun); this.ids = ids; this.names = sh.types.map((t) => t.name);
    this.maxes = ids.map((id) => sh.max(id));
    const hi = this.V.heart ? (this.V.solo ? 0 : this.V.n) : -1;
    this.dbl = hi >= 0 && this.maxes[hi] > capacityOf(gun, ids[hi]);
    const env = this.game.lachrimeterTube?.env; this.themeId = theme.id;
    this.B = buildCylinder(this.V, ids, ids.map((id) => shellById(id)?.tier || 1), env, this.bandHex());
    this.holder.add(this.B.mount);
    if (gun.play?.pentacle && this.V.n === 5) buildPentacle(this.B);
    this.turnPace = BASE_CLICK / (gun.play?.turn ?? BASE_CLICK); this.starT = 9;
    this.known = this.read(); this.beat = null; this.state.gun = gun.id;
  }
  bandHex() { const t = THEMES[theme.id] || THEMES.verdigris; return parseInt(t.mid.slice(1), 16); }
  lab(i) { return i == null ? PLAIN : { id: this.ids[i], name: this.names[i] }; }
  selIdx(S) { return S.heart ? (this.V.solo ? 0 : this.V.n) : S.sel; }
  bead(amount, colour) { this.beadAge = 0; this.game.spiritualLink?.bead({ amount, colour }); }

  // ---------- the bus ----------
  onTurn(e) {
    if (!this.B) return;
    const was = this.known, now = this.read(), V = this.V, n = V.n;
    if (!this.vis || was.open) { this.known = now; return; }
    if (e.auto) { // THE FLEX: the chamber's last shell turns the cylinder on (the shot's own event follows)
      this.autoPending = true;
      const to = e.chamber, m = n ? (((to - was.sel) % n) + n) % n : 0;
      this.begin('autoshot', { mode: was.heart ? 'out' : 'snap', m, to }, was, now);
      this.bead(fireCost(this.ids[this.selIdx(was)]).lachryma || 4, colourOf(this.ids[this.selIdx(was)]));
      return;
    }
    const heartIdx = V.heart && !V.solo ? n : -1;
    if (e.chamber === heartIdx) return this.begin('heartIn', null, was, now);
    if (was.heart && !V.solo) return this.begin('heartOut', { to: e.chamber }, was, now);
    let d = n ? (((e.chamber - was.sel) % n) + n) % n : 0; if (d > n / 2) d -= n;
    if (Math.abs(d) === 1) this.begin('turn', d, was, now); else if (d) this.begin('flick', d, was, now); else this.known = now;
  }
  onShell(e) {
    if (!this.B) return;
    if (this.autoPending) { this.autoPending = false; return; } // (the auto-turn's own beat has the shot in it)
    const was = this.known, now = this.read();
    if (!this.vis) { this.known = now; return; }
    this.bead(fireCost(e.id).lachryma || 4, colourOf(e.id));
    const i = this.selIdx(was);
    if (now.counts[i] > 0 || now.counts[i] === was.counts[i]) return this.begin('shot', null, was, now); // (a lend never empties a chamber)
    // its last shell and no turn: the heart loaded and the corners empty, it rests on the hollow corner; nothing loaded, it hangs open
    const mode = now.open ? 'hang' : 'stay';
    this.begin('autoshot', { mode, m: 0, to: was.sel }, was, mode === 'hang' ? { ...now, heart: false } : now);
    if (mode === 'hang') this.game.events?.emit('psygun.cylinder', { kind: 'open' });
  }
  begin(type, arg, S, end = null) {
    this.beat = { type, arg, t: 0, S: { ...S, counts: [...S.counts] }, dur: type === 'flick' ? (Math.abs(arg) - 1) * 0.085 + 0.38 : DUR[type] };
    if (end) this.known = end;
    if (SHOW.has(type)) this.hold = this.clock + this.beat.dur + HOLD;
    this.state.beat = type;
  }

  // ---------- the poses (the mock's BEATS: each a pure function of its time) ----------
  base(S) {
    const V = this.V, N = V.n + (V.heart && !V.solo ? 1 : 0) + (V.solo ? 1 : 0), si = this.selIdx(S), Dl = V.n ? TAU / V.n : 0;
    const P = { theta: S.sel * Dl, jolt: 0, shiver: 0, sink: 0, push: 0, pawl: 0, ch: [], cnt: [], ring: { x: 0, y: V.d, s: V.rc, z: F + 0.04, glow: 1, grey: 0, on: S.drawn && !S.open },
      tdim: 1, puff: 0, hammer: 0, open: S.open ? 1 : 0, caseU: -1, caseP: [0, V.d, F], dbl: !!(S.heart && this.dbl),
      label: S.open ? { from: PLAIN, to: PLAIN, u: 1 } : { from: this.lab(si), to: this.lab(si), u: 1 }, count: S.open ? null : { from: S.counts[si], to: S.counts[si], u: 1 } };
    for (let i = 0; i < N; i++) { const c = S.counts[i] ?? 0; P.ch[i] = { seat: c > 0 ? 1 : 0, glow: c > 0 ? (S.drawn ? (i === si && !S.open ? 1 : 0.45) : 0.28) : 0, kick: 0, flash: 0 }; P.cnt[i] = { from: c, to: c, u: 1 }; }
    if (S.open) P.pawl = 1;
    if (S.heart && !V.solo) { P.sink = 1; P.push = 1; }
    if (S.heart) { P.ring.y = 0; P.ring.s = V.heart.rc; P.ring.z = F + 0.04 + (V.solo ? 0 : 0.22); P.caseP = [0, 0, P.ring.z]; }
    if (!(S.counts[si] > 0)) P.ring.grey = 1;
    return P;
  }
  pose(b) {
    const V = this.V, S = b.S, t = b.t, n = V.n, Dl = n ? TAU / n : 0, lab = (i) => this.lab(i);
    switch (b.type) {
      case 'draw': { const P = this.base({ ...S, drawn: true }), k = sm(t / 0.3); P.ch.forEach((c) => { c.glow = lerp(0.28 * c.seat, c.glow, k); }); P.ring.on = !S.open && t > 0.14;
        if (t > 0.14) { P.ring.s *= 1 + 0.3 * Math.exp(-(t - 0.14) / 0.07); P.ring.glow = 1 + 1.2 * Math.exp(-(t - 0.14) / 0.1); } return P; }
      case 'stow': { const P = this.base(S), k = sm(t / 0.3); P.ch.forEach((c) => { c.glow = lerp(c.glow, 0.28 * c.seat, k); }); P.ring.on = P.ring.on && t < 0.12; return P; }
      case 'turn': { const dir = b.arg, k = S.sel, j = (((k + dir) % n) + n) % n, dead = !(S.counts[j] > 0), P = this.base(S), tc = dead ? 0.13 : 0.0925;
        P.theta = (k + dir * (dead ? dryCurve(t) : stepCurve(t))) * Dl; P.pawl = pawlCurve(t, tc, dead);
        if (S.counts[k] > 0) P.ch[k].glow = lerp(1, 0.45, sm(t / 0.1));
        if (!dead) { P.ch[j].glow = lerp(0.45, 1, sm((t - 0.03) / (tc - 0.03))) + (t > tc ? 1.5 * Math.exp(-(t - tc) / 0.12) : 0); P.ch[j].flash = t > tc ? Math.exp(-(t - tc) / 0.1) : 0;
          if (t > tc) { P.ring.s = V.rc * (1 + 0.25 * Math.exp(-(t - tc) / 0.07)); P.ring.glow = 1 + 0.9 * Math.exp(-(t - tc) / 0.1); } }
        P.ring.grey = dead ? sm((t - tc) / 0.05) : !(S.counts[k] > 0) ? 1 - sm((t - tc) / 0.05) : 0; if (dead) P.ring.glow = lerp(1, 0.55, sm((t - tc) / 0.06));
        P.label = { from: lab(k), to: lab(j), u: sm((t - 0.02) / 0.22) }; P.count = { from: S.counts[k], to: S.counts[j], u: cl((t - 0.02) / 0.4) }; return P; }
      case 'flick': { const steps = Math.abs(b.arg), sg = Math.sign(b.arg), k = S.sel, h = 0.085, T1 = (steps - 1) * h, j = (((k + b.arg) % n) + n) % n, P = this.base(S), tc = T1 + 0.0425; let x;
        if (t < T1) { const xx = t / h; x = xx - (0.85 * Math.sin(TAU * xx)) / TAU; P.pawl = Math.pow(Math.abs(Math.sin(Math.PI * xx)), 0.6); }
        else { const u = t - T1; x = steps - 1 + (1 - Math.exp(-u / 0.04) * Math.cos((TAU * u) / 0.17)); P.pawl = pawlCurve(u, 0.0425, false); }
        const at = (m) => (((k + sg * m) % n) + n) % n;
        P.theta = (k + sg * x) * Dl; if (S.counts[k] > 0) P.ch[k].glow = lerp(1, 0.45, sm(t / 0.08));
        for (let m = 1; m < steps; m++) { const i = at(m); if (S.counts[i] > 0) P.ch[i].glow = 0.45 + 0.75 * Math.exp(-Math.pow((t / h - m) / 0.35, 2)); }
        if (S.counts[j] > 0) { P.ch[j].glow = lerp(0.45, 1, sm((t - T1 + 0.04) / 0.08)) + (t > tc ? 1.5 * Math.exp(-(t - tc) / 0.12) : 0); P.ch[j].flash = t > tc ? Math.exp(-(t - tc) / 0.1) : 0;
          if (t > tc) { P.ring.s = V.rc * (1 + 0.25 * Math.exp(-(t - tc) / 0.07)); P.ring.glow = 1 + 0.9 * Math.exp(-(t - tc) / 0.1); } } else P.ring.grey = sm((t - tc) / 0.05);
        const passing = at(Math.round(cl(x, 0, steps))), prev = at(steps - 1);
        P.label = t >= T1 ? { from: lab(prev), to: lab(j), u: sm((t - T1) / 0.2) } : { from: lab(passing), to: lab(passing), u: 1 };
        P.count = t >= T1 ? { from: S.counts[prev], to: S.counts[j], u: cl((t - T1) / 0.4) } : { from: S.counts[passing], to: S.counts[passing], u: 1 }; return P; }
      case 'shot': { const i = this.selIdx(S), c = S.counts[i], P = this.base(S), env = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.08), C = P.ch[i];
        C.kick = -0.16 * env; P.jolt = 0.06 * env; C.glow = 1 + 2.4 * Math.exp(-t / 0.07); C.flash = 1.6 * Math.exp(-t / 0.09); P.hammer = hamCurve(t);
        const to = this.known.counts[i]; P.cnt[i] = { from: c, to, u: cl(t / 0.25) }; P.count = { ...P.cnt[i] }; P.ring.s *= 1 + 0.1 * Math.exp(-t / 0.06);
        if (t > 0.1) C.glow += 0.6 * Math.exp(-(t - 0.1) / 0.1); return P; }
      case 'autoshot': return this.autoshot(b);
      case 'plain': { const P = this.base(this.known); P.hammer = hamCurve(t); P.jolt = 0.03 * (t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.08)); return P; }
      case 'dry': { const P = this.base(S); P.hammer = hamCurve(t, 0.15, 0.08); P.shiver = 0.02 * Math.sin((TAU * t) / 0.035) * Math.exp(-t / 0.06); P.puff = Math.exp(-t / 0.1); P.tdim = 1 - 0.75 * Math.exp(-t / 0.25);
        P.ring.grey = 1; P.ring.glow = 0.55 + 0.15 * Math.exp(-t / 0.05); return P; }
      case 'reload': { const k = S.sel, P = this.base(S), E = t < 0.8 ? 1 - Math.pow(1 - t / 0.8, 3) : 1, D = n ? Dl : TAU / 8, si = this.selIdx(S), N = P.ch.length, to = this.known.counts;
        P.theta = k * Dl + TAU * E + (t > 0.8 ? 0.5 * D * 0.16 * Math.exp(-(t - 0.8) / 0.06) * Math.sin((TAU * (t - 0.8)) / 0.14) : 0); P.pawl = n && t < 0.8 ? Math.pow(Math.abs(Math.sin(Math.PI * n * E)), 0.7) : 0;
        for (let i = 0; i < N; i++) { const heart = i >= n, m = heart ? 0 : ((((i - k) % n) + n) % n) || n, tm = heart ? 0.86 : 0.8 * (1 - Math.cbrt(1 - m / n)), c = S.counts[i], C = P.ch[i], base = i === si ? 1 : 0.45;
          if (to[i] > c) { C.seat = c > 0 ? 1 : sm((t - tm) / 0.12); C.glow = c > 0 ? (t < tm ? C.glow : base) : t < tm ? 0 : base; if (t > tm) { C.glow += 1.4 * Math.exp(-(t - tm) / 0.15); C.flash = 0.8 * Math.exp(-(t - tm) / 0.12); }
            P.cnt[i] = { from: c, to: to[i], u: cl((t - tm) / 0.4) }; if (i === si) { P.count = { ...P.cnt[i] }; if (t > tm) P.ring.grey = 1 - sm((t - tm) / 0.08); } }
          else C.glow += 0.35 * Math.exp(-Math.pow((t - tm) / 0.05, 2)); }
        return P; }
      case 'reloadOpen': { const Sf = this.known, P = this.base(S), si = this.selIdx(Sf), N = P.ch.length, D = n ? Dl : TAU / 8;
        for (let i = 0; i < N; i++) { const tm = 0.05 + 0.045 * i, C = P.ch[i], loads = Sf.counts[i] > 0; C.seat = loads ? sm((t - tm) / 0.1) : 0; C.glow = !loads || t < tm ? 0 : 0.45 + 1.4 * Math.exp(-(t - tm) / 0.15); C.flash = loads && t > tm ? 0.8 * Math.exp(-(t - tm) / 0.12) : 0; P.cnt[i] = { from: 0, to: Sf.counts[i], u: cl((t - tm) / 0.3) }; }
        const u = t - 0.42; P.open = u < 0 ? 1 : u < 0.16 ? 1 - Math.pow(u / 0.16, 2) : 0.035 * Math.exp(-(u - 0.16) / 0.03) * Math.abs(Math.sin((TAU * (u - 0.16)) / 0.08));
        const s0 = 0.46, s1 = 1.36, E = t < s0 ? 0 : t < s1 ? 1 - Math.pow(1 - (t - s0) / (s1 - s0), 3) : 1;
        P.theta = Sf.sel * Dl + TAU * E + (t > s1 ? 0.16 * D * Math.exp(-(t - s1) / 0.06) * Math.sin((TAU * (t - s1)) / 0.14) : 0);
        P.pawl = t < 0.58 ? 1 : t < s1 ? (n ? Math.pow(Math.abs(Math.sin(Math.PI * n * E)), 0.7) : 0) : pawlCurve(t - s1 + 0.0425, 0.0425, false);
        P.ring.on = t > s1 - 0.02; P.ring.grey = Sf.counts[si] > 0 ? 0 : 1;
        if (Sf.heart) { P.ring.y = 0; P.ring.s = V.heart.rc; P.ring.z = F + 0.04 + (V.solo ? 0 : 0.22); P.sink = P.push = V.solo ? 0 : 1; }
        if (t > s1) { P.ring.s *= 1 + 0.3 * Math.exp(-(t - s1) / 0.07); P.ring.glow = 1 + 1.2 * Math.exp(-(t - s1) / 0.1); for (let i = 0; i < N; i++) if (Sf.counts[i] > 0) P.ch[i].glow = Math.max(P.ch[i].glow, i === si ? 1 + 1.5 * Math.exp(-(t - s1) / 0.12) : 0.45); }
        P.dbl = !!(Sf.heart && this.dbl); P.label = { from: PLAIN, to: lab(si), u: sm((t - s1) / 0.2) }; P.count = t < s1 ? null : { from: 0, to: Sf.counts[si], u: cl((t - s1) / 0.35) }; return P; }
      case 'heartIn': { const P = this.base(S), k = S.sel, e = eioc(cl(t / 0.3)); P.sink = sm(t / 0.25); const u = t - 0.15; P.push = u < 0 ? 0 : 1 - Math.exp(-u / 0.05) * Math.cos((TAU * u) / 0.2);
        P.ring.y = V.d * (1 - e); P.ring.s = lerp(V.rc, V.heart.rc, e) * (t > 0.3 ? 1 + 0.22 * Math.exp(-(t - 0.3) / 0.07) : 1); P.ring.z = F + 0.04 + e * (0.42 * P.push - 0.2 * P.sink); P.ring.glow = t > 0.3 ? 1 + 0.9 * Math.exp(-(t - 0.3) / 0.1) : 1;
        if (S.counts[k] > 0) P.ch[k].glow = lerp(1, 0.45, sm(t / 0.15)); P.ch[n].glow = S.counts[n] > 0 ? lerp(0.45, 1, sm((t - 0.15) / 0.15)) + (t > 0.3 ? 1.5 * Math.exp(-(t - 0.3) / 0.12) : 0) : 0; P.ch[n].flash = t > 0.3 && S.counts[n] > 0 ? Math.exp(-(t - 0.3) / 0.1) : 0;
        P.ring.grey = !(S.counts[n] > 0) ? sm((t - 0.3) / 0.05) : !(S.counts[k] > 0) ? 1 - sm(t / 0.2) : 0; P.pawl = 0.6 * Math.sin(Math.PI * cl(t / 0.3)); P.dbl = t > 0.2 && this.dbl;
        P.label = { from: lab(k), to: lab(n), u: sm((t - 0.05) / 0.25) }; P.count = { from: S.counts[k], to: S.counts[n], u: cl((t - 0.05) / 0.4) }; return P; }
      case 'heartOut': return this.heartOut(S, t, b.arg.to, b.arg.to);
      case 'barrels': { // both barrels: every loaded ring chamber flares at the press; the blast throws the cylinder one whole turn, a tick a chamber
        const P = this.base(this.known), k0 = S.sel, E = t < 0.04 ? 0 : t < 0.52 ? 1 - Math.pow(1 - (t - 0.04) / 0.48, 3) : 1;
        P.theta = (k0 + n * E) * Dl + (t > 0.52 ? 0.16 * Dl * Math.exp(-(t - 0.52) / 0.06) * Math.sin((TAU * (t - 0.52)) / 0.14) : 0);
        P.pawl = t < 0.52 ? Math.pow(Math.abs(Math.sin(Math.PI * n * E)), 0.7) : pawlCurve(t - 0.52 + 0.0425, 0.0425, false);
        P.hammer = hamCurve(t, 0.04, 0.06); P.jolt = 0.09 * (t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.1));
        for (let i = 0; i < n; i++) { if (!(S.counts[i] > 0)) continue; const C = P.ch[i], pass = 0.04 + 0.48 * (1 - Math.cbrt(1 - ((((i - k0) % n) + n) % n || n) / n));
          C.flash = Math.max(1.4 * Math.exp(-t / 0.1), t > pass ? 0.9 * Math.exp(-(t - pass) / 0.1) : 0); C.glow = Math.max(C.glow, 1 + 2 * Math.exp(-t / 0.12)); C.kick = -0.14 * Math.exp(-t / 0.08); }
        return P; }
      default: return this.base(this.known);
    }
  }
  /** Out of the heart: the sleeve draws back, the six come forward and the ring rises to `to` (turning from the ring chamber left, past hollow corners). */
  heartOut(S, t, to) {
    const V = this.V, n = V.n, Dl = TAU / n, P = this.base({ ...S, sel: to }), k = to, e = eioc(cl(t / 0.3)), dead = !(S.counts[k] > 0), m = (((to - S.sel) % n) + n) % n;
    P.theta = (S.sel + (m > n / 2 ? m - n : m) * e) * Dl;
    P.sink = 1 - sm((t - 0.1) / 0.25); P.push = 1 - sm(t / 0.22);
    P.ring.y = V.d * e; P.ring.s = lerp(V.heart.rc, V.rc, e) * (t > 0.3 ? 1 + 0.22 * Math.exp(-(t - 0.3) / 0.07) : 1); P.ring.z = F + 0.04 + (1 - e) * (0.42 * P.push - 0.2 * P.sink);
    if (S.counts[n] > 0) P.ch[n].glow = lerp(1, 0.45, sm(t / 0.15));
    if (!dead) { P.ch[k].glow = lerp(0.45, 1, sm((t - 0.15) / 0.15)) + (t > 0.3 ? 1.5 * Math.exp(-(t - 0.3) / 0.12) : 0); P.ch[k].flash = t > 0.3 ? Math.exp(-(t - 0.3) / 0.1) : 0; P.ring.glow = t > 0.3 ? 1 + 0.9 * Math.exp(-(t - 0.3) / 0.1) : 1; }
    P.ring.grey = dead ? sm((t - 0.3) / 0.05) : 0; P.pawl = 0.6 * Math.sin(Math.PI * cl(t / 0.3)); P.dbl = t < 0.2 && this.dbl;
    P.label = { from: this.lab(n), to: this.lab(k), u: sm((t - 0.05) / 0.25) }; P.count = { from: S.counts[n], to: S.counts[k], u: cl((t - 0.05) / 0.4) };
    return P;
  }
  /** THE FLEX: a chamber's last shell. The hammer falls, the case flicks out, the hammer's recoil drives the cylinder round. */
  autoshot(b) {
    const V = this.V, S = b.S, t = b.t, n = V.n, Dl = n ? TAU / n : 0, i = this.selIdx(S), { mode, m, to } = b.arg, TM = 0.06, after = [...S.counts]; after[i] = Math.max(0, after[i] - 1);
    let P, tc;
    if (mode === 'snap') {
      const Ttr = 0.034 + 0.02 * (m - 1), u = t - TM; tc = TM + Ttr; P = this.base(S); let x;
      if (u < 0) x = 0; else if (u < Ttr) x = m * Math.pow(u / Ttr, 1.35); else { const w = u - Ttr; x = m + 0.17 * Math.exp(-w / 0.035) * Math.sin((TAU * w) / 0.11); }
      P.theta = (S.sel + x) * Dl; P.pawl = t < TM ? 0 : t < tc ? 0.55 + 0.45 * Math.abs(Math.cos(Math.PI * x)) : pawlCurve(t, tc, false);
      for (let q = 1; q < m; q++) P.ch[(S.sel + q) % n].glow = 0; // (the hollow bores passed stay dark)
      P.ch[to].glow = t < tc ? 0.45 : 1 + 1.9 * Math.exp(-(t - tc) / 0.12); P.ch[to].flash = t > tc ? 1.3 * Math.exp(-(t - tc) / 0.1) : 0;
      if (t > tc) { P.ring.s = V.rc * (1 + 0.34 * Math.exp(-(t - tc) / 0.07)); P.ring.glow = 1 + 1.5 * Math.exp(-(t - tc) / 0.1); P.jolt += 0.025 * Math.exp(-(t - tc) / 0.03); }
      P.ring.grey = t < tc ? 0.5 * sm((t - 0.03) / 0.03) : 0;
      P.label = { from: this.lab(i), to: this.lab(to), u: sm((t - tc) / 0.18) }; P.count = t < tc ? { from: 1, to: 0, u: cl(t / 0.06) } : { from: 0, to: after[to], u: cl((t - tc) / 0.3) };
    } else if (mode === 'out') {
      const sp = 1.7, tt = Math.max(0, (t - TM) * sp); tc = TM + 0.3 / sp;
      P = this.heartOut({ ...S, counts: after }, tt, to);
      P.dbl = t < tc && this.dbl; P.count = t < tc ? { from: 1, to: 0, u: cl(t / 0.06) } : { from: 0, to: after[to], u: cl((t - tc) / 0.3) };
      if (t > tc) P.jolt += 0.025 * Math.exp(-(t - tc) / 0.03);
    } else if (mode === 'stay') {
      P = this.base({ ...S, counts: after }); P.ring.grey = sm((t - 0.06) / 0.05); P.ring.glow = lerp(1, 0.55, sm((t - 0.06) / 0.06)); P.count = t < 0.06 ? { from: 1, to: 0, u: cl(t / 0.06) } : { from: 0, to: 0, u: 1 };
    } else { // hung open
      P = this.base({ ...S, counts: after }); P.ch.forEach((c) => { c.glow = 0; }); const u = t - 0.1; P.open = u < 0 ? 0 : u < 0.24 ? eob(u / 0.24) : 1;
      if (S.heart && !V.solo) P.sink = P.push = u < 0 ? 1 : 1 - sm(u / 0.15);
      P.ring.on = t < 0.16; P.ring.glow = lerp(1, 0, sm(t / 0.15)); P.ring.grey = sm(t / 0.08); P.pawl = t < 0.08 ? 0 : sm((t - 0.08) / 0.06);
      P.label = { from: this.lab(i), to: PLAIN, u: sm((t - 0.3) / 0.18) }; P.count = t < 0.34 ? { from: 1, to: 0, u: cl(t / 0.06) } : null; P.dbl = false;
    }
    // the shot itself, on top, at the press
    const C = P.ch[i], env = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.08);
    C.kick = -0.16 * env; P.jolt += 0.06 * env; C.flash = Math.max(C.flash, 1.6 * Math.exp(-t / 0.09)); C.glow = t < 0.03 ? 1 + 2.4 * Math.exp(-t / 0.07) : 0; C.seat = t < 0.03 ? 1 : 0;
    P.cnt[i] = { from: 1, to: 0, u: cl(t / 0.12) }; P.hammer = hamCurve(t, 0.045, 0.045); P.caseU = cl((t - 0.02) / 0.42);
    P.caseP = S.heart ? [0, 0, F + 0.04 + (V.solo ? 0 : 0.22)] : [0, V.d, F];
    return P;
  }

  // ---------- the pose onto the model (the mock's apply) ----------
  apply(P) {
    const B = this.B, V = this.V;
    B.spin.rotation.z = P.theta; B.mount.rotation.set(B.rx + P.jolt, B.ry, P.shiver); B.spin.position.z = -P.sink * 0.2; B.pawl.rotation.z = P.pawl * 0.6;
    B.crane.rotation.z = 0.55 * P.open; B.tilt.rotation.set(-0.12 * P.open, 0.42 * P.open, 0);
    B.hammer.rotation.z = lerp(0.5, -1.15, P.hammer);
    if (B.heartG) B.heartG.position.z = V.solo ? 0 : P.push * 0.42;
    B.ch.forEach((c, i) => {
      const p = P.ch[i], q = P.cnt[i]; if (!p) return;
      c.g.visible = p.seat > 0.02; c.g.position.z = F - 0.035 + (1 - p.seat) * -0.34 + p.kick; const g = p.glow * (0.25 + 0.75 * p.seat);
      c.cap.material.uniforms.uCyGlow.value = g; c.ring.material.uniforms.uCyGlow.value = Math.min(g, 2.2);
      c.fl.material.uniforms.uCyA.value = cl(p.flash * 0.75 + Math.max(0, g - 1.1) * 0.35); c.fl.scale.setScalar(c.rc * (2.6 + 1.6 * p.flash));
      const du = c.depth.material.uniforms; du.uCyCount.value = lerp(q.from, q.to, sm(q.u * 1.6)); du.uCyMax.value = this.maxes[i] || 1; du.uCyGlow.value = Math.max(0.35, Math.min(p.glow, 1.6));
      c.mouth.visible = !c.g.visible;
    });
    const R = P.ring, su = B.sel.material.uniforms; B.sel.visible = R.on !== false; B.sel.position.set(R.x, R.y, R.z); B.sel.scale.setScalar(R.s * 1.1); su.uCyGlow.value = R.glow; su.uCyGrey.value = R.grey;
    const bulb = Math.exp(-this.beadAge / 0.15); B.slit.material.uniforms.uCyGlow.value = 0.5 + 0.5 * P.tdim + 0.8 * bulb;
    B.puff.material.uniforms.uCyA.value = 0.4 * P.puff; B.puff.scale.setScalar(V.rc * (1.1 + 0.9 * (1 - P.puff)) * 2); B.puff.position.set(R.x, R.y + (1 - P.puff) * 0.08, R.z + 0.05);
    const u = P.caseU; B.case.visible = u > 0 && u < 1; B.glint.material.uniforms.uCyA.value = 0;
    if (B.case.visible) {
      const [x0, y0, z0] = P.caseP; B.case.position.set(x0 + 1.0 * u, y0 + 0.75 * u - 1.5 * u * u, z0 + 0.25 + 0.6 * u); B.case.rotation.set(Math.PI / 2 + u * 7, 0, u * 4.5); B.caseMat.opacity = 1 - sm((u - 0.6) / 0.4);
      B.glint.position.copy(B.case.position); B.glint.position.z += 0.12; B.glint.scale.setScalar(0.44 + 0.4 * Math.abs(Math.sin(u * 18))); B.glint.material.uniforms.uCyA.value = (1 - u) * 0.9 * Math.abs(Math.sin(u * 14));
    }
  }

  // ---------- each frame it may be drawn ----------
  update(dt, slot) {
    const g = this.game, root = this.root;
    this.clock += dt; this.beadAge += dt; CYL_T.value = this.clock % 3600;
    if (!this.B) this.rebuild();
    const tool = g.belt?.get?.('psygun'), drawn = !!this.B && (tool ? tool.drawT > 0.5 && (g.belt.isWorn?.('psygun') ?? true) : !!g.weapon?.drawn);
    const allowed = !!this.B && !g.title?.active && !g.god?.controlling && !document.body.classList.contains('bztable-seated');
    if (drawn && allowed && !this.vis) { this.known = this.read(); this.begin('draw', null, { ...this.known, drawn: false }, this.known); this.vis = true; g.spiritualLink?.attach(this, (out) => this.eyeAt(out)); }
    else if (this.vis && !drawn && this.beat?.type !== 'stow') this.begin('stow', null, this.known, { ...this.known, drawn: false });
    else if (this.vis && drawn && this.beat?.type === 'stow') this.begin('draw', null, this.known, { ...this.known, drawn: true }); // (drawn again mid-stow)
    if (this.vis && (!allowed || (!drawn && this.beat?.type === 'stow' && this.beat.t >= this.beat.dur))) { this.vis = false; this.beat = null; g.spiritualLink?.detach(this); }
    if (!this.vis) { root.userData.overlayHidden = true; this.state.shown = false; if (this.B) this.known = { ...this.read(), drawn: false }; this.size = 0; return; }
    root.userData.overlayHidden = false; this.state.shown = true;
    // a reload: counts risen (the level's refill); hung open, it swings home with a spin
    const now = this.read(), was = this.known; this.prevCounts = now.counts; // (as they stand before this frame's shots: both barrels' flares)
    if (now.counts.some((c, i) => c > (was.counts[i] ?? 0)) && this.beat?.type !== 'draw') {
      if (was.open) g.events?.emit('psygun.cylinder', { kind: 'home' });
      this.begin(was.open ? 'reloadOpen' : 'reload', null, was, { ...now, heart: was.open ? !!this.V.solo : now.heart });
    } else if (now.counts.some((c, i) => c < (was.counts[i] ?? 0)) && !(this.beat && this.beat.t < this.beat.dur)) this.known = now; // (spent elsewhere: kept as it is)
    if (theme.id !== this.themeId) { this.themeId = theme.id; this.B.band.color.setHex(this.bandHex()); }
    // the beat and its pose
    const b = this.beat; if (b) { b.t += dt * (PACED.has(b.type) ? this.turnPace || 1 : 1); if (b.t >= b.dur && b.type !== 'stow') this.beat = null; } // (a turn at its psygun's pace)
    const P = this.beat ? this.pose(this.beat) : this.base(this.known);
    this.apply(P); this.state.beat = this.beat?.type || 'idle'; this.state.open = !!this.known.open;
    if (this.B.pent) this.pentacle(dt);
    // the size rule: whole while a beat that shows it runs and 1.2 real s after, settled to the corner over 350 ms
    this.size = this.clock < this.hold ? Math.min(1, this.size + dt / RISE) : Math.max(0, this.size - dt / SETTLE); this.state.size = this.size;
    const e = sm(this.size), H = slot.view.h || innerHeight, W = slot.view.w || innerWidth, lp = H / 480;
    const R0 = (this.game.lachrimeterTube?.pubW || TUBE_W * lp + 12) + CLEAR; // (the tube's published width, CSS px)
    const cx = R0 + lerp(AT.corner[0], AT.whole[0], e) * lp, cy = lerp(AT.corner[1], AT.whole[1], e) * lp;
    slot.x = 0; slot.y = 0; root.position.set(W, -H, 0);
    this.holder.position.set(-cx, cy, 0); this.holder.scale.setScalar(lerp(PPU.corner, PPU.whole, e) * lp);
    // the plate, left of the cylinder at its corner size, on the corner's foot; the vessel inset over its left end
    const px = R0 + (AT.corner[0] + 34 + PLATE.gap) * lp, pl = this.plate;
    pl.m.position.set(-(px + (PLATE.w / 2) * lp), (PLATE.foot + PLATE.h / 2) * lp, 200); pl.m.scale.set(PLATE.w * lp, PLATE.h * lp, 1);
    this.drawPlate(P);
    this.drawInset(P, px, lp);
    root.updateMatrixWorld(true);
  }
  drawPlate(P) {
    const L = P.label, c = P.count, anim = L.u < 1 || (c && c.u < 1), key = `${L.from.id}>${L.to.id}:${c ? `${c.from}>${c.to}` : '-'}:${P.dbl}:${this.themeId}`;
    if (!anim && key === this.plateKey) return; this.plateKey = anim ? '' : key;
    drawPlate(this.plate.c, P, this.clock); this.plate.t.needsUpdate = true;
  }
  /** While the Caster's own is under the hammer: the vessel inset, the region the toll would crack glinting (all when it would shatter). */
  drawInset(P, px, lp) {
    const g = this.game, S = this.known, i = this.selIdx(S), id = this.ids[i], ins = this.inset;
    const armed = !S.open && S.counts[i] > 0 && (shellById(id)?.tier || 1) >= 4 && !!g.vesselDamage;
    ins.m.visible = armed; if (!armed) { this.insetKey = ''; return; }
    const tr = g.vesselDamage.tollRegion?.() || { region: null, shatter: false }, lit = tr.shatter ? REGIONS.map((_, k) => k) : tr.region ? [REGIONS.indexOf(tr.region)] : [];
    const crack = Array.from(g.vesselDamage.crack || []), key = `${lit.join('')}|${crack.join('')}|${Math.floor(this.clock * (lit.length ? 30 : 4))}`; // (the glint pulses at 30 a real s; unlit, only the frame's slow film turns)
    if (key !== this.insetKey) { this.insetKey = key; drawInset(ins.c, lit, crack, 1, this.clock); ins.t.needsUpdate = true; }
    ins.m.position.set(-(px + (PLATE.w - 18) * lp), (PLATE.foot + PLATE.h + PLATE.gap + 26) * lp, 200); ins.m.scale.set(36 * lp, 52 * lp, 1);
  }
  /** The Pentagun's points: a chamber fired in the window lights its corner (60 ms up); the fifth draws the star (five strokes, 70 ms
   *  each), the circle closes (150 ms), all five flare, held 1.2 s and gone in 0.4. */
  pentacle(dt) {
    const lit = this.game.weapon?.play?.pentacleLit || [], st = (this.starT += dt), L = (this.pentGlow ||= [0, 0, 0, 0, 0]);
    for (let k = 0; k < 5; k++) { const want = lit.includes(k) ? 1 : 0; L[k] = want > L[k] ? Math.min(1, L[k] + dt / 0.06) : Math.max(0, L[k] - dt / 0.3); }
    const drawn = st < 2, fade = 1 - sm((st - 1.6) / 0.4);
    const show = L.map((l) => (drawn ? Math.max(l, (1 + 1.2 * Math.exp(-Math.max(0, st - 0.35) / 0.2)) * fade) : l));
    posePentacle(this.B.pent, show, drawn ? cl(st / 0.35) : 0, drawn ? cl((st - 0.35) / 0.15) : 0, drawn ? fade : 0);
    if (st < 0.6) this.hold = Math.max(this.hold, this.clock + HOLD); // (the cylinder grows whole for it)
  }
  /** The strap's brass eye in the overlay scene's coordinates (the link's far end), or null while hidden. */
  eyeAt(out) { if (!this.vis || !this.B) return null; this.B.eye.getWorldPosition(_v); return out.copy(_v); }
}
