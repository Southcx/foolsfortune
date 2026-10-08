// ---------------------------------------------------------------------------------------
// THE KNACKS: passive Arts, switched on or off at will, where every assist lives (docs/plans/TRAINING.md section 3; CLAUDE.md's design
// laws: arts only by achievement, assists earned and never gating the skill). A knack is OPENED by the ledger (a count way, a feat way,
// an explorer's way: any one), never by a flag set in a hook; once open it is ON until you switch it off, and switching it off restores
// the game exactly. The table is Dovina's to fill (the names Espada's, approved by the owner); the first row is the Crib Sheet, whose
// gloss world/ostraca.js shows. Kept in the save (`knacks`, player scope: what you switched off).
//
// Prior art: Celeste's Assist Mode (offered plainly, never judged), Hades' God Mode (earned and optional), and the arts here
// (progress/skills.js: opened by the ledger).
//
//   KNACKS[id] = { name, does, opens(L) -> bool }   const K = new Knacks(game)   K.open(id)   K.on(id)   K.set(id, on)   /knack [id] [on|off]
// ---------------------------------------------------------------------------------------
import { CRIB } from './ostraca.js';

export const KNACKS = {
  crib: { name: 'the Crib Sheet', does: 'the English beside each neuralese word you have glossed',
    opens: (L) => (L.get('reprogram.run') || 0) >= CRIB.macros || (L.get('reprogram.held5') || 0) >= CRIB.heldFive || (L.get('ostracon.found') || 0) >= CRIB.ostraca },
};

export class Knacks {
  constructor(game) {
    this.game = game; this.off = new Set();
    game.save?.section('knacks', { scope: 'player', version: 1, dump: () => ({ off: [...this.off] }), load: (d) => { this.off = new Set(Array.isArray(d?.off) ? d.off : []); }, reset: () => { this.off.clear(); } });
    game.chat?.add?.('knack', { help: 'your knacks (assists you have earned): /knack, or /knack <id> on|off', run: (args) => this.command(args) });
  }
  /** Opened: the ledger says so. */
  open(id) { const k = KNACKS[id], L = this.game.ledger; return !!(k && L && k.opens(L)); }
  /** In use: opened, and not switched off. */
  on(id) { return this.open(id) && !this.off.has(id); }
  set(id, on) {
    if (!KNACKS[id] || !this.open(id)) return false;
    if (on) this.off.delete(id); else this.off.add(id);
    this.game.save?.dirty('knacks');
    this.game.events?.emit('knack.set', { knack: id, on: !!on, by: 'courier' });
    return true;
  }
  command(args = []) {
    const [id, v] = args, log = this.game.log;
    if (!id) { for (const [k, d] of Object.entries(KNACKS)) log?.say('system', `${d.name} (${k}): ${this.open(k) ? (this.on(k) ? 'on' : 'off') : 'not yet earned'}. ${d.does}.`, { key: `knack.${k}`, throttle: 0.5 }); return; }
    if (!KNACKS[id]) { log?.say('warn', `No knack called ${id}.`, { key: 'knack', throttle: 1 }); return; }
    if (!this.open(id)) { log?.say('warn', `You have not earned ${KNACKS[id].name} yet.`, { key: 'knack', throttle: 1 }); return; }
    this.set(id, v ? v !== 'off' : !this.on(id));
  }
}
