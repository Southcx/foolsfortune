// ---------------------------------------------------------------------------------------
// THE ECONOMY, MEASURED: what the cubes are doing this session, read from the ledger (src/stats.js), never counted twice. Every cube
// that comes out of something is a `cube.spill` (cubes.js: chest, dupe, jelly, zandatsu, crystal, lockheart), condensing a card is a
// `cube.earn` with why `condense`, and every cube spent is a `cube.use.<why>` (tithe, and the shops to come). From those, cubes an hour
// by source and by drain, beside what the table (econ/table.js) says play should earn, so a faucet that runs away shows at once on the
// F3 panel; tools/economy.mjs simulates the same table offline.
//
// Prior art: the faucet/drain telemetry MMOs keep (EVE's monthly economic report: production, destruction and the ISK faucets and
// sinks by source; OSRS's GE tax tracker), boiled down to one line a developer can watch while playing.
//
//   minutes(n) -> cubes          rates(ledger) -> { hours, inPerH, outPerH, net, by: [[source, perH]], drains: [[why, perH]], granted }
//   econLine(ledger) -> a short text line for the F3 panel
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

/** A price named in minutes of ordinary play. */
export const minutes = (n) => Math.round(n * ECON.perMinute);

const SPILL = 'cube.spill.', USE = 'cube.use.';

/** Cubes an hour this session, in and out, by source. */
export function rates(L) {
  const s = L.sess || {}, secs = Math.max(30, L.sessionT || 0), hours = secs / 3600;
  const by = [], drains = [];
  for (const [k, v] of Object.entries(s)) {
    if (k.startsWith(SPILL)) by.push([k.slice(SPILL.length), v / hours]);
    else if (k.startsWith(USE)) drains.push([k.slice(USE.length), v / hours]);
  }
  if (s['cube.src.condense']) by.push(['condense', s['cube.src.condense'] / hours]);
  by.sort((a, b) => b[1] - a[1]); drains.sort((a, b) => b[1] - a[1]);
  const inPerH = by.reduce((a, [, v]) => a + v, 0), outPerH = drains.reduce((a, [, v]) => a + v, 0);
  return { hours, inPerH, outPerH, net: inPerH - outPerH, by, drains, granted: s['cube.src.grant'] || 0, target: ECON.perMinute * 60 };
}

const k = (v) => (v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0));
/** One line: in / out / target an hour, then the three biggest faucets. */
export function econLine(L) {
  const r = rates(L);
  const top = r.by.slice(0, 3).map(([s, v]) => `${s} ${k(v)}`).join(' ');
  const out = r.drains.slice(0, 2).map(([s, v]) => `${s} ${k(v)}`).join(' ');
  return { r, text: `cubes/h in ${k(r.inPerH)} out ${k(r.outPerH)} (aim ${k(r.target)})${top ? `  ▲ ${top}` : ''}${out ? `  ▼ ${out}` : ''}${r.granted ? `  · granted ${k(r.granted)}` : ''}` };
}

/** The DEBUG profile's purse: `/grant [n]` puts n cubes (500 if unsaid) in her balance, so a shop or a Tithe can be tested without
 *  farming. STORY refuses it (the owner's split: STORY earns everything). Reported by an event and a rule in tracking.js. */
export function installEconomy(game) {
  game.chat?.add('grant', {
    help: 'DEBUG only: /grant [n] puts n Lachryma cubes in your purse (500 if unsaid)',
    run: ([v]) => {
      if (game.mode !== 'debug') { game.log.say('warn', 'The System grants nothing outside DEBUG.', { key: 'grant.no', throttle: 2 }); return; }
      const n = Math.max(1, Math.min(1e6, Math.round(Number(v) || 500)));
      game.cubes?.earn(n, 'grant');
      game.events.emit('econ.grant', { n, by: 'courier' });
    },
  });
}
