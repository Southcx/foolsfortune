// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S READOUT, A PLACEHOLDER (docs/plans/OPEN-SEA.md section 3): the voyage's numbers while you are on the open sea, until
// Calissa's look for them (the Lachrimeter's kin: a fuel gauge, the Sight's needle for your doubt): the fuel left of the tank, the
// square you reckon you are in and how sure (doubt as a ± in squares), the throttle, and the finds not yet reported. It reads what is
// (the overlay's rule): what happened is the log's. Plain words, plain type, marked as a placeholder in its own class for her to replace.
//
//   new SeaHud(room)   .show(on)   .update(dt)
// ---------------------------------------------------------------------------------------
import { SHIPS } from '../../progress/rail/ships.js';

const NAMES = ['STOP', 'SLOW', 'CRUISE', 'FULL'];

export class SeaHud {
  constructor(room) {
    this.room = room; this.t = 0; this.on = false;
    const el = this.el = document.createElement('div');
    el.className = 'opensea-hud placeholder';
    el.style.cssText = 'position:fixed;left:18px;bottom:200px;font:12px/1.5 monospace;color:#e8e2d0;background:rgba(10,16,22,.55);padding:6px 10px;border-left:3px solid #d4a53c;pointer-events:none;display:none;z-index:5;white-space:pre';
    document.body.appendChild(el);
  }
  show(on) { if (on !== this.on) { this.on = on; this.el.style.display = on ? 'block' : 'none'; } }
  update(dt) {
    if ((this.t -= dt) > 0) return; this.t = 0.2;
    const R = this.room, v = R.voyage, tank = SHIPS[R.helm.ship].tank, bars = Math.round((v.fuel / tank) * 10);
    const doubt = v.doubt >= 1 ? ` ±${Math.floor(v.doubt)}` : '';
    this.el.textContent = `FUEL  ${'■'.repeat(bars)}${'□'.repeat(10 - bars)}  ${v.fuel.toFixed(1)}/${tank}\n`
      + `SQUARE ${v.at}${doubt}   CHARTED ${v.charted.size}/${R.grid.squares.length}\n`
      + (R.sailing ? `${NAMES[R.helm.throttle]}   W/S sail · A/D rudder · F moor · R read the sky` : 'F at the ship: board') + `\nFINDS TO REPORT ${v.found.size}`;
  }
}
