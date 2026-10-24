// ---------------------------------------------------------------------------------------
// THE RACE'S MODES (docs/plans/SKIFF-RACING.md section 12; the owner, 2026-10-14: "build everything"): what a run at the Raceway is
// for. One race engine (world/raceway/race.js: the grid, the gates, the laps, the ghost) and a mode that says how many laps, whether
// rivals line up, whether a medal is at stake, whether the start is flying, and which RULESET (a module of its own) adds its rules:
//   race      three laps against the rivals, from a standing start, a camera's flyover first; medals on the Sun Circuit.
//   hotlap    one lap, alone, from a flying start: the clock starts at the line (Gran Turismo's and Trackmania's hot lap).
//   practice  laps until you retire, alone; Backspace held rewinds (Forza's rewind, GRID's flashback); nothing is recorded.
//   pots      one lap, alone, pots on the line: each smashed takes a real second off the time (world/raceway/pottrial.js).
//   escape    the Gorge Run's crater, chased up out of it by the antlion (world/raceway/escape.js).
//   licence   a test on a stretch of a track, under a rule (world/raceway/licences.js: Gran Turismo's licences).
//   trim      one lap alone, from a flying start, against the ghost of your LAST trim run (not your best): the splits at each gate say
//             what the tune changed (Forza Horizon's test drive; SKIFF-TUNING.md 2.5). Nothing is recorded.
// A cup (world/raceway/cups.js) is three races in a row; the City Trial (world/raceway/citytrial.js) ends in one of these, drawn.
//
// Prior art: Mario Kart 8's modes over one engine (Grand Prix, Time Trial, VS), Gran Turismo's licences and its arcade, Trackmania's
// hot lap and practice, Forza's rewind, Kirby Air Ride's City Trial and its Stadium.
//
//   MODES[id] = { label, line, laps, rivals, medals, flyover, flying, rewind, record, ruleset, trim }   FLY (the flying start)
// ---------------------------------------------------------------------------------------

/** The modes, in the race board's order. `line`: the board's one line (placeholders for Espada's words). `record`: whether its time is
 *  kept on the ledger's boards (practice keeps nothing: it can rewind). `ruleset`: the module that adds the mode's own rules. */
export const MODES = {
  race:     { label: 'Race',      line: 'Three laps against the rivals, from a standing start.', laps: 3, rivals: true, medals: true, flyover: true, record: true },
  hotlap:   { label: 'Hot lap',   line: 'One lap alone, from a flying start: the clock starts at the line.', laps: 1, flying: true, record: true },
  practice: { label: 'Practice',  line: 'Laps until you retire. Hold Backspace to rewind. Nothing is recorded.', laps: 99, rewind: true, record: false },
  pots:     { label: 'Pot smash', line: 'One lap alone. Each pot smashed takes a second off your time.', laps: 1, ruleset: 'pots', record: true },
  escape:   { label: 'Escape',    line: 'The antlion wakes in the crater. Climb out before it reaches you.', laps: 1, ruleset: 'escape', record: true },
  licence:  { label: 'Licence',   line: 'A test on a stretch of track, under a rule.', laps: 1, ruleset: 'licence', record: true },
  trim:     { label: 'Trim run',  line: 'One lap alone against your last trim run: the splits show what the tune changed.', laps: 1, flying: true, record: false, trim: true },
};
/** The flying start: metres before the line the board is set down, at what speed (m/s) it is pushed off. */
export const FLY = { back: 220, push: 24 };
