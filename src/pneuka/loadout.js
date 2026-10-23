// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX'S LOADOUT: the reading (docs/plans/PNEUKA-BOX.md 5, the pick: Calissa's reading table on Petra's function). The two tools
// worn, the main and the sub (TOOLS-TOGETHER.md 8), are read off the belt and the box into the state the reading table draws
// (`game.readingTable`, ui/readingtable.js: Calissa's), and its pointer's events come back here as the loadout's rules:
//   - hovering a tool not worn previews the swap as the sub: what R becomes, the passive, and the pair's card that would be;
//   - a click on one makes it the sub; shift or a right click makes it the main; a card dropped on a place makes it that place's;
//   - a swap the rule refuses (progress/toolpairs.js swapRefusal, asked by the belt's mayEquip: a fight, a duel, the sea, a race, a table)
//     presses your seal over the place instead; the belt says the words, and the table dims the hand while the rule holds (`locked`).
// It decides nothing the belt does not: `belt.equip(id, as)` swaps, and the log says it (the belt's event and its rule).
//
// Prior art: the Celtic Cross's first two cards (the present and what crosses it), Persona's arcana, Balatro's hand lifted to preview.
//
//   const L = new Loadout(game, onChange)   L.ready (the belt's main and sub and the reading table both stand)   L.mount(host)   L.draw()
//   L.state(preview?) -> the reading table's state   L.swap(id, as) -> true | false
// ---------------------------------------------------------------------------------------
import { pairOf, SUB_GIFTS, TOOL_IDS } from '../progress/toolpairs.js';
import { itemOf } from './items.js';

/** A tool on its card: its name and genre label (CLARITY.md), and the main's own keys, in a line or two (the audit of 2026-10-23). */
const CARD = {
  psygun: { name: 'Psygun', label: 'gun', lines: ['LMB shoots · held, a charge', 'MMB: the quick taps · wheel: the cylinder'] },
  sondelass: { name: 'Sondelass', label: 'blade', lines: ['1 · 2 · 3: cutlass, rod, hook', 'RMB: the specials'] },
  soulbrush: { name: 'Soul Brush', label: 'brush', lines: ['RMB held: Celestial mode', '1: paint · 2: mop'] },
  veritome: { name: 'Veritome', label: 'camera', lines: ['1: the Flash', 'wheel: the lens'] },
  dreamvane: { name: 'Dreamvane', label: 'rod', lines: ['MMB: the survey', 'wheel: the dowse'] },
  crucibelle: { name: 'Crucibelle', label: 'bell', lines: ['1 to 5: the notes', 'the toll on the beat'] },
  lockheart: { name: 'Lockheart', label: 'coffin', lines: ['wheel: the keyring', 'the wheel of odds'] },
};
const nameOf = (id) => itemOf(id)?.name || id;

export class Loadout {
  constructor(game, onChange = () => {}) {
    this.game = game; this.onChange = onChange; this.hover = null; this.wired = false;
  }
  get T() { return this.game.readingTable; }
  get belt() { return this.game.belt; }
  get box() { return this.game.pneuka; }
  /** Both halves stand: the belt as main and sub (Petra's) and the reading table (Calissa's). */
  get ready() { return !!(this.T && this.belt); }

  mount(host) {
    if (!this.ready) return false;
    if (!this.wired) {
      this.wired = true;
      this.T.on('hover', (e) => { this.hover = e?.id && !this.worn(e.id) ? e.id : null; this.draw(); });
      this.T.on('pick', (e) => { if (e?.id && !this.worn(e.id)) this.swap(e.id, e.shift || e.button === 2 ? 'main' : 'sub'); });
      this.T.on('drop', (e) => { if (e?.id && (e.as === 'main' || e.as === 'sub')) this.swap(e.id, e.as); });
    }
    host.appendChild(this.T.el);
    this.draw();
    return true;
  }
  worn(id) { return id === this.belt.main || id === this.belt.sub; }

  /** What is fitted to a tool, as tiles on its card (the box keeps them: FITTINGS, pneuka/box.js). */
  fittings(id) {
    const box = this.box, out = [];
    if (!box) return out;
    if (id === 'sondelass' && box.lure) out.push({ kind: 'lure', label: `the lure: ${nameOf(box.lure)}` });
    if (id === 'crucibelle') for (const f of box.fitted('instrument')) out.push({ kind: 'instrument', label: nameOf(f) });
    if (id === 'lockheart') { for (const f of box.fitted('heart')) out.push({ kind: 'heart', label: nameOf(f) }); const k = box.fitted('keys').length; if (k) out.push({ kind: 'key', label: `keyring ${k} of 4` }); }
    if (id === 'soulbrush') for (const f of box.fitted('bottle')) out.push({ kind: 'bottle', label: nameOf(f) });
    if (id === 'psygun' && this.game.shells?.gun) out.push({ kind: 'shell', label: this.game.shells.gun.name });
    return out;
  }
  chambers() {
    const S = this.game.shells; if (!S?.gun) return null;
    return { of: S.gun.chambers, loaded: Array.from({ length: S.gun.chambers }, (_, i) => { const id = S.chambers[i]; return id && S.counts[id] > 0 ? '#ffd36a' : null; }) };
  }
  pairCard(a, b) {
    const p = pairOf(a, b); if (!p) return null;
    return { n: p.n, name: p.card, face: true, open: false, line: p.special ? p.special.line : 'special: to come' }; // (the pair's face shown; no special is designed yet: TOOLS-TOGETHER.md 8)
  }
  /** The reading table's state; `preview` a tool not worn, shown as the sub it would be. */
  state(preview = this.hover) {
    const B = this.belt, main = B.main, sub = B.sub, G = SUB_GIFTS;
    const card = (id) => ({ id, ...CARD[id] });
    const state = {
      main: { ...card(main), fittings: this.fittings(main), ...(main === 'psygun' ? { chambers: this.chambers() } : {}) },
      sub: { ...card(sub), verb: `${G[sub].verb}: ${G[sub].does}`, passive: G[sub].passive || 'none', fittings: this.fittings(sub) },
      pair: this.pairCard(main, sub),
      shelf: TOOL_IDS.filter((id) => !this.worn(id)).map((id) => ({ ...card(id), verb: G[id].verb, passive: G[id].passive || 'none',
        note: this.fittings(id).map((f) => f.label).join(' · ') || undefined })),
      preview: null,
      locked: !!this.belt.mayEquip?.(TOOL_IDS.find((t) => !this.worn(t))),
    };
    if (preview && !this.worn(preview)) {
      const next = this.pairCard(main, preview);
      state.preview = { id: preview, as: 'sub', pair: next, rows: [
        { what: 'R', from: G[sub].verb, to: G[preview].verb },
        { what: 'Passive', from: G[sub].passive || 'none', to: G[preview].passive || 'none' },
        { what: 'Pair', from: state.pair?.name, to: next?.name },
      ] };
    }
    return state;
  }
  draw() { if (this.ready && this.T.el.isConnected) this.T.draw(this.state()); }

  /** Make a tool the main or the sub: refused (the belt's mayEquip, the swap rule), your seal on the place, and the belt says why in the log. */
  swap(id, as) {
    if (!this.belt.equip(id, as)) { this.T.refuse(as); return false; }
    this.hover = null;
    this.draw(); this.onChange();
    return true;
  }
}
