// ---------------------------------------------------------------------------------------
// THE ASSEMBLY PAGE (docs/plans/MECHS.md 4.1, 5.1): F at the gantry's lectern. The nine slots, each a row of the parts that fit it that you
// own (mechstate.js owns); choosing one assembles the frame again (progress/mechs/frame.js) and shows its numbers beside the kept frame's
// (mass and the legs' load, the weapons' mass and the arms' load, the draw and the generator's output, minutes at rest off the cable, the
// walk's top, the acceleration, a step's time) and the checks' refusals in their own words (`checks[].why`). DONE keeps it (the save's
// `mech` section, `mech.assemble { frame }`) and builds the body again in the gantry; MEND clears the mech's cracks and mends its joints.
// A placeholder on the index window's page (feedback/indexmenu.js showPage), plain DOM, its classes `mk-*` for Calissa's dress (AC's
// garage: the slots as a slot row, the parts as choice cards, compare arrows); it draws only on a click, so it needs no clock of its own.
//
// Prior art: Armored Core's assembly screen (a slot list, the parts that fit, the frame's numbers and its warnings: overweight, arm
// load, energy), the hearth's page (world/garden/kitchen.js: a page of buttons on the index window).
//
//   const A = new MechAssembly(hangar)   A.open()   A.close()   A.draft   SLOT_LABEL   events: mech.assemble { frame }, mech.mend
// ---------------------------------------------------------------------------------------
import { SLOTS, PARTS } from '../../progress/mechs/parts.js';
import { assemble } from '../../progress/mechs/frame.js';
import { crackSum } from '../../progress/combat/vessel.js';

/** What the page calls each slot (plain names until Espada's). */
export const SLOT_LABEL = { head: 'HEAD', core: 'CORE', arms: 'ARMS', legs: 'LEGS', booster: 'BOOSTER', generator: 'GENERATOR', weaponL: 'LEFT ARM WEAPON', weaponR: 'RIGHT ARM WEAPON', back: 'BACK UNIT' };
const CSS = `
.mk-asm{display:flex;flex-direction:column;gap:6px;width:min(860px,88vw);max-width:100%;box-sizing:border-box;color:#f2e2c8;font:13px system-ui}
.mk-cols{display:flex;gap:14px;align-items:flex-start}.mk-slots{flex:1.4;display:flex;flex-direction:column;gap:5px}.mk-side{flex:1;display:flex;flex-direction:column;gap:6px}
.mk-slot{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.mk-slotname{width:130px;font-weight:700;color:#d9c0a0;font-size:11px;letter-spacing:.05em}
.mk-part{padding:4px 8px;border-radius:6px;border:1px solid #c8925e;background:#4a2c20;color:#fbeedd;cursor:pointer;font:600 12px system-ui}
.mk-part.on{background:#c8925e;color:#2a160e}.mk-part[title]{text-decoration:none}
.mk-nums{display:grid;grid-template-columns:auto auto auto;gap:2px 10px;font:12px ui-monospace,monospace}.mk-num.up{color:#9fe4ff}.mk-num.down{color:#ff9a7a}
.mk-refuse{color:#ff8a6a;font-size:12px}.mk-row{display:flex;gap:8px;flex-wrap:wrap}
.mk-btn{min-width:90px;min-height:40px;padding:6px 12px;border-radius:8px;border:2px solid #c8925e;background:#5c3424;color:#fbeedd;font:700 14px system-ui;cursor:pointer}
.mk-line{color:#d9c0a0;font-size:12px}
`;
/** The numbers shown: label, read from the stats, its unit, which way is better (+1 more, -1 less). */
const NUMS = [
  ['mass / load', (s) => `${s.mass.toFixed(1)} / ${s.load} t`, (s) => s.load - s.mass, 1],
  ['arm mass / load', (s) => `${s.armMass.toFixed(1)} / ${s.armLoad} t`, (s) => s.armLoad - s.armMass, 1],
  ['draw / output', (s) => `${s.draw} / ${s.output} kW`, (s) => s.output - s.draw, 1],
  ['at rest off the cable', (s) => `${s.minutesIdle.toFixed(1)} real min`, (s) => s.minutesIdle, 1],
  ['walk top', (s) => `${s.walkTop.toFixed(1)} m/s`, (s) => s.walkTop, 1],
  ['acceleration', (s) => `${s.accel.toFixed(1)} m/s²`, (s) => s.accel, 1],
  ['a step', (s) => (s.step > 0 ? `${s.step.toFixed(2)} real s` : 'treads'), (s) => -s.step, 1],
];

export class MechAssembly {
  constructor(hangar) { this.hangar = hangar; this.game = hangar.game; this.styled = false; this.draft = null; }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  get state() { return this.hangar.state; }

  open() {
    if (!this.menu?.showPage) return;
    if (!this.styled) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); this.styled = true; }
    this.draft = { ...this.state.sel }; this.show();
  }
  close() { if (this.menu?.open && this.menu.page?.name === 'mech') this.menu.close(); this.draft = null; }

  show() {
    const St = this.state, kept = St.stats, draft = assemble(this.draft);
    this.menu.showPage('mech', (im, el) => {
      const root = el('div', 'mk-asm'); im.appendChild(root);
      root.appendChild(el('div', 'mk-line', 'Choose a part for each slot. The frame\'s numbers change as you choose; DONE keeps it.'));
      const cols = el('div', 'mk-cols'), slots = el('div', 'mk-slots'), side = el('div', 'mk-side'); root.appendChild(cols); cols.append(slots, side);
      for (const slot of SLOTS) {
        const row = el('div', 'mk-slot'); row.appendChild(el('div', 'mk-slotname', SLOT_LABEL[slot]));
        for (const id of St.owned(slot)) {
          const P = id ? PARTS[id] : null, b = el('button', `mk-part${this.draft[slot] === id ? ' on' : ''}`, P ? P.label : 'None');
          b.title = P ? P.line : 'Nothing on the back.';
          b.onclick = (e) => { e.stopPropagation(); this.draft[slot] = id; this.show(); };
          row.appendChild(b);
        }
        slots.appendChild(row);
      }
      const nums = el('div', 'mk-nums');
      for (const [name, show, better] of NUMS) {
        const d = better(draft) - better(kept), cls = Math.abs(d) < 1e-6 ? '' : d > 0 ? ' up' : ' down';
        nums.append(el('div', 'mk-num', name), el('div', 'mk-num', show(kept)), el('div', `mk-num${cls}`, show(draft)));
      }
      side.append(el('div', 'grp', 'THE FRAME: KEPT, CHOSEN'), nums);
      for (const c of draft.checks) side.appendChild(el('div', 'mk-refuse', c.why));
      const cracks = crackSum(St.vessel), strained = St.strained; // (the joints mend with the cracks: MECHS.md 9.3)
      side.appendChild(el('div', 'mk-line', cracks > 0 || strained ? `Cracks on the mech: ${Math.round(cracks * 100)}% summed${strained ? ', its joints strained' : ''}. MEND fires them whole, in gold.` : 'The mech is whole.'));
      const btns = el('div', 'mk-row'); side.appendChild(btns);
      const btn = (t, run) => { const b = el('button', 'mk-btn', t); b.onclick = (e) => { e.stopPropagation(); run(); }; btns.appendChild(b); };
      btn('DONE', () => this.keep());
      if (cracks > 0 || strained) btn('MEND', () => { St.mend(); this.game.events?.emit('mech.mend', { by: 'courier' }); this.show(); });
    }, { title: 'THE GANTRY', sub: 'click a part · F closes' });
  }

  /** The chosen frame kept, the body built again in the gantry. */
  keep() {
    const H = this.hangar, sel = { ...this.draft };
    H.state.keep(sel);
    if (H.built && !this.game.cradles?.sealed) { H.pilot.build(); H.pilot.toGantry(); if (H.cradle) H.pilot.placeCradle(H.cradle); }
    this.game.events?.emit('mech.assemble', { frame: sel, by: 'courier' });
    this.close();
  }
}
