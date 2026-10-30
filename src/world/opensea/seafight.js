// ---------------------------------------------------------------------------------------
// THE FIGHT AT THE FREE HELM (docs/plans/OPEN-SEA.md section 0's third ruling, "combat only with what is hostile by nature", and section 7):
// what fights on the open sea, kept beside the room (Dovina's opensea.js) and run from main.js after it. The Courier is sealed in at the
// helm, so the ship fights: the psygun is always the ship's gun (the rail's rule, progress/rail/mounts.js), and V is the parry.
//
//   THE GUN      LMB held fires a shot each sixteenth (the rail's cadence) from over the deck along the camera's aim, the mouse and the
//                arrow keys swinging it (helm.js). The aim finds the height: a part of a serpent above the water within a few degrees of
//                the aim is what the shot flies at (the head first), so the camera's bearing is the aim and the sea is not a wall.
//                A shot under the water, or past its life, is gone. Each burst is heard (a `noise` stimulus): shooting draws a hunter.
//   THE BROADSIDE RMB: the side the camera looks out over (port or starboard, within ~63 degrees of its beam) fires its guns at once, each side
//                reloading on its own (Sid Meier's Pirates!, Black Flag): turn the hull to bring a side to bear; its guns are the hull's
//                (SHIPS[ship].guns: a sloop 3, a galleon 8). Its shots are heavy (`heavy`),
//                aimed at the part nearest the beam. Events: sea.broadside { side, guns, aimed }, sea.broadside.dry { side, left }.
//   THE MOUNTS   keys 1 and 2: the worn tools at sea by their arcs (seamounts.js)
//   THE SPIT     an outlined shot (courier/ship/shots.js's word): a glob of crude thrown in an arc at where the ship will be, wearing the
//                parry mark (vfx/parrymark.js); V while it is within reach of the hull sends it back at the head, three blows' worth.
//   THE HULL     the ship bears its class's hits (SHIPS.bears: the sloop six), as on the rail. The ram, the spit and the coil each take
//                one; the last breaks the hull and a tug tows the ship to the lane for the tow's fee, mended (seatrip.js `tow`). A dock
//                mends it. Kept by the save (`seaFight`).
//   THE COIL     while the serpent is wrapped round the hull, the helm turns at half and makes half its way (a modifier on the helm:
//                `helm.mods`, its source the coil); shooting the head breaks it.
//   WHERE THEY LIVE   the game day's lairs (Dovina's seabeasts.js lairsOf: the serpent's, the akhlut's, Jormungandr's that moves a game
//                day; the dock's rumour is one of them); within 380 m of one its beast rises there, out of the water's notice beyond
//                900 m it is gone again. One at a time. Down, a lair is empty until the next game day.
//   THE CREW     a hand a sibling in your party (Dovina's SEA_CREW, progress/rail/mounts.js): Petra mends a hit a real minute out of a
//                fight, Wanda reloads the broadside x0.75, Calissa reads the water (dives pinged), Espada widens the parry's reach x1.5,
//                Dovina shows a windup 0.5 s sooner (`crewLead`). Event: sea.mend { hull, by }.
//
// Prior art: The Legend of Zelda: The Wind Waker's boat cannon (aimed with the camera, the height found for you), Sea of Thieves'
//   Megalodon fight (a hull that takes hits, a hunter circling), Sin & Punishment's returned shot (the parry), Star Fox 64's hits borne.
//
//   game.seaFight = new SeaFight(game)   .update(dt)   .hull   .serpent   .spawnSerpent(pos?)   SEA_FIGHT (its numbers)
//   (called by the serpent's body: .serpentMove(c, move, hit), .serpentFree(c, how))
//   events: sea.hull { hull, of, move, by }, sea.hull.broken { fee, by }, seaserpent.* (creatures/seaserpent/seaserpent.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SHIPS } from '../../progress/rail/ships.js';
import { tow } from '../../progress/opensea/seatrip.js';
import { today } from '../../core/calendar.js';
import { squareCentre } from './seaprops.js';
import { SeaSerpents } from '../../creatures/seaserpent/seaserpent.js';
import { LANCE_COLOR } from '../../courier/ship/shots.js';
import { SeaMounts, MOUNTING } from './seamounts.js';
import { SEA_CREW } from '../../progress/rail/mounts.js';
import { SEA_BEAST_IDS } from '../../creatures/seaserpent/seaserpent.js';
import { phaseAt } from '../../progress/weather.js';
import { lairsOf as beastLairs } from '../../progress/opensea/seabeasts.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/opensea/seafight'); // (the simulation's chance: core/rng.js, the same twice)

/** gun: a shot each `every` real s, its speed (m/s), life (s), radius (m), power, the aim's cone (rad) and reach (m), how high over the deck
 *  it leaves (m); glob: the spit's speed (m/s), its fall (m/s each s), life (s), radius (m), the parry's reach from the hull's footprint (m), its speed
 *  sent back and its power; hurt: how near the hull's footprint a glob hits (m, helm.hullDist); knock: the ram's (a share of the way kept, the yaw thrown, rad);
 *  coil: the helm's turn and way while wrapped; broadside: a side's reload (real s), its shots' speed, life,
 *  radius and power, the aim's cone off the beam (rad) and reach (m), each gun's scatter, and how square to a side the camera must look (|cos|); lair: a beast risen within `near` m of its lair, gone past `far` m. */
export const SEA_FIGHT = {
  gun: { every: 0.125, speed: 90, life: 1.5, r: 0.3, power: 0.5, cone: 0.16, reach: 150, from: 1.4 }, // (power: 0.5, Dovina's 14.6: the bow gun alone 2 to 2.5 real min a serpent, the broadside used well about 1)
  broadside: { reload: 4, speed: 75, life: 2.4, r: 0.6, power: 3, cone: 0.6, reach: 180, spread: 0.04, beam: 0.45 }, // (ruled: OPEN-SEA.md 14.6; a side's guns are the hull's, SHIPS[ship].guns)
  glob: { speed: 24, fall: 7, life: 5, r: 0.7, reach: 7, back: 46, power: 3 },
  hurt: 1.2, knock: { keep: 0.25, yaw: 0.35 }, coil: { turn: 0.5, speed: 0.5 },
  lair: { near: 380, far: 900 }, noise: { radius: 90, every: 1 },
};
const GN = SEA_FIGHT.gun, GL = SEA_FIGHT.glob, CAP = { shots: 64, globs: 6 };
const _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
const _z = new THREE.Vector3(0, 0, 1), _hide = new THREE.Matrix4().makeScale(0, 0, 0);

export class SeaFight {
  constructor(game) {
    this.game = game; this.serpents = game.seaSerpents = new SeaSerpents(game);
    this.hull = SHIPS.sloop.bears; this.down = new Map(); // (lair id -> the game day its serpent went down)
    this.shots = []; this.globs = []; this.reload = [0, 0]; this.mounts = new SeaMounts(this); this.fireT = 0; this.noiseT = 0; this.lairs = null; this.spawnT = 0; this.grounded = false;
    // the placeholders, drawn only without game.seaFightLook (Calissa's: vfx/opensea/seafightlook.js): the gun's needles in one instanced
    // draw, the globs as dark spheres wearing the parry mark
    this.needles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 1.8), new THREE.MeshBasicMaterial({ color: LANCE_COLOR }), CAP.shots);
    this.needles.frustumCulled = false; this.needles.userData.zone = 'opensea'; this.needles.count = 0; game.scene.add(this.needles);
    const gm = new THREE.MeshStandardMaterial({ color: 0x16110c, roughness: 0.15, metalness: 0.3, emissive: 0x2a1406 }), gg = new THREE.SphereGeometry(GL.r, 14, 10);
    this.pool = Array.from({ length: CAP.globs }, () => { const m = new THREE.Mesh(gg, gm); m.visible = false; m.userData.zone = 'opensea'; game.scene.add(m); return m; });
    game.save?.section('seaFight', { scope: 'player', version: 1, dump: () => ({ hull: this.hull, down: [...this.down] }), load: (d) => { this.hull = d?.hull ?? SHIPS.sloop.bears; this.down = new Map(d?.down || []); }, reset: () => { this.hull = SHIPS.sloop.bears; this.down.clear(); } });
    game.events?.on?.('sea.dock', () => this.mend());
    game.events?.on?.('seaserpent.down', (e) => { if (e.lair) { this.down.set(e.lair, today()); this.dirty(); } });
    game.events?.on?.('seabeast.down', (e) => { if (e.lair) { this.down.set(e.lair, today()); this.dirty(); } });
  }
  get room() { return this.game.opensea; }
  get serpent() { return this.serpents.list.find((c) => c.alive) || null; }
  /** The crew aboard: the siblings in your party that have a hand at sea. */
  get crew() { return new Set((this.game.party?.list || []).map((S) => S.id).filter((id) => SEA_CREW[id])); }
  /** How much sooner a beast's windup shows (real s): Dovina's hand. */
  crewLead() { return this.crew.has('dovina') ? SEA_CREW.dovina.foresight.lead : 0; }
  get bears() { return (SHIPS[this.room?.helm?.ship || 'sloop']?.bears ?? 6) + (this.game.shipParts?.mult?.('bears') ?? 0); } // (a part may add to the hull: salvage.js)
  dirty() { this.game.save?.dirty?.('seaFight'); }
  mend() { this.mounts.refill(); if (this.hull !== this.bears) { this.hull = this.bears; this.dirty(); } }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    const g = this.game, R = this.room;
    if (!this.chatted && g.chat?.add) { this.chatted = true; g.chat.add('serpent', { debug: true, help: 'a sea serpent risen 120 m off the bow (DEBUG; on the open sea, at the helm)', run: () => this.spawnSerpent() }); g.chat.add('beast', { debug: true, help: '/beast wolfWhale | seaMonk | bigSquid | worldSerpent: a sea beast risen off the bow (DEBUG; at the helm)', run: (a) => this.spawnSerpent(String(a?.[0] ?? a ?? 'wolfWhale').trim() || 'wolfWhale') }); }
    if (!R?.built || !R.active) { if (this.serpents.list.length || this.shots.length || this.globs.length) this.clear(); return; }
    const H = R.helm;
    this.lairsOf(R);
    if ((this.spawnT -= dt) <= 0) { this.spawnT = 1; this.tend(R); }
    this.serpents.update(dt);
    this.tendCrew(dt);
    if (R.sailing) { this.gun(dt, g.input, H); this.broadside(dt, g.input, H); this.mounts.update(dt, g.input, H); this.parry(g.input, H); }
    if (this.serpent?.coiled && R.sailing) H.mods?.set('coil', SEA_FIGHT.coil); else H.mods?.delete('coil');
    this.fly(dt, H);
    this.draw();
    const fighting = this.serpents.list.length > 0; // (a Figment attack telegraph lies on the water while a serpent lives)
    if (fighting !== this.grounded && g.figmentTelegraphs) { this.grounded = fighting; g.figmentTelegraphs.ground = fighting ? (x, z) => this.serpents.surf(x, z) : null; }
  }
  clear() {
    for (const c of [...this.serpents.list]) this.serpents.remove(c);
    for (const s of this.shots) s.gone = true; this.shots.length = 0;
    for (const b of this.globs) this.dropGlob(b); this.globs.length = 0;
    this.mounts.clear(); for (const k of ['coil', 'grip', 'grasp', 'kraken']) this.room?.helm?.mods?.delete(k); this.draw();
    if (this.grounded && this.game.figmentTelegraphs) { this.grounded = false; this.game.figmentTelegraphs.ground = null; }
  }

  // ---------------------------------------------------------------- where serpents live
  /** The game day's lairs of the beasts this chassis carries (Dovina's lairsOf, progress/opensea/seabeasts.js: a territory kept, the legend
   *  moving a game day; the rumour posted at the dock is one of them, so the beast posted is the beast there). */
  lairsOf(R) {
    const day = today();
    if (this.lairs && this.lairsSeed === R.seed && this.lairsDay === day) return this.lairs;
    this.lairsSeed = R.seed; this.lairsDay = day;
    const bySq = new Map(R.grid.squares.map((sq) => [sq.id, sq]));
    this.lairs = beastLairs(R.grid, R.seed, day).filter((l) => SEA_BEAST_IDS.includes(l.id) && bySq.has(l.square)).map((l) => {
      const sq = bySq.get(l.square), at = squareCentre(sq.col, sq.row).setY(R.helm?.pos.y ?? 0);
      for (const isl of R.props?.islets || []) if (Math.hypot(isl.pos.x - at.x, isl.pos.z - at.z) < isl.r + 80) at.x += isl.r + 120; // (open water, off its islet)
      return { id: `${l.id}:${l.square}`, beast: l.id, pos: at, when: l.when || null };
    });
    return this.lairs;
  }
  /** A serpent risen at a lair the ship comes near (one at a time, none at a lair downed today), and gone when the ship is far off. */
  tend(R) {
    const P = R.sailing ? R.helm.pos : this.game.player.pos, live = this.serpents.list;
    for (const c of live) if (c.alive && !c.brain.action?.hunt && Math.hypot(c.pos.x - P.x, c.pos.z - P.z) > SEA_FIGHT.lair.far) this.serpents.remove(c);
    if (live.length) return;
    const day = today();
    const lair = this.lairs.find((l) => this.down.get(l.id) !== day && this.upNow(l) && Math.hypot(l.pos.x - P.x, l.pos.z - P.z) < SEA_FIGHT.lair.near);
    if (lair) this.serpents.spawn(lair.pos.clone(), { lair: lair.id, beast: lair.beast });
  }
  /** Whether a lair's beast is up now: its `when` (the umibozu's calm night, or dread: seabeasts.js LAIRS), either one. */
  upNow(l) {
    const W = l.when; if (!W) return true;
    return (!!W.phase && phaseAt() === W.phase) || (!!W.weather && this.game.weather?.now?.aspect === W.weather);
  }
  /** DEBUG's `/serpent`: one risen 120 m off the bow, sure of you. */
  spawnSerpent(beast = 'seaSerpent') {
    const R = this.room, g = this.game;
    if (!R?.sailing) { g.log?.say?.('warn', 'At the helm on the open sea only.', { key: 'serpent.cmd', throttle: 2 }); return; }
    for (const c of [...this.serpents.list]) this.serpents.remove(c);
    const H = R.helm, at = H.pos.clone().add(_a.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)).multiplyScalar(120));
    if (!SEA_BEAST_IDS.includes(beast)) { g.log?.say?.('warn', `No such beast here: ${SEA_BEAST_IDS.join(', ')}.`, { key: 'serpent.cmd', throttle: 2 }); return; }
    const c = this.serpents.spawn(at, { yaw: H.yaw + Math.PI, beast });
    c.mem.see(g.player, 'courier', H.pos, 1); c.under = 0.4; c.goUnder = 0.1;
  }

  // ---------------------------------------------------------------- the ship's gun
  gun(dt, I, H) {
    const g = this.game; this.fireT -= dt; this.noiseT -= dt;
    if (!I.isDown('Mouse0') || this.fireT > 0) return;
    this.fireT = GN.every;
    const from = _a.copy(H.pos).setY(H.pos.y + (H.look?.deckY || 1) + GN.from).addScaledVector(_b.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), 2);
    g.camera.getWorldDirection(_d); const yaw = Math.atan2(_d.x, _d.z);
    let aim = null, best = GN.cone; // (the aim finds the height: an exposed part near the camera's bearing, the head favoured)
    for (const c of this.serpents.list) {
      if (!c.alive) continue;
      for (let i = 0; i < c.spine.length; i++) {
        if (!this.serpents.exposed(c, i)) continue;
        const p = this.serpents.at(c, i), dist = Math.hypot(p.x - from.x, p.z - from.z); if (dist > GN.reach) continue;
        let da = Math.atan2(p.x - from.x, p.z - from.z) - yaw; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const s = Math.abs(da) - Math.atan2(this.serpents.rOf(c, i), dist) - (i === 0 ? 0.05 : 0); // (its own breadth widens the cone)
        if (s < best) { best = s; aim = p; }
      }
    }
    if (aim) _d.subVectors(aim, from).normalize(); else _d.set(Math.sin(yaw), 0.015, Math.cos(yaw)).normalize();
    if (this.shots.length >= CAP.shots) this.shots.shift();
    this.shots.push({ pos: from.clone(), prev: from.clone(), vel: _d.clone().multiplyScalar(GN.speed), t: GN.life, ...(this.mounts.takeGulp() ? { power: GN.power * MOUNTING.gulp.k, gulped: true } : { power: GN.power }) }); // (a spit gulped goes back on the next shot, marked for the look)
    g.seaFightLook?.muzzle(from, _d, this.shots[this.shots.length - 1]); // (the look's: vfx/opensea/seafightlook.js; the shot itself its third, light or heavy)
    if (this.noiseT <= 0) { this.noiseT = SEA_FIGHT.noise.every; g.ai?.stimuli.emit('noise', H.pos, { radius: SEA_FIGHT.noise.radius, strength: 1, by: 'courier', source: g.player }); }
  }

  // ---------------------------------------------------------------- the broadside
  /** RMB: the side the camera looks out over fires all its guns at once (port or starboard, each reloading on its own), so the rudder is the
   *  fight: turn to bring a side to bear. Each gun's shot flies at the exposed part nearest that beam (its height found), scattered a little;
   *  the ports are the look's (`look.ports(side)`, world points, Calissa's) or spaced along the middle three-fifths of the hull's side. */
  broadside(dt, I, H) {
    const g = this.game, BS = SEA_FIGHT.broadside, rl = this.reload;
    rl[0] = Math.max(0, rl[0] - dt); rl[1] = Math.max(0, rl[1] - dt);
    if (!I.wasPressed('Mouse2')) return;
    g.camera.getWorldDirection(_d);
    const sy = Math.sin(H.yaw), cy = Math.cos(H.yaw), dot = _d.x * cy - _d.z * sy; // (the look on port's normal, (cos, 0, -sin))
    if (Math.abs(dot) < BS.beam) return; // (looking fore or aft: no side bears)
    const k = dot > 0 ? 0 : 1, side = k ? 'starboard' : 'port', sg = k ? -1 : 1, nx = sg * cy, nz = -sg * sy;
    if (rl[k] > 0) { g.events?.emit('sea.broadside.dry', { side, left: +rl[k].toFixed(1), by: 'courier' }); return; }
    rl[k] = BS.reload * (this.crew.has('wanda') ? SEA_CREW.wanda.reload : 1); // (Wanda at the guns)
    const bear = Math.atan2(nx, nz); let aim = null, best = BS.cone;
    for (const c of this.serpents.list) {
      if (!c.alive) continue;
      for (let i = 0; i < c.spine.length; i++) {
        if (!this.serpents.exposed(c, i)) continue;
        const p = this.serpents.at(c, i), dist = Math.hypot(p.x - H.pos.x, p.z - H.pos.z); if (dist > BS.reach) continue;
        let da = Math.atan2(p.x - H.pos.x, p.z - H.pos.z) - bear; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const sc = Math.abs(da) - (i === 0 ? 0.08 : 0); if (sc < best) { best = sc; aim = p; } // (the head favoured)
      }
    }
    const L = H.look?.length ?? 7, half = (H.look?.beam ?? 2.4) / 2, y = H.pos.y + (H.look?.deckY || 1) + 0.2, ports = H.look?.ports?.(side), guns = SHIPS[H.ship]?.guns ?? 3;
    for (let i = 0; i < guns; i++) {
      const t = guns > 1 ? (i / (guns - 1) - 0.5) * L * 0.6 : 0;
      const from = ports?.[i]?.clone?.() ?? new THREE.Vector3(H.pos.x + sy * t + nx * half, y, H.pos.z + cy * t + nz * half);
      if (aim) _a.subVectors(aim, from).normalize(); else _a.set(nx, 0.03, nz);
      _a.x += (simRand() - 0.5) * BS.spread; _a.y += (simRand() - 0.5) * BS.spread * 0.5; _a.z += (simRand() - 0.5) * BS.spread; _a.normalize();
      if (this.shots.length >= CAP.shots) this.shots.shift();
      this.shots.push({ pos: from, prev: from.clone(), vel: _a.clone().multiplyScalar(BS.speed), t: BS.life, power: BS.power, r: BS.r, heavy: true });
      g.seaFightLook?.muzzle(from, _a, this.shots[this.shots.length - 1]);
    }
    g.events?.emit('sea.broadside', { side, guns, aimed: !!aim, by: 'courier' });
    g.ai?.stimuli.emit('noise', H.pos, { radius: SEA_FIGHT.noise.radius * 1.5, strength: 1.4, by: 'courier', source: g.player });
  }

  // ---------------------------------------------------------------- the parry at the helm
  parry(I, H) {
    if (!I.wasPressed('KeyV')) return;
    const g = this.game, reach = GL.reach * (this.crew.has('espada') ? SEA_CREW.espada.parry : 1); let hit = null, bd = Infinity; // (Espada's riposte)
    _a.copy(H.pos).setY(H.pos.y + 1);
    for (const b of this.globs) {
      if (b.back) continue;
      const d = H.hullDist(b.pos); if (d > reach || d >= bd) continue; // (from the hull's footprint, not its middle: 324)
      if (b.vel.dot(_b.subVectors(_a, b.pos)) <= 0) continue; // (only one still coming)
      bd = d; hit = b;
    }
    if (!hit) return;
    hit.back = true; hit.t = GL.life; hit.mark?.clear(); hit.mark = null;
    g.events?.emit('move.parry', { tool: H.ship, how: 'return', what: 'shot', d: +bd.toFixed(2), reach, by: 'courier' });
  }

  // ---------------------------------------------------------------- what the serpent's moves do
  serpentMove(c, move, hit) {
    const R = this.room, H = R?.helm; if (!H || !R.sailing) return;
    const hits = c.row?.moves?.[move]?.hits ?? 1; // (a beast's move its row's hits: the breach 2, the coil of the world 3)
    if ((move === 'ram' || move === 'rise' || move === 'breach') && hit) { H.speed *= SEA_FIGHT.knock.keep; H.yaw += (simRand() < 0.5 ? -1 : 1) * SEA_FIGHT.knock.yaw; for (let i = 0; i < hits; i++) this.hullHit(move); }
    else if ((move === 'coil' || move === 'coilWorld' || move === 'grip' || move === 'grasp' || move === 'slam') && hit) for (let i = 0; i < hits; i++) this.hullHit(move); // (the grip's a pour each `fill` s: creatures/seaserpent/shapes.js)
    else if (move === 'spit') { const n = c.row?.moves?.spit?.every ?? 1; for (let i = 0; i < n; i++) this.spit(c, H, n > 1 ? (i - (n - 1) / 2) * 0.22 : 0); } // (a fan of `every`: one aimed true)
  }
  /** Petra's hand: a hit mended each `mend.every` real s while no beast lives nearby. */
  tendCrew(dt) {
    if (!this.crew.has('petra') || this.serpents.list.some((c) => c.alive) || this.hull >= this.bears) { this.mendT = 0; return; }
    if ((this.mendT = (this.mendT || 0) + dt) < SEA_CREW.petra.mend.every) return;
    this.mendT = 0; this.hull++; this.dirty();
    this.game.events?.emit('sea.mend', { hull: this.hull, of: this.bears, by: 'courier' });
  }
  serpentFree() { this.room?.helm?.mods?.delete('coil'); }
  /** A glob thrown in an arc at where the ship will be when it lands. */
  spit(c, H, spread = 0) {
    const head = c.head(), g = this.game;
    const from = _a.copy(head).setY(head.y + 0.6), d0 = Math.hypot(H.pos.x - from.x, H.pos.z - from.z), T = Math.max(0.6, d0 / GL.speed);
    const to = _b.set(H.pos.x + Math.sin(H.yaw) * H.speed * T, H.pos.y + 1, H.pos.z + Math.cos(H.yaw) * H.speed * T);
    if (spread) { const a = Math.atan2(to.x - from.x, to.z - from.z) + spread, dd = Math.hypot(to.x - from.x, to.z - from.z); to.x = from.x + Math.sin(a) * dd; to.z = from.z + Math.cos(a) * dd; } // (a fan's others thrown wide)
    const vel = new THREE.Vector3().subVectors(to, from).divideScalar(T); vel.y += 0.5 * GL.fall * T;
    if (this.globs.length >= CAP.globs) this.dropGlob(this.globs.shift());
    const m = this.pool.find((x) => !x.visible) || this.pool[0];
    const L = g.seaFightLook; m.visible = !L; m.position.copy(from); // (the look draws the glob as the rail's outlined shot, its parry mark with it)
    this.globs.push({ pos: from.clone(), vel, t: GL.life, back: false, from: c, m, mark: L ? null : g.parryMark?.mark(m, { eta: null }) || null });
  }
  dropGlob(b) { if (!b) return; b.mark?.clear(); b.mark = null; b.m.visible = false; }
  hullHit(move) {
    const g = this.game, R = this.room, k = g.classArtsRun?.reinsK?.() ?? 1; // (Reins, a class's art: a share of each hit spared, a whole one let off as it adds up)
    if (k < 1 && (this.spare = (this.spare || 0) + (1 - k)) >= 1) { this.spare -= 1; g.classArtsRun?.fire?.('reins'); return; }
    this.hull = Math.max(0, this.hull - 1); this.dirty();
    g.player.shake = Math.max(g.player.shake || 0, 0.5);
    g.events?.emit('sea.hull', { hull: this.hull, of: this.bears, move, by: 'creature' });
    if (this.hull > 0) return;
    // the hull broken: a tug tows the ship to the lane for the tow's fee, mended there; the serpent loses it
    const ev = tow(R.voyage), fee = ev[0]?.fee ?? 0;
    g.cubes?.spend(Math.min(fee, g.cubes.balance ?? 0), 'tow');
    for (const c of [...this.serpents.list]) this.serpents.remove(c);
    this.hull = this.bears; this.dirty(); R.dirty?.();
    g.events?.emit('sea.hull.broken', { fee, by: 'creature' });
    R.towed();
  }

  // ---------------------------------------------------------------- what flies
  fly(dt, H) {
    const S = this.serpents, g = this.game;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.prev.copy(s.pos); s.pos.addScaledVector(s.vel, dt); s.t -= dt;
      const hit = S.partsHit(s.prev, s.pos, s.r ?? GN.r);
      if (hit) { g.creatures.strike(hit.c, hit.point, _d.copy(s.vel).normalize(), s.power ?? GN.power, 'shot', 'courier'); g.seaFightLook?.hit(hit.point, _d, s); this.shots.splice(i, 1); continue; }
      if (s.t <= 0 || s.pos.y < S.surf(s.pos.x, s.pos.z) - 0.2) { if (s.t > 0) g.seaFightLook?.splash(s.pos, 'shot', s); this.shots.splice(i, 1); }
    }
    for (let i = this.globs.length - 1; i >= 0; i--) {
      const b = this.globs[i]; b.t -= dt;
      if (b.back) { // (sent back: it flies home to the head)
        const c = b.from, head = c?.alive ? c.head() : null;
        if (head) { _a.subVectors(head, b.pos); const d = _a.length(); b.vel.copy(_a).multiplyScalar(GL.back / Math.max(d, 1e-3)); if (d < this.serpents.rOf(c, 0) + GL.r + 0.5) { g.creatures.strike(c, head, _d.copy(b.vel).normalize(), GL.power, 'parry', 'courier'); g.seaFightLook?.hit(head, _d); this.dropGlob(b); this.globs.splice(i, 1); continue; } }
        b.pos.addScaledVector(b.vel, dt);
      } else {
        b.vel.y -= GL.fall * dt; b.pos.addScaledVector(b.vel, dt);
        if (H && H.hullDist(b.pos) < SEA_FIGHT.hurt && b.pos.y < H.pos.y + (H.look?.deckY || 1) + 3 && this.room.sailing) { g.seaFightLook?.hull(b.pos); this.dropGlob(b); this.globs.splice(i, 1); this.hullHit('spit'); continue; }
      }
      b.m.position.copy(b.pos);
      if (b.t <= 0 || b.pos.y < S.surf(b.pos.x, b.pos.z) - 0.5) { if (b.t > 0) g.seaFightLook?.splash(b.pos, 'glob'); this.dropGlob(b); this.globs.splice(i, 1); }
    }
  }
  draw() {
    const N = this.needles, L = this.game.seaFightLook;
    if (L) { L.draw(this); N.count = 0; return; } // (the look's needles and globs; these are the placeholders without it)
    N.count = this.shots.length;
    for (let i = 0; i < this.shots.length; i++) { const s = this.shots[i]; _q.setFromUnitVectors(_z, _d.copy(s.vel).normalize()); _m.compose(s.pos, _q, _s); N.setMatrixAt(i, _m); }
    if (!this.shots.length) N.setMatrixAt(0, _hide);
    N.instanceMatrix.needsUpdate = true;
  }
}
