// ---------------------------------------------------------------------------------------
// A RADIAL WHEEL: a held key's choice among a few (the party's orders: coop/party.js). Held, it opens at the centre of the screen; the
// mouse, still locked, is flicked toward a wedge (its movement adds to a direction, as a console stick would: the cursor never shows);
// let go, and the wedge pointed at is the choice, or none if the mouse was not moved. The look follows the god hand's art wheel
// (godhand/arts.js), which picks with a free cursor instead; it is the next to move onto this one. The words are the choices' names
// (Espada's), the colours Calissa's to give.
//
// Prior art: Dragon's Dogma's pawn commands (four, on a held button), and the weapon wheels of Grand Theft Auto V and Red Dead
// Redemption 2 (held, flicked, released: a direction, not a pointer).
//
//   const W = new RadialWheel({ id, items: [{ label, sub, color?, icon?, locked? }] })   W.open()   W.steer(dx, dy)   W.close() -> index | -1   W.isOpen
//   (`color`: the wedge's own colour, under its label, never alone (CLARITY.md); `icon`: an element (a pixel icon, ui/icons/icons.js iconEl),
//   set above the label in place of the colour's chip; `locked`: shown dim and never picked: the Soul Brush's radial)
// ---------------------------------------------------------------------------------------

const DEAD = 40; // (pixels of mouse movement before a direction counts)

export class RadialWheel {
  constructor({ id, items }) {
    this.items = items; this.isOpen = false; this.dx = 0; this.dy = 0; this.sel = -1;
    const el = (this.el = document.createElement('div'));
    el.id = id; el.className = 'radialwheel';
    el.style.cssText = 'position:fixed;left:50%;top:50%;width:300px;height:300px;margin:-150px 0 0 -150px;z-index:6;pointer-events:none;display:none';
    const n = items.length, R = 140, r = 52, TAU = Math.PI * 2, iconic = items.some((it) => it.icon), LR = iconic ? 102 : 96, LY = iconic ? 22 : 0; // (with icons: the icon over the label, both mid-wedge)
    const wedge = (i) => { const a0 = (i - 0.5) / n * TAU - Math.PI / 2, a1 = (i + 0.5) / n * TAU - Math.PI / 2, p = (a, rad) => `${150 + Math.cos(a) * rad},${150 + Math.sin(a) * rad}`; return `M${p(a0, r)} L${p(a0, R)} A${R},${R} 0 0 1 ${p(a1, R)} L${p(a1, r)} A${r},${r} 0 0 0 ${p(a0, r)} Z`; };
    const label = (i) => { const a = i / n * TAU - Math.PI / 2, x = 150 + Math.cos(a) * LR, y = 150 + Math.sin(a) * LR + LY; return `<text x="${x}" y="${y}" style="opacity:${items[i].locked ? 0.4 : 1};fill:#fbe3cf;font:600 13px var(--f-title, serif);letter-spacing:.1em;text-anchor:middle">${items[i].label}</text><text x="${x}" y="${y + 14}" style="fill:#fbe3cf;opacity:.7;font:9px var(--f-ui, sans-serif);text-anchor:middle">${items[i].sub || ''}</text>`; };
    const chip = (i) => { if (!items[i].color || items[i].icon) return ''; const a = i / n * TAU - Math.PI / 2; return `<circle cx="${150 + Math.cos(a) * 122}" cy="${150 + Math.sin(a) * 122}" r="7" style="fill:${items[i].color};stroke:#1c0d08;stroke-width:2;opacity:${items[i].locked ? 0.35 : 1}"/>`; };
    el.innerHTML = `<svg viewBox="0 0 300 300" style="width:100%;height:100%;overflow:visible">${items.map((_, i) => `<path class="w" d="${wedge(i)}" style="fill:rgba(28,13,8,.82);stroke:rgba(255,178,122,.45);stroke-width:1.5"/>`).join('')}${items.map((_, i) => chip(i)).join('')}<circle cx="150" cy="150" r="${r - 6}" style="fill:rgba(28,13,8,.9);stroke:rgba(255,178,122,.6);stroke-width:1.5"/>${items.map((_, i) => label(i)).join('')}</svg>`;
    items.forEach((it, i) => { if (!it.icon) return; const a = i / n * TAU - Math.PI / 2; Object.assign(it.icon.style, { position: 'absolute', left: `${Math.round(150 + Math.cos(a) * LR)}px`, top: `${Math.round(150 + Math.sin(a) * LR - 10)}px`, transform: 'translate(-50%, -50%)', opacity: it.locked ? '0.75' : '1' }); el.appendChild(it.icon); });
    document.body.appendChild(el);
    this.paths = [...el.querySelectorAll('path.w')];
  }

  open() { if (this.isOpen) return; this.isOpen = true; this.dx = this.dy = 0; this.sel = -1; this.el.style.display = 'block'; this.paint(); }

  /** The mouse's movement while held: a direction, once past the dead zone, picks the wedge it points into. */
  steer(dx, dy) {
    if (!this.isOpen) return;
    this.dx += dx; this.dy += dy;
    const m = Math.hypot(this.dx, this.dy);
    if (m > DEAD * 3) { this.dx *= (DEAD * 3) / m; this.dy *= (DEAD * 3) / m; } // (held to a ring, so a flick the other way turns it at once)
    const n = this.items.length, a = Math.atan2(this.dy, this.dx) + Math.PI / 2;
    let sel = m < DEAD ? -1 : ((Math.round(a / (Math.PI * 2) * n) % n) + n) % n;
    if (sel >= 0 && this.items[sel].locked) sel = -1; // (a locked slot is shown, never picked)
    if (sel !== this.sel) { this.sel = sel; this.paint(); }
  }

  paint() { this.paths.forEach((p, i) => { p.style.fill = i === this.sel ? 'rgba(196,106,69,.7)' : 'rgba(28,13,8,.82)'; p.style.stroke = i === this.sel ? '#ffe0c0' : 'rgba(255,178,122,.45)'; }); }

  close() { if (!this.isOpen) return -1; this.isOpen = false; this.el.style.display = 'none'; return this.sel; }
}
