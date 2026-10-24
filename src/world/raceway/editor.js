// ---------------------------------------------------------------------------------------
// THE TRACK EDITOR (docs/plans/TRACK-EDITOR.md 3; the owner, 2026-10-24: "go full steam on an editor"): a made track built on the Raceway's
// build lot, from above. Opened from the race board's BUILD tab (its own room's thing: CLAUDE.md's scope) or /edit at the Raceway; the
// Courier is held at the lot while it is open, the camera hangs over the lot (cinema.shot, read every frame) and the cursor is free.
//   THE LINE      SELECT drags a point (its half-width on [ and ]); POINT clicks a point in (on the line: between its neighbours; off it:
//                 after the selected one); RMB takes one out. Or RIDE IT: the line laid where you sail, a point every 35 m, closed when
//                 you come back to its start (ModNation Racers' paver).
//   THE PIECES    a piece of the kit (progress/trackpieces.js) placed at the cursor, turned to the line; Q / E turn the selected thing.
//                 Each is made with a god power and open when that power is yours (the editor grows with your domains).
//   THE TRAPS     a trap (progress/traps.js) placed on the line; a portal takes two clicks (its eyes); + and - its period, , and . its offset.
//   THE RULES     up to three (trackdef.js RULES), a stele's words at the start.
//   THE CHECKS    the budget, and why it would not ride (trackdef.js validate), redrawn on every change: Super Mario Maker's red marks.
//   THE RUNS      TEST (practice), VALIDATE (ridden once to the line, alone: its author time), HAUNTED (you ride, the siblings possess its
//                 traps), HAUNT (the clapperjars ride, you possess them: world/raceway/haunt.js).
//   KEEPING       three slots in the save (`madeTracks`), a name, a share code (Trackmania's track code: trackdef.js), undo (Ctrl+Z).
// The panel is a plain placeholder for Calissa's dress (the house's UI is never stock); its words are placeholders for Espada's.
//
// Prior art: Trackmania's editor (lay, validate, share), ModNation Racers' track studio (ride the paver, then dress), Super Mario Maker 2
// (a part palette, readable at a glance, the clear check), LittleBigPlanet Karting's thermometer, Fall Guys Creative's exposed timings.
//
//   game.trackEditor = new TrackEditor(game)   .open(slot?)   .close()   .active   .slots [def | null]   .def   .slot   .load(code)
//   .update(dt)   save section 'madeTracks' (scope player)   events: editor.open, editor.save { budget, traps }, track.validate { seconds },
//   track.share, track.load { from }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from './track.js';
import { LOT, MADE, RULES, blankTrack, budgetOf, validate, hashOf, isValidated, shareCode, readCode, cleanDef } from '../../progress/trackdef.js';
import { PIECES, PIECE_KINDS, pieceRadius } from '../../progress/trackpieces.js';
import { TRAPS, TRAP_KINDS } from '../../progress/traps.js';
import { GOD_POWERS } from '../../progress/godpowers.js';

const CAM = { h: 130, min: 40, max: 170, lean: 0.35, pan: 1.1 }; // (the camera's height over the lot, its range, how far it stands back for its lean, pan speed a metre of height; kept inside the
// house camera's 200 m and the Dunes' haze, exp2 0.0042: at 180 m the lot is still half seen, past it the haze takes everything)
const PICK = { point: 6, trap: 6 }; // (metres a click reaches a handle at the closest zoom: more as the camera rises)
const UNDO = 40; // (snapshots kept)
const MAP = { px: 256, piece: '#9ad0ff', trap: '#ff6a5a', every: 0.1 }; // (the panel's map: its size in pixels, the pieces' and traps' colours, how often it is redrawn, real seconds)
const RECORD = { every: 35, close: 30, min: 400 }; // (ride it: metres between points laid, how near the start closes it, the least length)
const CSS = `
#tedit { position: fixed; left: 12px; top: 12px; bottom: 12px; width: 280px; overflow-y: auto; z-index: 6; display: none; font: 12px/1.35 var(--f-ui, sans-serif); color: #fbe3cf;
  background: rgba(28,13,8,.86); border: 1px solid rgba(255,178,122,.45); border-radius: 4px; padding: 8px 10px; }
#tedit h3 { margin: 8px 0 4px; font-size: 11px; letter-spacing: .12em; color: #ffcf9a; font-weight: 600; }
#tedit .row { display: flex; flex-wrap: wrap; gap: 4px; }
#tedit button { font: inherit; color: inherit; background: rgba(255,178,122,.12); border: 1px solid rgba(255,178,122,.35); border-radius: 3px; padding: 3px 6px; cursor: pointer; }
#tedit button.on { background: rgba(255,178,122,.45); color: #1c0d08; }
#tedit button:disabled { opacity: .35; cursor: default; }
#tedit .bar { height: 8px; border: 1px solid rgba(255,178,122,.5); margin: 4px 0; } #tedit .bar i { display: block; height: 100%; background: #ffb27a; }
#tedit .map canvas { display: block; width: 256px; height: 256px; border: 1px solid rgba(255,178,122,.35); cursor: crosshair; image-rendering: pixelated; }
#tedit .err { color: #ff9a7a; } #tedit .ok { color: #9ae0a0; } #tedit .dim { opacity: .7; }
`;

export class TrackEditor {
  constructor(game) {
    this.game = game; this.active = false; this.slots = [null, null, null]; this.slot = 0; this.def = null; this.tool = 'select'; this.sel = null; this.undo = [];
    this.cam = { x: 0, z: 0, h: CAM.h }; this.ndc = null; this.recording = null; this.dirty = false;
    game.save?.section('madeTracks', {
      scope: 'player', version: 1,
      dump: () => ({ slots: this.slots, slot: this.slot }),
      load: (d) => { this.slots = [0, 1, 2].map((i) => cleanDef(d?.slots?.[i])); this.slot = Math.max(0, Math.min(2, d?.slot | 0)); },
      reset: () => { this.slots = [null, null, null]; this.slot = 0; },
    });
    // a validation run's end: its time is the author's, if the track is still the one ridden
    game.events?.on('race.finish', (e) => {
      if (e.track !== 'made' || !e.validate) return;
      const def = this.slots[this.slot]; if (!def || `made.${hashOf(def)}` !== e.made) return;
      def.author = { seconds: e.seconds, hash: hashOf(def) }; game.save?.dirty('madeTracks');
      game.events?.emit('track.validate', { seconds: e.seconds, by: 'courier' });
    });
    if (typeof document !== 'undefined' && !document.getElementById('tedit-css')) { const st = document.createElement('style'); st.id = 'tedit-css'; st.textContent = CSS; document.head.appendChild(st); }
  }
  get R() { return this.game.raceway; }
  /** Lend the chat line /edit (at the Raceway: open the editor on the last slot). */
  commands() {
    const g = this.game; this.cmds = true;
    g.chat?.add('edit', { help: 'the track editor at the Raceway: /edit, /edit 2 (a slot), /edit name <words>, /edit code <a track code>, /edit off', run: (a) => {
      if (a[0] === 'off') { if (this.recording) { this.recording = null; return g.log?.say('info', 'You stop laying the line.', { key: 'edit', throttle: 1 }); } return this.close(); }
      if (a[0] === 'name') { const n = a.slice(1).join(' ').slice(0, 32); if (!n) return; const D = this.active ? this.def : this.slots[this.slot]; if (D) { D.name = n; if (this.active) this.commit(); else g.save?.dirty('madeTracks'); g.log?.say('info', `The track is called ${n}.`, { key: 'edit', throttle: 1 }); } return; }
      if (a[0] === 'code') { if (this.load(a[1] || '', this.active ? this.slot : null) && this.active) { this.close(false); this.open(this.slot); } return; }
      if (!this.R?.active) return g.log?.say('warn', 'The track editor is at the Raceway.', { key: 'edit', throttle: 1 });
      if (this.recording) { this.recording = null; return; }
      this.open(a[0] ? +a[0] - 1 : this.slot);
    } });
  }

  // ---------------------------------------------------------------- the made track worn: the slot's, built on the lot
  /** Build a slot's track on the lot (no editor), for a run from the race board. True if it was built. */
  wear(slot = this.slot) { const def = this.slots[slot]; if (!def) return false; this.slot = slot; return !!this.R?.made.set(def); }
  /** A track from a share code into a slot (the first empty, or the given one). */
  load(code, slot = null) {
    const def = readCode(code); if (!def) { this.game.log?.say('warn', 'That is not a track code.', { key: 'edit.code', throttle: 1 }); return false; }
    const i = slot ?? (this.slots.findIndex((s) => !s) >= 0 ? this.slots.findIndex((s) => !s) : this.slot);
    def.loaded = true; this.slots[i] = def; this.slot = i; this.game.save?.dirty('madeTracks');
    this.game.events?.emit('track.load', { from: 'code', by: 'courier' }); return true;
  }

  // ---------------------------------------------------------------- open, close
  open(slot = this.slot) {
    const g = this.game, R = this.R; if (!R?.active || g.race?.running || g.haunt?.on) return false;
    if (!this.cmds) this.commands();
    this.slot = Math.max(0, Math.min(MADE.slots - 1, slot | 0));
    this.def = JSON.parse(JSON.stringify(this.slots[this.slot] || blankTrack(`Track ${this.slot + 1}`)));
    this.undo = []; this.sel = null; this.tool = 'select'; this.active = true; this.cam = { x: 0, z: 0, h: CAM.h };
    this.rebuild();
    // the Courier set by the lot's edge and held there (main.js: aboard), the cursor free (main.js: cursorFree)
    const p = new THREE.Vector3(RW.x + LOT.x - LOT.half - 12, 0, RW.z + LOT.z); p.y = R.heightAt(p.x, p.z) + 0.05; g.course?.teleport?.(p, Math.PI / 2);
    document.exitPointerLock?.();
    this.panel(); this.listen(true);
    g.events?.emit('editor.open', { slot: this.slot, by: 'courier' });
    return true;
  }
  close(keep = true) {
    if (!this.active) return; const g = this.game;
    if (keep) this.store();
    this.active = false; this.listen(false); if (this.handles) this.handles.group.visible = false; g.cinema?.unshot('editor'); if (this.el) this.el.style.display = 'none';
    // set down at the made track's start pillar, if it has one
    const P = this.R?.pillars?.find((x) => x.track === 'made'); if (P) { const q = P.pos.clone(); q.x += 4; q.y = this.R.heightAt(q.x, q.z) + 0.05; g.course?.teleport?.(q, 0); }
  }
  /** The working copy into its slot (its author kept only if the geometry is still the one validated). */
  store() {
    const d = cleanDef(this.def); if (!d) return; if (d.author && d.author.hash !== hashOf(d)) d.author = null;
    this.slots[this.slot] = d; this.game.save?.dirty('madeTracks');
    this.game.events?.emit('editor.save', { slot: this.slot, budget: budgetOf(d).used, traps: d.traps.length, by: 'courier' });
  }

  // ---------------------------------------------------------------- input
  listen(on) {
    const el = this.game.renderer?.domElement; if (!el) return;
    if (!this.h) this.h = {
      move: (e) => { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; },
      down: (e) => { if (!this.active) return; e.preventDefault?.(); if (e.button === 2) this.erase(); else if (e.button === 0) this.press(); },
      up: (e) => { if (e.button === 0) this.release(); },
      wheel: (e) => { if (!this.active) return; this.cam.h = Math.max(CAM.min, Math.min(CAM.max, this.cam.h * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); },
      menu: (e) => { if (this.active) e.preventDefault(); },
    };
    const f = on ? 'addEventListener' : 'removeEventListener';
    el[f]('pointermove', this.h.move); el[f]('pointerdown', this.h.down); window[f]('pointerup', this.h.up); el[f]('wheel', this.h.wheel, { passive: true }); el[f]('contextmenu', this.h.menu);
  }
  cursor() {
    const cam = this.game.camera; if (!this.ndc || !cam) return null;
    const ray = new THREE.Raycaster(); ray.setFromCamera(this.ndc, cam);
    const d = ray.ray.direction, y = RW.y + LOT.y; if (Math.abs(d.y) < 1e-4) return null;
    const k = (y - ray.ray.origin.y) / d.y; if (k < 0) return null;
    const p = ray.ray.origin.clone().addScaledVector(d, k); return { x: p.x - RW.x - LOT.x, z: p.z - RW.z - LOT.z };
  }
  reach() { return Math.max(1, this.cam.h / 110); }
  /** What is under the cursor: a point, a piece, a trap (or a portal's second eye). */
  pick(c) {
    const D = this.def, k = this.reach(); let best = null, bd = Infinity;
    const test = (type, i, x, z, r) => { const d = Math.hypot(c.x - x, c.z - z); if (d < r && d < bd) { bd = d; best = { type, i }; } };
    D.points.forEach((p, i) => test('point', i, p[0], p[1], PICK.point * k));
    D.traps.forEach((t, i) => { test('trap', i, t.x, t.z, PICK.trap * k); if (t.pair) test('pair', i, t.pair[0], t.pair[1], PICK.trap * k); });
    D.pieces.forEach((p, i) => test('piece', i, p.x, p.z, Math.max(3, pieceRadius(p) * 0.7)));
    return best;
  }
  snapshot() { this.undo.push(JSON.stringify(this.def)); if (this.undo.length > UNDO) this.undo.shift(); }
  /** The line's heading at a lot-local point (for turning a new piece or trap to it). */
  yawAt(x, z) { const T = this.R.made.T, n = T?.nearest(x + LOT.x, z + LOT.z); if (!n) return 0; const F = T.frame(n.s); return Math.atan2(F.fx, F.fz); }
  press() {
    const c = this.cursor(); if (!c) return; const D = this.def, t = this.tool;
    if (Math.max(Math.abs(c.x), Math.abs(c.z)) > LOT.half) return;
    if (t === 'select') { this.sel = this.pick(c); if (this.sel) { this.snapshot(); this.drag = { from: c }; } this.panel(); return; }
    this.snapshot();
    if (t === 'point') { const at = this.insertAt(c); D.points.splice(at, 0, [Math.round(c.x), Math.round(c.z), MADE.defaultWidth]); this.sel = { type: 'point', i: at }; }
    else if (PIECES[t]) { D.pieces.push({ kind: t, x: Math.round(c.x), z: Math.round(c.z), yaw: +this.yawAt(c.x, c.z).toFixed(2) }); this.sel = { type: 'piece', i: D.pieces.length - 1 }; }
    else if (TRAPS[t]) {
      const pending = this.pendingPair; if (pending != null && D.traps[pending]) { D.traps[pending].pair = [Math.round(c.x), Math.round(c.z)]; this.pendingPair = null; this.sel = { type: 'trap', i: pending }; }
      else { D.traps.push({ kind: t, x: Math.round(c.x), z: Math.round(c.z), yaw: +this.yawAt(c.x, c.z).toFixed(2), period: TRAPS[t].cycle.period, offset: 0 }); this.sel = { type: 'trap', i: D.traps.length - 1 }; if (TRAPS[t].pair) this.pendingPair = D.traps.length - 1; }
    }
    this.commit();
  }
  /** Where a new point goes: between the two neighbours whose segment the click is nearest, else after the selected one. */
  insertAt(c) {
    const P = this.def.points, n = P.length; let best = -1, bd = 40;
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((c.x - a[0]) * dx + (c.z - a[1]) * dz) / l2)), d = Math.hypot(c.x - a[0] - dx * u, c.z - a[1] - dz * u); if (d < bd) { bd = d; best = i + 1; } }
    return best >= 0 ? best : this.sel?.type === 'point' ? this.sel.i + 1 : n;
  }
  release() { if (this.drag) { this.drag = null; this.commit(); } }
  erase() {
    const c = this.cursor(); if (!c) return; const s = this.pick(c); if (!s) return; const D = this.def;
    if (s.type === 'point' && D.points.length <= MADE.points[0]) { this.game.log?.say('warn', `A track keeps ${MADE.points[0]} points at least.`, { key: 'edit.min', throttle: 1 }); return; }
    this.snapshot();
    if (s.type === 'point') D.points.splice(s.i, 1); else if (s.type === 'piece') D.pieces.splice(s.i, 1); else D.traps.splice(s.i, 1);
    this.sel = null; this.commit();
  }
  /** The thing dragged follows the cursor; the line is relaid a few times a real second while it moves. */
  dragTo(c, dt) {
    const s = this.sel, D = this.def; if (!s || !c) return;
    const cl = (v) => Math.round(Math.max(-LOT.half, Math.min(LOT.half, v)));
    if (s.type === 'point') { D.points[s.i][0] = cl(c.x); D.points[s.i][1] = cl(c.z); }
    else if (s.type === 'piece') { D.pieces[s.i].x = cl(c.x); D.pieces[s.i].z = cl(c.z); }
    else if (s.type === 'trap') { D.traps[s.i].x = cl(c.x); D.traps[s.i].z = cl(c.z); }
    else if (s.type === 'pair') D.traps[s.i].pair = [cl(c.x), cl(c.z)];
    if ((this.relayT = (this.relayT || 0) - dt) <= 0) { this.relayT = 0.15; this.rebuild(); }
  }
  /** After an edit: the track relaid, its checks redrawn, the panel told. */
  commit() { this.rebuild(); this.panel(); }
  rebuild() {
    const R = this.R; this.T = R.made.set(this.def);
    this.check = validate(this.def, this.T); this.budget = budgetOf(this.def);
  }
  keys(dt) {
    const In = this.game.input, D = this.def, s = this.sel; if (!In) return;
    const pan = CAM.pan * this.cam.h * dt;
    if (In.isDown('KeyW') || In.isDown('ArrowUp')) this.cam.z -= pan; if (In.isDown('KeyS') || In.isDown('ArrowDown')) this.cam.z += pan;
    if (In.isDown('KeyA') || In.isDown('ArrowLeft')) this.cam.x -= pan; if (In.isDown('KeyD') || In.isDown('ArrowRight')) this.cam.x += pan;
    this.cam.x = Math.max(-LOT.half, Math.min(LOT.half, this.cam.x)); this.cam.z = Math.max(-LOT.half, Math.min(LOT.half, this.cam.z));
    const ctrl = In.isDown('ControlLeft') || In.isDown('ControlRight');
    if (ctrl && In.wasPressed('KeyZ') && this.undo.length) { this.def = JSON.parse(this.undo.pop()); this.sel = null; this.commit(); return; }
    if (!s) return;
    const once = (k) => In.wasPressed(k);
    let changed = false, item = s.type === 'piece' ? D.pieces[s.i] : s.type === 'trap' || s.type === 'pair' ? D.traps[s.i] : null;
    if (item && (once('KeyQ') || once('KeyE'))) { this.snapshot(); item.yaw = +((item.yaw || 0) + (once('KeyQ') ? -1 : 1) * (Math.PI / 12)).toFixed(2); changed = true; }
    if (s.type === 'point' && (once('BracketLeft') || once('BracketRight'))) { this.snapshot(); const p = D.points[s.i]; p[2] = Math.max(MADE.width[0], Math.min(MADE.width[1], (p[2] ?? MADE.defaultWidth) + (once('BracketLeft') ? -1 : 1))); changed = true; }
    if (item && s.type !== 'piece' && (once('Equal') || once('Minus'))) { this.snapshot(); const C = TRAPS[item.kind].cycle; item.period = +Math.max(C.min, Math.min(C.max, (item.period || C.period) + (once('Equal') ? 0.5 : -0.5))).toFixed(1); changed = true; }
    if (item && s.type !== 'piece' && (once('Comma') || once('Period'))) { this.snapshot(); item.offset = +Math.max(0, Math.min(30, (item.offset || 0) + (once('Period') ? 0.25 : -0.25))).toFixed(2); changed = true; }
    if (once('Delete')) { this.snapshot(); if (s.type === 'piece') D.pieces.splice(s.i, 1); else if (s.type === 'point') { if (D.points.length > MADE.points[0]) D.points.splice(s.i, 1); } else D.traps.splice(s.i, 1); this.sel = null; changed = true; }
    if (changed) this.commit();
  }

  // ---------------------------------------------------------------- the runs
  run(mode) {
    const g = this.game; this.store(); const def = this.slots[this.slot]; if (!def) return;
    if (!this.check?.ok) { g.log?.say('warn', `It will not ride yet: ${this.check?.errors?.[0]?.text || 'lay a line first.'}`, { key: 'edit.run', throttle: 1 }); return; }
    if ((mode === 'haunted' || mode === 'haunt') && !def.traps.length) { g.log?.say('warn', 'A haunt needs traps to haunt.', { key: 'edit.run', throttle: 1 }); return; }
    this.close(false); this.R.made.set(def);
    if (mode === 'haunt') { g.haunt?.start(); return; }
    g.race?.start('made', { mode, solo: mode !== 'haunted' });
  }
  /** Ride it: the line laid where you sail (ModNation's paver). */
  ride() {
    const g = this.game; this.store(); this.close(false);
    this.recording = { pts: [], last: null, len: 0 };
    g.log?.say('skiff', 'Sail the line you want: a point is laid every 35 m. Come back to where you began to close it; /edit to stop.', { key: 'edit.ride', throttle: 2 });
  }
  record() {
    const g = this.game, Rc = this.recording, p = g.player?.pos; if (!p) return;
    const x = p.x - RW.x - LOT.x, z = p.z - RW.z - LOT.z;
    if (Math.max(Math.abs(x), Math.abs(z)) > LOT.half - MADE.margin - MADE.defaultWidth) return;
    if (!Rc.last) { Rc.pts.push([Math.round(x), Math.round(z), MADE.defaultWidth]); Rc.last = { x, z }; return; }
    const d = Math.hypot(x - Rc.last.x, z - Rc.last.z); if (d < RECORD.every) return;
    Rc.len += d; Rc.last = { x, z };
    const [x0, z0] = Rc.pts[0];
    if (Rc.len > RECORD.min && Math.hypot(x - x0, z - z0) < RECORD.close) { this.recording = null; const D = this.slots[this.slot] || blankTrack(); D.points = Rc.pts.slice(0, MADE.points[1]); D.author = null; this.slots[this.slot] = D; this.open(this.slot); return; }
    Rc.pts.push([Math.round(x), Math.round(z), MADE.defaultWidth]);
    if (Rc.pts.length >= MADE.points[1]) { this.recording = null; const D = this.slots[this.slot] || blankTrack(); D.points = Rc.pts; D.author = null; this.slots[this.slot] = D; this.open(this.slot); }
  }

  // ---------------------------------------------------------------- the panel (a placeholder: Calissa's to dress)
  powerOpen(power) {
    const g = this.game; if (g.lend?.has?.('racing') || g.lend?.has?.('arts')) return true;
    const P = GOD_POWERS[power]; if (!P || (P.at ?? 1) <= 1) return true;
    return !!g.system?.unlocked?.(power) || (g.psyche?.level?.(P.domain) ?? 1) >= P.at;
  }
  panel() {
    if (typeof document === 'undefined') return;
    let el = this.el; if (!el) { el = this.el = document.createElement('div'); el.id = 'tedit'; document.body.appendChild(el); el.addEventListener('pointerdown', (e) => e.stopPropagation()); }
    el.style.display = this.active ? 'block' : 'none'; if (!this.active) return;
    const D = this.def, B = this.budget || budgetOf(D), V = this.check || { ok: false, errors: [] }, T = this.T;
    const btn = (label, on, f, dis = false, tip = '') => `<button data-a="${f}" class="${on ? 'on' : ''}" ${dis ? 'disabled' : ''} title="${tip.replace(/"/g, '&quot;')}">${label}</button>`;
    const sel = this.sel, item = sel?.type === 'piece' ? D.pieces[sel.i] : sel?.type === 'trap' || sel?.type === 'pair' ? D.traps[sel.i] : sel?.type === 'point' ? D.points[sel.i] : null;
    const selLine = !sel ? '<span class="dim">Nothing selected.</span>' : sel.type === 'point' ? `Point ${sel.i + 1}: half-width ${item[2]} m ([ and ] to change).`
      : sel.type === 'piece' ? `${PIECES[item.kind].label}: ${PIECES[item.kind].line} (Q / E turn it.)` : `${TRAPS[item.kind].label}: period ${item.period} s (+ / -), offset ${item.offset} s (, / .). ${TRAPS[item.kind].line}`;
    el.innerHTML = `<h3>THE TRACK EDITOR · SLOT ${this.slot + 1}</h3>
      <div>${D.name} ${isValidated(D) ? '<span class="ok">· validated</span>' : '<span class="dim">· not validated</span>'}${T ? ` · ${Math.round(T.length)} m` : ''}</div>
      <div class="row">${[0, 1, 2].map((i) => btn(`Slot ${i + 1}`, i === this.slot, `slot:${i}`)).join('')}${btn('Name', false, 'name')}</div>
      <h3>MAP</h3><div class="map"></div>
      <h3>THE LINE</h3><div class="row">${btn('Select', this.tool === 'select', 'tool:select', false, 'Drag a point, a piece or a trap. RMB takes one out.')}${btn('Point', this.tool === 'point', 'tool:point', false, 'Click a point into the line.')}${btn('Ride it', false, 'ride', false, 'Sail the line; a point every 35 m.')}${btn('New oval', false, 'reset')}</div>
      <h3>PIECES</h3><div class="row">${PIECE_KINDS.map((k) => btn(PIECES[k].label, this.tool === k, `tool:${k}`, !this.powerOpen(PIECES[k].power), this.powerOpen(PIECES[k].power) ? PIECES[k].line : `Opens with the god power ${GOD_POWERS[PIECES[k].power]?.label || PIECES[k].power}.`)).join('')}</div>
      <h3>TRAPS</h3><div class="row">${TRAP_KINDS.map((k) => btn(TRAPS[k].label, this.tool === k, `tool:${k}`, !this.powerOpen(TRAPS[k].power), this.powerOpen(TRAPS[k].power) ? TRAPS[k].line : `Opens with the god power ${GOD_POWERS[TRAPS[k].power]?.label || TRAPS[k].power}.`)).join('')}</div>
      ${this.pendingPair != null ? '<div class="dim">Click where the portal\'s second eye goes.</div>' : ''}
      <h3>RULES</h3><div class="row">${Object.entries(RULES).map(([id, r]) => btn(r.label, D.rules.includes(id), `rule:${id}`, false, r.line)).join('')}</div>
      <h3>SELECTED</h3><div>${selLine}</div>
      <h3>BUDGET ${B.used} / ${B.max}</h3><div class="bar"><i style="width:${Math.min(100, (100 * B.used) / B.max)}%"></i></div>
      <h3>CHECKS</h3><div>${V.ok ? '<span class="ok">It rides.</span>' : V.errors.slice(0, 5).map((e) => `<div class="err">${e.text}</div>`).join('')}</div>
      ${T ? `<div class="dim">Medals: gold ${this.R.made.medals.gold} s, silver ${this.R.made.medals.silver} s, bronze ${this.R.made.medals.bronze} s (three laps, from the ruler).${D.author ? ` Author ${D.author.seconds} s (one lap).` : ''}</div>` : ''}
      <h3>RUNS</h3><div class="row">${btn('Test ride', false, 'run:practice', !V.ok)}${btn('Validate', false, 'run:validate', !V.ok, 'Ride it once to the line, alone: your time is its author time.')}${btn('Haunted race', false, 'run:haunted', !V.ok || !D.traps.length, 'Race the clapperjars while the siblings possess its traps.')}${btn('Haunt', false, 'run:haunt', !V.ok || !D.traps.length, 'The clapperjars race it; you possess its traps.')}</div>
      <h3>KEEP</h3><div class="row">${btn('Save', false, 'save')}${btn('Share code', false, 'share', !isValidated(D), isValidated(D) ? '' : 'Validate it first.')}${btn('Load code', false, 'loadcode')}${btn('Undo', false, 'undo', !this.undo.length)}${btn('Leave', false, 'leave')}</div>
      <div class="dim" style="margin-top:6px">WASD or the arrows pan, the wheel zooms. LMB places or drags, RMB takes out, Delete too, Ctrl+Z undoes.</div>`;
    el.querySelectorAll('button').forEach((b) => { b.onclick = () => this.act(b.dataset.a); });
    el.querySelector('.map')?.appendChild(this.mapCanvas()); this.drawMap();
  }

  /** The line's points as pegs on the lot and the selection as a ring round its thing, while the editor is open (placeholders: the
   *  hand cursor and the handles' dress are Calissa's, docs/handoffs/calissa/). */
  drawHandles() {
    const g = this.game, R = this.R, D = this.def; if (!g.scene || !R) return;
    let H = this.handles;
    if (!H) {
      H = this.handles = { group: new THREE.Group(), pegs: new THREE.InstancedMesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 10), new THREE.MeshBasicMaterial({ color: 0xd2572e, fog: false }), MADE.points[1]), ring: new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 6, 40), new THREE.MeshBasicMaterial({ color: 0x2a1208, fog: false })) };
      H.ring.rotation.x = Math.PI / 2; H.group.add(H.pegs, H.ring); g.scene.add(H.group);
    }
    H.group.visible = this.active; if (!this.active) return;
    const m = new THREE.Matrix4(), y = (x, z) => R.heightAt(RW.x + LOT.x + x, RW.z + LOT.z + z);
    D.points.forEach((p, i) => { m.makeTranslation(RW.x + LOT.x + p[0], y(p[0], p[1]) + 0.6, RW.z + LOT.z + p[1]); H.pegs.setMatrixAt(i, m); });
    H.pegs.count = D.points.length; H.pegs.instanceMatrix.needsUpdate = true;
    const s = this.sel, at = !s ? null : s.type === 'point' ? [D.points[s.i]?.[0], D.points[s.i]?.[1], PICK.point] : s.type === 'piece' ? [D.pieces[s.i]?.x, D.pieces[s.i]?.z, Math.max(3, pieceRadius(D.pieces[s.i] || {}))] : s.type === 'pair' ? [D.traps[s.i]?.pair?.[0], D.traps[s.i]?.pair?.[1], PICK.trap] : [D.traps[s.i]?.x, D.traps[s.i]?.z, PICK.trap];
    H.ring.visible = !!(at && at[0] != null);
    if (H.ring.visible) { H.ring.position.set(RW.x + LOT.x + at[0], y(at[0], at[1]) + 0.3, RW.z + LOT.z + at[1]); H.ring.scale.setScalar(at[2]); }
  }

  /** The whole lot from above (the camera keeps inside the haze, so this is the overview): the line, its pieces and traps, the start,
   *  and the camera's view as a box; a click or a drag on it moves the camera there (Trackmania's and RollerCoaster Tycoon's minimaps). */
  mapCanvas() {
    if (this.map) return this.map;
    const c = (this.map = document.createElement('canvas')); c.width = c.height = MAP.px;
    const go = (e) => { const r = c.getBoundingClientRect(), k = (2 * LOT.half) / r.width; this.cam.x = (e.clientX - r.left) * k - LOT.half; this.cam.z = (e.clientY - r.top) * k - LOT.half; this.drawMap(); };
    c.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.mapDrag = true; go(e); });
    c.addEventListener('pointermove', (e) => { if (this.mapDrag && e.buttons & 1) go(e); });
    addEventListener('pointerup', () => { this.mapDrag = false; });
    return c;
  }
  drawMap() {
    const c = this.map; if (!c || !this.active) return; const x = c.getContext('2d'), D = this.def, T = this.T, k = MAP.px / (2 * LOT.half);
    const at = (lx, lz) => [(lx + LOT.half) * k, (lz + LOT.half) * k];
    x.fillStyle = '#3a2418'; x.fillRect(0, 0, MAP.px, MAP.px);
    x.strokeStyle = 'rgba(255,178,122,.25)'; x.lineWidth = 1; for (let i = 1; i < 8; i++) { const v = (i * MAP.px) / 8; x.beginPath(); x.moveTo(v, 0); x.lineTo(v, MAP.px); x.moveTo(0, v); x.lineTo(MAP.px, v); x.stroke(); }
    if (T) { // (the line at its width, sampled every 6 m)
      x.strokeStyle = '#e8c9a4'; x.lineCap = 'round'; x.lineJoin = 'round';
      for (let s = 0; s < T.length; s += 6) { const a = T.frame(s), b = T.frame(Math.min(T.length - 0.01, s + 6)); x.lineWidth = Math.max(2, a.w * 2 * k); x.beginPath(); x.moveTo(...at(a.x - LOT.x, a.z - LOT.z)); x.lineTo(...at(b.x - LOT.x, b.z - LOT.z)); x.stroke(); }
      const F = T.frame(T.line || 0), [sx, sz] = at(F.x - LOT.x, F.z - LOT.z); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(sx - F.fz * F.w * k, sz + F.fx * F.w * k); x.lineTo(sx + F.fz * F.w * k, sz - F.fx * F.w * k); x.stroke();
    }
    D.points.forEach((p, i) => { const [px, pz] = at(p[0], p[1]), on = this.sel?.type === 'point' && this.sel.i === i; x.fillStyle = on ? '#ffffff' : '#ffb27a'; x.fillRect(px - 1.5, pz - 1.5, 3, 3); });
    for (const P of D.pieces) { const [px, pz] = at(P.x, P.z); x.fillStyle = MAP.piece; x.fillRect(px - 2.5, pz - 2.5, 5, 5); }
    for (const Tp of D.traps) {
      const [px, pz] = at(Tp.x, Tp.z); x.fillStyle = MAP.trap; x.beginPath(); x.arc(px, pz, 3.5, 0, 2 * Math.PI); x.fill();
      if (Tp.pair) { const [qx, qz] = at(Tp.pair[0], Tp.pair[1]); x.strokeStyle = MAP.trap; x.setLineDash([3, 3]); x.lineWidth = 1; x.beginPath(); x.moveTo(px, pz); x.lineTo(qx, qz); x.stroke(); x.setLineDash([]); x.beginPath(); x.arc(qx, qz, 3.5, 0, 2 * Math.PI); x.fill(); }
    }
    // the camera's view: its footprint on the lot (the view's height over the ground through the house fov, and the screen's shape)
    const cam = this.game.camera, hh = this.cam.h * Math.tan(((cam?.fov || 70) * Math.PI) / 360), hw = hh * (cam?.aspect || 1.6), [cx, cz] = at(this.cam.x, this.cam.z);
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.5; x.strokeRect(cx - hw * k, cz - hh * k, 2 * hw * k, 2 * hh * k);
  }
  act(a) {
    const g = this.game, D = this.def, [k, v] = a.split(':');
    if (k === 'tool') { this.tool = v; this.pendingPair = null; }
    else if (k === 'slot') { this.store(); this.close(false); this.open(+v); return; }
    else if (k === 'rule') { this.snapshot(); D.rules = D.rules.includes(v) ? D.rules.filter((x) => x !== v) : [...D.rules, v].slice(0, MADE.maxRules); this.commit(); return; }
    else if (k === 'run') { this.run(v); return; }
    else if (k === 'ride') { this.ride(); return; }
    else if (k === 'reset') { this.snapshot(); this.def.points = blankTrack().points; this.commit(); return; }
    else if (k === 'name') { g.log?.say('info', 'Type /edit name and the name on the chat line.', { key: 'edit.name', throttle: 1 }); return; }
    else if (k === 'save') { this.store(); g.log?.say('info', `Kept in slot ${this.slot + 1}.`, { key: 'edit.save', throttle: 1 }); }
    else if (k === 'share') { this.store(); const code = shareCode(this.slots[this.slot]); navigator.clipboard?.writeText?.(code).catch?.(() => {}); g.log?.say('info', `Its code is copied: ${code.slice(0, 24)}...`, { key: 'edit.share', throttle: 1 }); g.events?.emit('track.share', { by: 'courier' }); }
    else if (k === 'loadcode') { g.log?.say('info', 'Type /edit code and paste the code on the chat line: it loads into this slot.', { key: 'edit.code', throttle: 1 }); return; }
    else if (k === 'undo') { if (this.undo.length) { this.def = JSON.parse(this.undo.pop()); this.sel = null; this.commit(); } return; }
    else if (k === 'leave') { this.close(); return; }
    this.panel();
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game; if (!this.cmds && g.chat) this.commands();
    if (this.recording) { if (!this.R?.active) this.recording = null; else this.record(); }
    if (!this.active) return;
    if (!this.R?.active) { this.close(); return; }
    this.keys(dt);
    if (this.drag) this.dragTo(this.cursor(), dt);
    if ((this.mapT = (this.mapT || 0) + dt) > MAP.every) { this.mapT = 0; this.drawMap(); this.drawHandles(); }
    const look = new THREE.Vector3(RW.x + LOT.x + this.cam.x, RW.y + LOT.y, RW.z + LOT.z + this.cam.z), pos = look.clone().add(new THREE.Vector3(0, this.cam.h, this.cam.h * CAM.lean));
    g.cinema?.shot('editor', { pos, look, fov: 0, bars: 0, ease: 6 });
  }
}
