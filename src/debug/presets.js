// ---------------------------------------------------------------------------------------
// THE PRESETS (docs/plans/DEBUG-MODE.md section 5): a moment of play written as data (the ledger's counts, the kit, the cubes, the lends,
// where you stand) and the loader that puts the DEBUG save there. Choosing one (`/preset <id>`) wipes the DEBUG save's player and world
// scopes, writes the counts (every achievement, knack, move and art is a predicate over the ledger, so the counts are the whole of it),
// marks the writes (`first('debug.preset.<id>')`), gives the kit as a debug chest does (`from: 'debug'`, never counted), sets the lends
// it names, and travels to its place. DEBUG only; STORY refuses it. The rows are Dovina's to write (the plan's first three stand here
// until she does: the bowl's own place id waits on her, so `dunemaw` starts at the mouth).
//
//   PRESETS[id] = { label, for, at (a place id), ledger: { key: n }, kit: [[item id, count, data?]], cubes, lend: { id: bool } | 'all' | 'none' }
//   game.presets = new Presets(game)   .apply(id) -> { ok, why? }   event debug.preset { id, ok, why?, by: 'courier' }
//
// Prior art: the plan's own sketch; OSRS's retroactive achievements (written counts stay right as systems are added); a speedrunner's
// save states; the debug chests (debug/debugchest.js) for how a kit is given.
// ---------------------------------------------------------------------------------------
export const PRESETS = {
  fresh: { label: 'Fresh', for: "STORY's rules in the DEBUG save: an unlock path from the start", at: 'kiln', ledger: {}, kit: [], cubes: 0, lend: 'none' },
  everything: { label: 'Everything', for: "every category lent and 10,000 cubes: today's DEBUG", at: 'kiln', ledger: {}, kit: [], cubes: 10000, lend: 'all' },
  dunemaw: { label: 'Before the Great Dunemaw', for: 'a Well run with the cutlass and the kick earned', at: 'well.mouth',
    ledger: { 'cut.hit': 500, 'kick.hit': 30 }, kit: [], cubes: 3000, lend: { arts: true } },
};

export class Presets {
  constructor(game) {
    this.game = game;
    game.chat?.add('preset', {
      help: `put the DEBUG save at a moment of play: /preset ${Object.keys(PRESETS).join(' | ')}`,
      run: ([id]) => { this.apply(id); },
    });
  }

  apply(id) {
    const g = this.game, P = PRESETS[id];
    const out = (ok, why) => { g.events?.emit('debug.preset', { id: id ?? '', ok, ...(why ? { why } : {}), by: 'courier' }); return { ok, why }; };
    if (!P) return out(false, 'no such preset');
    if (g.mode !== 'debug') return out(false, 'only in the DEBUG save');
    g.save?.wipe('player'); g.save?.wipe('world');
    for (const [k, n] of Object.entries(P.ledger || {})) g.ledger?.inc(k, n);
    g.ledger?.first(`debug.preset.${id}`);
    const L = g.lend;
    if (L) { if (P.lend === 'all') L.all(true); else if (P.lend === 'none') L.all(false); else for (const [k, on] of Object.entries(P.lend || {})) L.set(k, !!on); }
    for (const [item, count, data] of P.kit || []) for (let i = 0; i < count; i++) if ((g.pneuka?.add(item, 'debug', 0, data ? { ...data } : null) ?? -1) < 0) break;
    const short = Math.max(0, (P.cubes || 0) - (g.cubes?.balance ?? 0));
    if (short > 0) g.cubes?.earn(short, 'debug');
    if (P.at) g.places?.travel(P.at);
    g.save?.flush({ all: true });
    return out(true);
  }
}
