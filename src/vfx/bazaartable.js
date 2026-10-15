// ---------------------------------------------------------------------------------------
// THE TABLE VIEW (docs/plans/CASINO.md section 9; Dovina's handoff of 2026-10-15, item 2): a seat at Raku's tables as the table itself.
// While a seat is taken (world/bazaar/session.js `TableSession`, its page open), the camera comes down to a frame on the cloth from your
// side of the table, and the session's state is laid out as real pieces (vfx/bazaarlayout.js): cards, dice, tiles and chips of the
// house (vfx/bazaarpieces.js, vfx/bazaarfaces.js). Your choices are the pieces: the ones you may take are lit in the labradorite's
// schiller (the paid cut's glint: vfx/oxidation.js `schillerInk`), lift under the cursor, and a click makes the same move the page's
// button would. Dice tumble from the seat that threw them and settle on the face the rules rolled. The page (world/bazaar/views.js)
// stays beside it as the fallback for the choices that are no piece; F rises, as before.
// Also, at every table at all times, its cloth: felt, a gold border, the game's sigil (one mesh for the three).
//
// The index page pauses the world's tick (main.js: a modal window), so this runs from main.js before that pause: it keeps the seat's
// clock (the bots' turns, session.update) and the camera itself while the page is up, the shot's pose in vfx/cinema.js's form (a place
// and a point looked at), eased in. Draw calls: the cloths 1 (in the hall), the pieces 3 at most (paper, glaze, lit) while seated.
// Programs: none added (the stock map material: vfx/bazaarpieces.js).
//
// Prior art: Final Fantasy VII's Gold Saucer and its minigames' tables, Like a Dragon's casino (walk up, sit, the camera down on the
// cloth), Mahjong Soul's and Hearthstone's pieces lit when playable and lifted under the cursor, the house's chest ceremony's camera
// (vfx/cinema.js shot()).
//
//   game.bazaarTable = new BazaarTable(game)   (main.js)   .tick(dt) (every frame, before the modal pause)   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BAZAAR } from '../world/bazaar/bazaar.js';
import { TABLES } from '../world/bazaar/session.js';
import { bazaarMaterials, clothTpl, PieceBatch } from './bazaarpieces.js';
import { layoutTable } from './bazaarlayout.js';
import { schillerInk } from './oxidation.js';

/** The numbers: the cloth's height over the hall's floor (just over Dovina's plinth cloth, 0.95), the shot (metres over the cloth, and
 *  out toward you in table radii; where it looks), the ease in (per real second), the pieces' slide, a die's tumble (real seconds), the
 *  lift under the cursor and when chosen, the lit glint's walk. */
export const TABLE_VIEW = { cloth: 0.956, shot: { up: 1.5, out: 0.9, lookOut: 0.2, lookX: -0.3 }, ease: 2.6, slide: 11, tumble: 0.95, hover: 0.035, chosen: 0.06, glint: 0.22 };
const CSS = '#indexmenu.bztable { pointer-events: none; } #indexmenu.bztable .im { pointer-events: auto; }';

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _c = new THREE.Color(), _one = new THREE.Vector3(1, 1, 1);

export class BazaarTable {
  constructor(game) {
    this.game = game; this.s = null; this.pieces = new Map(); this.t = 0; this.zsel = new Set(); this.ndc = null; this.hover = null;
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
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = game.renderer?.domElement;
    if (el) {
      el.addEventListener('pointermove', (e) => { if (this.s) this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; });
      el.addEventListener('pointerdown', (e) => { if (this.s && e.button === 0) { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; this.click(); } });
    }
  }
  get active() { return !!this.s; }

  /** Every frame: sit down, lay out, animate, frame; or rise. */
  tick(dt) {
    const g = this.game, s = g.bazaar?.session, menu = s?.menu, up = !!(s?.open && menu?.open && menu.page?.name === 'bazaar.table');
    if (up && this.s !== s) this.enter(s); else if (!up && this.s) this.leave();
    if (!this.s) return;

    if (!s.open) { this.leave(); return; }
    this.t += dt;
    if (s.S !== this.S) { this.S = s.S; this.seen = 0; this.zsel.clear(); this.lastDice = null; } // (a new game at the table: again)
    this.layout(); this.pickHover(); this.animate(dt); this.batch.write(); this.frame(dt); // (laid out every frame: a hundred pieces at most, and nothing the rules change is missed)
    this.mats.lit.emissive.copy(schillerInk(this.t * TABLE_VIEW.glint, _c)).multiplyScalar(0.55);
  }

  enter(s) {
    const g = this.game, T = s.T, C = (this.C = new THREE.Vector3(BAZAAR.x + T.at.x, BAZAAR.y + TABLE_VIEW.cloth, BAZAAR.z + T.at.z));
    const P = g.player.pos, dx = P.x - C.x, dz = P.z - C.z; this.yaw = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dx, dz) : 0; // (your side of the table: where you stood)
    this.s = s; this.S = null; this.pieces.clear(); this.zsel.clear(); this.k = 0;
    const m = this.batch.mesh; m.position.copy(C); m.rotation.set(0, this.yaw, 0); m.visible = true; m.updateMatrixWorld();
    this.from = { p: g.camera.position.clone(), q: g.camera.quaternion.clone() };
    s.menu?.root?.classList.add('bztable');
  }
  leave() {
    const s = this.s; this.s = null; this.batch.mesh.visible = false; this.pieces.clear(); this.batch.clear(); this.hover = null; this.ndc = null;
    s?.menu?.root?.classList.remove('bztable'); this.game.bazaar?.session?.menu?.root?.classList.remove('bztable');
  }

  /** The session's state as pieces: kept by id, so a card that moves slides there; a new one comes from where it would. */
  layout() {
    const s = this.s, list = layoutTable(s, { zsel: this.zsel }), keep = new Set();
    const rolls = this.newRolls();
    for (const L of list) {
      keep.add(L.id);
      let e = this.pieces.get(L.id);
      const p = new THREE.Vector3(...L.p);
      if (!e) { e = { cur: new THREE.Vector3(...(L.from || L.p)), q: L.q.clone(), m: new THREE.Matrix4(), lift: 0 }; this.pieces.set(L.id, e); }
      const was = e.die?.value;
      Object.assign(e, { id: L.id, tpl: L.tpl, to: p, toQ: L.q, act: L.act || null, sel: !!L.sel, glaze: !!L.glaze, die: L.die || null });
      if (L.die && (rolls.has(L.id) || (was != null && was !== L.die.value && L.id.startsWith('zd:')))) this.tumble(e);
    }
    for (const id of [...this.pieces.keys()]) if (!keep.has(id)) this.pieces.delete(id);
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
        used.forEach((sd, i) => { const id = `ed:${q}:${sd}:${(count[sd] = (count[sd] ?? -1) + 1)}`; if (i >= used.length - dice.length) out.add(id); });
      }
    }
    return out;
  }
  /** A die thrown: from its thrower's side (or where it lay), over the cloth, settling exactly on its rest (the rules' face up). */
  tumble(e) {
    const from = e.cur.clone(); if (from.distanceTo(e.to) < 0.05) from.add(_v.set((Math.random() - 0.5) * 0.4, 0, 0.35));
    e.tumble = { t: 0, dur: TABLE_VIEW.tumble * (0.85 + Math.random() * 0.3), from, axis: new THREE.Vector3(Math.random() - 0.5, 0.3, Math.random() - 0.5).normalize(), spins: 2 + Math.random() * 2 };
  }

  pickHover() {
    if (!this.ndc) { this.hover = null; return; }
    this.ray.setFromCamera(this.ndc, this.game.camera);
    const id = this.batch.pick(this.ray), e = id && this.pieces.get(id);
    this.hover = e?.act ? id : null;
  }
  click() {
    this.pickHover(); const e = this.hover && this.pieces.get(this.hover);
    if (e?.act) e.act();
  }

  animate(dt) {
    const k = 1 - Math.exp(-TABLE_VIEW.slide * dt), B = this.batch; B.clear();
    for (const e of this.pieces.values()) {
      const lift = (this.hover === e.id ? TABLE_VIEW.hover : 0) + (e.sel ? TABLE_VIEW.chosen : 0);
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
      B.add(e.tpl, e.m, e.act || e.sel ? 2 : e.glaze ? 1 : 0, e.id);
    }
  }

  /** The camera on the cloth: eased from where it was to the seat's frame (a place and a point looked at, as cinema.shot takes). */
  frame(dt) {
    const cam = this.game.camera, T = this.s.T, S = TABLE_VIEW.shot, yq = _q2.setFromAxisAngle(_v.set(0, 1, 0), this.yaw);
    const pos = new THREE.Vector3(0, S.up, T.r * S.out).applyQuaternion(yq).add(this.C), look = new THREE.Vector3(S.lookX, 0, T.r * S.lookOut).applyQuaternion(yq).add(this.C);
    _m.lookAt(pos, look, _v.set(0, 1, 0)); _q.setFromRotationMatrix(_m);
    this.k = Math.min(1, this.k + dt * TABLE_VIEW.ease * (1 - this.k * 0.9)); const e = this.k * this.k * (3 - 2 * this.k);
    cam.position.lerpVectors(this.from.p, pos, e); cam.quaternion.slerpQuaternions(this.from.q, _q, e); cam.updateMatrixWorld();
  }
}
