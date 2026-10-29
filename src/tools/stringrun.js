// ---------------------------------------------------------------------------------------
// THE STRING RUN'S BOOKKEEPING: the blows of the base Moveset (tools/moveset.js) counted for the ledger: `move.blow` once a blow is
// over, `move.string.end` when a run of LMB blows landed in a row stops (Dovina's earning: sond.string.best, sond.move.<id>.*; Petra's
// rules in feedback/tracking/moves.js). Laid onto Moveset's prototype (one job: the counting; the engine keeps the moves), split out
// of moveset.js to keep it under the module contract's 800 lines.
// Prior art: the arcade combo counter (Street Fighter's hit counter, Devil May Cry's style meter's run): counted on contact, broken by a
// whiff, a hit taken or a pause.
import { hasTag } from '../core/tags.js';
import { isTraining } from '../progress/combat/testroom.js';

export const STRING_RUN = {
  /** A blow the tool plays itself (the cutlass's stinger): marked as it strikes (markBlow), closed when it is over (closeBlow); a
   *  special's (slot null, apart from the run). */
  ownBlow(id) { return { id, own: true, slot: null, tally: { hit: 0, creature: 0, idle: 0, landed: false, closed: false } }; },
  /** What a thing struck is to the blows: 'creature' (hurtable, of game.creatures), 'hit' (a clapperjar, a pot), or 'idle', neither a hit
   *  nor a miss: a training body (isTraining: Strawman, a roly-poly; a Throwing Room pot by its def), a sibling or a spirit (an ally:
   *  creatures.strike reaches a sibling only as friendly fire, a spirit never), a struckable thing (a crystal: struck as many times as
   *  you like), or a move whose row is worth nothing (the pick's shove: "never counted as struck"). */
  blowCounts(kind, ent, c) {
    if (kind === 'thing' || !ent || ent.ally || isTraining(ent) || isTraining(ent.def) || this.rule(c?.def)?.power === 0) return 'idle';
    if (kind === 'creature') return hasTag(ent, 'hurtable') ? 'creature' : 'idle';
    return 'hit';
  },
  /** A special's blow (R, RMB's, the iaido's draw cut, the stinger): its move.blow is sent, but it is apart from the string run, which
   *  is the LMB blows' alone (Dovina's rule: a stinger between them would open a string slot a blow early). */
  specialBlow(c) { return !!(c.own || c.kind === 'special' || c.kind === 'iaido'); },
  /** Blow `c` struck `ent`: counted; its first counted contact lands it, and the string run goes up by one (an LMB blow's). Nothing
   *  is marked once its move.blow is sent. */
  markBlow(c, kind, ent) {
    const tally = c?.tally; if (!tally || tally.closed) return;
    const w = this.blowCounts(kind, ent, c);
    tally[w]++;
    if (w !== 'idle' && !tally.landed) { tally.landed = true; if (!this.specialBlow(c)) this.stringRun++; }
  },
  /** Blow `c` is over, its strike past or cut short (the next move, the blink, a cancel, a stow): `move.blow`, once. One whose strike
   *  ran its course and struck nothing at all is a miss and ends the run; a special's, or one cut short before its strike was past, never. */
  closeBlow(c) {
    const tally = c?.tally; if (!tally || tally.closed) return;
    tally.closed = true;
    const special = this.specialBlow(c), short = !c.own && !this.recovering(c);
    this.game.events?.emit('move.blow', { tool: this.S.rules || this.id, move: c.id, slot: c.slot ?? null, hit: tally.landed, finish: !!(c.last && tally.creature), struck: tally.creature + tally.hit, effect: this.blowEffect(c), by: 'courier' });
    if (!tally.landed && !tally.idle && !special && !short) this.endStringRun('miss');
  },
  /** What blow `c` did to a body it struck (MELEE-LOADOUT-EARNING.md's feats): 'guardBreak' (it opens a guard), 'trip' (its row's
   *  status), 'knock' (its catalogue effect); null when it struck no creature or does none of these. */
  blowEffect(c) {
    if (!c?.tally?.creature) return null;
    if (c.def?.hit?.guardBreak) return 'guardBreak';
    if (this.rule?.(c.def)?.status === 'trip') return 'trip';
    return this.catalogueRow?.(c.id)?.effect === 'knock' ? 'knock' : null;
  },
  /** The string run stops (`why`: 'miss' | 'hurt' | 'pause' | 'stow'): `move.string.end` with the blows landed in a row, if any were. */
  endStringRun(why) {
    const run = this.stringRun; if (!run) return;
    this.stringRun = 0;
    this.game.events?.emit('move.string.end', { tool: this.S.rules || this.id, run, why, by: 'courier' });
  },
};
