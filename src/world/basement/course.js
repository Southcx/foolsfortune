// ---------------------------------------------------------------------------
// THE COURSE: the basement's runtime, behind `game.course`.
//
// The checkpoints and reset floors of the course's eight stations and the lab's wings, split times and laps (the bests are a save
// section), the Index's console in the hub with the metrics board, the speed gates, and `teleport`: the one way the Courier is set
// down elsewhere. The rooms the Index lists and the teleports to them are world/rooms.js; the building is basement.js.
//
// Prior art: Trackmania's checkpoints and splits (a clean split only from the last checkpoint in order), Super Meat Boy's reset floor.
//
//   new Course(game) -> { teleport(v, yaw, opts), goTo(i), touch(i), update(dt), respawnHere(), calibration(), rooms, menu, ... }
// ---------------------------------------------------------------------------
import { wholeOf } from '../../render/zonemap.js';
import * as THREE from 'three';
import { PALETTE, T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { FONT } from '../../ui/theme.js';
import { inSiege } from './siege.js';
import { inWeir } from '../../tools/sondelass/angling/weir.js';
import { TECH_CPS, TECH_PITS } from './techwing.js';
import { MILL_CPS, MILL_PITS } from './mill.js';
import { RIG_CPS, HAND_CPS, RIG_PITS } from './rigwing.js';
import { IndexMenu } from '../../feedback/indexmenu.js';
import { ROOM_GLAZE_ID as RG } from '../../vfx/roomglazes.js';
import { addOutline } from '../../render/outline.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { BASE_Y, HUB, CHECKPOINTS, PITS, RUBRIC, glowMat, label, signHelp } from './basement.js';
import { indexRooms, roomSpawns, goRoom, toLab, toDunes, toWeir, toDunemaw, toShore, toSiege, toMill } from '../rooms.js';

// ---- runtime: checkpoints, reset floors, the index console, speed gates, splits ---------
const STORE = 'courseBests'; // (the save's section)

export class Course {
  constructor(game) {
    this.game = game;
    this.current = -1; // last checkpoint touched
    this.t = 0;
    this.running = false;
    this.lapT = null; // running lap time (from room 1's checkpoint)
    this.lapRooms = new Set();
    this.best = {};
    game.save?.section(STORE, { scope: 'player', version: 1, dump: () => this.best, load: (s) => { this.best = { ...s }; }, reset: () => { this.best = {}; } }); // (the splits' bests, the player's)
    // the ring's checkpoints (a lap, with splits), then the tech lab's (no splits)
    this.ringN = CHECKPOINTS.length;
    this.cps = [...CHECKPOINTS, ...TECH_CPS.map((c) => ({ ...c, tech: true })), ...MILL_CPS.map((c) => ({ ...c, tech: true })), ...RIG_CPS.map((c) => ({ ...c, tech: true })), ...HAND_CPS.map((c) => ({ ...c, tech: true }))]
      .map((c) => ({ ...c, v: new THREE.Vector3(c.pos[0], BASE_Y + c.pos[1], c.pos[2]) }));
    this.millN = this.ringN + TECH_CPS.length; // (index of the mill's first checkpoint)
    this.rigN = this.millN + MILL_CPS.length; // (the rigging's, then the hands')
    this.handN = this.rigN + RIG_CPS.length;
    this.pits = [...PITS, ...TECH_PITS.map(([r, i, below]) => [r, i + this.ringN, below]), ...MILL_PITS.map(([r, i, below]) => [r, i + this.millN, BASE_Y + below]), ...RIG_PITS.map(([r, i, below]) => [r, i + this.rigN, BASE_Y + below])];
    Object.assign(this, roomSpawns()); // (millSpawn, weirSpawn, siegeSpawn, hubSpawn, labSpawn: world/rooms.js)
    this.gates = [
      { axis: 'x', at: -8, a0: -36, a1: -20, y: [0, 3] },
      { axis: 'x', at: 18, a0: -36, a1: -20, y: [0, 3] },
      { axis: 'z', at: -4.5, a0: -33.2, a1: -26.8, y: [2, 8] },
    ];
    this.prev = new THREE.Vector3();
    // (no banner: the course's timing is the log's: every station, split and lap is said there; the owner, 2026-10-07)
    this.buildConsole();
    this.buildBoard();
  }

  // metrics board on the hub's south wall: live values from the tuning, and the rubric
  buildBoard() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.board = { c, tex: new THREE.CanvasTexture(c) };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.5), new THREE.MeshBasicMaterial({ map: this.board.tex, transparent: true }));
    m.position.set(-11, BASE_Y + 4.6, -HUB + 0.27);
    this.game.scene.add(m);
    this.refreshBoard();
  }

  /** The calibration numbers (the board's, and the Index's panel): live values from the tuning, and the measured chains. */
  calibration() {
    const M = T.movement;
    const v = M.jumpVelocity, G = M.gravity;
    const air = (2 * v) / G, h = (v * v) / (2 * G), h2 = h + ((v * M.airJumpMult) ** 2) / (2 * G);
    return {
      live: [
        ['walk / sprint / crouch', `${M.walkSpeed} / ${M.sprintSpeed} / ${M.crouchSpeed} m/s`],
        ['slide boost / top speed', `${M.slideSpeed} / ${M.maxSpeed} m/s`],
        ['wallrun speed / time', `${M.wallrunSpeed} m/s / ${M.wallrunMaxTime} s`],
        ['jump height / double', `${h.toFixed(2)} / ${h2.toFixed(2)} m`],
        ['sprint jump (flat)', `${(M.sprintSpeed * air).toFixed(2)} m`],
        ['step / mantle / jump+mantle', `${M.stepHeight} / ${M.mantleMax} / ${(h + M.mantleMax).toFixed(2)} m`],
        ['stand / crouch height', '1.7 / 1.35 m'],
        ['dash', `${M.dashSpeed} m/s, ${M.dashCost} Lachryma`],
      ],
      chains: RUBRIC.map(([k, d]) => [k, `${d} m`]),
    };
  }

  refreshBoard() {
    const g = this.board.c.getContext('2d'), { live, chains } = this.calibration();
    g.clearRect(0, 0, 1024, 640);
    g.fillStyle = 'rgba(28,13,8,0.82)';
    g.fillRect(0, 0, 1024, 640);
    g.strokeStyle = '#ffb27a'; g.lineWidth = 3; g.strokeRect(6, 6, 1012, 628);
    g.fillStyle = '#ffb27a'; g.font = `700 38px ${FONT.title}`;
    g.fillText('METRICS', 30, 58);
    g.fillStyle = '#ffb27a'; g.font = `700 25px ${FONT.title}`;
    g.fillText('LIVE (from the tuning panel)', 30, 104);
    g.font = `23px ${FONT.sys}`;
    live.forEach(([k, val], i) => { g.fillStyle = '#e8ab86'; g.fillText(k, 30, 140 + i * 31); g.fillStyle = '#fff1dc'; g.fillText(val, 470, 140 + i * 31); });
    g.fillStyle = '#ffb27a'; g.font = `700 25px ${FONT.title}`;
    g.fillText('MEASURED CHAINS (default tuning)', 30, 424);
    g.font = `21px ${FONT.sys}`;
    chains.forEach(([k, d], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      g.fillStyle = '#e8ab86'; g.fillText(k, 30 + col * 500, 458 + row * 32);
      g.fillStyle = '#fff1dc'; g.fillText(d, 30 + col * 500 + 380, 458 + row * 32);
    });
    this.board.tex.needsUpdate = true;
  }

  // the index: one console in the hub's first room. F at it opens a menu of the rooms; one teleport
  // each (the stations inside a room are checkpoints: the Tab panel goes back to the last one you touched)
  buildConsole() {
    const S = this.game.scene, B = BASE_Y, cx = 0, cz = -6;
    this.rooms = indexRooms(); // (the rooms the menu lists: world/rooms.js)
    this.menu = new IndexMenu(this.game, this.rooms, (id) => (!id.startsWith('debug.') && this.game.gateRing?.depart(() => this.goRoom(id))) || this.goRoom(id), () => this.calibration()); // (the gate-out under the seam: vfx/gatering.js; the DEBUG rows go at once)
    this.game.indexMenu = this.menu;
    this.console = { x: cx, z: cz };
    this.game.interact?.add('index', (P) => { // (the hub's Index offers the chevron as every other F does: SWEEPS group 8)
      if (this.menu.open || this.game.god?.controlling) return null;
      const d = Math.hypot(P.pos.x - cx, P.pos.z - cz);
      return Math.abs(P.pos.y - BASE_Y) < 0.5 && d < 2.3 ? { pos: new THREE.Vector3(cx, BASE_Y + 1.9, cz), d } : null;
    });
    // the console: a pedestal with a lit face, on a glowing ring
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.8), this.game.level.mat(RG.index));
    ped.position.set(cx, B + 0.55, cz);
    addOutline(ped);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 4, 36), glowMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(cx, B + 0.04, cz);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, opacity: 0.22 }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(cx, B + 0.03, cz);
    S.add(ped, ring2, disc);
    this.consoleDisc = disc;
    const body = this.game.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, B + 0.55, cz));
    this.game.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.8, 0.55, 0.4).setCollisionGroups(GROUPS.static), body);
    label(S, 'INDEX', [cx, B + 0.72, cz - 0.41], { rotY: Math.PI, width: 1.4, vertical: true }); // (a sign names a place; what the keys do is the log's to say: room.help)
    label(S, 'INDEX', [0, B + 3.2, -4.4], { rotY: Math.PI, width: 3, vertical: true });
  }

  // the Index's rooms and the teleports to them live in world/rooms.js; these are the doors others knock on
  goRoom(id) { goRoom(this, id); }
  toLab() { toLab(this); }
  toDunes() { toDunes(this); }
  toWeir() { toWeir(this); }
  toDunemaw() { toDunemaw(this); }
  toShore() { toShore(this); }
  toSiege() { toSiege(this); }
  toMill() { toMill(this); }

  inBasement() { const g = this.game; return g.player.pos.y < -2 && !g.well?.active && !g.dunes?.active && !g.realm?.active && !g.emocean?.stage.active; } // (the Wells, the Dunes and the garden lie lower still: the hub's help was said in the Dunemaw)

  /** Put the Courier at `v` facing `yaw`, everything they were doing let go. The pool is refilled (save-scumming is allowed between
   *  rooms) unless `keepPool` (a Well's floors: going deeper is not a rest). */
  teleport(v, yaw, { keepPool = false } = {}) {
    this.game.areas?.ensureAt(wholeOf(v)); // (a room that builds itself on entry, built before the Courier lands in it: render/areas.js stage 2)
    const p = this.game.player;
    this.game.god?.forceOff?.(); // (set down elsewhere, the hand is let go: its view was left 36 m off in the siege, SWEEPS group 4)
    if (this.game.cradles?.sealed) this.game.cradles.unseal('travel', 'courier', { now: true }); // (set down elsewhere, out of any cradle first, where they stand: its step out would put them back in front of it, world/cradles.js)
    p.pos.copy(v); p.prevPos.copy(v); p.renderPos.copy(v);
    p.vel.set(0, 0, 0);
    p.airPeak = v.y; p.airT = 0; // (a jump taken where they were is not a fall where they arrive: a 400 m 'drop' rolled them past the Well's mouth)
    p.yaw = yaw; p.pitch = 0; p.bodyYaw = yaw;
    p.wallrun = null; p.mantle = null; p.sliding = false; p.dashT = 0; p.riding = null; p.platform = null; p.exiting = 0;
    p.techs?.reset();
    p.standUp(); // (arrived on their feet: a shatter on the belly was made whole still prone)
    const hs = p.techs?.get?.('sondelass')?.hookshot; // (a line out does not come along: it would drag the Courier back across the world)
    if (hs?.att) hs.release('stow');
    hs?.cancel?.();
    this.game.character?.setHidden(false);
    p.airJumps = T.movement.airJumps; p.dashCharges = T.movement.dashCharges; p.slideBoostCd = 0;
    p.place();
    p.markSafe();
    if (!keepPool) this.game.lachryma.reset(); // save-scumming is allowed here
    this.game.fx.absorbSparkle(v.clone().setY(v.y + 1));
    this.prev.copy(v);
  }

  goTo(i, sound = 'dash') {
    const cp = this.cps[i];
    if (this.current !== i) this.lapRooms.clear();
    this.current = i;
    this.teleport(cp.v, cp.yaw);
    this.t = 0;
    this.running = true;
    if (i === 0) this.lapT = 0;
    sfx[sound]();
  }

  respawn() { if (this.current < 0) this.toHub(); else this.goTo(this.current); }

  toHub() {
    this.game.circuits?.leave();
    this.teleport(this.hubSpawn.v, this.hubSpawn.yaw);
    this.running = false;
    this.current = -1;
    this.lapT = null;
    sfx.geyser();
  }

  touch(i) {
    if (i === this.current && this.running) return;
    if (this.cps[i].tech) {
      // a tech station: somewhere to come back to, no splits
      this.current = i; this.t = 0; this.running = true; this.lapT = null; this.lapRooms.clear();
      this.game.events?.emit('course.station', { room: this.cps[i].room, title: this.cps[i].name });
      sfx.lockOn(2);
      return;
    }
    const g = this.game, n = this.ringN;
    const prev = this.current;
    const inOrder = this.running && prev >= 0 && prev < n && (prev + 1) % n === i;
    if (inOrder) {
      // a clean split: straight from the previous room's checkpoint
      const key = `room${this.cps[prev].room}`, t = this.t;
      const pb = !(this.best[key] <= t);
      if (pb) this.best[key] = t;
      g.events?.emit('course.split', { room: this.cps[prev].room, time: t, pb, best: this.best[key] });
      this.lapRooms.add(prev);
    } else this.lapRooms.clear();
    if (i === 0) {
      // full lap: every room in order, back to room 1
      if (inOrder && this.lapT !== null && this.lapRooms.size === n) {
        const lap = this.lapT;
        const pb = !(this.best.lap <= lap);
        if (pb) this.best.lap = lap;
        g.events?.emit('course.lap', { time: lap, pb });
      }
      this.lapT = 0;
      this.lapRooms.clear();
    }
    this.game.save?.dirty(STORE);
    this.current = i;
    this.t = 0;
    this.running = true;
    sfx.lockOn(2);
  }

  /** Back to the last checkpoint (or the start of a circuit, the dunes, the siege): the Tab panel's action (it was R). */
  respawnHere() {
    const g = this.game, p = g.player;
    if (g.circuits?.active) g.circuits.restart(); else if (g.well?.active) g.well.toArrival(); else if (g.dunes.active) this.toDunes(); else if (g.opensea?.active) g.opensea.respawn(); else if (g.raceway?.active) g.raceway.respawn(); else if (g.bazaar?.here) g.bazaar.arrive(); else if (inSiege(p.pos)) this.toSiege(); else this.respawn();
  }

  update(dt) {
    const g = this.game, p = g.player, inp = g.input;
    const here = this.inBasement();
    if (!here) { this.running = false; this.prev.copy(p.pos); this.placeHelp(); return; } // (the Weir's, the Dunes' and the skiff's help are said out there too)
    this.t += dt;
    if (this.lapT !== null) this.lapT += dt;

    const feet = p.pos;
    // checkpoints
    this.cps.forEach((cp, i) => {
      const [x0, x1, z0, z1] = cp.zone;
      if (Math.abs(feet.y - cp.v.y) < 1.5 && feet.x > x0 && feet.x < x1 && feet.z > z0 && feet.z < z1) this.touch(i);
    });
    // reset floors
    // (a pit's own trigger height if it has one: the lab's are dug below its floor, where
    // the ring's are the basement floor itself under raised rooms)
    for (const [[x0, x1, z0, z1], cpi, below = BASE_Y + 0.4] of this.pits) {
      if (feet.y < below && feet.x > x0 && feet.x < x1 && feet.z > z0 && feet.z < z1) {
        this.goTo(cpi, 'fizzle');
        g.events?.emit('course.reset', {});
        return;
      }
    }
    // the index console
    const cs = this.console, nearConsole = Math.abs(feet.y - BASE_Y) < 0.5 && Math.hypot(feet.x - cs.x, feet.z - cs.z) < 2.3;
    this.consoleDisc.material.opacity = nearConsole ? 0.55 : 0.22;
    if (this.game.interact?.cur?.id === 'index' && p.peekLatch?.('KeyF')) { p.latch('KeyF'); this.menu.show(); return; }
    // speed gates
    for (const gt of this.gates) {
      const a = gt.axis === 'x' ? this.prev.x : this.prev.z, b = gt.axis === 'x' ? feet.x : feet.z;
      const side = gt.axis === 'x' ? feet.z : feet.x;
      const hy = feet.y - BASE_Y;
      if ((a - gt.at) * (b - gt.at) < 0 && side > gt.a0 && side < gt.a1 && hy > gt.y[0] - 0.5 && hy < gt.y[1]) {
        g.events?.emit('course.gate', { speed: Math.hypot(p.vel.x, p.vel.z) });
      }
    }
    this.prev.copy(feet);

    this.placeHelp();
    signHelp(g, p.pos);
  }

  /** What the keys do in each place, said once by the log on arriving there (room.help -> tracking.js), not kept on the screen. Asked
   *  every frame wherever the Courier is: the Weir and the Dunes are not the basement (QA-A, 2026-10-22: their lines were never said). */
  placeHelp() {
    const g = this.game, p = g.player;
    const place = g.circuits?.active ? null : inSiege(p.pos) ? 'siege' : g.techs?.active?.id === 'skiff' ? 'skiff' : inWeir(p.pos) ? 'weir' : g.dunes.active ? 'dunes' : this.inBasement() ? 'hub' : null;
    if (place !== this.place) { this.place = place; if (place) g.events?.emit('room.help', { room: place }); }
  }
}
