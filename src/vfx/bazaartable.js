// ---------------------------------------------------------------------------------------
// THE TABLE VIEW (docs/plans/CASINO.md section 9; docs/plans/CASINO-CLARITY.md; Dovina's handoff of 2026-10-15, item 2): a seat at Raku's
// tables as the table itself. While a seat is taken (world/bazaar/session.js `TableSession`, its page open), the camera comes down to a
// frame on the cloth from your side of the table, and the session's state is laid out as real pieces (vfx/bazaarlayout.js): cards, dice,
// tiles and chips of the house (vfx/bazaarpieces.js, vfx/bazaarfaces.js), sized by the game's ladder. Your choices are the pieces: the
// ones you may take are lit in the labradorite's schiller (the paid cut's glint: vfx/oxidation.js `schillerInk`) under a film rim
// (vfx/tablemarks.js), lift under the cursor and say what they do (vfx/tableclarity.js: the tip), and a click makes the same move the
// page's button would; a choice that is no piece, or a handful, is a plate on the action bar with its price and what it would bring.
// Dice tumble from the seat that threw them and settle on the face the rules rolled.
// What it reads is the coach (progress/casino/coach/, through `session.coach()`, worked out again only when the game moves), never the
// rules: the plates, the goal, the banner, the count-up and the how-to are vfx/tableclarity.js's; the marks on the cloth (whose turn, what
// you may take, what is chosen, whose it is) are vfx/tablemarks.js's, in the seats' colours and shapes (vfx/seatlook.js). The page
// (world/bazaar/views.js) is hidden while the view is up: the bar, AGAIN and STAND UP, the stake and "?" do all it did. At the first sit
// the how-to plays on a dealt demo table (never the session's own), so its spotlight has the very pieces to point at.
// G3: the canvas listeners and the style belong to a seat (made in enter, taken down in leave). Also, at every table at all times, its cloth: felt, a gold border, the game's sigil (one mesh for the three).
//
// The index page pauses the world's tick (main.js: a modal window), so this runs from main.js before that pause: it keeps the seat's
// clock (the bots' turns, session.update) and the camera itself while the page is up, the shot's pose in vfx/cinema.js's form (a place
// and a point looked at), eased in. Draw calls: the cloths 1 (in the hall), the pieces 3 at most (paper, glaze, lit) and the marks 3
// while seated. Programs: none added (the stock map material: vfx/bazaarpieces.js).
//
// Prior art: Final Fantasy VII's Gold Saucer and its minigames' tables, Like a Dragon's casino (walk up, sit, the camera down on the
// cloth), Mahjong Soul's and Hearthstone's pieces lit when playable and lifted under the cursor, the house's chest ceremony's camera
// (vfx/cinema.js shot()), Balatro's count-up, Monster Train's previews.
//
//   game.bazaarTable = new BazaarTable(game)   (main.js)   .tick(dt) (every frame, before the modal pause)   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BAZAAR } from '../world/bazaar/bazaar.js';
import { TABLES } from '../world/bazaar/session.js';
import { rngOf } from '../progress/casino/table.js';
import { coach as coachOf } from '../progress/casino/coach/index.js';
import { bazaarMaterials, clothTpl, PieceBatch } from './bazaarpieces.js';
import { layoutTable } from './bazaarlayout.js';
import './bazaarlayoutastroll.js'; // (registers Supernova Run's and Nebula Bluff's layouts)
import { schillerInk } from './oxidation.js';
import { SEAT_LOOK } from './seatlook.js';
import { TableMarks } from './tablemarks.js';
import { TableClarity } from './tableclarity.js';

/** The numbers: the cloth's height over the hall's floor (just over Dovina's plinth cloth, 0.95), the shot (metres over the cloth, and
 *  out toward you in table radii; where it looks), the ease in (per real second), the pieces' slide, a die's tumble (real seconds), the
 *  lift under the cursor, the lit glint's walk, how long a coach is trusted without a new move (real seconds). */
export const TABLE_VIEW = { cloth: 0.956, shot: { up: 1.5, out: 0.9, lookOut: 0.3, lookX: -0.3 }, ease: 2.6, slide: 11, tumble: 0.95, hover: 0.035, glint: 0.22, coachFor: 0.5 };
// (the page is hidden while the view is up; the root lets the canvas through)
const CSS = '#indexmenu.bztable { pointer-events: none; } #indexmenu.bztable .im { visibility: hidden; pointer-events: none; }';
/** The marks' seat look: SEAT_LOOK with the number hex the marks' atlas takes, and a keyline where the cloth would swallow the seat colour. */
const KEYLINE = { yellow: 0x1a1420, white: 0x1a1420, black: 0xd8d4dc };
const MARK_LOOK = Object.fromEntries(Object.values(SEAT_LOOK).map((l) => [l.label, { hex: parseInt(String(l.hex).replace('#', ''), 16), shape: l.shape, ...(KEYLINE[l.id] != null ? { keyline: KEYLINE[l.id] } : null) }]));

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _c = new THREE.Color(), _one = new THREE.Vector3(1, 1, 1), _b = new THREE.Vector3();
const BOX = new WeakMap(); // a template -> its box [x0, y0, z0, x1, y1, z1]
const boxOf = (tpl) => {
  let b = BOX.get(tpl); if (b) return b;
  b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; const p = tpl.pos;
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], p[i + k]); b[k + 3] = Math.max(b[k + 3], p[i + k]); }
  BOX.set(tpl, b); return b;
};

export class BazaarTable {
  constructor(game) {
    this.game = game; this.s = null; this.src = null; this.pieces = new Map(); this.t = 0; this.zsel = new Set(); this.ndc = null; this.hover = null; this.hoverIds = null; this.chosen = new Set();
    this.mats = bazaarMaterials();
    // the cloths, one mesh: each table's felt, border and sigil
    const B = BAZAAR, cl = (this.cloths = new PieceBatch(this.mats));
    for (const T of TABLES) cl.add(clothTpl(T.id, T.r - 0.17), new THREE.Matrix4().makeTranslation(T.at.x, TABLE_VIEW.cloth, T.at.z), 0, T.id);
    cl.write(); cl.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 10), 40);
    cl.mesh.frustumCulled = true; cl.mesh.position.set(B.x, B.y, B.z); cl.mesh.userData.zone = 'bazaar'; cl.mesh.name = 'bazaar-cloths'; game.scene.add(cl.mesh);
    // the pieces of the table you sit at
    const pb = (this.batch = new PieceBatch(this.mats));
    pb.mesh.visible = false; pb.mesh.userData.zone = 'bazaar'; pb.mesh.name = 'bazaar-pieces'; game.scene.add(pb.mesh);
    this.ray = new THREE.Raycaster();
    this.clarity = new TableClarity(game, { project: (v) => this.project(v), pieceRect: (role) => this.pieceRect(role), hover: (ids) => { this.hoverIds = ids; }, picked: () => this.clearPicks() });
    // (the style and the canvas listeners are made when a seat is taken and taken down when it is left: enter/leave)
    const at = (e) => { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; this.mouse = { x: e.clientX, y: e.clientY }; };
    this.onMove = (e) => { if (this.s) at(e); };
    this.onDown = (e) => { if (this.s && e.button === 0 && !this.clarity.busy) { at(e); this.click(); } };
  }
  get active() { return !!this.s; }

  /** Every frame: sit down, lay out, animate, frame; or rise. */
  tick(dt) {
    const g = this.game, s0 = g.bazaar?.session, menu = s0?.menu, page = menu?.open && menu.page?.name;
    const up = !!(s0?.open && (page === 'bazaar.table' || page === 'bazaar.howto') && (s0.S || s0.where === 'howto'));
    if (up && (this.src !== s0 || (this.s?.demo && s0.S))) { if (this.s) this.leave(); this.enter(s0); } else if (!up && this.s) this.leave();
    if (!this.s) return;

    if (!this.src.open) { this.leave(); return; }
    this.t += dt; const s = this.s;
    if (s.S !== this.S) { this.S = s.S; this.seen = 0; this.zsel.clear(); this.lastDice = null; this.coach = null; this.chosen = new Set(); } // (a new game at the table: again)
    this.refreshCoach(dt);
    this.layout(); this.pickHover(); this.animate(dt); this.batch.write(); this.frame(dt); // (laid out every frame: a hundred pieces at most, and nothing the rules change is missed)
    this.markUp(dt); this.clarityFrame(dt);
    this.mats.lit.emissive.copy(schillerInk(this.t * TABLE_VIEW.glint, _c)).multiplyScalar(0.55);
  }

  /** The view's session: the real one, or (at the first sit, before any game is dealt) a demo table dealt for the how-to to point at. */
  viewOf(s) {
    if (s.S) return s;
    const T = s.T, d = Object.create(s);
    Object.assign(d, { demo: true, real: s, S: T.game.setup({ seats: T.seats, r: rngOf(0x5eed), opts: T.opts ? T.opts(0, T) : {} }), done: false, practice: true, move() {}, render() {}, showHowto() {}, again() {}, close() {} });
    d.coach = () => coachOf(T, d.S, 0, { suggest: false });
    return d;
  }
  enter(s0) {
    const g = this.game, s = this.viewOf(s0), T = s.T, C = (this.C = new THREE.Vector3(BAZAAR.x + T.at.x, BAZAAR.y + TABLE_VIEW.cloth, BAZAAR.z + T.at.z));
    const P = g.player.pos, dx = P.x - C.x, dz = P.z - C.z; this.yaw = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dx, dz) : 0; // (your side of the table: where you stood)
    this.src = s0; this.s = s; this.S = null; this.pieces.clear(); this.zsel.clear(); this.k = 0; this.hoverIds = null; this.chosen = new Set(); this.coach = null;
    const m = this.batch.mesh; m.position.copy(C); m.rotation.set(0, this.yaw, 0); m.visible = true; m.updateMatrixWorld();
    this.from = { p: g.camera.position.clone(), q: g.camera.quaternion.clone() };
    this.marks = new TableMarks(g.scene, { frame: m, clothY: 0, seatLook: MARK_LOOK });
    this.clarity.open(s);
    this.handLook(T.id === 'querent'); // (Querent's cards are read for their faces: see handLook)
    s0.menu?.root?.classList.add('bztable');
    this.style = document.createElement('style'); this.style.textContent = CSS; document.head.appendChild(this.style);
    const el = (this.canvas = g.renderer?.domElement); el?.addEventListener('pointermove', this.onMove); el?.addEventListener('pointerdown', this.onDown);
  }
  leave() {
    const s0 = this.src; this.s = null; this.src = null; this.batch.mesh.visible = false; this.pieces.clear(); this.batch.clear(); this.hover = null; this.hoverIds = null; this.ndc = null;
    this.marks?.dispose(); this.marks = null; this.clarity.close(); this.coach = null; this.handLook(false);
    s0?.menu?.root?.classList.remove('bztable'); this.game.bazaar?.session?.menu?.root?.classList.remove('bztable');
    this.canvas?.removeEventListener('pointermove', this.onMove); this.canvas?.removeEventListener('pointerdown', this.onDown); this.canvas = null;
    this.style?.remove(); this.style = null;
  }
  /** Querent's face contrast at 480 lines: the paper is lit down and made matt (the sun's glare and the exposure washed the ink out; no emissive, no new program, the same material's
   *  uniforms), and the other tables get theirs back on leaving. */
  handLook(on) { const p = this.mats.paper; p.color.setScalar(on ? 0.5 : 1); p.roughness = on ? 1 : 0.72; p.envMapIntensity = on ? 0.4 : 1;
    const tex = p.map; if (on && tex && tex.anisotropy < 16) { tex.anisotropy = 16; tex.needsUpdate = true; } } // (the oblique hand keeps its ink through the minifying: the atlas's anisotropy 4 to 16)
  clearPicks() { this.zsel.clear(); this.s.dsel = []; this.s.sel = new Set(); }

  /** The coach, worked out again only when the game moves (or half a real second on, for a knack switched meanwhile). */
  refreshCoach(dt) {
    const s = this.s, T = s.T, St = s.S, P = T.game.result(St) ? null : T.game.pending(St);
    const key = [St.log?.length, P?.seat, P?.kind, P?.moves?.length, T.game.result(St) ? 1 : 0, s.where, s.done ? 1 : 0, s.practice ? 1 : 0].join('|');
    this.coachAge = (this.coachAge || 0) + dt;
    if (key === this.coachKey && this.coach && this.coachAge < TABLE_VIEW.coachFor) return;
    this.coachKey = key; this.coachAge = 0; this.coach = s.coach?.() || null;
    if (this.coach) this.clarity.sync(this.coach, s);
  }

  /** The session's state as pieces: kept by id, so a card that moves slides there; a new one comes from where it would. */
  layout() {
    const s = this.s, ctx = { zsel: this.zsel, t: this.t, coach: this.coach, chosen: this.chosen }, list = (this.list = layoutTable(s, ctx)), keep = new Set();
    this.anchors = list.anchors || []; this.ctx = ctx;
    const rolls = this.newRolls();
    for (const L of list) {
      keep.add(L.id);
      let e = this.pieces.get(L.id);
      const p = new THREE.Vector3(...L.p);
      if (!e) { e = { cur: new THREE.Vector3(...(L.from || L.p)), q: L.q.clone(), m: new THREE.Matrix4(), lift: 0 }; this.pieces.set(L.id, e); }
      const was = e.die?.value, rolled = L.rollKey != null && !L.still && e.rollKey !== L.rollKey; // (a layout's own throw: its key changed)
      Object.assign(e, { id: L.id, tpl: L.tpl, to: p, toQ: L.q, act: L.act || null, sel: !!L.sel, glaze: !!L.glaze, glow: !!L.glow, die: L.die || null, rollKey: L.rollKey, role: L.role || null, tier: L.tier || 'L', dim: !!L.dim, owner: L.owner, tip: L.tip || null });
      if (L.die && (rolled || rolls.has(L.id) || (was != null && was !== L.die.value && L.id.startsWith('zd:')))) this.tumble(e);
    }
    for (const id of [...this.pieces.keys()]) if (!keep.has(id)) this.pieces.delete(id);
    this.chosen = new Set(list.filter((L) => L.sel).map((L) => L.id)); // (the next frame's: what you have picked so far)
  }
  /** Which dice were thrown since the last look (the table's log: Zodiac's `roll`, Event Horizon's `roll` and `reroll`). */
  newRolls() {
    const s = this.s, L = s.S.log, out = new Set();
    for (; this.seen < L.length; this.seen++) {
      const x = L[this.seen];
      if (s.T.id === 'zodiac' && x.roll) { out.add('zd:a'); out.add('zd:b'); out.add('zd:atk'); }
      else if (s.T.id === 'eventhorizon' && (x.roll || x.reroll != null)) {
        const q = x.roll ? x.seat : this.lastSeat, used = s.S.used[q] || [], dice = x.roll || this.lastDice || [], count = {};
        this.lastSeat = q; this.lastDice = dice;
        used.forEach((sd, i) => { const id = `ex:${q}:${sd}:${(count[sd] = (count[sd] ?? -1) + 1)}`; if (i >= used.length - dice.length) out.add(id); });
      }
    }
    return out;
  }
  /** A die thrown: from its thrower's side (or where it lay), over the cloth, settling exactly on its rest (the rules' face up). */
  tumble(e) {
    const from = e.cur.clone(); if (from.distanceTo(e.to) < 0.05) from.add(_v.set((Math.random() - 0.5) * 0.4, 0, 0.35));
    e.tumble = { t: 0, dur: TABLE_VIEW.tumble * (0.85 + Math.random() * 0.3), from, axis: new THREE.Vector3(Math.random() - 0.5, 0.3, Math.random() - 0.5).normalize(), spins: 2 + Math.random() * 2 };
  }

  /** A piece's footprint on the cloth (metres, x and z): its template's box turned by where it is going. */
  foot(e) {
    const b = boxOf(e.tpl); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < 8; i++) { _b.set(i & 1 ? b[3] : b[0], i & 2 ? b[4] : b[1], i & 4 ? b[5] : b[2]).applyQuaternion(e.toQ); x0 = Math.min(x0, _b.x); x1 = Math.max(x1, _b.x); z0 = Math.min(z0, _b.z); z1 = Math.max(z1, _b.z); }
    return { w: Math.max(0.02, x1 - x0), d: Math.max(0.02, z1 - z0), cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
  }
  /** A point in the table's frame as a point on the screen. */
  project(v) {
    _v.copy(v); this.batch.mesh.localToWorld(_v); _v.project(this.game.camera);
    return { x: (_v.x * 0.5 + 0.5) * innerWidth, y: (-_v.y * 0.5 + 0.5) * innerHeight, off: _v.z > 1 || _v.z < -1 };
  }
  /** The screen box of the pieces that carry a how-to role (null if none). */
  pieceRect(role) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
    for (const e of this.pieces.values()) {
      if (e.role !== role) continue;
      const f = this.foot(e);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = this.project(_b.set(e.to.x + f.cx + (dx * f.w) / 2, e.to.y, e.to.z + f.cz + (dz * f.d) / 2)); if (p.off) continue; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); n++; }
    }
    return n ? { x0, y0, x1, y1 } : null;
  }

  pickHover() {
    if (!this.ndc) { this.hover = null; return; }
    this.ray.setFromCamera(this.ndc, this.game.camera);
    const id = this.batch.pick(this.ray), e = id && this.pieces.get(id);
    this.hover = e && (e.act || e.tip || this.moveOf(id)) ? id : null;
  }
  /** The one move that names this piece (its label, line and preview are the tip), if exactly one does. */
  moveOf(id) {
    const ms = this.coach?.moves?.filter((m) => m.pieceIds?.includes(id)) || [];
    return ms.length === 1 ? ms[0] : null;
  }
  /** What the tip under the cursor says: the move that names the piece, else the piece's own line. */
  tipFor() {
    const id = this.hover; if (!id || this.clarity.busy) return null;
    const m = this.moveOf(id), e = this.pieces.get(id);
    if (m) {
      const stats = []; if (m.preview) stats.push({ label: 'IF YOU DO', value: m.preview }); if (m.amount) stats.push({ label: m.amount < 0 ? 'COSTS' : 'PAYS', value: `${Math.abs(m.amount)} chips`, kind: 'money' }); if (m.best) stats.push({ label: 'THE HOUSE', value: 'would pick this' });
      return { label: m.label, line: m.line || '', stats };
    }
    return e?.tip ? { label: e.tip.label, line: e.tip.line, stats: [] } : null;
  }
  click() {
    this.pickHover(); const e = this.hover && this.pieces.get(this.hover);
    if (e?.act) e.act();
  }

  animate(dt) {
    const k = 1 - Math.exp(-TABLE_VIEW.slide * dt), B = this.batch, M = this.marks; B.clear();
    for (const e of this.pieces.values()) {
      const named = this.hoverIds?.has(e.id), lift = (this.hover === e.id || named ? TABLE_VIEW.hover : 0) + (M?.lift(e.id) || 0) + (M?.sink(e.id) || 0);
      e.lift += (lift - e.lift) * k;
      const tb = e.tumble;
      if (tb) {
        tb.t += dt; const u = Math.min(1, tb.t / tb.dur), ease = 1 - (1 - u) ** 3, hop = 0.32 * Math.abs(Math.sin(u * Math.PI * 2.5)) * (1 - u) ** 2;
        e.cur.lerpVectors(tb.from, e.to, ease); e.cur.y += hop + (1 - u) * 0.04;
        e.q.copy(e.toQ).multiply(_q.setFromAxisAngle(tb.axis, tb.spins * Math.PI * 2 * (1 - u) ** 2));
        if (u >= 1) { e.tumble = null; e.cur.copy(e.to); e.q.copy(e.toQ); }
      } else { e.cur.lerp(e.to, k); e.q.slerp(e.toQ, k); }
      _v.copy(e.cur); _v.y += e.lift;
      e.m.compose(_v, e.q, _one);
      // (the lit glaze's emissive washes a face out: the hand is lit only when picked, hovered or named; the marks' rims say what it may take)
      const lit = e.role === 'hand' && e.tier === 'XL' ? e.sel || e.glow || named || this.hover === e.id : e.act || e.sel || e.glow || named;
      B.add(e.tpl, e.m, lit ? 2 : e.glaze ? 1 : 0, e.id);
    }
  }

  /** The marks on the cloth: whose turn it is, what you may take, what is chosen (or named by a plate under the cursor), what is out of play, whose is whose. */
  markUp(dt) {
    const M = this.marks, c = this.coach; if (!M) return;
    const seats = (c?.seats || []).map((q) => {
      const a = this.anchors.find((x) => x.key === `seat:${q.seat}`), owns = [];
      for (const e of this.pieces.values()) if (e.owner === q.seat && e.role !== 'tiles') owns.push(e.id);
      return { seat: q.seat, colour: q.colourName, at: a?.at, owns };
    });
    const chosen = new Set(this.chosen); if (this.hoverIds) for (const id of this.hoverIds) chosen.add(id);
    const actable = [...this.pieces.values()].filter((e) => e.act).map((e) => e.id);
    M.set({ turnSeat: c && c.phase !== 'over' ? c.turn?.seat : null, seats, legal: c?.phase === 'yours' ? actable : [], chosen: [...chosen], dim: [...this.pieces.values()].filter((e) => e.dim).map((e) => e.id) },
      (id) => { const e = this.pieces.get(id); if (!e) return null; const f = this.foot(e); return { pos: _b.set(e.to.x + f.cx, 0, e.to.z + f.cz).clone(), size: { w: f.w, d: f.d } }; });
    M.update(dt);
  }
  /** The words and plates: the anchors projected, the bar, the tip. */
  clarityFrame(dt) {
    const actable = new Set([...this.pieces.values()].filter((e) => e.act).map((e) => e.id));
    this.clarity.frame(dt, { anchors: this.anchors, pick: this.ctx?.pick, chosen: this.chosen, actable, hoverId: this.hover, hoverTip: this.tipFor(), mouse: this.mouse });
  }

  /** The camera on the cloth: eased from where it was to the seat's frame (a place and a point looked at, as cinema.shot takes). */
  frame(dt) {
    const cam = this.game.camera, T = this.s.T, S = TABLE_VIEW.shot, yq = _q2.setFromAxisAngle(_v.set(0, 1, 0), this.yaw);
    const pos = new THREE.Vector3(0, S.up, T.r * S.out).applyQuaternion(yq).add(this.C), look = new THREE.Vector3(S.lookX, 0, T.r * S.lookOut).applyQuaternion(yq).add(this.C);
    _m.lookAt(pos, look, _v.set(0, 1, 0)); _q.setFromRotationMatrix(_m);
    this.k = Math.min(1, this.k + dt * TABLE_VIEW.ease * (1 - this.k * 0.9)); const e = this.k * this.k * (3 - 2 * this.k);
    cam.position.lerpVectors(this.from.p, pos, e); cam.quaternion.slerpQuaternions(this.from.q, _q, e);
    const j = this.clarity.jolt(dt); if (j) cam.position.add(_v.set((Math.random() - 0.5) * j, (Math.random() - 0.5) * j, (Math.random() - 0.5) * j));
    cam.updateMatrixWorld();
  }
}
