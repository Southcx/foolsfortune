// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD (OVERLAY.md 10.5g; board v9, signed off by the owner 2026-10-18: "go ahead with the ingame implementation of the
// Psygun and Sondelass UI as outlined in v9"). The Sondelass's own UI, one made object in the overlay's own scene (render/overlayscene.js)
// at the 480-line present, bottom-right beside the thermometer Lachrimeter where the psygun's cylinder stands when the psygun is drawn:
// a tsuba of brass and the window colour's glaze, and out of it the form in the hands.
//   THE GUARD     three openwork windows (a blade slit, a ring of beads, a hook claw) turning with it; the form in hand's window comes
//                 round to where the spiritual link comes in and fills with the film
//   A CHANGE      0.55 real s (the mock's beats): the form slides back into the guard (0 to 0.165), the guard turns a third (to 0.275),
//                 the new form telescopes out and overshoots (to 0.55), and a glint runs the rim once (to 0.80); the plate's word rolls
//   THE CUTLASS   a broad, strongly curved sabre (the owner's one note: "wider and curved like a sabre or cutlass, rather than too
//                 katana-coded"), its knuckle bow out of the guard; the melee loadout's string as notches on its temper line, each
//                 notch's shape what the blow does (stagger, knock, launch, guard break), the next gold, a struck blow's light running
//                 notch to notch; the paid cut's window as the oil film on the edge, a glint running it; the pause string a second line
//   THE ROD       four lacquered sections; the ring of the seven round the lure in display order, a feeling not yet awakened a dark
//                 seat passed over with a shiver; out of the water the wheel turns it, in the water MMB held past 0.2 s opens it (the
//                 beads fan wider, the pawl lifts); the sounding a ripple in the feeling's colour, echoes as pointers at each lit fish's
//                 bearing from the view (2 s, direction only), the hoop re-inking clockwise over the 3 real s cooldown, a glint and a tick
//   THE HOOK      the grapnel on its forged shaft and a reach ruler as long as the hook's reach; the marker where the aim would bite,
//                 a catch's brackets closing on it; the throw down one straight keylined rope, the bite's flash, the reel's drum
//   THE PLATE     CUTLASS, ROD or HOOK in Cinzel; in the rod form the lure's feeling in its colour (sondelassguard/plate.js)
// Every spend sends a bead down the spiritual link (vfx/spirituallink.js), which this claims while it stands, its end at the lit
// window (in the rod form, the pawl): a paid cut, a sounding, a hook's throw, the reeling. The sounding's cost is held on the tube as
// its reserve by the angler itself (angler.js: tube.reserve('sounding', 5)), so the column's top shows it while MMB is down.
// It is the Sondelass's only UI: the old tool strip (the forms, the lure, the aspects) and the cutlass's string row were retired, not
// hidden (the owner, 2026-10-18). Keys stay bound and unmarked (OVERLAY.md 18): the forms' 1 2 3 (sondelass.js), the lure's - = and the
// aspects' 4 to 0 (angling/angler.js). It reads, never drives: the belt, the form, the moveset's string and place and paid cut, the
// angler, the hookshot.
//
// Prior art, as on a museum label: the mock (Calissa's board v9, r9-sondelass); the tsuba and its sukashi windows; the cutlass and
// the naval sabre's broad curved blade and knuckle bow; the tenkara rod; a ship's grapnel and capstan; Monster Hunter's switch axe and
// Bloodborne's trick weapons (one weapon, the change itself a flourish); a combination lock's dial and a revolver's detent (the ring);
// the PPI sonar scope (the ping and its echoes); God Hand's Combo Tree and Devil May Cry's pause combos (the notches); Guilty Gear's
// Roman Cancel flash (the paid cut); Dead Space's RIG and Metroid Prime's visor (the interface as a lit object).
//
//   game.sondelassGuard = new SondelassGuard(game)   (main.js, after the tube and the link; it updates itself in the overlay's scene)
//   .state -> { shown, form, morph, string: { n, lit, next, cutOpen, branch }, ring: { sel, open, cool, echoes }, hook: { d, kind, out } }
//   .standing (a Sondelass form is in the hands)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHOWN, aspectKnown } from '../tools/sondelass/angling/species.js';
import { lureList, BARE } from '../tools/sondelass/angling/lures.js';
import { COLOR } from '../progress/weather.js';
import { THEMES, theme } from '../ui/theme.js';
import { guardAtlas, FEELINGS, EFFECTS } from './sondelassguard/atlas.js';
import { QuadBatch } from './sondelassguard/batch.js';
import { buildForms, BLADE } from './sondelassguard/forms.js';
import { wearSkin } from './toolskinwear.js';
import { GuardPlate, GuardCount } from './sondelassguard/plate.js';
import { drawGuard, drawRing, drawRod, drawBlade, drawHook, film, rgbOf, pawlR, R0U, DPM } from './sondelassguard/marks.js';

const TAU = Math.PI * 2, D = Math.PI / 180, MT = 0.55;
const FORMS = ['cutlass', 'rod', 'hook'], FROT = { cutlass: 0, rod: TAU / 3, hook: (2 * TAU) / 3 }, NAME = { cutlass: 'CUTLASS', rod: 'ROD', hook: 'HOOK' };
const ANG = { cutlass: 97 * D, rod: 115 * D, hook: 115 * D }; // (y up: the blade nearly upright beside the Lachrimeter, the rod and the hook leaning out)
const CLEAR = 18, AT = [143, 88]; // (CSS px from the right edge, as the tube's; then the guard's heart in dots: left of it, and up from the bottom)
const ROD_L = [26, 25, 24, 23], HOOK_L = [20, 18];
const PING_LIGHT = 2.4; // (real s a sounding's wave is watched for the fish it lights: angler.js PING_LIFE, and a little)
const C01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sm = (t) => { t = C01(t); return t * t * (3 - 2 * t); };
const oB = (t, s = 1.70158) => { t = C01(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const lerp = (a, b, t) => a + (b - a) * t;
/** What a blow does to a body, for its notch's shape: its catalogue row's effect, else a knock if it throws (push 6 m/s or more), as the melee loadout's catalogue says it. */
const effOf = (M, id) => { const row = M.catalogueRow(id); return row?.effect || ((M.def(id)?.hit?.push ?? 0) >= 6 ? 'knock' : 'stagger'); };
const LURE_SHAPE = { bob: 'ball', eye: 'ball', bell: 'ball', fly: 'star', spoon: 'spoon', tear: 'tear' };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _fw = new THREE.Vector3(), _film = [0, 0, 0];

export class SondelassGuard {
  constructor(game) {
    this.game = game; this.S0 = game.overlayScene;
    this.t = 0; this.a = 0; this.shown = false; this.standing = false; this.anchor = -20 * D;
    this.form = null; this.morph = null; this.clickT = 9;
    this.S = { ext: { cutlass: 0, rod: 0, hook: 0 }, rot: 0, ring: 0, drum: 0, flare: 0, click: -1, a: 'CUTLASS', b: 'CUTLASS', p: 1 };
    this.B = { n: 0, eff: [], lit: 0, next: -1, hitAge: 9, runP: 1, cool: 0, cooling: false, cutOpen: false, payAge: 9, branch: null, br: { at: 0, n: 0, eff: [], g: 0, st: 0, next: -1, hitAge: 9, runP: 1 }, seen: 0 };
    this.R = { selF: 0, from: 0, to: -1, moveT: 9, open: 0, cool: 1, readyAge: 9, pAge: -1, echoes: Array.from({ length: 8 }, () => ({ at: 0, b: 0, f: null })), echoN: 0, soundId: -1, flash: 0,
      known: [false, false, false, false, false, false, false], lure: [1, 1, 1], lureFrom: [1, 1, 1], lureNow: [1, 1, 1], lureKind: 'ball', water: 0, depth: 0, splash: -1, wasWater: false, shakeI: -1, shakeAmp: 0, fill: 1 };
    this.H = { range: 40, d: 0, kind: 'anchor', out: false, low: false, closeP: 0, um: R0U, gU: 0, fly: -1, bit: false, biteAge: 9, pot: false, reel: false, spin: 0, reseat: 9, wasAtt: false, flyT: 9, reelT: 0 };
    this.F = { rodTip: null, hookTip: 0 };
    this.beadQ = []; // (spends waiting for the link to show: { amount, colour, age })
    this.state = { shown: false, form: null, morph: false, string: null, ring: null, hook: null };
    this.endFn = (out) => this.linkEnd(out);
    if (!this.S0) return;
    this.build();
    this.slot = this.S0.add(this.root, { anchor: 'br', x: 0, y: 0, z: 0, hud: true, update: (dt, slot) => this.update(dt, slot) });
    const ev = game.events;
    ev?.on('move.cut', (e) => { if (e.paid && e.tool === 'sondelass' && this.shown) { this.B.payAge = 0; this.spend(e.cost || 5); } });
    ev?.on('angle.sound', () => this.sounded());
    ev?.on('hook.fire', () => { if (!this.shown) return; this.H.flyT = 0; this.spend(2); });
    document.fonts?.addEventListener?.('loadingdone', () => { this.plateKey = ''; this.countKey = ''; });
  }

  build() {
    const A = guardAtlas(), cell = A.cell;
    this.C = { bead: FEELINGS.map((f) => cell(`bead.${f}`)), beadLine: FEELINGS.map((f) => cell(`beadLine.${f}`)), seat: cell('seat'),
      notch: Object.fromEntries(EFFECTS.map((e) => [e, cell(`notch.${e}`)])), notchFill: Object.fromEntries(EFFECTS.map((e) => [e, cell(`notchFill.${e}`)])),
      win: [0, 1, 2].map((j) => cell(`win.${j}`)), winFill: [0, 1, 2].map((j) => cell(`winFill.${j}`)),
      lure: { ball: cell('lure.ball'), star: cell('lure.star'), spoon: cell('lure.spoon'), tear: cell('lure.tear') },
      pawl: cell('pawl'), echo: cell('echo'), dot: cell('dot'), disc: cell('disc'), star: cell('star'), pot: cell('pot') };
    const root = (this.root = new THREE.Group()); root.name = 'sondelassGuard'; root.userData.overlayHidden = true;
    this.themeId = theme.id;
    this.forms = buildForms(THEMES[theme.id] || THEMES.verdigris); root.add(this.forms.root);
    wearSkin('sondelass', this.forms.skin, { kind: 'sg' }); // (the Sondelass's skin on its guard's forms: their colour and metal)
    this.b = { under: new QuadBatch(A.tex, 64, { additive: true, order: 2 }), marks: new QuadBatch(A.tex, 900, { order: 10 }), over: new QuadBatch(A.tex, 500, { additive: true, order: 12 }) };
    root.add(this.b.under.mesh, this.b.marks.mesh, this.b.over.mesh);
    this.plate = new GuardPlate(); root.add(this.plate.mesh); this.plateKey = '';
    this.count = new GuardCount(); root.add(this.count.mesh); this.countKey = '';
    this.X = { b: this.b, C: this.C, t: 0, anchor: 0, ang: 0, ca: 1, sa: 0, S: this.S, R: this.R, B: this.B, H: this.H, F: this.F, shf: 0, sb: 0 };
  }

  /** The Sondelass, drawn and in the hands as the belt says, or null. */
  tool() {
    const g = this.game, tool = g.techs?.get?.('sondelass');
    if (!tool || g.belt?.inHand?.id !== 'sondelass' || tool.drawT <= 0.02 || tool.drawTarget <= 0 || g.god?.controlling) return null;
    return tool;
  }

  /** A spend: a bead down the link (held a moment while the tube rises to meet it). */
  spend(amount, colour = null) { if (this.beadQ.length < 4) this.beadQ.push({ amount, colour, age: 0 }); }

  /** The link's far end: the lit window (in the rod form, the pawl), in the overlay scene's coordinates. */
  linkEnd(out) {
    if (!this.shown) return null;
    const S = this.S, r = lerp(15, pawlR(S, this.R) + 3.4, sm(S.ring)), k = this.root.scale.x;
    return out.set(this.root.position.x + Math.cos(this.anchor) * r * k, this.root.position.y + Math.sin(this.anchor) * r * k, 0);
  }

  // ---------------------------------------------------------------- each frame it may be drawn
  update(dt, slot) {
    const g = this.game, root = this.root, B = document.body.classList, tool = this.tool();
    const standing = (this.standing = !!tool);
    const allowed = standing && !g.title?.active && !g.emocean?.stage?.active && !B.contains('cine') && !B.contains('bztable-seated');
    this.a = C01(this.a + (allowed ? dt / 0.22 : -dt / 0.16));
    if (!allowed && this.a <= 0) return this.hide();
    this.t += dt; this.X.t = this.t;
    if (!this.shown) { this.shown = true; root.userData.overlayHidden = false; this.game.spiritualLink?.attach(this, this.endFn); }
    // where it stands: CLEAR px from the right edge, AT dots in; one dot a line of the 480-line present
    const dot = (slot.view.h || innerHeight) / 480;
    slot.x = -(CLEAR + AT[0] * dot); slot.y = -AT[1] * dot;
    root.position.set(slot.view.w + slot.x, -(slot.view.h + slot.y), slot.z);
    root.scale.setScalar(dot * (allowed ? 0.55 + 0.45 * oB(this.a, 2.2) : 0.55 + 0.45 * this.a));
    const bulb = g.lachrimeterTube?.bulbAt?.(this.bulb || (this.bulb = {}));
    if (bulb) this.anchor = Math.atan2(bulb.y - root.position.y, bulb.x - root.position.x);
    if (tool) { this.readForm(dt, tool); this.readBlade(dt, tool); this.readRing(dt, tool); this.readHook(dt, tool); }
    if (theme.id !== this.themeId) { this.themeId = theme.id; this.forms.glaze(THEMES[theme.id] || THEMES.verdigris); this.plateKey = ''; }
    this.place();
    this.marks();
    this.words();
    this.link(dt);
  }

  hide() {
    if (!this.shown) return;
    this.shown = false; this.root.userData.overlayHidden = true; this.form = null; this.morph = null; this.beadQ.length = 0;
    this.game.spiritualLink?.detach(this);
    this.state.shown = false;
  }

  // ---------------------------------------------------------------- the form and its change
  readForm(dt, tool) {
    const S = this.S, want = FORMS.includes(tool.form) ? tool.form : 'cutlass';
    if (this.form == null) { this.form = want; this.morph = null; this.clickT = 9; }
    if (!this.morph && want !== this.form) this.morph = { a: this.form, b: want, t: 0 };
    this.clickT += dt;
    if (this.morph) { const m = this.morph; m.t += dt; if (m.t >= MT) { this.form = m.b; this.morph = null; this.clickT = 0; } }
    const m = this.morph;
    if (!m) {
      const f = this.form; S.ext.cutlass = +(f === 'cutlass'); S.ext.rod = +(f === 'rod'); S.ext.hook = +(f === 'hook');
      S.rot = FROT[f]; S.ring = +(f === 'rod'); S.drum = S.flare = +(f === 'hook');
      S.a = S.b = NAME[f]; S.p = 1; S.click = this.clickT < 0.25 ? this.clickT : -1; this.ang = ANG[f];
    } else { // (the mock's morphS: retract to 0.3 of the change, turn to 0.5, extend with an overshoot)
      const p = m.t / MT, pa = C01(p / 0.3), pb = C01((p - 0.3) / 0.2), pc = C01((p - 0.5) / 0.5);
      for (const f of FORMS) S.ext[f] = 0;
      S.ext[m.a] = 1 - sm(pa); if (pc > 0) S.ext[m.b] = oB(pc, 2.0);
      let d = (((FROT[m.b] - FROT[m.a]) % TAU) + TAU) % TAU; if (d > Math.PI) d -= TAU;
      S.rot = FROT[m.a] + d * oB(pb, 1.6);
      const fade = (f) => (f === m.a ? 1 - sm(pa) : f === m.b ? sm(pc) : 0);
      S.ring = fade('rod'); S.drum = S.flare = fade('hook');
      S.a = NAME[m.a]; S.b = NAME[m.b]; S.p = sm((p - 0.3) / 0.3); S.click = -1;
      this.ang = lerp(ANG[m.a], ANG[m.b], sm(p));
    }
    this.X.ang = this.ang; this.X.ca = Math.cos(this.ang); this.X.sa = Math.sin(this.ang); this.X.anchor = this.anchor;
  }

  // ---------------------------------------------------------------- the cutlass: the moveset's string, read
  readBlade(dt, tool) {
    const B = this.B, M = tool.cutlass?.moves, g = this.game;
    B.hitAge += dt; B.payAge += dt; B.runP = C01(B.hitAge / 0.12);
    if (!M) return;
    const string = M.string || [], place = M.stringPlace(), br = place.branch, n = Math.min(8, string.length);
    if (n !== B.n || string !== B.strRef || string[0] !== B.first) { B.n = n; B.strRef = string; B.first = string[0]; for (let i = 0; i < n; i++) B.eff[i] = effOf(M, string[i]); } // (the loadout read again only when it changes)
    const st = place.struck | 0;
    if (st > B.lit || (st > 0 && B.cooling)) { B.lit = st; B.hitAge = 0; B.runP = 0; B.cooling = false; B.cool = 0; }
    else if (st < B.lit && !B.cooling) { B.cooling = true; B.cool = 0; } // (the string left: the temper line cools from the tip back, 0.5 real s)
    if (B.cooling) { B.cool = C01(B.cool + dt / 0.5); if (B.cool >= 1) { B.cooling = false; B.cool = 0; B.lit = st; B.branch = null; } }
    // the pause string, as a second temper line from its notch
    if (br && br.to?.length) {
      const P = B.br;
      if (!B.branch || P.at !== br.at || P.ref !== br.to) { P.at = br.at; P.ref = br.to; P.n = Math.min(4, br.to.length); for (let j = 0; j < P.n; j++) P.eff[j] = effOf(M, br.to[j]); P.g = 0; P.st = 0; P.hitAge = 9; }
      P.g = C01(P.g + dt / 0.15);
      const bs = br.struck | 0; if (bs > P.st) { P.hitAge = 0; } P.st = bs; P.next = br.next ?? -1; P.hitAge += dt; P.runP = C01(P.hitAge / 0.12);
      B.branch = P;
    } else if (!B.cooling) B.branch = null;
    B.next = B.cooling ? -1 : br && br.next >= 0 ? -1 : place.next;
    // the paid cut's window (the string row's own reading: a ground blow's recovery into the string's next, its cost affordable)
    const c = M.cur, litId = br && br.next >= 0 ? br.to[br.next] : string[place.next], nd = litId && M.def(litId);
    const into = c && c.kind !== 'air' && c.kind !== 'launcher' && g.player?.grounded;
    B.cutOpen = !!into && !!litId && !!M.paidCutOpen(nd ? M.rule(nd)?.cost ?? nd.cost ?? 0 : 0);
  }

  // ---------------------------------------------------------------- the rod: the angler, read
  readRing(dt, tool) {
    const R = this.R, A = tool.angler, g = this.game;
    if (!A) return;
    for (let k = 0; k < 7; k++) R.known[k] = aspectKnown(g, SHOWN[k]);
    const to = Math.max(0, SHOWN.indexOf(A.aspect));
    if (R.to < 0) { R.to = R.from = to; R.selF = to; rgbOf(COLOR[FEELINGS[to]], R.lure); R.lureFrom.splice(0, 3, ...R.lure); R.fill = 1; }
    if (to !== R.to) { R.from = Math.round(R.selF); R.to = to; R.moveT = 0; R.lureFrom.splice(0, 3, ...R.lureNow); rgbOf(COLOR[FEELINGS[to]], R.lure); }
    // the ring turns a bead a notch (0.16 real s onto a bead, 0.24 over a dark seat, with a shiver); a long jump is pressed into 0.45 s
    R.moveT += dt; R.shakeI = -1;
    const dir = Math.sign(R.to - R.from); let total = 0;
    for (let s = R.from + dir; dir && (dir > 0 ? s <= R.to : s >= R.to); s += dir) total += R.known[s] ? 0.16 : 0.24;
    const k = total > 0.45 ? 0.45 / total : 1; let T = 0, done = true;
    for (let s = R.from + dir; dir && (dir > 0 ? s <= R.to : s >= R.to); s += dir) {
      const d = (R.known[s] ? 0.16 : 0.24) * k;
      if (R.moveT < T + d) { const p = (R.moveT - T) / d; R.selF = s - dir + dir * oB(p, 1.9); if (!R.known[s]) { R.shakeI = s; R.shakeAmp = Math.sin(C01(p) * Math.PI); } done = false; break; }
      T += d;
    }
    if (done) { R.selF = R.to; R.fill = sm((R.moveT - T + 0.05) / 0.35); } else R.fill = 0;
    for (let c = 0; c < 3; c++) R.lureNow[c] = lerp(R.lureFrom[c], R.lure[c], R.fill);
    if (A.lureId !== R.lureId) { R.lureId = A.lureId; let def = BARE; try { def = lureList(g.ledger, g.pneuka).find((l) => l.id === A.lureId) || BARE; } catch { /* (no box yet: a bare hook) */ } R.lureKind = LURE_SHAPE[def?.key] || 'ball'; } // (its shape, read when the lure changes)
    // held open (MMB past 0.2 real s in the water), the water, the depth, the cast's splash
    R.open = C01(R.open + (A.ringOpen ? dt / 0.12 : -dt / 0.15));
    const water = !!A.lure?.inWater; R.water = C01(R.water + (water ? dt : -dt) / 0.2);
    if (water && !R.wasWater) R.splash = 0; R.wasWater = water; if (R.splash >= 0) { R.splash += dt; if (R.splash > 0.5) R.splash = -1; }
    R.depth = lerp(R.depth, Math.min(2, (A.lure?.depth || 0) / 2), Math.min(1, dt * 8));
    // the cooldown re-inking, then whole: a glint and a tick
    const cool = A.soundCool > 0 ? C01(1 - A.soundCool / 3) : 1;
    if (cool >= 1 && R.cool < 1) R.readyAge = 0;
    R.cool = cool; R.readyAge += dt;
    // the sounding: the echoes of the fish it lights (a fish's pingId turns to the sounding's id as the wave reaches it: fish.js)
    if (R.pAge >= 0) {
      R.pAge += dt; if (R.pAge > 3) R.pAge = -1;
      const W = A.weir, cam = g.camera;
      if (W && cam && R.pAge >= 0 && R.pAge < PING_LIGHT) {
        cam.getWorldDirection(_fw); _fw.y = 0; _fw.normalize();
        for (const f of W.fish || []) {
          if (R.echoN >= R.echoes.length || f.pingId !== R.soundId) continue;
          let seen = false; for (let i = 0; i < R.echoN; i++) if (R.echoes[i].f === f) { seen = true; break; }
          if (seen) continue;
          _v.copy(f.pos).sub(cam.getWorldPosition(_w)); _v.y = 0;
          const e = R.echoes[R.echoN++]; e.f = f; e.at = R.pAge; e.b = Math.atan2(_v.x * -_fw.z + _v.z * _fw.x, _v.x * _fw.x + _v.z * _fw.z); // (its bearing from where the view faces: right is +)
        }
      }
      R.flash = 0; for (let i = 0; i < R.echoN; i++) { const ea = R.pAge - R.echoes[i].at - 0.35; if (ea >= 0) R.flash = Math.max(R.flash, Math.exp(-ea * 7)); }
    } else R.flash = 0;
  }

  /** A sounding went off (angle.sound): the ripple, a bead down the link to the pawl. */
  sounded() {
    if (!this.shown) return;
    const R = this.R, A = this.game.angler;
    R.pAge = 0; R.echoN = 0; for (const e of R.echoes) e.f = null; R.soundId = A?.weir?.sound?.id ?? -1;
    this.spend(5, A?.aspectColor ?? null);
  }

  // ---------------------------------------------------------------- the hook: the hookshot, read
  readHook(dt, tool) {
    const H = this.H, hs = tool.hookshot, g = this.game, S = this.S;
    if (!hs) return;
    H.range = hs.range ?? 40; // (the hookshot's RANGE; Ouranurgy's widening of it is not exposed yet)
    H.low = (g.lachryma?.available ?? 0) < 2; H.flyT += dt; H.biteAge += dt; H.reseat += dt;
    const chest = hs.chest?.(_w);
    if (hs.att) {
      if (!H.wasAtt) { H.biteAge = 0; H.wasAtt = true; }
      H.bit = true; H.kind = hs.att.mode === 'pull' ? 'catch' : 'anchor'; H.pot = H.kind === 'catch'; H.reel = !!hs.reeling; H.out = false; H.closeP = 1;
      if (chest) H.d = chest.distanceTo(hs.attachPoint ? hs.attachPoint(_v) : hs.att.point);
      if (H.reel) { H.spin -= dt * 8; H.reelT += dt; if (H.reelT >= 0.45) { H.reelT = 0; this.spend(1); } } else H.reelT = 0.45;
    } else {
      if (H.wasAtt) { H.wasAtt = false; H.reseat = 0; }
      H.bit = false; H.pot = false; H.reel = false;
      if (!hs.flying && S.ext.hook > 0.6 && this.form === 'hook') {
        const r = hs.probe?.();
        H.out = !r;
        if (r) { const kind = r.kind === 'pull' ? 'catch' : 'anchor'; if (kind === 'catch' && H.kind !== 'catch') H.closeP = 0; H.kind = kind; if (chest) H.d = chest.distanceTo(r.point); }
        H.closeP = C01(H.closeP + dt / 0.15);
      }
    }
    H.um = H.out ? R0U + H.range * DPM + 7 : R0U + Math.min(H.d, H.range) * DPM;
    H.fly = hs.flying ? C01(H.flyT / 0.22) : hs.att ? 1 : -1;
  }

  // ---------------------------------------------------------------- the made parts, placed
  place() {
    const F = this.forms, S = this.S, H = this.H, B = this.B;
    F.tsuba.rotation.z = -S.rot;
    F.axis.rotation.z = this.ang;
    // the cutlass: slid back into the guard and clipped there, out with the change; flashed in the film when a paid cut is paid
    const e = S.ext.cutlass, shf = (1 - e) * BLADE.L;
    F.blade.visible = e > 0.001; F.blade.position.x = -shf; F.blade.material.uniforms.uSgClip.value = 17 + shf;
    const flash = B.payAge < 0.2 ? 0.6 * (1 - B.payAge / 0.2) : 0, gl = F.blade.material.uniforms.uSgGlow.value;
    if (flash > 0) { const c = film(this.t * 1.5, _film); gl.setRGB(c[0] * flash, c[1] * flash, c[2] * flash, THREE.SRGBColorSpace); } else gl.setRGB(0, 0, 0);
    F.bow.visible = e > 0.01; F.bow.scale.setScalar(Math.max(0.001, sm(e * 1.5)));
    // the rod: four sections telescoping out, a ferrule at each joint
    const er = S.ext.rod; let u = 15; this.F.rodTip = null;
    for (let i = 0; i < 4; i++) {
      const ei = i < 3 ? C01(er * 4 - i) : Math.max(0, Math.min(1.3, er * 4 - i)); u += ROD_L[i] * ei;
      const a = Math.max(13, u - ROD_L[i]), on = er > 0.001 && (i === 0 || ei > 0.01) && u - a > 0.2;
      F.rod[i].visible = on; F.rod[i].position.x = a; F.rod[i].scale.x = Math.max(0.01, u - a);
      F.ferrule[i].visible = on && ei > 0.05; F.ferrule[i].position.x = u - 1.4; F.ferrule[i].scale.x = 1.4;
      if (i === 3 && on) this.F.rodTip = u;
    }
    F.collars.rod.visible = er > 0.01; F.collars.rod.scale.x = Math.max(0.01, C01(er * 3));
    // the hook: two forged sections, the grapnel at the tip or out on its rope
    const eh = S.ext.hook, e0 = C01(eh * 2), e1 = Math.max(0, Math.min(1.25, eh * 2 - 1)), end0 = 15 + HOOK_L[0] * e0, end1 = end0 + HOOK_L[1] * e1;
    const seg = (m, a, b) => { m.visible = eh > 0.001 && b - a > 0.2; m.position.x = a; m.scale.x = Math.max(0.01, b - a); };
    seg(F.hook[0], 13, end0); seg(F.hook[1], Math.max(13, end1 - HOOK_L[1]), end1); seg(F.hookBand[0], end0 - 1.5, end0); seg(F.hookBand[1], end1 - 1.4, end1);
    F.hookBand[1].visible = F.hookBand[1].visible && e1 > 0.05;
    F.collars.hook.visible = eh > 0.01; F.collars.hook.scale.x = Math.max(0.01, C01(eh * 3));
    this.F.hookTip = end1;
    const tgt = H.um - 11; H.gU = H.fly >= 0 && H.fly < 1 ? lerp(end1, tgt, sm(H.fly)) : H.bit ? Math.max(end1, tgt) : end1;
    const gp = F.grapnel.group; gp.visible = eh > 0.15; gp.position.x = H.gU;
    const fl = H.fly >= 0 && H.fly < 1 ? 0.4 : H.pot ? 0.55 : S.flare * (H.reseat < 0.3 ? oB(H.reseat / 0.3, 2.5) : 1);
    F.grapnel.flukes.scale.y = Math.max(0.15, fl);
    // the drum: the rim swelled into a capstan, turning as it reels
    const d = sm(S.drum); F.drum.visible = d > 0.01; F.drum.scale.setScalar((15 + 3.8 * d * (1 - 0.4 * (H.bit ? 1 - C01(H.d / 22) : 0))) / 18.8); F.drum.rotation.z = H.spin * 0.25;
  }

  marks() {
    const b = this.b; b.under.begin(); b.marks.begin(); b.over.begin();
    drawGuard(this.X); drawRod(this.X); drawBlade(this.X); drawHook(this.X); drawRing(this.X);
    b.under.end(); b.marks.end(); b.over.end();
  }

  // ---------------------------------------------------------------- the plate and the count
  words() {
    const S = this.S, R = this.R, H = this.H, fr = sm(S.ring);
    const i0 = Math.max(0, Math.min(6, Math.floor(R.selF))), ff = C01(R.selF - i0), i1 = Math.min(6, i0 + 1);
    const key = `${S.a}|${S.b}|${Math.round(S.p * 24)}|${Math.round(fr * 12)}|${i0}|${Math.round(ff * 24)}|${R.known.join('')}|${this.themeId}`;
    if (key !== this.plateKey) { this.plateKey = key; this.plate.draw({ a: S.a, b: S.b, p: Math.round(S.p * 24) / 24, fr: Math.round(fr * 12) / 12, i0, i1, ff: Math.round(ff * 24) / 24, known: R.known }); }
    this.plate.mesh.position.set(0, -(30.5 + this.plate.h / 2), 0);
    // the hook's count, on the ruler where the aim would bite (none past the reach: the hookshot's probe stops there)
    const al = C01((S.ext.hook - 0.6) / 0.4);
    this.count.mesh.visible = al > 0.02 && !H.out;
    if (this.count.mesh.visible) {
      const text = `${Math.round(H.d)} m`, col = H.kind === 'catch' ? '#fff2c8' : '#ece6ff', k2 = `${text}|${col}`;
      if (k2 !== this.countKey) { this.countKey = k2; this.count.draw(text, col); }
      const ca = this.X.ca, sa = this.X.sa, u = H.um, v = 8.5;
      this.count.mesh.position.set(ca * u - sa * v, sa * u + ca * v, 0);
      this.count.mesh.material.opacity = al * (H.low ? 0.45 : 1);
    }
    this.state.shown = this.shown; this.state.form = this.form; this.state.morph = !!this.morph;
    const B = this.B; this.state.string = { n: B.n, lit: B.lit, next: B.next, cutOpen: B.cutOpen, branch: B.branch ? { at: B.branch.at, n: B.branch.n, st: B.branch.st } : null };
    this.state.ring = { sel: R.to, open: +R.open.toFixed(2), cool: +R.cool.toFixed(2), echoes: R.echoN };
    this.state.hook = { d: +H.d.toFixed(1), kind: H.kind, out: H.out };
  }

  // ---------------------------------------------------------------- the spiritual link: beads for the spends
  link(dt) {
    const L = this.game.spiritualLink, Q = this.beadQ;
    for (let i = Q.length - 1; i >= 0; i--) {
      const q = Q[i]; q.age += dt;
      if (L?.state?.shown) { L.bead({ amount: q.amount, colour: q.colour }); Q.splice(i, 1); } else if (q.age > 0.5) Q.splice(i, 1); // (the tube rises when the pool moves: the bead waits for it, a moment)
    }
  }
}

