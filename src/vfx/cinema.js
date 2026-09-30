// ---------------------------------------------------------------------------------------
// CINEMA: what the screen does when the game wants you to look at one thing. Letterbox bars slide in from the top and bottom (the
// picture becomes a frame), the camera is asked for a composition (a longer lens, a closer, lower stand-off, a turn toward what
// matters, a little tilt with the strain), and a vignette tightens with how hard the moment is pulling. Anything can ask, by name,
// and the last to ask sets the composition; everything eases in and out, and nothing is left behind when the last one lets go.
//
//   game.cinema.frame('fight', { bars: 1, fov: -14, dist: 0.78, yaw: 0.3, pitch: -0.05, roll: 0.02 })
//   game.cinema.free('fight')          game.cinema.strain = 0..1
//
// Prior art: the Wind Waker's Z-target letterbox and the way Zelda frames a boss (bars in, camera on the thing), Shadow of the
// Colossus' grip camera, and every fishing minigame that has cut to a low, tight camera on the water for the fight (Zelda: Twilight
// Princess, Red Dead 2's reel camera). The composition is data, so the cutlass's blade mode and the chests reuse it.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CSS = `
#cinema { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
#cinema .bar { position: absolute; left: 0; right: 0; height: 0; background: #0b0402; box-shadow: 0 0 0 1px rgba(255,178,122,.0); }
#cinema .bar.top { top: 0; border-bottom: 1px solid rgba(255,178,122,.35); }
#cinema .bar.bot { bottom: 0; border-top: 1px solid rgba(255,178,122,.35); }
body #compass, body #speed, body #course, body #locks, body #crosshair, body #toolstrip { transition: opacity .4s; }
body.cine #compass, body.cine #speed, body.cine #course, body.cine #locks, body.cine #crosshair, body.cine #toolstrip { opacity: 0 !important; }
#cinema .strain { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 46%, rgba(120,20,8,.55) 100%); }
`;

export class Cinema {
  constructor(game) {
    this.game = game;
    this.reqs = new Map();
    this.k = 0; // bars
    this.cam = { yaw: 0, pitch: 0, dist: 1, fov: 0, roll: 0 };
    this.strain = 0; this.strainK = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = document.createElement('div'));
    root.id = 'cinema';
    root.innerHTML = '<div class="bar top"></div><div class="bar bot"></div><div class="strain"></div>';
    document.body.insertBefore(root, document.getElementById('hud'));
    this.top = root.querySelector('.top'); this.bot = root.querySelector('.bot'); this.vig = root.querySelector('.strain');
  }

  frame(id, spec) { this.reqs.delete(id); this.reqs.set(id, { bars: 0, yaw: 0, pitch: 0, dist: 1, fov: 0, roll: 0, ease: 4, ...spec }); }
  free(id) { this.reqs.delete(id); }
  get active() { return this.reqs.size > 0; }

  update(dt) {
    let bars = 0, spec = null;
    for (const r of this.reqs.values()) { bars = Math.max(bars, r.bars); spec = r; }
    const ease = spec?.ease ?? 5, c = this.cam, D = THREE.MathUtils.damp;
    c.yaw = D(c.yaw, spec ? spec.yaw : 0, ease, dt);
    c.pitch = D(c.pitch, spec ? spec.pitch : 0, ease, dt);
    c.dist = D(c.dist, spec ? spec.dist : 1, ease, dt);
    c.fov = D(c.fov, spec ? spec.fov : 0, ease, dt);
    c.roll = D(c.roll, spec ? spec.roll : 0, ease * 1.5, dt);
    const P = this.game.player.camFx;
    P.yaw = c.yaw; P.pitch = c.pitch; P.dist = c.dist; P.fov = c.fov; P.roll = c.roll;
    this.k = D(this.k, bars, bars > this.k ? 5 : 4, dt);
    const cine = this.k > 0.3;
    if (cine !== this.cine) { this.cine = cine; document.body.classList.toggle('cine', cine); } // (what is not part of the shot steps out of it)
    const h = this.k * 11.5;
    this.top.style.height = this.bot.style.height = `${h < 0.02 ? 0 : h}vh`;
    this.strainK = D(this.strainK, this.strain, 8, dt);
    this.vig.style.opacity = this.strainK < 0.01 ? 0 : (this.strainK * this.strainK).toFixed(3);
  }
}
