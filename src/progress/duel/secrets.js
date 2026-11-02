// ---------------------------------------------------------------------------------------
// AN ABERRANT'S SECRET WIN (docs/plans/ABERRANTS.md; South, 2026-10-28: "each Aberrant should be structured like its own fully unique
// puzzle with a secret win condition ... Puzzle duels are like Elite fights"): a second way to end a PvE duel, one an aberrant, never
// said. The Line always wins (the grind: push it to the far wall); the secret wins sooner, for a player who reads the aberrant, and ends
// the fight in its own way (its own death, the view's and the cinematic's). Found once, it is known (progress/foeseen.js `found`), and
// from then on the view may show its progress plainly (DESIGN.md 22: skill skips grind; grind closes the gap).
//
// A secret is told only by the aberrant's body and board: its progress is always drawn on the thing it is about (the Wisp's lantern
// dimming, the fog closing in), never by a gauge or a word, until it has been found. Each has a tell the player can notice in a turn
// or two, a cost (playing for it gives up some of the Line), and an answer from the aberrant (a foe skill that only wakes once the
// secret is half done: the aberrant noticing).
//
// Prior art: Slay the Spire's elites (one rule each that changes how you play the fight), Shadow of the Colossus and Zelda's bosses
// (the weak point read from the body), Metroid Prime's scan, Monster Hunter's breakable parts and the capture as a second way to end a
// hunt, Hollow Knight's and Dark Souls' boss deaths (an ending of its own), Pokemon's catching versus fainting.
//
//   SECRETS[id] = { of (whose: the collection log names the slot by it, never the secret), label, line, start(s) -> state, step(s, side, events) -> events }   (a ruleset's `secret: id`)
//   (k is what the view draws on the body; a secret is won by its own test, the Wisp's at k 1, the jelly's by one turn's clear)
//   secretOf(s) -> { id, k (0..1), ... } | null   secretStep(s, side, events) -> events (duel.js after each settle of the Courier's)
//   lightOf(s) -> the fog's light now (dread.js visibleTo reads it: the Wisp's lantern)
//   CLAP { window }   clapOf(clock) -> 'on' | 'off' | 'miss' (where a drag was let go against the duel cue's beat: music/clock.js's clock;
//   the session's, on the drag action as `beat`: the clapperjar's secret reads it)
//   events: secret.step { id, k, light? } (its progress moved), secret.half { id } (the aberrant notices: its gated moves wake),
//   duel.secret { winner: 0, id } (won: the duel's end, beside duel.line / duel.full)
// ---------------------------------------------------------------------------------------

export const SECRETS = {
  // THE LANTERN WISP: SNUFF THE LANTERN. Its lantern burns on Dread: every gem of Dread (its own feeling, which it resists: half to the
  // Line) you clear is fuel taken from it. Its light on its half shrinks a cell a third of the way (the fog closes in on its body: the
  // tell), and at `fuel` the lantern goes out and the Wisp with it. The cost: Dread clears push the Line half as far. The answer: once
  // the lantern is half spent its Kindle wakes (foeskills.js), burning your Dread gems into embers before you can clear them.
  // The will-o'-the-wisp of the fens is a light that leads you astray; you beat one by putting it out, not by chasing it.
  snuff: { of: 'The Lantern Wisp', label: 'Snuff the lantern', line: 'Every Dread gem you clear is fuel taken from its lantern; empty it and the Wisp goes out with it', colour: 'dread', fuel: 48,
    start: (s) => ({ id: 'snuff', k: 0, fuel: 0, light: s.rs.fog?.light ?? 3, half: false }),
    step: (s, side, events) => {
      const S = s.secret, def = SECRETS.snuff; if (side !== 0) return [];
      let n = 0; for (const e of events) if (e.type === 'clear' && e.side === 0 && e.colour === def.colour) n++;
      if (!n) return [];
      S.fuel = Math.min(def.fuel, S.fuel + n); S.k = S.fuel / def.fuel;
      const full = s.rs.fog?.light ?? 3; S.light = Math.max(0, Math.ceil(full * (1 - S.k)));
      const out = [{ type: 'secret.step', id: 'snuff', k: S.k, light: S.light, n }];
      if (!S.half && S.k >= 0.5) { S.half = true; out.push({ type: 'secret.half', id: 'snuff' }); }
      if (S.k >= 1 && s.winner === null) { s.winner = 0; out.push({ type: 'duel.secret', winner: 0, id: 'snuff' }); }
      return out;
    } },
  // AN ABERRANT SLIP JELLY: DISSOLVE IT (South, 2026-10-29: "it should throw a LOT of junk, but its easy to clear. The weakness could be
  // being highly susceptible to a well timed Transmute that converts the piled up junk for an OHKO"). Its junk is slime, itself thrown
  // at you: junk that breaks beside a clear as any does, so it is easy to keep down. Let it pile instead, then Transmute the slime (all
  // of it on your half turns to gems of one colour, powers.js) and clear `need` of those gems in one turn: the jelly has nothing left to
  // hold together and falls apart. The tell: the jelly shrinks as its slime piles on your half (k, the pile against `need`). The cost:
  // a half full of slime is a half near full (a side that cannot take what lands has lost) and pushing nothing. The answer: once the
  // pile is past `wake` of `need` its Harden wakes (foeskills.js), setting slime into plain junk a Transmute cannot touch.
  // Prior art: Puyo Puyo's garbage turned back on the sender, Tetris 99's held garbage cleared for a counter, Pokemon's Counter, Kirby
  // swallowing what is thrown at it, Majora's Mask's Gyorg (its own spawn turned against it).
  dissolve: { of: 'The slip jelly', label: 'Dissolve the slip jelly', line: 'Let its slime pile up on your half, Transmute the slime, and clear 9 of those gems in one turn; with nothing left to hold it together, the slip jelly falls apart', // (Espada's, 2026-10-29)
    need: 9, wake: 0.6,
    start: () => ({ id: 'dissolve', k: 0, pile: 0, melt: 0, ply: -1, half: false }),
    step: (s, side, events) => {
      const S = s.secret, def = SECRETS.dissolve, b = s.board, out = [];
      let pile = 0; b.each((p, x) => { if (p.slime && b.mine(0, x)) pile++; });
      if (S.ply !== s.ply) { S.ply = s.ply; S.melt = 0; } // (one turn's clear: a new ply, a new count)
      if (side === 0) for (const e of events) if (e.type === 'clear' && e.side === 0 && e.born === 'slime') S.melt++;
      const k = Math.min(1, pile / def.need); if (k !== S.k) { S.k = k; S.pile = pile; out.push({ type: 'secret.step', id: 'dissolve', k, pile }); }
      if (!S.half && pile >= def.need * def.wake) { S.half = true; out.push({ type: 'secret.half', id: 'dissolve' }); }
      if (S.melt >= def.need && s.winner === null) { s.winner = 0; out.push({ type: 'duel.secret', winner: 0, id: 'dissolve', n: S.melt }); }
      return out;
    } },
  // AN ABERRANT CLAPPERJAR: CLAP BACK (ABERRANTS.md 5.2, G1). A clapperjar claps on the beat of the duel's cue, and so must you: let your
  // turn's drag go on its clap and have it clear, `need` turns running, and it loses its own time, claps itself to pieces and is mended.
  // The tell is the clap itself, seen on its body and heard over the cue (never a gauge). The cost: a drag let go on the beat is a drag
  // cut to the music's time, not to the board's best (the drag's timer still runs). The answer: once two turns have kept time its
  // Syncopate wakes (foeskills.js) and moves its clap to the off-beat (the "and" between), and back, every other turn: you must listen.
  // The mechanic is the lesson (DESIGN.md 22): keeping time, then syncopation, as a drummer learns them.
  // Prior art: Rhythm Heaven (a lenient window on a heard beat, the off-beat turned on you), Crypt of the NecroDancer (every move on the
  // beat), Parappa's call and response, Patapon's drums, a busker's crowd clapping along.
  clapback: { of: 'The clapperjar', label: 'Clap back', line: 'Let your drag go on its clap, and clear, three turns running: it loses its own time and claps itself to pieces', need: 3,
    start: () => ({ id: 'clapback', k: 0, streak: 0, off: false, last: -9, half: false }),
    step: (s, side, events) => {
      const S = s.secret, def = SECRETS.clapback; if (side !== 0 || s.beatLast == null || S.last === s.ply) return []; // (only a drag of yours counts, the turn's first: s.beatLast is set by act for a drag; an Encore's second keeps no extra time)
      const kept = s.beatLast === (S.off ? 'off' : 'on') && events.some((e) => e.type === 'clear' && e.side === 0);
      S.streak = kept && s.ply - S.last <= 2 ? S.streak + 1 : kept ? 1 : 0; S.last = s.ply; // (a turn skipped, or a drag off its clap, starts it over)
      S.k = S.streak / def.need;
      const out = [{ type: 'secret.step', id: 'clapback', k: S.k, streak: S.streak, beat: s.beatLast, kept }];
      if (!S.half && S.streak >= 2) { S.half = true; out.push({ type: 'secret.half', id: 'clapback' }); }
      if (S.streak >= def.need && s.winner === null) { s.winner = 0; out.push({ type: 'duel.secret', winner: 0, id: 'clapback' }); }
      return out;
    } },
};

/** How near a beat a drag must be let go to count, in real seconds either side, heard (Rhythm Heaven's lenient window is about 0.07;
 *  at the duel cue's 132 bpm a beat is 0.45 real s, so 0.06 either side is 26% of the time on and 26% off: three turns running by chance
 *  is under 2 in 100, and each must clear as well). */
export const CLAP = { window: 0.06 };

/** Where a drag let go now stands against the cue's beat: 'on' (on a beat), 'off' (on the "and" between), or 'miss'; 'miss' with no
 *  cue playing. `clock` is music/clock.js's (game.music.clock()). */
export function clapOf(clock, window = CLAP.window) {
  if (!clock || !(clock.spb > 0)) return 'miss';
  const f = ((clock.beat % 1) + 1) % 1, on = Math.min(f, 1 - f) * clock.spb, off = Math.abs(f - 0.5) * clock.spb;
  return on <= window ? 'on' : off <= window ? 'off' : 'miss';
}

/** The duel's secret as it stands, or null (a ruleset without one; any style but the PvE duel). */
export const secretOf = (s) => s.secret || null;

/** A new duel's secret, from its ruleset (duel.js newDuel). */
export const secretStart = (s) => (s.style === 'pve' && SECRETS[s.rs.secret] ? SECRETS[s.rs.secret].start(s) : null);

/** After a settle of a side's action or turn: the secret's progress from what it cleared (duel.js act and endTurn). */
export function secretStep(s, side, events) {
  if (!s.secret || s.winner !== null) return [];
  return SECRETS[s.secret.id].step(s, side, events);
}

/** The fog's light now: the secret's (the Wisp's lantern dimming), else the ruleset's. */
export const lightOf = (s) => s.secret?.light ?? s.rs.fog?.light ?? 3;
