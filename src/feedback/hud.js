import { restartClass } from '../core/restart.js';
import { T } from '../core/config.js';

import { SHELL_KEYS } from '../tools/psygun/shells.js';
import { Lachrimeter } from '../ui/lachrimeter.js';
import { ChargeBeads } from '../ui/beads.js';

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

  /** The maker's pixel Lachrimeter (ui/lachrimeter.js) in place of the drawn bar, and the count in the maker's font. */
  pixelate(px) {
    this.px = px;
    const bar = this.el.lach.querySelector('.bar');
    bar.classList.add('pxbar'); bar.innerHTML = '';
    // (the gauge one step smaller than the windows' buttons, a HUD and not a menu; as long as the panel is wide, in whole art pixels)
    const build = () => {
      const s = px.scale(), k = Math.max(1, s - 1) / s, dpr = window.devicePixelRatio || 1;
      const inner = Math.max(120, (this.el.lach.clientWidth || 284) - 40);
      const W = Math.floor((inner * dpr) / Math.max(1, Math.round(s * k)));
      if (this.meter?.W === W && this.meter.el.__k === k) return;
      const old = this.meter;
      this.meter = new Lachrimeter(px, { width: W, k });
      if (old) old.el.replaceWith(this.meter.el); else bar.appendChild(this.meter.el);
    };
    build();
    addEventListener('resize', build);
    this.el.lachNum.textContent = ''; // (no count beside the tube: the tube is the count, docs/LOOK.md 2)
    // the Blink's charges, as beads of Lachryma beside the count (ui/beads.js), shown while they have it
    this.beads = new ChargeBeads(px, { k: this.meter.el.__k, max: 3 });
    this.el.lachNum.before(this.beads.el);
    // the cubes (cubes.js's readout) live in the panel, under the tube, and not over its frame
    const cubes = document.getElementById('cubes');
    if (cubes) this.el.lach.appendChild(cubes);
  }

  lachrymaPulse(ok) {
    if (ok) this.meter?.bead();
    this.quietT = 0;
    restartClass(this.el.lach, ok ? 'gain' : 'deny', ['gain', 'deny']); // (no forced layout: restart.js)
  }

  buildShells(types) {
    this.el.shells.innerHTML = types.map((t, i) => `<div class="slot" data-i="${i}"><u>${SHELL_KEYS[i] || ''}</u><i>${t.glyph}</i><span>${t.name}</span><b></b></div>`).join('');
    this.slots = [...this.el.shells.querySelectorAll('.slot')];
    // the glove over the chosen shell, pointing down at it (as a JRPG's command palette points at its choice)
    this.hand = document.createElement('div'); this.hand.className = 'hand'; // (its picture is the theme's turned glove: --jglove-down)
    this.el.shells.appendChild(this.hand); this.handAt = -1;
  }

  update(dt, { spreadDeg, fov, reloadT, fp, ads, charge = 0, pool, shells, speed = 0, move = '', gunOut = true, blink = null, debug = false, combat = true }) {
    // (the shells are the Psygun's: their palette is shown while it is out, and steps away when it is put up)
    if (gunOut !== this.gunOut) { this.gunOut = gunOut; this.el.shells?.classList.toggle('stowed', !gunOut); }
    // speedometer (with a short peak hold, for tuning movement): a tuning tool, so only with the diagnostics up (F3): live numbers are
    // not the HUD's to show (CLAUDE.md, Feedback; docs/LOOK.md 6)
    if (debug !== this.debugShown) { this.debugShown = debug; this.el.speed.style.display = debug ? '' : 'none'; }
    if (debug) {
      this.peakT = (this.peakT || 0) - dt;
      if (speed > (this.peak || 0) || this.peakT <= 0) { this.peak = speed; this.peakT = 1.5; }
      this.el.speed.innerHTML = `<b>${speed.toFixed(1)}</b> m/s · peak ${this.peak.toFixed(1)} ${move ? `<i>${move}</i>` : ''}`;
    }
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

    if (this.beads) {
      const on = !!blink && combat; // (the charges are a fight's: shown in combat only, game.combat)
      if (on !== this.beadsOn) { this.beadsOn = on; this.beads.el.style.display = on ? '' : 'none'; }
      if (on) { this.beads.set(blink.n, blink.max, blink.fill); this.beads.update(dt); }
    }
    if (pool && this.meter) {
      this.meter.set(pool.available, pool.reserved, pool.max); this.meter.update(dt);
      this.el.lach.classList.toggle('low', pool.available < 12);
      // the panel is there when the Lachryma is doing something (not full, held for a charge, just moved) and steps back when it is
      // full and still: the ring at their feet (vfx/hudring.js) is the always-on gauge
      if (Math.abs(pool.available - (this.lastAvail ?? -1)) > 0.01 || pool.reserved > 0) { this.lastAvail = pool.available; this.quietT = 0; }
      this.quietT = (this.quietT || 0) + dt;
      const show = pool.available < pool.max - 0.5 || this.quietT < 4 || this.lach?.forced;
      if (show !== this.lachShown) { this.lachShown = show; this.el.lach.style.transition = 'opacity .6s'; this.el.lach.style.opacity = show ? '' : '0'; }
    } else if (pool) {
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
      if (sel && this.handAt !== shells.selected) { this.handAt = shells.selected; this.hand.style.transform = `translateX(${sel.offsetLeft + sel.offsetWidth / 2 - 26}px)`; } // (the turned glove's tip is at 26 of 32)
    }
    this.el.reload.style.opacity = reloadT >= 0 ? 1 : 0;
    this.el.reloadFill.style.width = `${Math.max(0, reloadT) * 100}%`;
  }
}
