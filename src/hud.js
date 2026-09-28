import { T } from './config.js';

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
      mode: document.getElementById('mode'),
      stats: document.getElementById('stats'),
      popups: document.getElementById('popups'),
      reload: document.getElementById('reloadbar'),
      reloadFill: document.querySelector('#reloadbar i'),
      charge: document.getElementById('charge'),
      chargeArc: document.querySelector('#charge circle.arc'),
    };
    this.hitT = 0;
    this.chain = 0;
    this.chainT = 0;
    this.broken = 0;
  }

  hitmarker(kill) {
    this.hitT = kill ? 0.22 : 0.12;
    this.el.hit.classList.toggle('kill', !!kill);
  }

  onBroken(total, remaining) {
    this.broken = total;
    this.chain = this.chainT > 0 ? this.chain + 1 : 1;
    this.chainT = 0.45;
    if (this.chain >= 3) this.popup(`×${this.chain} CHAIN`);
    this.remaining = remaining;
  }

  lachrymaPulse(ok) {
    const el = this.el.lach;
    el.classList.remove('gain', 'deny');
    void el.offsetWidth; // restart the animation
    el.classList.add(ok ? 'gain' : 'deny');
  }

  buildShells(types) {
    this.el.shells.innerHTML = types.map((t, i) => `<div class="slot" data-i="${i}"><i>${t.glyph}</i><span>${i + 1} ${t.name}</span><b></b></div>`).join('');
    this.slots = [...this.el.shells.querySelectorAll('.slot')];
  }

  popup(text) {
    const d = document.createElement('div');
    d.className = 'pop';
    d.textContent = text;
    this.el.popups.replaceChildren(d);
    setTimeout(() => d.remove(), 900);
  }

  update(dt, { spreadDeg, fov, reloadT, fp, ads, shots, hits, total, charge = 0, pool, shells }) {
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
    this.chainT -= dt;

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
    }
    this.el.reload.style.opacity = reloadT >= 0 ? 1 : 0;
    this.el.reloadFill.style.width = `${Math.max(0, reloadT) * 100}%`;
    this.el.mode.textContent = fp ? '1ST PERSON' : '3RD PERSON';
    const acc = shots ? Math.round((hits / shots) * 100) : 0;
    this.el.stats.textContent = `SHATTERED ${this.broken}/${total}  ·  ACC ${acc}%`;
  }
}
