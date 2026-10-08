// ---------------------------------------------------------------------------------------
// THE PIRATES: the Wreckers' brig, the False Light (docs/plans/RAIL.md section 7; its numbers are progress/rail/setpieces.js PIRATES,
// Dovina's; its look vfx/brig.js, Calissa's; the names Espada's). A ship as a boss with parts, over a set piece's 34 bars:
//
//   SAILS      (bars 0 to 8, looking astern) she closes from behind; her bow chasers lob an OUTLINED shot every two bars: parried
//              back, it holes her bow (6 off her hull)
//   BROADSIDE  (8 to 22, abeam) she runs alongside; her six ports open a bar before each volley (the lid up, the gun out: the
//              telegraph is her body) and fire round shot in a WALL WITH GAPS (three a port, too heavy to parry: move to a gap, or
//              roll); every port shot away widens the gaps. Her four rigging points (the slings of her yards) are a lance each.
//              Boarders swing across every four bars, two at a time; one that stands a bar on your deck takes a cask.
//   THE RAM    (22 to 30, behind the ship) she comes about ahead and bears down on the ship's line: a bar and a half to see it; two
//              of what the ship bears unless you are off her line, or her hull is holed (under a third: she founders first)
//   COLOURS    (from 30) holed, she SINKS and her hold floats astern (two casks to fly through); dismasted or holed past two thirds,
//              she STRIKES her colours (one cask); else she LIMPS off with whatever she stole
//
// Every part is a foe on the waves' roll (world/emocean/waves.js `add`): the hull, each port, each sling, each boarder; so the gun, the
// lock-on and the parry's return find them as they find a fish.
//
// Prior art: Skies of Arcadia's ship battles (a ship of parts, a turn to see each blow coming), Wind Waker's cannon duels, Assassin's
// Creed IV (the broadside, boarding, a struck ship), Sid Meier's Pirates! (they come for the cargo), R-Type's battleship stage (a boss
// you fly alongside, taking it apart gun by gun), Mushihime-sama (a wall of shot is a path).
//
//   const P = new PiratesPiece(stage)   P.build(scene)   P.begin(leg)   P.update(dt, rel, ctx)   P.finish() -> 'sunk' | 'struck' | 'limped'
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PIRATES } from '../../progress/rail/setpieces.js';
import { SCORE } from '../../progress/rail/score.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { BrigLook, BoarderLook } from '../../vfx/brig.js';
import { sfx } from '../../audio/sfx.js';

const B = PIRATES.brig, SIDE = -1; // (her ports toward the ship: she runs on the ship's far side, her -X flank to it)
const ABEAM = -17, ASTERN = -30;   // (rail frame: her place alongside, and astern)
const _w = new THREE.Vector3(), _l = new THREE.Vector3(), _v = new THREE.Vector3();
const lerp = THREE.MathUtils.lerp, smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export class PiratesPiece {
  constructor(stage) { this.stage = stage; this.game = stage.game; this.at = new THREE.Vector3(); }

  build(scene) {
    const g = this.game;
    this.look = new BrigLook({ env: g.sky?.env || null, fx: g.fx || null }); this.look.group.visible = false;
    this.look.group.traverse((o) => { o.userData.zoneFree = true; }); scene.add(this.look.group);
    this.boarders = Array.from({ length: 4 }, () => { const b = new BoarderLook(); b.group.visible = false; b.group.traverse((o) => { o.userData.zoneFree = true; }); scene.add(b.group); return b; });
    // the casks her hold lets go (placeholders: a barrel of crude)
    this.caskGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10).rotateZ(Math.PI / 2); this.caskMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.7, emissive: 0x2a1406, emissiveIntensity: 0.4 });
    this.casks = Array.from({ length: 2 }, () => { const m = new THREE.Mesh(this.caskGeo, this.caskMat); m.visible = false; m.userData.zoneFree = true; scene.add(m); return m; });
  }
  show(on) {
    if (!this.look) return;
    this.look.group.visible = on;
    if (!on) { for (const b of this.boarders) { b.group.visible = false; b.rope.visible = false; } for (const c of this.casks) c.visible = false; }
  }

  /** Alongside (the broadside): the side view's gun fires abeam, at her (courier/ship/ship.js). */
  abeam(rel) { return rel >= 8 && rel < 22 && !this.ended; }

  begin(leg) {
    const st = this.stage, W = st.waves, L = this.look;
    this.leg = leg; this.ended = null; this.sinkT = 0; this.lastBar = -1; this.ram = null; this.floating = [];
    for (let i = 0; i < 6; i++) L.port(i, { side: SIDE, open: 0, gone: false });
    for (let i = 0; i < 4; i++) L.rigging(i, false);
    L.strike(0); L.hurt(0); L.sink(0);
    this.at.set(0, 0, ASTERN - 30); this.heading = 0;
    this.place();
    // her parts on the roll
    this.hull = W.add({
      kind: 'rail.brig', name: 'the False Light', role: 'brig', cls: 4, radius: 4.2, hp: B.hull, local: this.at, chain: false, pay: 0,
      returned: PIRATES.chaser.returned, tick: (dt, f) => { f.local.copy(this.at).setY(1.6); return !this.ended || this.sinkT < 2; },
      onHurt: (f) => this.look.hurt(1 - f.hp / B.hull), onDown: () => this.founder(),
    });
    this.ports = Array.from({ length: B.ports }, (_, i) => W.add({
      kind: 'rail.port', name: 'a gunport', role: 'port', cls: 1, radius: 0.85, hp: B.portHp, chain: false, count: false, pay: SCORE.part.port,
      get solid() { return this.open > 0.05; }, get lock() { return this.solid; }, open: 0,
      tick: (dt, f) => { this.partAt(this.look.portWorld(i, SIDE, _w), f.local); return !this.ended; },
      onDown: () => { this.look.port(i, { side: SIDE, gone: true }); sfx.explosion?.(6); this.game.events?.emit('rail.part', { part: 'port', by: 'courier' }); },
    }));
    this.slings = Array.from({ length: B.rigging }, (_, i) => W.add({
      kind: 'rail.rigging', name: 'a sling', role: 'rigging', cls: 1, radius: 0.9, hp: B.riggingHp, chain: false, count: false, pay: SCORE.part.rigging,
      tick: (dt, f) => { this.partAt(this.look.riggingWorld(i, _w), f.local); return !this.ended; },
      onDown: () => { this.look.rigging(i, true); this.game.events?.emit('rail.part', { part: 'rigging', by: 'courier' }); },
    }));
    this.aboard = [];
    this.show(true);
  }

  /** A part's place in the rail frame, from its world place on her look. */
  partAt(w, out) { return this.stage.rail.toLocal(w, out); }
  /** Her look where she is (rail frame `at`), her bow the way she heads. */
  place() {
    const st = this.stage, L = this.look;
    st.rail.toWorld(this.at, L.group.position); L.group.position.y = st.rail.Q.y + (st.sea ? st.sea.heightAt(L.group.position.x, L.group.position.z) - st.rail.Q.y : 0) * 0.6;
    L.group.rotation.y = this.heading; L.group.updateMatrixWorld(true);
  }

  update(dt, rel, ctx) {
    const st = this.stage, S = st.ship, bar = Math.floor(rel), raw = this.game.rawDt ?? dt, L = this.look;
    // where she sails
    if (this.ended === 'sunk') { this.sinkT += dt / BAR_S; L.sink(Math.min(1, this.sinkT / 2)); this.at.z = lerp(this.at.z, -60, dt * 0.2); }
    else if (this.ended) { this.at.z -= dt * 6; this.at.x = lerp(this.at.x, ABEAM - 12, dt * 0.4); this.heading = lerp(this.heading, -0.3, dt); } // (she limps off, or lies to, astern)
    else if (rel < 8) { this.at.set(lerp(-6, ABEAM, smooth((rel - 6) / 2)), 0, lerp(ASTERN - 30, ASTERN, smooth(rel / 3)) + Math.sin(rel * 0.8) * 2); this.heading = 0; }
    else if (rel < 22) { this.at.set(ABEAM, 0, lerp(this.at.z, 2 + Math.sin(rel * 0.5) * 3, dt * 0.8)); this.heading = 0; }
    else this.ramming(rel, dt);
    this.place();
    L.set({ heel: Math.sin(st.t * 0.7) * 0.05 + (rel >= 8 && rel < 22 ? 0.04 : 0), pitch: Math.sin(st.t * 0.9) * 0.03 });
    // on the bar: her chasers, her ports, her boarders
    if (bar !== this.lastBar && !this.ended) { this.lastBar = bar; this.onBar(bar, rel); }
    // the ports ease open a bar before a volley (the lid, then the gun)
    for (const [i, p] of this.ports.entries()) if (p.alive) { p.flashT = Math.max(0, (p.flashT || 0) - dt); const want = p.flashT > 0 || (rel >= 8 && rel < 22 && (bar - 8) % PIRATES.broadside.every === PIRATES.broadside.every - 1) ? 1 : 0; // (the plate's Flash holds a port open: courier/ship/mounts.js)
      p.open = lerp(p.open, want, Math.min(1, dt * 6)); L.port(i, { side: SIDE, open: p.open }); }
    this.boarding(dt, rel);
    this.flotsam(dt);
    L.update(raw);
    if (!this.ended && rel >= 30) this.close();
  }

  onBar(bar, rel) {
    const st = this.stage, S = st.ship;
    if (rel < 8 && bar % PIRATES.chaser.every === 0) { // (the bow chasers: an outlined shot, slow, to be sent home)
      const bow = _l.copy(this.at).add(_v.set(0, 2.4, 9));
      st.shots.foe(bow, _v.copy(S.local).sub(bow).normalize().multiplyScalar(PIRATES.chaser.speed), { outlined: true, from: this.hull });
      sfx.explosion?.(9);
    }
    if (rel >= 8 && rel < 22 && (bar - 8) % PIRATES.broadside.every === 0) this.broadside();
    if (rel >= 8 && rel < 21 && (bar - 8) % PIRATES.broadside.every === PIRATES.broadside.every - 1) for (const [i, p] of this.ports.entries()) if (p.alive) st.shots.telegraphs?.mark((o) => this.look.portWorld(i, SIDE, o), BAR_S, { radius: 0.85, from: 2.2, alive: () => p.alive && !this.ended }); // (each port that will fire wears the telegraph mark over the bar before the volley, none for a volley that will not come (rel < 21), and it goes with the port: vfx/telegraph.js)
    if (rel >= 9 && rel < 22 && (bar - 9) % PIRATES.boarders.every === 0) for (let k = 0; k < PIRATES.boarders.count; k++) this.board(k);
  }

  /** A volley: three round shot from each open port, across the ship's plane at the port's place: a wall, its gaps where ports are gone. */
  broadside() {
    const st = this.stage, P = PIRATES.broadside;
    for (const [i, p] of this.ports.entries()) {
      if (!p.alive || p.open < 0.5) continue;
      this.look.fire(i, SIDE);
      for (let k = 0; k < P.shotsPerPort; k++) st.shots.foe(_l.set(p.local.x + 1, 1.6 + k * 2.3, p.local.z), _v.set(P.speed, 0, 0), { aspect: null, from: this.hull });
    }
    sfx.explosion?.(4); st.trauma = Math.min(1, st.trauma + 0.15);
    this.game.events?.emit('rail.broadside', { ports: this.ports.filter((p) => p.alive).length, by: 'creature' });
  }

  /** A boarder swings across from her main yard to the ship's deck over a bar; aboard a bar, they take a cask and go back. */
  board(k) {
    const st = this.stage, look = this.boarders.find((b) => !b.group.visible); if (!look) return;
    look.group.visible = true; look.group.scale.setScalar(0.55);
    const yard = this.look.riggingWorld(2, new THREE.Vector3()); // (the main course's sling: where the ropes are made fast)
    const b = st.waves.add({
      kind: 'rail.boarder', name: 'a boarder', role: 'boarder', cls: 1, radius: 0.7, hp: 3, chain: false, pay: SCORE.part.boarder, look, yard, side: k ? 1 : -1, aboardT: 0,
      local: this.partAt(yard, _l),
      tick: (dt, f) => this.swing(dt, f),
      onDown: () => { look.group.visible = false; look.rope.visible = false; },
    });
    b.from = this.partAt(yard, new THREE.Vector3());
    this.aboard.push(b);
  }
  swing(dt, f) {
    const st = this.stage, S = st.ship, sw = PIRATES.boarders.swing * BAR_S, deck = _v.copy(S.local).add(_l.set(f.side * 0.35, 0.5, 0));
    if (f.t < sw) { const k = smooth(f.t / sw); f.local.lerpVectors(f.from, deck, k); f.local.y += Math.sin(k * Math.PI) * 4; }
    else {
      f.local.copy(deck); f.aboardT += dt;
      if (f.aboardT >= PIRATES.boarders.stay * BAR_S) { // (a bar on your deck: a cask taken, and over the side)
        st.run.stolen += PIRATES.boarders.steals;
        this.game.events?.emit('rail.steal', { casks: PIRATES.boarders.steals, by: 'creature' });
        f.look.group.visible = false; f.look.rope.visible = false; return false;
      }
    }
    st.rail.toWorld(f.local, f.pos);
    f.look.set({ pos: f.pos.clone().setY(f.pos.y - 0.4), face: Math.PI / 2, rope: f.t < sw ? this.look.riggingWorld(2, _w).clone() : null, t: st.t });
    return !this.ended || f.t < sw;
  }
  boarding() { this.aboard = this.aboard.filter((b) => b.alive); }

  /** The ram: she pulls ahead, comes about, and bears down on the line the ship held a bar and a half before. */
  ramming(rel, dt) {
    const st = this.stage, S = st.ship, R = PIRATES.ram;
    if (!this.ram) { this.ram = { line: S.local.x, hit: false, t0: rel }; this.game.events?.emit('rail.ram', { eta: R.eta, by: 'creature' }); }
    const k = rel - this.ram.t0;
    if (k < 1) { this.at.set(lerp(ABEAM, this.ram.line, smooth(k)), 0, lerp(this.at.z, 46, Math.min(1, dt * 2))); this.heading = lerp(0, Math.PI, smooth(k)); this.ram.line = S.local.x; }
    else { this.heading = Math.PI; this.at.x = this.ram.line; this.at.z = lerp(46, -40, smooth((k - 1) / (R.eta + 0.5))); }
    if (!this.ram.hit && k > 1 && Math.abs(this.at.z - S.local.z) < 6) {
      this.ram.hit = true;
      if (Math.abs(S.local.x - this.at.x) < 3.2 && S.local.y < 6) st.blow(R.hits, { by: 'creature', what: 'ram' }); // (off her line, or over her rail: missed)
    }
  }

  /** Her hull holed through: she sinks. */
  founder() { if (this.ended) return; this.end('sunk'); }
  /** The set piece's colours bar: struck or limped (sunk is already said). */
  close() {
    const cut = this.slings.every((s) => !s.alive), holed = this.hull.alive && this.hull.hp < B.hull / 3;
    this.end(cut || holed ? 'struck' : 'limped');
  }
  end(how) {
    const st = this.stage;
    this.ended = how;
    if (how === 'struck') this.look.strike(1);
    for (const p of [...this.ports, ...this.slings]) if (p.alive) st.waves.drop(p);
    if (how !== 'sunk' && this.hull.alive) st.waves.drop(this.hull);
    const n = PIRATES.loot[how] || 0;
    for (let i = 0; i < n; i++) { const m = this.casks[i]; m.visible = true; this.floating.push({ m, local: new THREE.Vector3(st.ship.local.x + (i ? 2.5 : -2.5), 0.2, 60 + i * 10) }); }
    this.game.events?.emit('rail.end', { end: how, by: how === 'limped' ? 'creature' : 'courier' });
    st.endPay(how);
  }
  /** Her hold's casks drift toward the ship: fly through one (within 3.5 m across) and it is gathered. */
  flotsam(dt) {
    const st = this.stage, S = st.ship.local;
    for (let i = this.floating.length - 1; i >= 0; i--) {
      const c = this.floating[i]; c.local.z -= 14 * dt;
      st.rail.toWorld(c.local, c.m.position); c.m.rotation.y += dt;
      if (Math.abs(c.local.z - S.z) < 1.5 && Math.abs(c.local.x - S.x) < 3.5) { st.run.won++; c.m.visible = false; this.floating.splice(i, 1); sfx.pop?.(2); this.game.events?.emit('rail.gather', { casks: 1, by: 'courier' }); }
      else if (c.local.z < S.z - 20) { c.m.visible = false; this.floating.splice(i, 1); }
    }
  }

  /** The hook's: the nearest floating cask within r of a point (rail frame), and gathering it. */
  nearestCask(p, r) { let best = null, bd = r; for (const c of this.floating) { const d = c.local.distanceTo(p); if (d < bd) { bd = d; best = c; } } return best; }
  gather(c) { const i = this.floating.indexOf(c); if (i < 0) return; this.floating.splice(i, 1); c.m.visible = false; this.stage.run.won++; sfx.pop?.(2); this.game.events?.emit('rail.gather', { casks: 1, by: 'courier' }); }

  finish() {
    if (!this.ended) this.close();
    const W = this.stage.waves;
    for (const f of [this.hull, ...this.ports, ...this.slings, ...this.aboard]) if (f?.alive) W.drop(f);
    for (const b of this.boarders) { b.group.visible = false; b.rope.visible = false; }
    this.show(false);
    return this.ended;
  }
}
