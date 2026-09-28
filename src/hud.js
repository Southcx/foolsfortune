import { T } from './config.js';

export class Hud {
  constructor() {
    this.el = {
      cross: document.getElementById('crosshair'),
      lines: [...document.querySelectorAll('#crosshair .l')],
      hit: document.getElementById('hitmarker'),
      ammo: document.getElementById('ammo'),
      mode: document.getElementById('mode'),
      stats: document.getElementById('stats'),
      popups: document.getElementById('popups'),
      reload: document.getElementById('reloadbar'),
      reloadFill: document.querySelector('#reloadbar i'),
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

  popup(text) {
    const d = document.createElement('div');
    d.className = 'pop';
    d.textContent = text;
    this.el.popups.replaceChildren(d);
    setTimeout(() => d.remove(), 900);
  }

  update(dt, { spreadDeg, fov, ammo, mag, reloadT, fp, ads, shots, hits, total }) {
    const h = window.innerHeight;
    const px = Math.tan((spreadDeg * Math.PI) / 180) / Math.tan((fov * Math.PI) / 360) * (h / 2);
    const gap = 4 + px;
    const [t, r, b, l] = this.el.lines;
    t.style.transform = `translate(-50%, calc(-100% - ${gap}px))`;
    b.style.transform = `translate(-50%, ${gap}px)`;
    l.style.transform = `translate(calc(-100% - ${gap}px), -50%)`;
    r.style.transform = `translate(${gap}px, -50%)`;
    this.el.cross.style.opacity = fp && ads > 0.5 ? 0 : 1 - ads * 0.3;

    this.hitT -= dt;
    this.el.hit.style.opacity = this.hitT > 0 ? 1 : 0;
    this.chainT -= dt;

    this.el.ammo.innerHTML = `<b>${ammo}</b><span>/ ${mag}</span>`;
    this.el.ammo.classList.toggle('low', ammo <= 2);
    this.el.reload.style.opacity = reloadT >= 0 ? 1 : 0;
    this.el.reloadFill.style.width = `${Math.max(0, reloadT) * 100}%`;
    this.el.mode.textContent = fp ? '1ST PERSON' : '3RD PERSON';
    const acc = shots ? Math.round((hits / shots) * 100) : 0;
    this.el.stats.textContent = `SHATTERED ${this.broken}/${total}  ·  ACC ${acc}%`;
  }
}
