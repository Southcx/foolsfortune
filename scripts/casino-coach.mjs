// ---------------------------------------------------------------------------------------
// THE COACH'S CHECK (docs/plans/CASINO-CLARITY.md section 4): every table's games played by its bots, and at each of seat 0's decisions the
// coach asked to explain it (progress/casino/coach/). It fails on a throw, or on a decision the coach gives no choices for. Run it after a
// change to a rules module or a coach: `node scripts/casino-coach.mjs`.
// ---------------------------------------------------------------------------------------
import { rngOf } from '../src/progress/casino/table.js';
import { coach } from '../src/progress/casino/coach/index.js';
import { TABLES } from '../src/world/bazaar/session.js';
let errs = 0;
for (const T of TABLES) {
  let decisions = 0, said = 0, best = 0, previews = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const r = rngOf(seed), S = T.game.setup({ seats: T.seats, r, opts: T.opts ? T.opts(seed % T.seats, T) : {} });
    for (let n = 0; n < 4000; n++) {
      if (T.game.result(S)) { coach(T, S, 0); break; }
      const P = T.game.pending(S); if (!P) break;
      if (P.seat === 0) { try { const C = coach(T, S, 0); decisions++; if (C.turn.say) said++; if (C.moves.some((m) => m.best)) best++; previews += C.moves.filter((m) => m.preview).length; if (!C.moves.length && P.moves.length) throw new Error(`no moves for ${P.kind}`); } catch (e) { errs++; if (errs < 4) console.log(T.id, P.kind, e.stack.split('\n').slice(0, 3).join(' | ')); } }
      const pair = T.bots[P.seat] || T.bots.find((b) => b); const [bot, style] = pair;
      T.game.apply(S, P.moves.length === 1 ? P.moves[0] : bot(T.game.view(S, P.seat), P, r, style), r);
    }
  }
  console.log(T.id, { decisions, said, best, previews });
}
console.log('errors', errs);
process.exit(errs ? 1 : 0);
