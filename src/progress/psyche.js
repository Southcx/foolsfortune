// ---------------------------------------------------------------------------------------
// THE PSYCHE AT WORK: the seven domains' EXP earned in play (docs/DESIGN.md, section 10; progress/domains.js holds the data: the
// sources, the curve, the weight of skill). Every event a source names is heard here; what it is worth, by domain, is counted in the
// ledger (`exp.<domain>`, so the levels are the ledger's like everything else, and retroactive achievements can read them), and a
// domain that crosses a level says so (`domain.level { domain, level, by }`: the log's line is tracking.js's). One listener for every
// layer: the island, the Wells and the Emocean all earn through the same events, so the domains move wherever the Courier does.
//
// Prior art: Old School RuneScape's skills (EXP only from doing the thing, a level-up message, the level as proof), and the event-
// sourced counters the ledger already keeps (an achievement is a predicate over them).
//
//   installPsyche(game) -> game.psyche = { exp(domain), level(domain), total() }
// ---------------------------------------------------------------------------------------
import { DOMAINS, SOURCES, expFor, levelOf } from './domains.js';

const EVENTS = new Set(SOURCES.map((s) => s.event));

export function installPsyche(game) {
  const L = game.ledger;
  const exp = (d) => L.get(`exp.${d}`);
  game.psyche = {
    exp,
    level: (d) => levelOf(exp(d)),
    total: () => Object.keys(DOMAINS).reduce((a, d) => a + levelOf(exp(d)), 0),
  };
  game.events.on('*', (e) => {
    if (!EVENTS.has(e.name) || (e.by && e.by !== 'courier')) return;
    for (const [d, n] of expFor(e)) {
      if (!(n > 0)) continue;
      const was = levelOf(exp(d));
      L.inc(`exp.${d}`, n);
      const now = levelOf(exp(d));
      if (now > was) game.events.emit('domain.level', { domain: d, level: now, by: 'courier' });
    }
  });
  return game.psyche;
}
