// ---------------------------------------------------------------------------------------
// THE PRESETS' LOADER (docs/plans/DEBUG-MODE.md section 5): what puts the DEBUG save at one of Dovina's presets (debug/presets.js: a
// moment of play written as data: the ledger's counts and records, the kit, the belt, the cubes, the lends, where you stand). Choosing one (`/preset <id>`) wipes the DEBUG save's player and world
// scopes, writes the counts (every achievement, knack, move and art is a predicate over the ledger, so the counts are the whole of it),
// marks the writes (`first('debug.preset.<id>')`), gives the kit as a debug chest does (`from: 'debug'`, never counted), wears its belt,
// sets the balance, sets the lends it names (the rest off), and travels to its place. DEBUG only; STORY refuses it.
//
//   game.presets = new Presets(game)   .apply(id) -> { ok, why? }   event debug.preset { id, ok, why?, by: 'courier' }
//
// Prior art: the plan's own sketch; OSRS's retroactive achievements (written counts stay right as systems are added); a speedrunner's
// save states; the debug chests (debug/debugchest.js) for how a kit is given.
// ---------------------------------------------------------------------------------------
import { PRESETS } from './presets.js';

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
    for (const [k, v] of Object.entries(P.best || {})) g.ledger?.hi(k, v);
    const L = g.lend;
    if (L) { L.all(false); for (const [k, on] of Object.entries(P.lend || {})) if (on) L.set(k, true); }
    for (const [item, count, data] of P.kit || []) for (let i = g.pneuka?.held?.(item) ?? 0; i < count; i++) if ((g.pneuka?.add(item, 'debug', 0, data ? { ...data } : null) ?? -1) < 0) break;
    if (P.belt?.main) g.belt?.equip(P.belt.main, 'main', { quiet: true });
    if (P.belt?.sub) g.belt?.equip(P.belt.sub, 'sub', { quiet: true });
    const bal = g.cubes?.balance ?? 0, want = P.cubes || 0; // (the balance set, not added)
    if (want > bal) g.cubes?.earn(want - bal, 'debug'); else if (want < bal) g.cubes?.spend(bal - want, 'debug');
    if (P.at) g.places?.travel(P.at);
    g.save?.flush({ all: true });
    return out(true);
  }
}
