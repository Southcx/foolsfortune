// ---------------------------------------------------------------------------------------
// CO-OP'S METER: what the game spends of yours when your siblings answer and your letters go (the glossary: the co-op meter). Asking a
// sibling spends your own Claude usage (the page's `sample`: coop/answer.js); a letter wakes a division's session through your own
// Claude connector (coop/letters.js). Each is counted over the last real hour and stops at a cap you set: `/usage` says where you
// stand, `/usage asks 60` or `/usage letters 5` sets one (0 turns it off). The meter also keeps the letters still waiting on an answer
// (`waiting`), so a reload does not wake a session twice. Kept with your settings (the save's `settings`: it outlives a new build).
// Events: usage.report { asks, asksCap, letters, lettersCap, waiting }, usage.cap { kind, cap }.
//
// Prior art: the spending caps of cloud consoles (a budget, an alert, a hard stop), and the per-hour limits of chat bots.
//
//   game.coopUsage = new CoopUsage(game)   .take(kind) -> bool   .give(kind)   .left(kind)   .waiting { sibling: { letter, at, late } }
// ---------------------------------------------------------------------------------------

const HOUR = 3600e3;
export const CAPS = { asks: 40, letters: 10 }; // (a real hour's: an answer is a quick call; a letter costs a session a turn)
const KINDS = Object.keys(CAPS);

export class CoopUsage {
  constructor(game) {
    this.game = game; this.now = () => Date.now(); this.caps = { ...CAPS }; this.log = { asks: [], letters: [] }; this.waiting = {};
    game.save?.section('coopusage', { scope: 'settings', version: 1,
      dump: () => ({ caps: this.caps, log: this.log, waiting: this.waiting }),
      load: (d) => {
        for (const k of KINDS) {
          if (Number.isFinite(d?.caps?.[k])) this.caps[k] = Math.max(0, Math.min(500, Math.round(d.caps[k])));
          this.log[k] = Array.isArray(d?.log?.[k]) ? d.log[k].filter(Number.isFinite).slice(-500) : [];
        }
        this.waiting = d?.waiting && typeof d.waiting === 'object' ? d.waiting : {};
      },
      reset: () => { this.caps = { ...CAPS }; this.log = { asks: [], letters: [] }; this.waiting = {}; } });
    game.chat?.add('usage', {
      help: 'what co-op spends of yours this hour: /usage (where you stand), /usage asks <n> | letters <n> (a cap; 0 turns it off)',
      run: ([kind, n]) => {
        if (KINDS.includes(kind) && n !== undefined && Number.isFinite(+n)) { this.caps[kind] = Math.max(0, Math.min(500, Math.round(+n))); this.dirty(); game.events.emit('usage.cap', { kind, cap: this.caps[kind], by: 'courier' }); return; }
        game.events.emit('usage.report', { asks: this.used('asks'), asksCap: this.caps.asks, letters: this.used('letters'), lettersCap: this.caps.letters, waiting: Object.keys(this.waiting), by: 'courier' });
      },
    });
  }

  dirty() { this.game.save?.dirty('coopusage'); }
  used(kind) { const t = this.now() - HOUR; this.log[kind] = this.log[kind].filter((x) => x > t); return this.log[kind].length; }
  left(kind) { return Math.max(0, this.caps[kind] - this.used(kind)); }
  /** Spend one, if the hour's cap allows. */
  take(kind) { if (this.left(kind) <= 0) return false; this.log[kind].push(this.now()); this.dirty(); return true; }
  /** One that never reached Claude, given back. */
  give(kind) { this.log[kind].pop(); this.dirty(); }
}
