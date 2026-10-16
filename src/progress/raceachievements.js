// ---------------------------------------------------------------------------------------
// THE RACEWAY'S ACHIEVEMENTS (docs/plans/SKIFF-RACING.md; split from progress/achievements.js in round 6, when the Raceway's grew past a
// page of their own): predicates over the ledger as every achievement is (OSRS's tiers and types, FFXIV's categories), in the SOLAR
// SKIFFING category's "The Raceway" sub. Some open the garage's parts (progress/skiffparts.js `opens`) and the siblings' race (rw21).
// A medal is a test passed once; a count way and a feat way for each thing worth having (DESIGN.md section 22).
//
// Prior art: Tony Hawk's goal lists and gap checklists, Gran Turismo's licence golds, Mario Kart's cup trophies, Burnout's takedown
// types; the house's own achievements.js (its helpers are passed in).
//
//   racewayAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { LICENCES } from '../world/raceway/licences.js';
import { GAPS } from '../world/raceway/gaps.js';

export function racewayAchievements({ C, H, F }) {
  // the Raceway (docs/plans/SKIFF-RACING.md: a medal is a test passed once; the carve, the solar start and the plates are its verbs)
  C('rw1', 'skiff', 'The Raceway', 1, 'mechanic', 'Lights Out', 'Finish a race at the Raceway.', 'race.raceway.finish', 1);
  F('rw2', 'skiff', 'The Raceway', 2, 'mechanic', 'Podium', 'Take bronze at the Raceway.', (L) => L.get('race.raceway.bronze') + L.get('race.raceway.silver') + L.get('race.raceway.gold'), 1);
  F('rw3', 'skiff', 'The Raceway', 3, 'mechanic', 'Second Wind', 'Take silver at the Raceway.', (L) => L.get('race.raceway.silver') + L.get('race.raceway.gold'), 1);
  C('rw4', 'skiff', 'The Raceway', 5, 'mechanic', 'Gold Leaf', 'Take gold at the Raceway.', 'race.raceway.gold', 1, { title: 'Sunracer' });
  C('rw5', 'skiff', 'The Raceway', 2, 'mechanic', 'Sunrise Start', 'Make a solar start: the sail run up full just as the race begins.', 'race.raceway.solarstart', 1);
  H('rw6', 'skiff', 'The Raceway', 3, 'mechanic', 'White Heat', 'Let go of a carve at its third tier.', 'skiff.carve.best', 3);
  C('rw7', 'skiff', 'The Raceway', 2, 'count', 'Sunbather', 'Ride over 50 sun plates.', 'skiff.plate', 50);
  C('rw8', 'skiff', 'The Raceway', 3, 'mechanic', 'Late Bloomer', 'Make 25 late pops off a crest or a kicker.', 'skiff.pop', 25);
  H('rw9', 'skiff', 'The Raceway', 3, 'mechanic', 'Keel and Lintel', 'Grind a rail for 40 metres in one go.', 'skiff.grind.best', 40, { unit: 'm' });
  C('rw10', 'skiff', 'The Raceway', 2, 'count', 'Ringleader', 'Fly through 50 sun rings.', 'skiff.ring', 50);
  // round 3 (SKIFF-RACING.md 9): the trick combo, the grabs, the perfect pop, the cavern, and the night lap
  H('rw11', 'skiff', 'The Raceway', 3, 'mechanic', 'Daisy Chain', 'Link 8 tricks into one combo and bank it.', 'skiff.combo.longest', 8);
  H('rw12', 'skiff', 'The Raceway', 4, 'mechanic', 'Full Tank', 'Bank a combo worth 3,000.', 'skiff.combo.best', 3000);
  C('rw13', 'skiff', 'The Raceway', 3, 'mechanic', 'Nailed It', 'Make 25 perfect pops.', 'skiff.pop.perfect', 25);
  H('rw14', 'skiff', 'The Raceway', 2, 'mechanic', 'Stalefish', 'Hold a grab for 2 real seconds and let go before you land.', 'skiff.grab.best', 2, { unit: 's' });
  C('rw15', 'skiff', 'The Raceway', 2, 'mechanic', 'Undercroft', 'Ride the cavern through, from its fork to its end.', 'raceway.cavern', 1);
  C('rw16', 'skiff', 'The Raceway', 3, 'mechanic', 'Moonlighting', 'Finish a race at night, the sun plates dark.', 'race.raceway.finish.night', 1);
  // round 4 (SKIFF-RACING.md 10): the park's other tracks, the coaster rail, the antlion
  C('rw17', 'skiff', 'The Raceway', 2, 'mechanic', 'Into the Gorge', 'Finish a race on the Gorge Run.', 'race.track.gorge.finish', 1);
  C('rw18', 'skiff', 'The Raceway', 2, 'mechanic', 'Season Pass', 'Finish a race on the Coaster.', 'race.track.coaster.finish', 1);
  H('rw19', 'skiff', 'The Raceway', 4, 'mechanic', 'Loop the Loop', 'Ride the Coaster\'s rail end to end: 850 metres in one grind.', 'skiff.grind.best', 850, { unit: 'm' });
  C('rw20', 'skiff', 'The Raceway', 1, 'mechanic', 'Doodlebug', 'Be taken by the antlion.', 'raceway.pit', 1);
  // round 5 (SKIFF-RACING.md 11): the rivals, the takedown, the grind tricks
  C('rw21', 'skiff', 'The Raceway', 2, 'mechanic', 'Podium Pottery', 'Win a race against the rivals.', 'race.raceway.win', 1);
  C('rw22', 'skiff', 'The Raceway', 2, 'mechanic', 'Crockery', 'Take down a rival: hit one hard from the side.', 'race.takedown', 1);
  C('rw23', 'skiff', 'The Raceway', 3, 'mechanic', 'Grindhouse', 'Make 25 grind tricks: LMB or RMB clicked twice on a rail.', 'skiff.grind.trick', 25);
  // round 6 (SKIFF-RACING.md 12): the modes, the board's rules, the cups, the licences, the gaps, the City Trial, the wager
  C('rw24', 'skiff', 'The Raceway', 1, 'mechanic', 'Flying Lap', 'Finish a hot lap.', 'race.hotlap', 1);
  H('rw25', 'skiff', 'The Raceway', 4, 'perfect', 'Pot Luck', 'Smash all 30 pots in one pot smash.', 'race.pots.smashed.best', 30);
  C('rw26', 'skiff', 'The Raceway', 3, 'mechanic', 'Out of the Pit', 'Escape the crater ahead of the antlion.', 'race.escape.out', 1);
  F('rw27', 'skiff', 'The Raceway', 3, 'collect', 'Licensed', 'Take a medal in every licence test.', (L) => LICENCES.filter((t) => ['gold', 'silver', 'bronze'].some((m) => L.get(`licence.${t.id}.${m}`) > 0)).length, LICENCES.length);
  F('rw28', 'skiff', 'The Raceway', 5, 'perfect', 'With Honours', 'Take gold in every licence test.', (L) => LICENCES.filter((t) => L.get(`licence.${t.id}.gold`) > 0).length, LICENCES.length, { title: 'Licensed' });
  C('rw29', 'skiff', 'The Raceway', 3, 'mechanic', 'Clay Cup', 'Win the Clay Cup.', 'cup.clay.win', 1);
  C('rw30', 'skiff', 'The Raceway', 5, 'mechanic', 'Family Silver', 'Win the Sibling Cup.', 'cup.sibling.win', 1, { title: 'Favourite' });
  C('rw31', 'skiff', 'The Raceway', 1, 'mechanic', 'Mind the Gap', 'Find a gap: a named jump, off one stretch and onto another.', 'skiff.gap', 1);
  F('rw32', 'skiff', 'The Raceway', 4, 'collect', 'Gap Hunter', 'Find every gap in the park.', (L) => GAPS.filter((G) => L.get(`skiff.gap.${G.id}`) > 0).length, GAPS.length);
  H('rw33', 'skiff', 'The Raceway', 2, 'mechanic', 'Full Power', 'Pass five buoys on their sides in a row.', 'skiff.buoy.power', 5);
  C('rw34', 'skiff', 'The Raceway', 2, 'count', 'Close Shave', 'Make 25 near misses: past a pillar, a column or a rival at speed, a hand\'s breadth off.', 'skiff.nearmiss', 25);
  H('rw35', 'skiff', 'The Raceway', 3, 'mechanic', 'Tail Spin', 'Hold a manual for 5 real seconds.', 'skiff.manual.best', 5, { unit: 's' });
  C('rw36', 'skiff', 'The Raceway', 1, 'mechanic', 'Pit Stop', 'Fill your pool on a vein lane.', 'skiff.refill', 1);
  C('rw37', 'skiff', 'The Raceway', 1, 'mechanic', 'Total Loss', 'Wreck the board: a hard knock with the pool empty.', 'skiff.wreck', 1, { hidden: true });
  C('rw38', 'skiff', 'The Raceway', 2, 'mechanic', 'Grudge Match', 'Beat the rival that beat you last.', 'race.nemesis.beaten', 1);
  C('rw39', 'skiff', 'The Raceway', 2, 'mechanic', 'High Roller', 'Win a wager on your own race.', 'wager.won', 1);
  C('rw40', 'skiff', 'The Raceway', 2, 'mechanic', 'City Slicker', 'Ride a City Trial through to its Stadium\'s end.', 'citytrial.done', 1);
  H('rw41', 'skiff', 'The Raceway', 3, 'mechanic', 'Patchwork', 'Take 20 patches in one City Trial.', 'citytrial.patch.best', 20);
  C('rw42', 'skiff', 'The Raceway', 2, 'mechanic', 'Shoulder Charge', 'Take down a rival with the shoulder: Q or E tapped twice.', 'race.takedown.shoulder', 1);
  C('rw43', 'skiff', 'The Raceway', 3, 'mechanic', 'Aftertouch', 'Take down a rival with your own body, thrown in a bail and steered onto it.', 'race.takedown.aftertouch', 1);
}
