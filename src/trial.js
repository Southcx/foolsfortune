import * as THREE from 'three';
import { T, PALETTE } from './config.js';
import { makeGlowOutline, addOutline } from './outline.js';
import { sfx } from './audio.js';

// ---------------------------------------------------------------------------
// Time trial: G starts. The room resets, shells and Lachryma are topped up,
// and a dozen glowing trial jars appear around both floors. Break them all.
// Deliberately forgiving: the jars glow through walls, an arrow points at the
// nearest one, quick double-breaks shave time off, and the medals are generous.
// ---------------------------------------------------------------------------

// [x, y (surface), z]: a route that wants a mantle, the geyser (or stairs), a dash
// across the atrium and a banked or seeking shot or two
const COURSE = [
  [3.2, 0.95, -4.5], // workbench
  [6.4, 0.9, -1.2], // clay block by the geyser
  [8.6, 1.2, 12.4], // the raised platform
  [-4.5, 0.5, 9.8], // clay block by the kiln
  [-8.2, 2.6, 8.5], // mezzanine (jump + mantle, or the stairs)
  [-8.3, 2.6, -1.8], // far end of the mezzanine
  [0, 4.6, 0], // floating in the atrium
  [0, 8.2, -11.5], // top of the showroom pyramid
  [6, 7.95, -9.2], // showroom table
  [-6.2, 7.3, -1], // west showcase
  [0, 7.4, 11.2], // gallery plinth
  [6.5, 8.1, 8], // gallery pedestal
];
const STORE = 'foolsfortune.trial.best';
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

export class Trial {
  constructor(game) {
    this.game = game;
    this.state = 'off';
    this.jars = [];
    this.t = 0;
    this.best = null;
    try { this.best = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { /* storage unavailable */ }
    this.glow = makeGlowOutline(PALETTE.hot, 0.012);
    this.xray = makeGlowOutline(PALETTE.glow, 0.005, true);
    this.el = {
      box: document.getElementById('trial'),
      time: document.querySelector('#trial .time'),
      count: document.querySelector('#trial .count'),
      medals: document.querySelector('#trial .medals'),
      big: document.getElementById('trialbig'),
      arrow: document.getElementById('trialarrow'),
    };
  }

  get running() { return this.state === 'countdown' || this.state === 'run'; }

  start() {
    const g = this.game;
    this.clearJars();
    this.starting = true;
    g.resetRoom();
    this.starting = false;
    const P = g.player;
    P.respawn('trial');
    P.yaw = 0;
    for (const k of Object.keys(g.shells.counts)) g.shells.counts[k] = T.shells.max;
    g.lachryma.reset();
    // clear anything sitting where a jar goes, then place the jars (fixed, one-shot)
    for (const [x, y, z] of COURSE) {
      for (const ent of [...g.breakables.items]) {
        const t = ent.body.translation();
        if (Math.hypot(t.x - x, t.z - z) < 0.6 && Math.abs(t.y - y) < 1.2) g.breakables.removeQuiet(ent);
      }
      const ent = g.breakables.spawn({ kind: 'lantern', pos: [x, y + 0.01, z], scale: 1.25, color: PALETTE.cream, target: true, trial: true, hp: 1, yaw: 0, popIn: true });
      ent.glowMesh = addOutline(ent.mesh, this.glow);
      ent.glowMesh.renderOrder = 9;
      const xr = new THREE.Mesh(ent.mesh.geometry, this.xray);
      xr.renderOrder = 10;
      ent.mesh.add(xr);
      // a soft halo so they read from across the room
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: PALETTE.glow, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(ent.P.height * 3.2);
      halo.position.y = ent.P.height * 0.5;
      halo.renderOrder = 3;
      ent.mesh.add(halo);
      ent.halo = halo;
      this.jars.push(ent);
    }
    g.stats.total = [...g.breakables.items].filter((e) => !e.def.target).length;
    this.left = this.jars.length;
    this.t = 0;
    this.bonus = 0;
    this.lastBreak = -9;
    this.countdown = 3;
    this.state = 'countdown';
    this.el.box.style.display = 'block';
    this.showBig('3');
    sfx.lockOn(1);
  }

  /** Room reset from elsewhere (T): drop the trial. */
  abort() {
    if (this.starting || this.state === 'off') return;
    this.state = 'off';
    this.clearJars();
    this.el.box.style.display = 'none';
    this.el.arrow.style.display = 'none';
    this.game.player.freeze = false;
  }

  clearJars() {
    for (const ent of this.jars) if (ent.alive) this.game.breakables.removeQuiet(ent);
    this.jars = [];
  }

  onTarget(ent) {
    if (this.state !== 'run' && this.state !== 'countdown') return;
    this.left--;
    const g = this.game;
    // quick double: two jars within the window shave a second
    if (this.t - this.lastBreak < T.trial.quickWindow) {
      this.bonus += T.trial.quickBonus;
      g.hud.popup(`QUICK −${T.trial.quickBonus}s`);
    } else g.hud.popup(`${this.jars.length - this.left}/${this.jars.length} · ${fmt(this.time)}`);
    this.lastBreak = this.t;
    sfx.lockOn(this.jars.length - this.left);
    if (this.left <= 0) this.finish();
  }

  get time() { return Math.max(0, this.t - this.bonus); }

  finish() {
    const time = this.time;
    const M = T.trial;
    const medal = time <= M.gold ? 'GOLD' : time <= M.silver ? 'SILVER' : time <= M.bronze ? 'BRONZE' : 'FINISHED';
    const pb = this.best === null || time < this.best;
    if (pb) {
      this.best = time;
      try { localStorage.setItem(STORE, JSON.stringify(time)); } catch { /* storage unavailable */ }
    }
    this.state = 'done';
    this.showBig(`${fmt(time)}<small>${medal}${pb ? ' · NEW BEST' : ''}<br>G TO RUN IT AGAIN</small>`, 6);
    sfx.mended(1);
    this.el.arrow.style.display = 'none';
  }

  showBig(html, dur = 0.9) {
    this.el.big.innerHTML = html;
    this.el.big.style.display = 'block';
    this.bigT = dur;
  }

  update(dt) {
    const g = this.game;
    if (g.input.wasPressed('KeyG')) { this.start(); return; }
    this.bigT -= dt;
    if (this.bigT <= 0 && this.el.big.style.display !== 'none') this.el.big.style.display = 'none';
    if (this.state === 'off') return;
    g.player.freeze = this.state === 'countdown';
    if (this.state === 'countdown') {
      const before = Math.ceil(this.countdown);
      this.countdown -= dt;
      g.weapon.cooldown = Math.max(g.weapon.cooldown, 0.05);
      const now = Math.ceil(this.countdown);
      if (now !== before && now > 0) { this.showBig(String(now)); sfx.lockTick(); }
      if (this.countdown <= 0) { this.state = 'run'; this.showBig('GO!', 0.7); sfx.lockOn(6); }
    } else if (this.state === 'run') this.t += dt;

    const M = T.trial;
    this.el.time.textContent = fmt(this.time);
    this.el.count.textContent = `${this.jars.length - this.left}/${this.jars.length}`;
    this.el.medals.textContent = `GOLD ${fmt(M.gold)} · SILVER ${fmt(M.silver)} · BRONZE ${fmt(M.bronze)}${this.best !== null ? ` · BEST ${fmt(this.best)}` : ''}`;
    const pulse = 0.45 + 0.2 * Math.sin(performance.now() * 0.004);
    for (const ent of this.jars) if (ent.alive && ent.halo) ent.halo.material.opacity = pulse;
    this.glow.opacity = 0.6 + 0.3 * Math.sin(performance.now() * 0.006);
    this.xray.opacity = 0.25;
    this.pointArrow();
  }

  // an edge-of-screen arrow toward the nearest jar that's off screen (or a tick above it)
  pointArrow() {
    const g = this.game, cam = g.camera, el = this.el.arrow;
    if (this.state !== 'run' && this.state !== 'countdown') { el.style.display = 'none'; return; }
    let best = null, bd = Infinity;
    for (const ent of this.jars) {
      if (!ent.alive) continue;
      const t = ent.body.translation();
      const d = cam.position.distanceToSquared(t);
      if (d < bd) { bd = d; best = ent; }
    }
    if (!best) { el.style.display = 'none'; return; }
    const t = best.body.translation();
    const p = new THREE.Vector3(t.x, t.y + best.P.height * 1.3, t.z).project(cam);
    const w = innerWidth, h = innerHeight;
    const behind = p.z > 1;
    let x = p.x, y = p.y;
    if (behind) { x = -x; y = -y; }
    const onScreen = !behind && Math.abs(x) < 0.92 && Math.abs(y) < 0.88;
    el.style.display = 'block';
    if (onScreen) {
      el.className = 'over';
      el.style.transform = `translate(${(x * 0.5 + 0.5) * w}px, ${(-y * 0.5 + 0.5) * h}px)`;
    } else {
      const k = 0.9 / Math.max(Math.abs(x), Math.abs(y) / 0.95, 1e-3);
      x *= k; y *= k;
      const ang = Math.atan2(-y, x);
      el.className = 'edge';
      el.style.transform = `translate(${(x * 0.5 + 0.5) * w}px, ${(-y * 0.5 + 0.5) * h}px) rotate(${ang}rad)`;
    }
  }
}
