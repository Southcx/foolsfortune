import { T } from './config.js';

import { SHELL_KEYS } from './shells.js';
import { gloveURL } from './ui/theme.js';

export class Hud {
  constructor() {
    this.el = {
      cross: document.getElementById('crosshair'),
      lines: [...document.querySelectorAll('#crosshair .l')],
      hit: document.getElementById('hitmarker'),
      lach: document.getElementById('lachryma'),
      lachFill: document.querySelector('#lachryma .fill'),
      lachRes: document.querySelector('#lachryma .res'),
      lachNum: document.querySelector('#lachryma .num'),
      shells: document.getElementById('shells'),
      reload: document.getElementById('reloadbar'),
      reloadFill: document.querySelector('#reloadbar i'),
      charge: document.getElementById('charge'),
      speed: document.getElementById('speed'),
      chargeArc: document.querySelector('#charge circle.arc'),
    };
    this.hitT = 0;
    this.peak = 0;
    this.peakT = 0;
  }

  hitmarker(kill) {
    this.hitT = kill ? 0.22 : 0.12;
    this.el.hit.classList.toggle('kill', !!kill);
  }

  lachrymaPulse(ok) {
    const el = this.el.lach;
    el.classList.remove('gain', 'deny');
    void el.offsetWidth; // restart the animation
    el.classList.add(ok ? 'gain' : 'deny');
  }

  buildShells(types) {
    this.el.shells.innerHTML = types.map((t, i) => `<div class="slot" data-i="${i}"><u>${SHELL_KEYS[i] || ''}</u><i>${t.glyph}</i><span>${t.name}</span><b></b></div>`).join('');
    this.slots = [...this.el.shells.querySelectorAll('.slot')];
    // the glove over the chosen shell, pointing down at it (as a JRPG's command palette points at its choice)
    this.hand = document.createElement('div'); this.hand.className = 'hand'; this.hand.style.backgroundImage = `url(${gloveURL(true)})`;
    this.el.shells.appendChild(this.hand); this.handAt = -1;
  }

  update(dt, { spreadDeg, fov, reloadT, fp, ads, charge = 0, pool, shells, speed = 0, move = '' }) {
    // speedometer (with a short peak hold, for tuning movement)
    this.peakT = (this.peakT || 0) - dt;
    if (speed > (this.peak || 0) || this.peakT <= 0) { this.peak = speed; this.peakT = 1.5; }
    this.el.speed.innerHTML = `<b>${speed.toFixed(1)}</b> m/s · peak ${this.peak.toFixed(1)} ${move ? `<i>${move}</i>` : ''}`;
    const h = window.innerHeight;
    const px = Math.tan((spreadDeg * Math.PI) / 180) / Math.tan((fov * Math.PI) / 360) * (h / 2);
    const gap = 4 + px;
    const [t, r, b, l] = this.el.lines;
    t.style.transform = `translate(-50%, calc(-100% - ${gap}px))`;
    b.style.transform = `translate(-50%, ${gap}px)`;
    l.style.transform = `translate(calc(-100% - ${gap}px), -50%)`;
    r.style.transform = `translate(${gap}px, -50%)`;
    this.el.cross.style.opacity = fp && ads > 0.5 ? 0 : 1 - ads * 0.3;

    this.el.charge.style.opacity = charge > 0 ? 1 : 0;
    this.el.chargeArc.style.strokeDashoffset = `${(1 - charge) * 100}`;
    this.el.charge.classList.toggle('full', charge >= 1);
    this.hitT -= dt;
    this.el.hit.style.opacity = this.hitT > 0 ? 1 : 0;

    if (pool) {
      this.el.lachFill.style.width = `${(pool.available / pool.max) * 100}%`;
      this.el.lachRes.style.width = `${(pool.reserved / pool.max) * 100}%`;
      this.el.lachRes.style.left = `${(pool.available / pool.max) * 100}%`;
      this.el.lachNum.textContent = Math.floor(pool.available);
      this.el.lach.classList.toggle('low', pool.available < 12);
    }
    if (shells && this.slots) {
      this.slots.forEach((el, i) => {
        const t = shells.types[i];
        el.classList.toggle('sel', i === shells.selected);
        el.classList.toggle('empty', shells.counts[t.id] <= 0);
        el.querySelector('b').textContent = shells.counts[t.id];
      });
      const sel = this.slots[shells.selected];
      if (sel && this.handAt !== shells.selected) { this.handAt = shells.selected; this.hand.style.transform = `translateX(${sel.offsetLeft + sel.offsetWidth / 2 - 12}px)`; }
    }
    this.el.reload.style.opacity = reloadT >= 0 ? 1 : 0;
    this.el.reloadFill.style.width = `${Math.max(0, reloadT) * 100}%`;
  }
}
