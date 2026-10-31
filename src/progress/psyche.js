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
// A class's affinity (CLASSES.md 6.2, a modifier with a source you can see: the class your laid spread reads as): read as a Major, its
// domain's experience counts CLASS.affinity times, and the ledger keeps what the class added (`exp.affinity.<domain>`).
//
//   installPsyche(game) -> game.psyche = { exp(domain), level(domain), total(), widen(key), affinity(domain) }
// ---------------------------------------------------------------------------------------
import { isTraining } from './combat/throwingroom.js';
import { DOMAINS, SOURCES, expFor, levelOf } from './domains.js';
import { RAMP, widenOf } from './godpowers.js';
import { CLASS } from './spreads.js';

const EVENTS = new Set(SOURCES.map((s) => s.event));

export function installPsyche(game) {
  const L = game.ledger;
  const exp = (d) => L.get(`exp.${d}`);
  const lv = (d) => (game.lend?.has?.('summit') ? 99 : levelOf(exp(d))); // (the Summit lend: every domain read at 99, the ledger untouched: progress/lend.js)
  game.psyche = {
    exp,
    level: lv,
    total: () => Object.keys(DOMAINS).reduce((a, d) => a + lv(d), 0),
    /** What the Courier's level widens this knob to (godpowers.js RAMP.tools, on the ramp's curve: SPINE.md 1.1): a multiplier of the tool's own number, or a bonus to a count. */
    widen: (key) => widenOf(key, RAMP.tools[key] ? lv(RAMP.tools[key].domain) : 1),
    /** The class's multiplier on a domain's experience: CLASS.affinity in the domain of the Major you read as, else 1. */
    affinity: (d) => (game.laidSpread?.class?.domain === d ? CLASS.affinity : 1),
  };
  game.events.on('*', (e) => {
    if (!EVENTS.has(e.name) || (e.by && e.by !== 'courier') || isTraining(e)) return; // (a training body pays no exp: combat/throwingroom.js)
    for (const [d, n] of expFor(e)) {
      if (!(n > 0)) continue;
      const was = levelOf(exp(d)), k = game.psyche.affinity(d);
      L.inc(`exp.${d}`, n * k);
      if (k !== 1) L.inc(`exp.affinity.${d}`, n * (k - 1)); // (what the class added: the Codex can show it)
      const now = levelOf(exp(d));
      if (now > was) game.events.emit('domain.level', { domain: d, level: now, by: 'courier' });
    }
  });
  return game.psyche;
}
