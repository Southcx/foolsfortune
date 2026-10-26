// ---------------------------------------------------------------------------------------
// A LIVE MOMENT: a stretch of play a pop-up must wait out (the owner, 2026-10-26, on the phone: the title placard "can descend at very
// unfortunate timing (like in the middle of a live race)"). One question for anything that would cover the view or take the keys: is
// something under way that the player is steering, against a clock or a foe? It names what (a race, a trial, a crossing, a puzzle duel,
// the rhythm mode, a sea serpent hunting the hull, the Great Slip Jelly awake, a fight: the owner, 2026-10-26, "maybe mid-combat is
// another situation to exclude?"), or null when the moment is free. What waits keeps its queue and shows when the answer is null again;
// nothing here decides what waits (the title screen and a cinematic are the placard's own).
// Read each frame from what each mode already keeps (its own flag), so a mode needs no wiring here beyond its row. A fight has no flag of
// its own: it is a blow answerable near the Courier (a creature's windup within FIGHT.near m), or a blow landed either way (the Courier's
// on a creature, a creature's on the vessel) within the last FIGHT.hold real s.
//
// Prior art: the PlayStation 5's Do Not Disturb and iOS's Focus (notifications held through what you are doing, delivered after), and
// a fighting game's "results after the round" (Street Fighter's: nothing pops up while the round is on).
//
//   installLiveMoment(game) -> game.liveMoment()   'race' | 'trial' | 'crossing' | 'duel' | 'rhythm' | 'sea fight' | 'FOE' | 'fight' | null
//   LIVE   the rows, [name, (game) -> truthy while under way]      FIGHT   a fight's reach and how long it holds after the last blow
// ---------------------------------------------------------------------------------------

/** near: m from the Courier a creature's windup counts; hold: real s a fight lasts after the last blow landed either way. */
export const FIGHT = { near: 15, hold: 6 };
const lastBlow = new WeakMap(); // (a game's last blow landed either way, real ms)

/** A creature winding up an answerable blow near the Courier (creatures.windups' test, without its list). */
function windingUp(g) {
  const P = g.player?.pos, L = g.creatures?.list; if (!P || !L) return false;
  for (const c of L) { const w = c.windup; if (c.alive && !c.ally && w?.parry && w.at.distanceTo(P) <= FIGHT.near + w.radius) return true; }
  return false;
}

export const LIVE = [
  ['race', (g) => g.race?.running || g.cityTrial?.on], // (a race of any ruleset, and the City Trial's roam: world/raceway/)
  ['trial', (g) => g.trial?.running || g.solar?.running], // (the workshop's course trial, the Solar Skiffing trial)
  ['crossing', (g) => g.emocean?.stage?.active], // (a stage of the Emocean sailed)
  ['duel', (g) => g.duel?.active], // (a puzzle duel)
  ['rhythm', (g) => g.rhythm?.active], // (the rhythm mode, and busking)
  ['sea fight', (g) => g.seaFight?.serpent], // (a sea serpent alive on the open sea)
  ['FOE', (g) => g.well?.fight?.active], // (the Great Slip Jelly awake)
  ['fight', (g) => performance.now() - (lastBlow.get(g) ?? -Infinity) < FIGHT.hold * 1000 || windingUp(g)], // (a blow landed lately, or one winding up near)
];

/** What is under way now, by name, or null. A row that throws counts as free (a mode half built). */
export function liveMoment(game) {
  for (const [name, live] of LIVE) { try { if (live(game)) return name; } catch { /* not built: free */ } }
  return null;
}

export function installLiveMoment(game) {
  // a blow landed either way: the Courier's on a creature (creatures.strike), a creature's on the vessel (shielded or cracked)
  const blow = () => lastBlow.set(game, performance.now());
  game.events?.on?.('creature.struck', (e) => { if (e?.by === 'courier') blow(); });
  for (const k of ['vessel.shield', 'vessel.crack']) game.events?.on?.(k, (e) => { if (e?.by && e.by !== 'courier') blow(); });
  game.liveMoment = () => liveMoment(game);
  return game.liveMoment;
}
