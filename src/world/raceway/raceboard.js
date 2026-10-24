// ---------------------------------------------------------------------------------------
// THE RACE BOARD (docs/plans/SKIFF-RACING.md section 12; the owner, v198: "racetrack selection"): the stone at the park's hub, F there.
// One page in tabs, every run the Raceway offers begun from it (its room's own thing, never a global key: CLAUDE.md's scope):
//   RACES     each track: a race, a hot lap, practice, a pot smash; your bests; the rivals to race (the clapperjars, or the siblings
//             once opened); and the wager on the next race (wager.js).
//   CUPS      the cups (cups.js), and how you last did.
//   LICENCES  the tests (licences.js), each with the medal you hold.
//   TRIALS    the escape (escape.js) and the City Trial (citytrial.js).
//   GARAGE    the build: its class (STOCK or OPEN) and Performance Index on each track; the skiff's parts, slot by slot
//             (progress/skiffparts.js): the open ones to choose, the shut ones with the achievement that opens each; the tune sheet
//             (progress/skifftune.js; drawn as sliders by ui/garagesheet.js: a notch hovered shows its change, clicked wears it); the three
//             setups (wear, keep, pin to a track); a trim run on each track; the last two laps' telemetry, drawn over the map (ui/garagesheet.js).
// A row is a choice card's plain cousin (the index's rooms), its words placeholders for Espada's.
//
// Prior art: Mario Kart's mode select, Gran Turismo's world map of modes, Kirby Air Ride's top menu; the index's own room list.
//
//   const B = new RaceBoard(game, race)   B.open(tab?)   B.siblingsOpen
// ---------------------------------------------------------------------------------------
import { MODES } from './modes.js';
import { CUPS } from './cups.js';
import { LICENCES } from './licences.js';
import { PARTS, SLOTS } from '../../progress/skiffparts.js';
import { TUNE, SETUPS, tuneMult } from '../../progress/skifftune.js';
import { tuneSheet, runTrace } from '../../ui/garagesheet.js';
import { WAGER } from '../../progress/econ/wager.js';
import { ECON } from '../../progress/econ/table.js';

const TABS = [['races', 'RACES'], ['cups', 'CUPS'], ['licences', 'LICENCES'], ['trials', 'TRIALS'], ['garage', 'GARAGE']];
const clock = (s) => (s && Number.isFinite(s) ? `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}` : '—');
const MEDAL = { gold: '◆ gold', silver: '◇ silver', bronze: '△ bronze' };

export class RaceBoard {
  constructor(game, race) { this.game = game; this.race = race; this.tab = 'races'; this.roster = 'clapperjars'; this.stake = 0; this.on = 'win'; }
  get siblingsOpen() { const g = this.game; return !!g.achievements?.done?.('rw21') || !!g.lend?.has?.('racing'); }
  open(tab = this.tab) {
    const g = this.game, menu = g.indexMenu || g.course?.menu, R = this.race.R; if (!menu?.showPage || !R) return;
    this.tab = tab;
    menu.showPage('raceway.board', (im, el) => {
      const tabs = el('div', 'rooms'); tabs.style.gridTemplateColumns = `repeat(${TABS.length}, 1fr)`;
      for (const [id, label] of TABS) { const t = el('div', `room${id === this.tab ? ' sel' : ''}`, `<span><b>${label}</b></span>`); t.onclick = () => this.open(id); tabs.appendChild(t); }
      im.appendChild(tabs);
      const row = (parent, icon, title, sub, go, shut) => { const d = el('div', 'room', `<span class="n">${icon}</span><span><b>${title}</b><s>${sub}</s></span>`); if (shut) d.style.opacity = '0.45'; else if (go) d.onclick = () => go(menu); parent.appendChild(d); return d; };
      const grp = (title) => { im.appendChild(el('div', 'grp', title)); const rows = el('div', 'rooms'); im.appendChild(rows); return rows; };
      this[this.tab](grp, row, menu);
    }, { title: 'THE RACE BOARD', sub: 'click to choose · F closes' });
  }
  /** Begin a run and close the board. */
  go(menu, track, opts) { menu.close(); this.race.start(track, opts); }

  races(grp, row) {
    const g = this.game, L = g.ledger, R = this.race.R, W = g.wager;
    for (const T of R.tracks) {
      const lap = this.race.bestLaps[`${T.id}.stock`]?.seconds, open = this.race.bestLaps[`${T.id}.open`]?.seconds, best = L?.best?.(`race.track.${T.id}.best`), hot = L?.best?.(`race.hotlap.${T.id}`), pots = L?.best?.(`race.pots.${T.id}`);
      const rows = grp(`${T.name.toUpperCase()} · ${(T.length / 1000).toFixed(1)} km · best lap ${clock(lap)} STOCK, ${clock(open)} OPEN`);
      for (const id of ['race', 'hotlap', 'practice', 'pots']) {
        const M = MODES[id], mine = id === 'race' ? best : id === 'hotlap' ? hot : id === 'pots' ? pots : null;
        row(rows, id === 'race' ? '◇' : id === 'hotlap' ? '⟳' : id === 'practice' ? '∞' : '⚱', M.label, `${M.line}${mine ? ` Best ${clock(mine)}.` : ''}`, (menu) => {
          if (id === 'race' && this.stake && W && !W.place(T.id, WAGER.stakes[this.stake - 1], this.on)) return;
          this.go(menu, T.id, { mode: id, roster: this.roster });
        });
      }
    }
    const rr = grp('RIVALS');
    row(rr, this.roster === 'clapperjars' ? '●' : '○', 'The clapperjars', 'Clink the blocker, Crock the rail hog, Glaze the gambler.', () => { this.roster = 'clapperjars'; this.open(); });
    row(rr, this.roster === 'siblings' ? '●' : '○', 'Your siblings', this.siblingsOpen ? 'Petra, Calissa and Espada: the hard field.' : 'Win a race to open.', () => { this.roster = 'siblings'; this.open(); }, !this.siblingsOpen);
    if (!W) return;
    const wr = grp('THE WAGER (ON YOUR NEXT RACE)');
    row(wr, this.stake === 0 ? '●' : '○', 'No stake', 'Race for the race.', () => { this.stake = 0; this.open(); });
    WAGER.stakes.forEach((m, k) => row(wr, this.stake === k + 1 ? '●' : '○', `${Math.round(m * ECON.perMinute)} cubes`, `You have ${g.cubes?.balance ?? 0}.`, () => { this.stake = k + 1; this.open(); }));
    for (const on of ['win', 'podium']) row(wr, this.on === on ? '●' : '○', on === 'win' ? 'To win' : 'To make the podium', `Pays ${R.tracks.map((T) => `${W.odds(T.id, on)}x on ${T.name}`).join(', ')}.`, () => { this.on = on; this.open(); });
  }
  cups(grp, row) {
    const g = this.game, L = g.ledger, rows = grp('CUPS: THREE RACES, POINTS BY PLACE (10, 6, 4, 2)');
    for (const C of CUPS) {
      const shut = C.roster === 'siblings' && !this.siblingsOpen, won = L?.get?.(`cup.${C.id}.win`) || 0;
      row(rows, won ? '♛' : '♔', C.label, shut ? 'Win a race to open.' : `${C.line}${won ? ` Won ${won}.` : ''}`, (menu) => { menu.close(); this.race.cups.start(C.id); }, shut);
    }
  }
  licences(grp, row) {
    const g = this.game, L = g.ledger, rows = grp('LICENCES: A STRETCH, A RULE, A MEDAL');
    for (const t of LICENCES) {
      const held = ['gold', 'silver', 'bronze'].find((m) => L?.get?.(`licence.${t.id}.${m}`) > 0);
      row(rows, held ? '◆' : '◇', `${t.label}${held ? ` · ${MEDAL[held]}` : ''}`, t.line, (menu) => this.go(menu, t.track, { mode: 'licence', test: t.id }));
    }
  }
  trials(grp, row) {
    const g = this.game, L = g.ledger, rows = grp('TRIALS');
    row(rows, '☗', 'Escape the crater', `${MODES.escape.line}${L?.best?.('race.escape') ? ` Best ${clock(L.best('race.escape'))}.` : ''}`, (menu) => this.go(menu, 'gorge', { mode: 'escape' }));
    row(rows, '✦', 'City Trial', 'Roam the park for patches that build your board, then ride a drawn event on it.', (menu) => { menu.close(); this.race.city.start(); });
  }
  garage(grp, row) {
    const g = this.game, P = g.skiffParts, R = this.race.R; if (!P) return;
    const pct = (k) => `${k >= 1 ? '+' : '−'}${Math.abs(Math.round((k - 1) * 100))}%`;
    grp(`THE BUILD · ${P.recordClass().toUpperCase()} · PI ${R.tracks.map((T) => `${P.pi(T).toFixed(1)} ${T.name.replace(/^the /, '')}`).join(', ')}`);
    for (const slot of SLOTS) {
      const rows = grp(slot.toUpperCase());
      for (const [id, part] of Object.entries(PARTS)) {
        if (part.slot !== slot) continue;
        const open = P.open(id), mine = P.chosen[slot] === id, ach = part.opens && g.achievements?.by?.[part.opens];
        const stats = Object.entries(part.mult).map(([k, v]) => `${k} ${pct(v)}`).join(', ');
        row(rows, mine ? '●' : '○', part.name, open ? `${part.does}${stats ? ` (${stats})` : ''}` : `Opened by the achievement ${ach?.name || part.opens}.`, () => { P.choose(slot, id); this.open(); }, !open);
      }
    }
    const sh = grp('THE SHEET · hover a notch to see what it changes, click to wear it; the gold tick is the board as it came');
    if (!P.sheetOpen) row(sh, '○', 'The tune sheet', 'Opens with your first part.', null, true);
    else { sh.style.display = 'block'; tuneSheet(sh, { P, tracks: R.tracks, TUNE, tuneMult, onChange: () => this.open() }); } // (the sheet's look: Calissa's, ui/garagesheet.js)
    const su = grp('SETUPS · the parts and the sheet, kept; pinned, worn when that track starts');
    for (let i = 0; i < SETUPS; i++) {
      const S = P.setups[i], pinned = R.tracks.filter((T) => P.pins[T.id] === i).map((T) => T.name).join(', ');
      row(su, S ? '▣' : '□', S ? `${S.name}: wear it` : `Setup ${i + 1}: empty`, S ? `${Object.values(S.chosen).filter((id) => !id.endsWith('.standard')).map((id) => PARTS[id]?.name).join(', ') || 'standard parts'}; sheet ${Object.entries(S.sheet).filter(([, x]) => x).map(([k, x]) => `${k} ${x > 0 ? '+' : ''}${x}`).join(', ') || 'at 0'}${pinned ? `; pinned to ${pinned}` : ''}.` : 'Keep what you wear here.', S ? () => { P.wear(i); this.open(); } : null, !S);
      row(su, '⇩', `Keep what you wear as Setup ${i + 1}`, S ? 'It replaces what is kept.' : 'The parts and the sheet as they are now.', () => { P.saveSetup(i); this.open(); });
      if (S) { const at = R.tracks.findIndex((T) => P.pins[T.id] === i), next = R.tracks[at + 1]; row(su, '⚑', next ? `Pin Setup ${i + 1} to ${next.name}` : `Unpin Setup ${i + 1}`, 'Click again for the next track.', () => { if (at >= 0) P.pin(R.tracks[at].id, null); if (next) P.pin(next.id, i); this.open(); }); }
    }
    const tr = grp('TRIM RUNS · one lap from a flying start against your last trim run: the splits say what the tune changed');
    for (const T of R.tracks) row(tr, '⟲', `Trim run: ${T.name}`, this.race.bestLaps[`${T.id}.trim`] ? `Your last: ${clock(this.race.bestLaps[`${T.id}.trim`].seconds)}.` : 'No trim run yet: the first sets the ghost.', (menu) => this.go(menu, T.id, { mode: 'trim' }));
    const tel = grp('TELEMETRY · the last lap, and the one before');
    tel.style.display = 'block';
    if (!runTrace(tel, { traces: this.race.traces, trackOf: (id) => R.trackOf(id) })) row(tel, '·', 'No lap yet', 'Ride a lap to see it.', null, true); // (the trace's look: Calissa's, ui/garagesheet.js)
  }
}
