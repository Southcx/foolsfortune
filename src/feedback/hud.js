// ---------------------------------------------------------------------------------------
// THE HUD: the few things drawn over the world that are not the log: the psygun's crosshair (only while it is drawn) and its spread, the hitmarker, the charge arc,
// the speed (F3). The pool, the Blink's charges, the cubes, the shells and the Sondelass's forms are the overlay's made objects
// (vfx/lachrimetertube.js with its pearls and cube plate, vfx/psyguncylinder.js, vfx/sondelassguard.js); the old DOM gauge, the
// LACHRYMA panel (its beads and the cubes' readout), the shells row and the tool strip were retired (the owner, 2026-10-18). No words or numbers in the
// world (CLAUDE.md, Feedback): what deserves a sentence goes to the log.
//
// Prior art: the PS2 shooters' minimal HUDs (Ratchet & Clank's reticle and ammo, Metroid Prime's visor kept to the edges).
//
//   const H = new Hud()   H.update(dt, { spreadDeg, fov, fp, ads, charge, speed, move, gunOut, debug })   H.hitmarker(kill)
// ---------------------------------------------------------------------------------------

export class Hud {
  constructor() {
    this.el = {
      cross: document.getElementById('crosshair'),
      lines: [...document.querySelectorAll('#crosshair .l')],
      hit: document.getElementById('hitmarker'),
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

  update(dt, { spreadDeg, fov, reloadT, fp, ads, charge = 0, speed = 0, move = '', gunOut = true, debug = false }) {
    // speedometer (with a short peak hold, for tuning movement): a tuning tool, so only with the diagnostics up (F3): live numbers are
    // not the HUD's to show (CLAUDE.md, Feedback; docs/ART.md precept 6)
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
    this.el.cross.style.opacity = !gunOut || (fp && ads > 0.5) ? 0 : 1 - ads * 0.3; // (the crosshair is the psygun's: shown only while it is drawn, the owner 2026-10-11; every other tool shows its own marks)

    this.el.charge.style.opacity = charge > 0 ? 1 : 0;
    this.el.chargeArc.style.strokeDashoffset = `${(1 - charge) * 100}`;
    this.el.charge.classList.toggle('full', charge >= 1);
    this.hitT -= dt;
    this.el.hit.style.opacity = this.hitT > 0 ? 1 : 0;

    this.el.reload.style.opacity = reloadT >= 0 ? 1 : 0;
    this.el.reloadFill.style.width = `${Math.max(0, reloadT) * 100}%`;
  }
}
