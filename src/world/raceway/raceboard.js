// ---------------------------------------------------------------------------------------
// THE RACE BOARD (docs/plans/SKIFF-RACING.md section 12; the owner, v198: "racetrack selection"): the stone at the park's hub, F there.
// One page in tabs, every run the Raceway offers begun from it (its room's own thing, never a global key: CLAUDE.md's scope):
//   RACES     each track: a race, a hot lap, practice, a pot smash, a haunted race and the haunt (its traps: TRACK-EDITOR.md 7); your
//             bests; the rivals to race (the clapperjars, or the siblings once opened); and the wager on the next race (wager.js).
//   CUPS      the cups (cups.js), and how you last did.
//   LICENCES  the tests (licences.js), each with the medal you hold.
//   TRIALS    the escape (escape.js) and the City Trial (citytrial.js).
//   BUILD     your made tracks (world/raceway/editor.js, TRACK-EDITOR.md): three slots, each to edit, test, validate, race, race haunted
//             by the siblings, or haunt yourself (world/raceway/haunt.js); a code pasted on the chat line (/edit code ...) loads one.
//   PAINT     what the board wears (progress/skiffpaint.js): the sail's dye and pattern, your seal on it, the trail, the ribbon, the
//             pennant and its length; the shut ones with what opens them; a dye's price (a firing's) said before it is paid; a choice
//             hovered is shown on the board before it is worn (Calissa's preview, vfx/skiffpaintlook.js).
//   GARAGE    the build: its class (STOCK or OPEN) and Performance Index on each track; the skiff's parts, slot by slot
//             (progress/skiffparts.js): the open ones to choose, the shut ones with the achievement that opens each; the tune sheet
//             (progress/skifftune.js; drawn as sliders by ui/garagesheet.js: a notch hovered shows its change, clicked wears it); the three
//             setups (wear, keep, pin to a track); a test lap on each track; the last two laps' telemetry, in numbers and drawn over the map (ui/garagesheet.js).
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
import { PAINT } from '../../progress/skiffpaint.js';
import { isValidated, budgetOf } from '../../progress/trackdef.js';
import { TUNE, SETUPS, SLIDE, tuneMult } from '../../progress/skifftune.js';
import { tuneSheet, runTrace } from '../../ui/garagesheet.js';
import { skiffPaintPreview } from '../../vfx/skiffpaintlook.js';
import { WAGER } from '../../progress/econ/wager.js';
import { ECON } from '../../progress/econ/table.js';

const TABS = [['races', 'RACES'], ['cups', 'CUPS'], ['licences', 'LICENCES'], ['trials', 'TRIALS'], ['garage', 'GARAGE'], ['paint', 'PAINT'], ['build', 'BUILD']];
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
      // its traps, set up only for these two (TRACK-EDITOR.md 7: a park track's races are never changed by them)
      if (T.features.traps?.length) {
        row(rows, '☠', MODES.haunted.label, `${MODES.haunted.line} ${T.features.traps.length} traps.`, (menu) => this.go(menu, T.id, { mode: 'haunted', roster: this.roster }));
        row(rows, '◎', 'Haunt', 'The clapperjars race it; you possess its traps (LMB on one, or Space for the next ahead; Q / E its lane or side).', (menu) => { menu.close(); g.haunt?.start(T.id); });
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
    const tr = grp('TEST LAPS · one lap from a flying start against your last test lap: the splits say what the tune changed');
    for (const T of R.tracks) row(tr, '⟲', `Test lap: ${T.name}`, this.race.bestLaps[`${T.id}.trim`] ? `Your last: ${clock(this.race.bestLaps[`${T.id}.trim`].seconds)}.` : 'No test lap yet: the first sets the ghost.', (menu) => this.go(menu, T.id, { mode: 'trim' }));
    const tel = grp('TELEMETRY · the last lap, and the one before');
    for (const [k, Tr] of [['Last lap', this.race.traces?.last], ['The lap before', this.race.traces?.prev]]) {
      if (!Tr?.samples?.length) { row(tel, '·', k, 'Ride a lap to see it.', null, true); continue; }
      const sp = Tr.samples.map((x) => x[1]), sl = Tr.samples.map((x) => Math.abs(x[2])), slide = Tr.samples.filter((x) => Math.abs(x[2]) > SLIDE.slip * (x[4] || 1)).length / sl.length;
      row(tel, '∿', `${k}: ${clock(Tr.seconds)} on ${R.trackOf(Tr.track)?.name || Tr.track} (${Tr.cls.toUpperCase()})`, `speed ${Math.min(...sp).toFixed(1)} .. ${Math.max(...sp).toFixed(1)} m/s, mean ${(sp.reduce((a, b) => a + b, 0) / sp.length).toFixed(1)}; slip up to ${(Math.max(...sl) * 57.3).toFixed(0)}°, sliding ${(slide * 100).toFixed(0)}% of the lap.`, null);
    }
    tel.style.display = 'block';
    runTrace(tel, { traces: this.race.traces, trackOf: (id) => R.trackOf(id) }); // (the trace drawn under the numbers: Calissa's, ui/garagesheet.js)
  }
  paint(grp, row) {
    const g = this.game, S = g.skiffPaint; if (!S) return;
    const TITLE = { dye: 'THE SAIL\'S DYE · a firing\'s price each change', pattern: 'THE SAIL\'S PATTERN', seal: 'YOUR SEAL', trail: 'THE TRAIL ON THE SAND', ribbon: 'THE TRAIL IN THE AIR', pennant: 'THE PENNANT', length: 'ITS LENGTH' };
    for (const kind of Object.keys(PAINT)) {
      const rows = grp(TITLE[kind]);
      for (const r of kind === 'dye' ? S.dyes() : PAINT[kind]) {
        const open = S.open(kind, r.id), mine = S.worn[kind] === r.id, price = S.priceOf(kind, r.id);
        if (kind === 'dye' && r.glaze && !open) continue; // (a glaze not yours is not offered)
        const d = row(rows, mine ? '●' : '○', `${r.label}${price && open ? ` · ${price} cubes` : ''}`, S.why(kind, r.id), () => { this.unpreview(); S.choose(kind, r.id); this.open(); }, !open);
        if (open) { d.onmouseenter = () => this.preview(kind, r.id); d.onmouseleave = () => this.unpreview(); } // (Calissa's look shows a choice on the board before it is worn)
      }
    }
    grp(`PURSE ${g.cubes?.balance ?? 0} CUBES · none of this touches the handling`);
  }
  /** A paint choice shown on the board without wearing it (vfx/skiffpaintlook.js), given back when the pointer leaves it or the board
   *  closes (watched a frame at a time while it shows: the index's page has no close hook of its own to borrow). */
  preview(kind, id) {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!skiffPaintPreview(g, kind, id)) return;
    if (this.previewing) return; this.previewing = true;
    const watch = () => { if (!this.previewing) return; if (!menu?.open || menu.page?.name !== 'raceway.board' || this.tab !== 'paint') { this.unpreview(); return; } requestAnimationFrame(watch); };
    requestAnimationFrame(watch);
  }
  unpreview() { if (!this.previewing) return; this.previewing = false; skiffPaintPreview(this.game); }
  build(grp, row) {
    const g = this.game, E = g.trackEditor; if (!E) return;
    const run = (slot, mode) => (menu) => { menu.close(); if (!E.wear(slot)) return; if (mode === 'haunt') g.haunt?.start('made'); else this.race.start('made', { mode, solo: mode === 'validate' || mode === 'practice' }); };
    for (let i = 0; i < 3; i++) {
      const D = E.slots[i], v = D && isValidated(D), rows = grp(`SLOT ${i + 1} · ${D ? `${D.name}${v ? ' · validated' : ' · not validated'} · budget ${budgetOf(D).used}${D.author ? ` · author ${D.author.seconds} s` : ''}` : 'empty'}`);
      row(rows, '✎', D ? 'Edit it' : 'Build a track', D ? 'The build lot, from above: its line, pieces, traps and rules.' : 'A new track on the build lot.', (menu) => { menu.close(); E.open(i); });
      if (!D) continue;
      row(rows, '∞', 'Test ride', 'Laps until you retire. Nothing is recorded.', run(i, 'practice'));
      row(rows, '✓', 'Validate', 'Ride it once to the line, alone: your time is its author time, and it can be shared.', run(i, 'validate'));
      row(rows, '◇', 'Race', 'Three laps against the clapperjars, its traps on their own cycles. No cubes: a made track pays in records.', run(i, 'race'), !v);
      row(rows, '☠', 'Haunted race', 'Three laps against the clapperjars; the siblings possess its traps against you.', run(i, 'haunted'), !v || !D.traps.length);
      row(rows, '◎', 'Haunt', 'The clapperjars race it; you possess its traps (LMB on one, or Space for the next ahead; Q / E its lane or side).', run(i, 'haunt'), !v || !D.traps.length);
    }
    row(grp('SHARED TRACKS'), '⇩', 'Load a code', 'Type /edit code and paste a track code on the chat line: it loads into the first empty slot.', null, true);
  }
}
