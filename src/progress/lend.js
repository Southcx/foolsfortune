// ---------------------------------------------------------------------------------------
// THE LEND PANEL (docs/plans/DEBUG-MODE.md section 4; the owner, 2026-10-09: "we want DEBUG to be a really solid high-level testing
// environment"). In DEBUG, a lent category answers "yes" at every gate in it without the ledger; switched off, that category plays by
// STORY's rules inside the DEBUG save, which is how an unlock path is tested. Outside DEBUG nothing is ever lent, whatever the setting
// says. A lend never writes the ledger. Kept as a setting (`lend`, scope settings), so the switches survive a new build.
//
// Prior art: Celeste's Assist Mode and Hades' God Mode (a switch a feature, each honest about what it changes), Minecraft's cheats as a
// property of the world (here: of the DEBUG save), Bethesda's QASmoke (everything on demand in a test cell).
//
//   LENDS[id] = { label, opens }   const N = new Lend(game)   N.has(id) -> bool (DEBUG only)   N.set(id, on)   N.all(on)   N.state
//   Each gate asks: `|| game.lend?.has('<id>')` (the gates, by file and line: DEBUG-MODE.md section 4).
// ---------------------------------------------------------------------------------------

/** The categories, in the panel's order. `opens` is what lending it opens (the panel's one line). Labels are placeholders for Espada. */
export const LENDS = {
  arts:      { label: 'Movement Arts', opens: 'Every Movement Art and variant' },
  godArts:   { label: 'God Arts',      opens: 'God Arts 2 to 5, wherever the hand reaches' },
  knacks:    { label: 'Knacks',        opens: 'Every knack opened (each still switched on or off)' },
  moves:     { label: 'Tool moves',    opens: "Every tool's launcher, air string, dash attack, pause branches and special" },
  functions: { label: 'Functions',     opens: 'Every reprogramming Function known, every neuralese word glossed' },
  shrines:   { label: 'Shrines',       opens: 'Every Shrine found for fast travel' },
  garden:    { label: 'Garden',        opens: 'The Spirit Garden at its highest Firing (never the attributes\' ranks)' },
  sea:       { label: 'Sea',           opens: 'Entropolis open; any ship sails without a rutter' },
  siblings:  { label: 'Siblings',      opens: 'All five siblings met' },
  feelings:  { label: 'Feelings',      opens: 'Gall and Fury known' },
  glazes:    { label: 'Glazes',        opens: 'Every kiln look firable' },
  codex:     { label: 'Codex',         opens: 'Every hidden entry shown' },
};
const fresh = () => Object.fromEntries(Object.keys(LENDS).map((k) => [k, true])); // (a new DEBUG save lends everything: today's sandbox)

export class Lend {
  constructor(game) {
    this.game = game;
    this.state = fresh();
    game.save?.section('lend', { scope: 'settings', version: 1, dump: () => this.state, load: (d) => { this.state = { ...fresh(), ...(d || {}) }; }, reset: () => { this.state = fresh(); } });
  }
  /** Is this category lent? Only ever in DEBUG. */
  has(id) { return this.game.mode === 'debug' && !!this.state[id]; }
  set(id, on) {
    if (!(id in LENDS) || this.state[id] === !!on) return false;
    this.state[id] = !!on; this.game.save?.dirty?.('lend');
    this.game.events?.emit('lend.set', { category: id, on: !!on, by: 'courier' });
    return true;
  }
  all(on) { for (const id of Object.keys(LENDS)) this.set(id, on); }
}
