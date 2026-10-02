// ---------------------------------------------------------------------------------------
// ACHIEVEMENTS: a wall of small, dated, checkable things, kept the way the two MMOs that do it best keep theirs.
//
// From Old School RuneScape (Combat Achievements, Achievement Diaries, the Collection Log, the Hiscores):
//  - SIX TIERS worth 1-6 points (Easy, Medium, Hard, Elite, Master, Grandmaster), and a running total that buys standing.
//  - Every task has a TYPE, so the list teaches by what it asks: a count (kill count), a speed (a time to beat),
//    perfection (all of it with nothing missed), a mechanic (do the difficult thing once), stamina (keep going).
//  - RETROACTIVE: a task is a predicate over numbers the game already keeps (stats.js), never a flag set by a hook, so an
//    achievement added later completes at once for whoever has already done it (OSRS made its kill-count tasks retroactive).
//  - The COLLECTION LOG: slots for every thing there is to see (kinds of pot, shells, arts, places); a slot is by thing, not by source.
//  - Hiscores keep a score and the time it took, and never reset: the ledger's records carry where and when.
// From Final Fantasy XIV's Achievements:
//  - CATEGORIES with sub-groups, points, a number behind every one (so it can show 37/100 before it is done), hidden
//    entries that read ??? until they are earned, TITLES as the reward for some, and the total as a running score.
//  - Nothing is missable and nothing is timed out: it is all there to be filled in at whatever speed the player likes.
//
// A task is { id, cat, sub, tier, type, name, desc, cur(ledger, game) -> number, goal, dir: 'up' | 'down', unit, hidden, title }.
// 'down' tasks are best times: cur returns the best (Infinity when there is none yet) and the task is done at or under the goal.
// ---------------------------------------------------------------------------------------
import { BY_ID, ABILITIES, GOD_ARTS } from './system/skills.js';
import { SHELL_TYPES } from './shells.js';
import { PROFILES } from './pottery.js';
import { SPECIES, ASPECTS, TIDES } from './angling/species.js';
import { T } from './config.js';
import { TIERS as CHEST_TIERS, CURIOS } from './treasure.js';
import { sfx } from './audio.js';

export const TIERS = [null, { name: 'Easy', pts: 1 }, { name: 'Medium', pts: 2 }, { name: 'Hard', pts: 3 }, { name: 'Elite', pts: 4 }, { name: 'Master', pts: 5 }, { name: 'Grandmaster', pts: 6 }];
export const TYPES = { count: 'Count', speed: 'Speed', perfect: 'Perfection', mechanic: 'Mechanic', endure: 'Stamina', collect: 'Collection' };
export const CATS = [
  { id: 'break', name: 'BREAKING', subs: ['Pots', 'Clapperjars', 'Shells', 'The Workshop'] },
  { id: 'move', name: 'MOVEMENT', subs: ['Distance', 'Air', 'Ground', 'The Arts'] },
  { id: 'surf', name: 'SOLAR SKIFFING', subs: ['The Board', 'Tricks'] },
  { id: 'hand', name: 'THE HAND', subs: ['Reach', 'Arts', 'Raids', 'Lachryma'] },
  { id: 'sond', name: 'THE SONDELASS', subs: ['Cutlass', 'Grapnel'] },
  { id: 'brush', name: 'THE SOUL BRUSH', subs: ['The Club', 'The Slide', 'The Canvas', 'Sigils'] },
  { id: 'veritome', name: 'THE VERITOME', subs: ['The Lens', 'The Darkroom', 'The Bestiary', 'The Book'] },
  { id: 'angle', name: 'ANGLING', subs: ['Casting', 'The Bite', 'The Fight', 'The Catch', 'Bestiary', 'The Deep'] },
  { id: 'treasure', name: 'TREASURE', subs: ['Chests', 'Cubes', 'The Tithe', 'Curios'] },
  { id: 'circuit', name: 'CIRCUITS', subs: ['Laps', 'Medals', 'The Trial'] },
  { id: 'battle', name: 'BATTLE', subs: ['Slip Jellies', 'Reprogramming'] },
  { id: 'explore', name: 'EXPLORATION', subs: ['Charting', 'Places', 'Folk'] },
  { id: 'collect', name: 'COLLECTION', subs: ['Logged'] },
  { id: 'general', name: 'GENERAL', subs: ['Time', 'Persistence', 'Achievements'] },
];

// what the points buy: a standing, named in the manner of the studio's own trade (a title is the reward, as in FFXIV)
export const RANKS = [
  [0, 'Sweeper'], [10, 'Apprentice'], [30, 'Journeyman'], [70, 'Potter'], [130, 'Master Potter'], [220, 'Kiln Warden'], [340, 'Fool\'s Fortune'],
];

const tiers = [];
const add = (o) => tiers.push({ dir: 'up', unit: '', hidden: false, ...o });
// a counter or a total that reaches n
const C = (id, cat, sub, tier, type, name, desc, key, n, o = {}) => add({ id, cat, sub, tier, type, name, desc, cur: (L) => L.get(key), goal: n, ...o });
// a record (highest) that reaches n
const H = (id, cat, sub, tier, type, name, desc, key, n, o = {}) => add({ id, cat, sub, tier, type, name, desc, cur: (L) => L.best(key) || 0, goal: n, ...o });
// a best time at or under n
const S = (id, cat, sub, tier, name, desc, key, n, o = {}) => add({ id, cat, sub, tier, type: 'speed', name, desc, cur: (L) => L.best(key) ?? Infinity, goal: n, dir: 'down', unit: 's', ...o });
// anything else
const F = (id, cat, sub, tier, type, name, desc, cur, n, o = {}) => add({ id, cat, sub, tier, type, name, desc, cur, goal: n, ...o });


export function buildAchievements(game) {
  tiers.length = 0;
  const kinds = Object.keys(PROFILES).length;
  const CAUSES = ['shot', 'sliced', 'cooked', 'splat', 'well', 'explosion', 'charged', 'ricochet', 'homing', 'brushed'];
  const sys = game.system;

  // ---------------------------------------------------------------- BREAKING
  C('br1', 'break', 'Pots', 1, 'count', 'First Casualties', 'Break 10 pots.', 'break.total', 10);
  C('br2', 'break', 'Pots', 2, 'count', 'Clay Reckoning', 'Break 100 pots.', 'break.total', 100);
  C('br3', 'break', 'Pots', 3, 'count', 'Kiln Fodder', 'Break 500 pots.', 'break.total', 500);
  C('br4', 'break', 'Pots', 4, 'count', 'Rubble Maker', 'Break 2,500 pots.', 'break.total', 2500);
  C('br5', 'break', 'Pots', 5, 'count', 'Shatterer', 'Break 10,000 pots.', 'break.total', 10000, { title: 'Shatterer' });
  H('ch1', 'break', 'Pots', 1, 'mechanic', 'Two of a Kind', 'Break 5 pots in one chain.', 'chain.max', 5);
  H('ch2', 'break', 'Pots', 2, 'mechanic', 'Cascade', 'Chain 12.', 'chain.max', 12);
  H('ch3', 'break', 'Pots', 3, 'mechanic', 'Avalanche', 'Chain 25.', 'chain.max', 25);
  H('ch4', 'break', 'Pots', 4, 'mechanic', 'Landslide', 'Chain 50.', 'chain.max', 50, { title: 'Landslide' });
  C('brc', 'break', 'Pots', 2, 'count', 'Every Cause', 'Break pots by shot, slice, cooking, explosion and slam alike (25 of each cause).', 'break.cause.shot', 1,
    { cur: (L) => Math.min(...['shot', 'sliced', 'explosion'].map((c) => L.get(`break.cause.${c}`))) , goal: 25 });
  F('brk', 'break', 'Pots', 3, 'collect', 'A Pot of Every Kind', 'Break every kind of pottery.', (L) => L.under('break.kind.').filter(([, v]) => v > 0).length, kinds);
  C('cl1', 'break', 'Clapperjars', 1, 'count', 'Clapped', 'Defeat 1 clapperjar.', 'clapper.down', 1);
  C('cl2', 'break', 'Clapperjars', 2, 'count', 'Pest Control', 'Defeat 25 clapperjars.', 'clapper.down', 25);
  C('cl3', 'break', 'Clapperjars', 3, 'count', 'Exterminator', 'Defeat 100 clapperjars.', 'clapper.down', 100);
  C('cl4', 'break', 'Clapperjars', 4, 'count', 'Nothing Left to Clap', 'Defeat 500 clapperjars.', 'clapper.down', 500);
  C('cl5', 'break', 'Clapperjars', 5, 'endure', 'Clapperjar Bane', 'Defeat 2,000 clapperjars.', 'clapper.down', 2000, { title: 'Clapperjar Bane' });
  C('cls', 'break', 'Clapperjars', 2, 'mechanic', 'Clean Cut', 'Cleave 10 clapperjars with a sliced shot.', 'clapper.cause.sliced', 10);
  C('clk', 'break', 'Clapperjars', 2, 'mechanic', 'Well Done', 'Bake 5 clapperjars in a kiln.', 'clapper.cause.cooked', 5);
  C('clw', 'break', 'Clapperjars', 3, 'mechanic', 'Under the Well', 'Crush 10 clapperjars with a well shell.', 'clapper.cause.well', 10);
  C('clh', 'break', 'Clapperjars', 3, 'mechanic', 'Hunted', 'Hunt down 10 clapperjars with seeking shells.', 'clapper.cause.homing', 10);
  C('clr', 'break', 'Clapperjars', 3, 'mechanic', 'Off the Wall', 'Take 10 clapperjars with banked shots.', 'clapper.cause.ricochet', 10);
  C('cle', 'break', 'Clapperjars', 3, 'mechanic', 'Vapour Trail', 'Vaporise 10 clapperjars with charged shots.', 'clapper.cause.charged', 10);
  F('cla', 'break', 'Clapperjars', 4, 'collect', 'Every Way to Go', 'Defeat a clapperjar in every way there is.', (L) => CAUSES.filter((c) => L.get(`clapper.cause.${c}`) > 0).length, CAUSES.length);
  C('sh1', 'break', 'Shells', 1, 'count', 'Loaded', 'Fire 100 shells.', 'shell.fire', 100);
  C('sh2', 'break', 'Shells', 3, 'count', 'Ordnance', 'Fire 1,000 shells.', 'shell.fire', 1000);
  C('sh3', 'break', 'Shells', 5, 'endure', 'Arsenal', 'Fire 10,000 shells.', 'shell.fire', 10000);
  F('shc', 'break', 'Shells', 3, 'collect', 'Full Rack', 'Fire every kind of shell.', (L) => L.under('shell.fire.').filter(([, v]) => v > 0).length, SHELL_TYPES.length);
  C('shs', 'break', 'Shells', 2, 'count', 'Charged Up', 'Fire 25 charged shots.', 'shot.charged', 25);
  H('shx', 'break', 'Shells', 3, 'mechanic', 'Three at Once', 'Slice through 3 targets with one shell.', 'shell.slice.best', 3);
  H('shy', 'break', 'Shells', 4, 'mechanic', 'Mandoline', 'Slice through 6 targets with one shell.', 'shell.slice.best', 6);
  H('shm', 'break', 'Shells', 3, 'mechanic', 'Marked Men', 'Mark 5 targets with one shell.', 'shell.mark.best', 5);
  H('shb', 'break', 'Shells', 3, 'mechanic', 'Cushion Shot', 'Land a shot that ricochets 3 times.', 'shell.bank.best', 3);
  H('shd', 'break', 'Shells', 4, 'mechanic', 'From on High', 'Hit a target from 30 m above it.', 'target.drop', 30);
  C('sha', 'break', 'Shells', 2, 'mechanic', 'Airborne', 'Fire 50 shots while airborne.', 'shot.air', 50);
  F('shp', 'break', 'Shells', 4, 'perfect', 'Steady Hand', 'Land 65% of at least 300 shots.', (L) => (L.get('shot.fired') >= 300 ? L.get('shot.hit') / L.get('shot.fired') : 0), 0.65, { unit: '%' });
  C('rc1', 'break', 'The Workshop', 2, 'count', 'Swept Clean', 'Break every pot in the workshop.', 'room.cleared', 1);
  C('rc2', 'break', 'The Workshop', 3, 'endure', 'Regular Custom', 'Clear the workshop 10 times.', 'room.cleared', 10);
  S('rct', 'break', 'The Workshop', 3, 'Quick Sweep', 'Clear the workshop in under 3 minutes.', 'room.clear.time', 180);
  S('rcf', 'break', 'The Workshop', 5, 'Spring Cleaning', 'Clear the workshop in under 90 seconds.', 'room.clear.time', 90, { title: 'Spring Cleaner' });

  // ---------------------------------------------------------------- MOVEMENT
  C('dt1', 'move', 'Distance', 1, 'count', 'Footsore', 'Travel 1 km.', 'dist.total', 1000, { unit: 'm' });
  C('dt2', 'move', 'Distance', 2, 'count', 'Well Travelled', 'Travel 10 km.', 'dist.total', 10000, { unit: 'm' });
  C('dt3', 'move', 'Distance', 3, 'endure', 'Marathon', 'Travel 50 km.', 'dist.total', 50000, { unit: 'm' });
  C('dt4', 'move', 'Distance', 4, 'endure', 'Ultramarathon', 'Travel 200 km.', 'dist.total', 200000, { unit: 'm' });
  C('dt5', 'move', 'Distance', 5, 'endure', 'Around the World', 'Travel 1,000 km.', 'dist.total', 1000000, { unit: 'm', title: 'Wayfarer' });
  C('up1', 'move', 'Distance', 2, 'count', 'Up and Up', 'Climb 500 m in all.', 'dist.up', 500, { unit: 'm' });
  C('up2', 'move', 'Distance', 4, 'endure', 'Everest, Twice', 'Climb 17,700 m in all.', 'dist.up', 17700, { unit: 'm' });
  C('jp1', 'move', 'Air', 1, 'count', 'Leaps', 'Jump 100 times.', 'move.jump', 100);
  C('jp2', 'move', 'Air', 3, 'count', 'Springheel', 'Jump 2,000 times.', 'move.jump', 2000);
  C('jp3', 'move', 'Air', 4, 'endure', 'Jumping Jack', 'Jump 10,000 times.', 'move.jump', 10000);
  C('ja', 'move', 'Air', 2, 'mechanic', 'Twice Off the Ground', 'Air-jump 100 times.', 'move.airjump', 100);
  C('jw', 'move', 'Air', 2, 'mechanic', 'Off the Wall', 'Jump off a wall 50 times.', 'move.walljump', 50);
  H('at1', 'move', 'Air', 2, 'endure', 'Hang Time', 'Stay airborne for 3 seconds.', 'air.longest', 3, { unit: 's' });
  H('at2', 'move', 'Air', 3, 'endure', 'Glider', 'Stay airborne for 5 seconds.', 'air.longest', 5, { unit: 's' });
  H('at3', 'move', 'Air', 5, 'endure', 'Float Like a Pot', 'Stay airborne for 9 seconds.', 'air.longest', 9, { unit: 's' });
  H('fl1', 'move', 'Air', 2, 'mechanic', 'A Long Way Down', 'Fall 20 m.', 'fall.max', 20, { unit: 'm' });
  H('fl2', 'move', 'Air', 3, 'mechanic', 'Terminal Velocity', 'Fall 40 m.', 'fall.max', 40, { unit: 'm' });
  H('fl3', 'move', 'Air', 4, 'mechanic', 'Free Fall', 'Fall 60 m.', 'fall.max', 60, { unit: 'm' });
  H('rl', 'move', 'Air', 4, 'mechanic', 'Landing Gear', 'Roll out of a 30 m fall.', 'roll.fall.height', 30, { unit: 'm' });
  H('sp1', 'move', 'Ground', 2, 'mechanic', 'Getting Up to Speed', 'Reach 12 m/s.', 'speed.max', 12, { unit: 'm/s' });
  H('sp2', 'move', 'Ground', 3, 'mechanic', 'Faster', 'Reach 16 m/s on foot.', 'speed.max', 16, { unit: 'm/s' });
  H('sp3', 'move', 'Ground', 4, 'mechanic', 'Faster Still', 'Reach 22 m/s on foot.', 'speed.max', 22, { unit: 'm/s' });
  H('sl1', 'move', 'Ground', 2, 'mechanic', 'Slippery', 'Slide 15 m in one go.', 'slide.longest', 15, { unit: 'm' });
  H('sl2', 'move', 'Ground', 3, 'mechanic', 'Long Slide', 'Slide 35 m in one go.', 'slide.longest', 35, { unit: 'm' });
  H('wr1', 'move', 'Ground', 2, 'mechanic', 'Wall Walker', 'Run along a wall for 20 m.', 'wallrun.longest', 20, { unit: 'm' });
  H('wr2', 'move', 'Ground', 4, 'mechanic', 'Along the Whole Wall', 'Run along a wall for 45 m.', 'wallrun.longest', 45, { unit: 'm' });
  C('mn1', 'move', 'Ground', 2, 'count', 'Ledge Lizard', 'Mantle 50 ledges.', 'move.mantle', 50);
  H('mn2', 'move', 'Ground', 3, 'mechanic', 'Over the Top', 'Mantle a ledge 2.5 m high.', 'mantle.height', 2.5, { unit: 'm' });
  C('ds1', 'move', 'Ground', 1, 'count', 'Quick Step', 'Dash 100 times.', 'move.dash', 100);
  F('gt1', 'move', 'Ground', 2, 'endure', 'Sprinter', 'Sprint for 10 minutes in all.', (L) => L.get('time.state.sprint') / 60, 10, { unit: 'min' });
  F('gt2', 'move', 'Ground', 4, 'endure', 'Tireless', 'Sprint for 3 hours in all.', (L) => L.get('time.state.sprint') / 3600, 3, { unit: 'h' });
  F('gt3', 'move', 'Ground', 1, 'count', 'Low Profile', 'Spend 2 minutes crouched.', (L) => L.get('time.state.crouch') / 60, 2, { unit: 'min' });
  C('bl1', 'move', 'The Arts', 1, 'count', 'Blinker', 'Blink 100 times.', 'move.blink', 100);
  C('bl2', 'move', 'The Arts', 3, 'count', 'Flicker', 'Blink 1,000 times.', 'move.blink', 1000);
  C('sm1', 'move', 'The Arts', 2, 'count', 'Slammer', 'Slam 50 times.', 'move.slam', 50);
  H('sm2', 'move', 'The Arts', 3, 'mechanic', 'Meteor', 'Slam from 30 m.', 'slam.height', 30, { unit: 'm' });
  H('sm3', 'move', 'The Arts', 5, 'mechanic', 'Orbital Strike', 'Slam from 60 m.', 'slam.height', 60, { unit: 'm' });
  C('sm4', 'move', 'The Arts', 3, 'mechanic', 'Bullseye', 'Slam onto a target 10 times.', 'slam.target', 10);
  C('st1', 'move', 'The Arts', 2, 'count', 'Stompy', 'Stomp 50 times.', 'move.stomp', 50);
  C('pa1', 'move', 'The Arts', 2, 'mechanic', 'Not Today', 'Parry 10 times.', 'move.parry', 10);
  C('pa2', 'move', 'The Arts', 4, 'mechanic', 'Riposte', 'Parry 100 times.', 'move.parry', 100);
  C('ki1', 'move', 'The Arts', 1, 'count', 'Field Goal', 'Kick 25 things.', 'kick.hit', 25);
  H('ki2', 'move', 'The Arts', 3, 'mechanic', 'Through the Line', 'Kick 3 things with one kick.', 'kick.best', 3);
  C('th1', 'move', 'The Arts', 2, 'count', 'Heave', 'Throw 50 things.', 'move.throw', 50);
  C('th2', 'move', 'The Arts', 3, 'mechanic', 'Direct Hit', 'Hit something with 25 thrown things.', 'throw.hit', 25);
  C('rj1', 'move', 'The Arts', 2, 'mechanic', 'Rocket Boots', 'Recoil-jump 50 times.', 'move.recoil', 50);
  C('lb1', 'move', 'The Arts', 2, 'mechanic', 'Nimble', 'Dodge 10 lobs.', 'lob.dodged', 10);
  F('mv1', 'move', 'The Arts', 3, 'collect', 'Tried Everything', 'Hang, latch, climb a pole, climb a grate, balance, push, carry and swim.',
    (L) => ['hang.start', 'latch.start', 'pole.start', 'grate.start', 'balance.start', 'push.start', 'carry.lift'].filter((k) => L.get(`move.${k}`) > 0).length + (L.get('time.tech.swim') > 0 ? 1 : 0), 8);
  F('ar1', 'move', 'The Arts', 1, 'collect', 'A Quick Study', 'Learn 1 movement art.', () => ABILITIES.filter((a) => sys.unlocked(a.id)).length, 1);
  F('ar2', 'move', 'The Arts', 3, 'collect', 'Well Practised', 'Learn 5 movement arts.', () => ABILITIES.filter((a) => sys.unlocked(a.id)).length, 5);
  F('ar3', 'move', 'The Arts', 5, 'collect', 'All the Arts', 'Learn every movement art.', () => ABILITIES.filter((a) => sys.unlocked(a.id)).length, ABILITIES.length, { title: 'Adept' });
  F('ar4', 'move', 'The Arts', 5, 'collect', 'Every Variant', 'Learn every variant of every movement art.', () => ABILITIES.reduce((n, a) => n + a.variants.filter((v) => sys.unlocked(`${a.id}.${v.id}`)).length, 0), ABILITIES.reduce((n, a) => n + a.variants.length, 0));

  // ---------------------------------------------------------------- SURFING
  C('sf1', 'surf', 'The Board', 1, 'count', 'Board Rider', 'Unfurl the Solar Skiff.', 'surf.start', 1);
  F('sf2', 'surf', 'The Board', 2, 'endure', 'Sea Legs', 'Skiff for 5 minutes in all.', (L) => L.get('time.surf') / 60, 5, { unit: 'min' });
  F('sf3', 'surf', 'The Board', 3, 'endure', 'Dune Dweller', 'Skiff for 30 minutes in all.', (L) => L.get('time.surf') / 60, 30, { unit: 'min' });
  F('sf4', 'surf', 'The Board', 5, 'endure', 'Endless Summer', 'Skiff for 3 hours in all.', (L) => L.get('time.surf') / 3600, 3, { unit: 'h', title: 'Sandsailor' });
  C('sfd1', 'surf', 'The Board', 2, 'count', 'Sail a Kilometre', 'Skiff 1 km.', 'dist.state.surfer', 1000, { unit: 'm' });
  C('sfd2', 'surf', 'The Board', 4, 'endure', 'Across the Sea', 'Skiff 25 km.', 'dist.state.surfer', 25000, { unit: 'm' });
  C('sfp', 'surf', 'The Board', 2, 'mechanic', 'In Time with the Wind', 'Pump the board 100 times.', 'surf.pump', 100);
  H('sfs1', 'surf', 'The Board', 2, 'mechanic', 'Full Sail', 'Skiff at 15 m/s.', 'speed.surf.max', 15, { unit: 'm/s' });
  H('sfs2', 'surf', 'The Board', 3, 'mechanic', 'Trade Winds', 'Skiff at 20 m/s.', 'speed.surf.max', 20, { unit: 'm/s' });
  H('sfs3', 'surf', 'The Board', 5, 'mechanic', 'Storm Front', 'Skiff at 26 m/s.', 'speed.surf.max', 26, { unit: 'm/s', title: 'Stormrider' });
  C('sft1', 'surf', 'Tricks', 1, 'count', 'Ollie', 'Hop 25 times on the board.', 'surf.hop', 25);
  C('sft2', 'surf', 'Tricks', 2, 'mechanic', 'Spinner', 'Land 10 spins.', 'surf.trick', 10);
  C('sft3', 'surf', 'Tricks', 4, 'mechanic', 'Whirlwind', 'Land 100 spins.', 'surf.trick', 100);
  H('sft4', 'surf', 'Tricks', 3, 'mechanic', 'Double Spin', 'Land a double spin.', 'surf.spin.best', 2);
  H('sft5', 'surf', 'Tricks', 5, 'mechanic', 'Triple Spin', 'Land a triple spin.', 'surf.spin.best', 3, { hidden: true });

  // ---------------------------------------------------------------- THE HAND
  C('gd1', 'hand', 'Reach', 1, 'count', 'Take the Hand', 'Take the hand.', 'god.enter', 1);
  F('gd2', 'hand', 'Reach', 2, 'endure', 'Idle Hands', 'Spend 10 minutes as the hand.', (L) => L.get('time.god') / 60, 10, { unit: 'min' });
  F('gd3', 'hand', 'Reach', 4, 'endure', 'Divine Patience', 'Spend 2 hours as the hand.', (L) => L.get('time.god') / 3600, 2, { unit: 'h' });
  C('gg1', 'hand', 'Reach', 1, 'count', 'Grab', 'Pick up 50 things with the hand.', 'god.grab', 50);
  C('gg2', 'hand', 'Reach', 2, 'count', 'Clapper Wrangler', 'Grab 25 clapperjars with the hand.', 'god.grab.clapper', 25);
  C('gt', 'hand', 'Reach', 2, 'count', 'Throwing Arm', 'Throw 25 things with the hand.', 'god.throw', 25);
  H('gts', 'hand', 'Reach', 3, 'mechanic', 'Fastball', 'Throw something at 25 m/s.', 'god.throw.speed', 25, { unit: 'm/s' });
  C('gs1', 'hand', 'Arts', 2, 'count', 'Sunderer', 'Sunder 10 clapperjars.', 'god.cuts', 10);
  C('gs2', 'hand', 'Arts', 4, 'count', 'Guillotine', 'Sunder 100 clapperjars.', 'god.cuts', 100);
  H('gs3', 'hand', 'Arts', 3, 'mechanic', 'Three with One Stroke', 'Sunder 3 clapperjars with one stroke.', 'god.cuts.best', 3);
  H('gs4', 'hand', 'Arts', 5, 'mechanic', 'A Clean Sweep', 'Sunder 6 clapperjars with one stroke.', 'god.cuts.best', 6);
  C('gm1', 'hand', 'Arts', 2, 'count', 'Bricklayer', 'Manifest 10 walls.', 'god.manifest', 10);
  F('ga1', 'hand', 'Arts', 4, 'collect', 'Five Fingers', 'Learn all five God Arts.', () => GOD_ARTS.filter((a) => sys.unlocked(a.id) || a.basic).length, GOD_ARTS.length);
  C('gr1', 'hand', 'Raids', 2, 'count', 'Hold the Silo', 'Clear a raid wave.', 'god.wave', 1);
  H('gr2', 'hand', 'Raids', 3, 'endure', 'Five Waves', 'Reach wave 5 in a raid.', 'god.wave.max', 5);
  H('gr3', 'hand', 'Raids', 4, 'endure', 'Ten Waves', 'Reach wave 10 in a raid.', 'god.wave.max', 10);
  H('gr4', 'hand', 'Raids', 5, 'endure', 'Siege Breaker', 'Reach wave 20 in a raid.', 'god.wave.max', 20, { title: 'Siege Breaker' });
  C('gv1', 'hand', 'Raids', 1, 'count', 'Cracked', 'Have the vessel shatter.', 'vessel.shatter', 1, { hidden: true });
  C('gv2', 'hand', 'Raids', 2, 'count', 'Kintsugi', 'Have the vessel reforged 5 times.', 'vessel.reforge', 5);
  F('gl1', 'hand', 'Lachryma', 1, 'count', 'A Little Weeping', 'Spend 500 lachryma.', (L) => L.get('lach.spent'), 500);
  F('gl2', 'hand', 'Lachryma', 3, 'endure', 'A River of Tears', 'Spend 10,000 lachryma.', (L) => L.get('lach.spent'), 10000);
  C('gl3', 'hand', 'Lachryma', 1, 'count', 'Running Dry', 'Run out of lachryma.', 'lach.empty', 1);
  C('gl4', 'hand', 'Lachryma', 2, 'count', 'Brimming', 'Fill the pool to the top 25 times.', 'lach.full', 25);

  // ---------------------------------------------------------------- CIRCUITS
  for (const def of game.circuits?.defs?.values() || []) {
    const id = def.id, P = def.par;
    C(`c_${id}_1`, 'circuit', 'Laps', 1, 'count', `${def.name}: Complete`, `Finish ${def.name}.`, `circuit.${id}.finish`, 1);
    C(`c_${id}_2`, 'circuit', 'Laps', 3, 'endure', `${def.name}: Regular`, `Finish ${def.name} 25 times.`, `circuit.${id}.finish`, 25);
    C(`c_${id}_c`, 'circuit', 'Laps', 2, 'perfect', `${def.name}: Clean`, `Finish ${def.name} without falling.`, `circuit.${id}.clean`, 1);
    C(`c_${id}_b`, 'circuit', 'Medals', 2, 'speed', `${def.name}: Bronze`, `Finish ${def.name} in ${P.bronze} s or less.`, `circuit.${id}.medal.bronze`, 1, { cur: (L) => L.get(`circuit.${id}.medal.bronze`) + L.get(`circuit.${id}.medal.silver`) + L.get(`circuit.${id}.medal.gold`) });
    C(`c_${id}_s`, 'circuit', 'Medals', 3, 'speed', `${def.name}: Silver`, `Finish ${def.name} in ${P.silver} s or less.`, `circuit.${id}.medal.silver`, 1, { cur: (L) => L.get(`circuit.${id}.medal.silver`) + L.get(`circuit.${id}.medal.gold`) });
    C(`c_${id}_g`, 'circuit', 'Medals', 4, 'speed', `${def.name}: Gold`, `Finish ${def.name} in ${P.gold} s or less.`, `circuit.${id}.medal.gold`, 1);
    S(`c_${id}_p`, 'circuit', 'Medals', 5, `${def.name}: Flawless`, `Finish ${def.name} in ${P.gold} s or less without falling.`, `circuit.${id}.time.clean`, P.gold, { type: 'perfect' });
  }
  C('cx1', 'circuit', 'Laps', 3, 'endure', 'Lap Counter', 'Finish 50 circuits.', 'circuit.finish', 50);
  C('cx2', 'circuit', 'Medals', 5, 'perfect', 'Clean Gold, Thrice', 'Earn a gold medal without falling, three times.', 'circuit.goldclean', 3);
  C('cx3', 'circuit', 'Laps', 1, 'count', 'On the Course', 'Complete a lap of the basement ring.', 'course.lap', 1);
  C('cx4', 'circuit', 'Laps', 3, 'endure', 'Regular Lapper', 'Complete 25 laps of the basement ring.', 'course.lap', 25);
  S('cx5', 'circuit', 'Laps', 4, 'Around the Ring', 'Complete a lap of the ring in under 90 seconds.', 'course.lap.time', 90);
  H('cx6', 'circuit', 'Laps', 3, 'mechanic', 'Through the Gate', 'Pass a speed gate at 14 m/s.', 'course.gate.speed', 14, { unit: 'm/s' });
  C('tr1', 'circuit', 'The Trial', 1, 'count', 'Lantern Lighter', 'Finish the lantern trial.', 'trial.finish', 1);
  C('tr2', 'circuit', 'The Trial', 2, 'speed', 'Trial Bronze', `Finish the trial in ${T.trial.bronze} s or less.`, 'trial.medal.bronze', 1, { cur: (L) => L.get('trial.medal.bronze') + L.get('trial.medal.silver') + L.get('trial.medal.gold') });
  C('tr3', 'circuit', 'The Trial', 3, 'speed', 'Trial Silver', `Finish the trial in ${T.trial.silver} s or less.`, 'trial.medal.silver', 1, { cur: (L) => L.get('trial.medal.silver') + L.get('trial.medal.gold') });
  C('tr4', 'circuit', 'The Trial', 4, 'speed', 'Trial Gold', `Finish the trial in ${T.trial.gold} s or less.`, 'trial.medal.gold', 1);
  C('tr5', 'circuit', 'The Trial', 3, 'mechanic', 'Double Tap', 'Score 10 quick doubles in the trial.', 'trial.quick', 10);
  S('tr6', 'circuit', 'The Trial', 5, 'Sub-Minute', 'Finish the trial in under 60 seconds.', 'trial.time', 60);

  // ---------------------------------------------------------------- THE SONDELASS: the cutlass and the grapnel
  C('cu1', 'sond', 'Cutlass', 1, 'count', 'A Swing', 'Swing the cutlass 50 times.', 'cut.swing', 50);
  C('cu2', 'sond', 'Cutlass', 3, 'endure', 'Swordsmanship', 'Swing the cutlass 1,000 times.', 'cut.swing', 1000);
  C('cu3', 'sond', 'Cutlass', 1, 'count', 'Cut Down', 'Cut 25 things with the cutlass.', 'cut.hit', 25);
  C('cu4', 'sond', 'Cutlass', 3, 'endure', 'A Field of Stubble', 'Cut 500 things with the cutlass.', 'cut.hit', 500);
  C('cu5', 'sond', 'Cutlass', 2, 'mechanic', 'Three-Stroke', 'Finish the three-stroke combination 25 times.', 'cut.combo', 25);
  C('cu6', 'sond', 'Cutlass', 4, 'perfect', 'Unbroken String', 'Finish the three-stroke combination 200 times.', 'cut.combo', 200);
  C('cu7', 'sond', 'Cutlass', 2, 'mechanic', 'Stinger', 'Drive the Stinger 25 times.', 'cut.stinger', 25);
  C('cu8', 'sond', 'Cutlass', 3, 'mechanic', 'Clapperjar Bane, Blade', 'Cut down 25 clapperjars with the cutlass.', 'cut.hit.clapper', 25);
  C('cu9', 'sond', 'Cutlass', 1, 'count', 'Time Slows', 'Enter Blade Mode 10 times.', 'blade.enter', 10);
  C('cu10', 'sond', 'Cutlass', 3, 'endure', 'Chunks', 'Cut 200 pieces in Blade Mode.', 'blade.pieces', 200);
  C('cu11', 'sond', 'Cutlass', 3, 'mechanic', 'Zandatsu', 'Cut a clapperjar along its own line and take its core.', 'blade.zandatsu', 1);
  C('cu12', 'sond', 'Cutlass', 4, 'endure', 'A Field of Cores', 'Zandatsu 25 clapperjars.', 'blade.zandatsu', 25);
  C('cu13', 'sond', 'Cutlass', 1, 'count', 'In the Sights', 'Lock on 25 times.', 'lock.on', 25);
  C('cu14', 'sond', 'Cutlass', 2, 'mechanic', 'Turned Aside', 'Turn 10 shots aside on the blade.', 'guard.block', 10);
  C('cu15', 'sond', 'Cutlass', 3, 'perfect', 'Parry', 'Parry 10 shots.', 'move.parry', 10);
  H('cu16', 'sond', 'Cutlass', 3, 'mechanic', 'A Long Held Breath', 'Cut 8 times in a single breath of Blade Mode.', 'blade.cuts.best', 8);
  C('hk1', 'sond', 'Grapnel', 1, 'count', 'Bite and Pull', 'Throw the grapnel 25 times.', 'hook.fire', 25);
  C('hk2', 'sond', 'Grapnel', 2, 'count', 'Drawn In', 'Be drawn to an anchor 25 times.', 'zip.arrive', 25);
  C('hk3', 'sond', 'Grapnel', 4, 'endure', 'Spider', 'Be drawn to an anchor 250 times.', 'zip.arrive', 250);
  C('hk4', 'sond', 'Grapnel', 3, 'endure', 'A Long Line', 'Travel 1 km on the grapnel line.', 'zip.dist', 1000, { unit: 'm' });
  H('hk5', 'sond', 'Grapnel', 3, 'mechanic', 'Across the Hall', 'Be drawn 30 m by a single throw.', 'zip.longest', 30, { unit: 'm' });
  C('hk6', 'sond', 'Grapnel', 2, 'count', 'Fetch', 'Yank 25 loose things toward you.', 'hook.pull', 25);
  C('hk7', 'sond', 'Grapnel', 2, 'mechanic', 'Cut Loose', 'Leap from the line 10 times.', 'zip.cancel', 10);
  F('hk8', 'sond', 'Grapnel', 2, 'endure', 'Terracotta Tarzan', 'Spend a minute in all on the end of the line, swinging or hanging.', (L) => L.get('grapple.swing.time') / 60, 1, { unit: 'min' });
  F('hk9', 'sond', 'Grapnel', 4, 'endure', 'Ninja Courier', 'Spend ten minutes in all on the end of the line.', (L) => L.get('grapple.swing.time') / 60, 10, { unit: 'min' });
  H('hk10', 'sond', 'Grapnel', 3, 'mechanic', 'Slingshot', 'Let go of the line at 18 m/s.', 'grapple.fling.speed', 18, { unit: 'm/s' });
  H('hk11', 'sond', 'Grapnel', 4, 'mechanic', 'Faster Than the Rope', 'Let go of the line at 26 m/s.', 'grapple.fling.speed', 26, { unit: 'm/s' });
  C('hk12', 'sond', 'Grapnel', 2, 'count', 'Sling', 'Let go of a catch and send it flying 10 times.', 'hook.fling', 10);
  C('hk13', 'sond', 'Grapnel', 1, 'count', 'Brought to Hand', 'Bring 25 loose things to you on the line.', 'hook.pull', 25);


  // ---------------------------------------------------------------- THE SOUL BRUSH (moves/soulbrush.js, brush/)
  C('br1', 'brush', 'The Club', 1, 'count', 'Heavy Hair', 'Swing the Soul Brush 50 times.', 'brush.swing', 50);
  C('br2', 'brush', 'The Club', 2, 'mechanic', 'Batter Up', 'Bat 25 clapperjars away with the brush.', 'brush.bat', 25);
  C('br3', 'brush', 'The Club', 2, 'mechanic', 'Bring It Down', 'Slam the brush down 10 times.', 'brush.slam', 10);
  C('br4', 'brush', 'The Club', 3, 'mechanic', 'From a Height', 'Come down out of the air with the brush 10 times.', 'brush.slam.air', 10);
  C('br5', 'brush', 'The Club', 3, 'endure', 'Seeing Stars', 'Leave 25 clapperjars reeling with the overhead blow.', 'brush.stun', 25);
  C('bs1', 'brush', 'The Slide', 1, 'count', 'A Stroke of Slip', 'Brush slide 25 times.', 'brush.slide', 25);
  C('bs2', 'brush', 'The Slide', 3, 'endure', 'Slip Trailer', 'Paint 1 km of slip with brush slides.', 'brush.slide.dist', 1000, { unit: 'm' });
  H('bs3', 'brush', 'The Slide', 3, 'mechanic', 'One Long Stroke', 'Paint 20 m of slip in a single brush slide.', 'brush.slide.best', 20, { unit: 'm' });
  C('bc1', 'brush', 'The Canvas', 1, 'count', 'The World Is Paper', 'Open the Celestial Brush 10 times.', 'brush.canvas', 10);
  C('bc2', 'brush', 'The Canvas', 2, 'mechanic', 'Two Hands at Once', 'Have 10 drawings of more than one stroke read.', 'brush.read.multi', 10);
  F('bc3', 'brush', 'The Canvas', 3, 'collect', 'Every Stroke Known', 'Draw every technique the brush knows.', (L) => ['still', 'bounce', 'mend', 'ember', 'gale', 'bolt', 'light', 'heavy', 'solace'].filter((t) => L.get(`brush.tech.${t}`) > 0).length, 9);
  H('bc4', 'brush', 'The Canvas', 3, 'mechanic', 'A Full Page', 'Make four drawings in one breath of the Celestial Brush.', 'brush.drawings.best', 4);
  C('bc5', 'brush', 'The Canvas', 4, 'endure', 'Calligrapher', 'Have 250 drawings read.', 'brush.read', 250);
  C('bg1', 'brush', 'Sigils', 1, 'count', 'Lifted', 'Lift 50 sigils from clapperjars.', 'sigil.pop', 50);
  C('bg2', 'brush', 'Sigils', 2, 'count', 'Unwritten', 'Unwrite 25 clapperjars.', 'sigil.cleared', 25);
  C('bi1', 'brush', 'The Canvas', 2, 'count', 'Rewritten', 'Write 50 properties onto things.', 'inscribe', 50);
  C('bi2', 'brush', 'The Canvas', 3, 'mechanic', 'A Step in the Air', 'Hold 10 things still with the brush.', 'inscribe.still', 10);
  H('bg3', 'brush', 'Sigils', 4, 'mechanic', 'One Word for All', 'Unwrite 4 clapperjars with a single mark.', 'sigil.cleared.best', 4);

  // ---------------------------------------------------------------- THE VERITOME (moves/veritome.js, veritome/)
  C('vl1', 'veritome', 'The Lens', 1, 'count', 'Say Cheese', 'Take 25 photographs.', 'photo.take', 25);
  C('vl2', 'veritome', 'The Lens', 3, 'endure', 'Shutterbug', 'Take 500 photographs.', 'photo.take', 500);
  C('vl4', 'veritome', 'The Lens', 3, 'mechanic', 'Held to the Real', 'Hold 10 clapperjars with a fully charged shot.', 'photo.held', 10);
  C('vl5', 'veritome', 'The Lens', 4, 'mechanic', 'Shutter Chance', 'Hold 5 clapperjars at the shutter chance.', 'photo.chance', 5);
  C('vd1', 'veritome', 'The Darkroom', 1, 'count', 'Developing', 'Appraise a roll of film.', 'darkroom.batches', 1);
  H('vd2', 'veritome', 'The Darkroom', 2, 'mechanic', 'A Full Roll', 'Appraise twenty-four photographs at once.', 'darkroom.batch.best', 24);
  H('vl3', 'veritome', 'The Darkroom', 2, 'mechanic', 'Four Stars', 'Appraise a four-star photograph.', 'photo.stars.best', 4);
  H('vc3', 'veritome', 'The Darkroom', 3, 'mechanic', 'A Full Frame', 'Appraise a photograph of five kinds of thing.', 'photo.kinds.best', 5);
  F('vc1', 'veritome', 'The Darkroom', 2, 'collect', 'Field Notes', 'Enter 8 kinds of thing in the Compendium.', (L) => L.under('photo.kind.').filter(([k, v]) => v > 0 && !k.endsWith('nothing')).length, 8);
  F('vc2', 'veritome', 'The Darkroom', 4, 'collect', 'The Whole Compendium', 'Enter every kind of thing in the Compendium.', (L) => L.under('photo.kind.').filter(([k, v]) => v > 0 && !k.endsWith('nothing')).length, 20);
  C('vs1', 'veritome', 'The Bestiary', 1, 'count', 'Naturalist', 'Learn 5 facts about the creatures of the workshop.', 'bestiary.facts', 5);
  C('vs2', 'veritome', 'The Bestiary', 3, 'collect', 'Know Thy Enemy', 'Learn 10 battle facts.', 'bestiary.battle', 10);
  C('vs3', 'veritome', 'The Bestiary', 3, 'mechanic', 'Infighting', 'Photograph a turned clapperjar setting on a raider.', 'bestiary.fact.clapper.infight', 1, { hidden: true });
  C('vs4', 'veritome', 'The Bestiary', 4, 'collect', 'Understood', 'Understand the clapperjar: every fact.', 'bestiary.u.clapper', 4, { title: 'the Naturalist' });
  F('vs5', 'veritome', 'The Bestiary', 4, 'collect', 'Under the Surface', 'Study five kinds of fish.', (L) => L.under('bestiary.u.fish.').filter(([, v]) => v >= 3).length, 5);
  C('vb1', 'veritome', 'The Book', 1, 'count', 'Bound', 'Bind your first card into the Book.', 'card.pages', 1);
  C('vb2', 'veritome', 'The Book', 3, 'collect', 'Half the Arcana', 'Fill eleven Arcana pages.', 'card.pages.arcana', 11);
  C('vb3', 'veritome', 'The Book', 5, 'collect', 'The Major Arcana', 'Fill all twenty-two Arcana pages.', 'card.pages.arcana', 22, { title: 'the Fool Who Read the World' });
  C('vb4', 'veritome', 'The Book', 3, 'collect', 'Portraitist', 'Bind five creature cards.', 'card.pages.creature', 5);
  C('vb5', 'veritome', 'The Book', 2, 'mechanic', 'Banked', 'Store something in the Veritome from the Pneuka Box.', 'item.store', 1);
  C('vb7', 'veritome', 'The Book', 1, 'mechanic', 'Something Old', 'Tie a curio on as a lure.', 'lure.tie.curio', 1);
  C('vb8', 'veritome', 'The Book', 2, 'mechanic', 'Overburdened', 'Fill all twenty-eight slots of the Pneuka Box.', 'pneuka.filled', 1);
  C('vb6', 'veritome', 'The Book', 2, 'mechanic', 'Condensed', 'Condense a spare card into cubes.', 'card.condense', 1);

  // ---------------------------------------------------------------- TREASURE (chests.js, cubes.js, treasure.js)
  const ownedCurios = (L) => CURIOS.filter((c) => L.get(`curio.${c.id}`) > 0).length;
  C('tc1', 'treasure', 'Chests', 1, 'count', 'First Hinge', 'Open a chest.', 'chest.open', 1);
  C('tc2', 'treasure', 'Chests', 2, 'count', 'Lid Lifter', 'Open 10 chests.', 'chest.open', 10);
  C('tc3', 'treasure', 'Chests', 3, 'count', 'Chest Chaser', 'Open 50 chests.', 'chest.open', 50);
  C('tc4', 'treasure', 'Chests', 4, 'endure', 'Hoarder\'s Hands', 'Open 200 chests.', 'chest.open', 200);
  C('tc5', 'treasure', 'Chests', 1, 'collect', 'Fine Fortune', 'Open a fine chest.', 'chest.open.fine', 1);
  C('tc6', 'treasure', 'Chests', 2, 'collect', 'Rare Rummage', 'Open a rare chest.', 'chest.open.rare', 1);
  C('tc7', 'treasure', 'Chests', 4, 'collect', 'Epic Epiphany', 'Open an epic chest.', 'chest.open.epic', 1);
  C('tc8', 'treasure', 'Chests', 5, 'collect', 'Prismatic Paradise', 'Open a prismatic chest, and stay for the whole show.', 'chest.open.prismatic', 1, { hidden: true });
  F('tc9', 'treasure', 'Chests', 4, 'collect', 'Every Tier', 'Open a chest of every tier.', (L) => CHEST_TIERS.filter((t) => L.get(`chest.open.${t.id}`) > 0).length, CHEST_TIERS.length);
  C('tc10', 'treasure', 'Chests', 2, 'mechanic', 'So Close', 'Watch a sealed chest climb past what it turns out to be.', 'chest.near', 1, { hidden: true });
  C('tc11', 'treasure', 'Chests', 3, 'mechanic', 'From on High', 'Have a chest fall out of the air.', 'chest.drop', 1);
  C('tc12', 'treasure', 'Chests', 4, 'count', 'Encore', 'Open 5 prismatic chests.', 'chest.open.prismatic', 5, { hidden: true });
  C('tu1', 'treasure', 'Cubes', 1, 'count', 'Pocket Change', 'Gather 100 Lachryma cubes.', 'cube.earned', 100);
  C('tu2', 'treasure', 'Cubes', 2, 'count', 'A Purse', 'Gather 1,000 Lachryma cubes.', 'cube.earned', 1000);
  C('tu3', 'treasure', 'Cubes', 3, 'count', 'Cubic Consequence', 'Gather 10,000 Lachryma cubes.', 'cube.earned', 10000);
  C('tu4', 'treasure', 'Cubes', 5, 'endure', 'Dragon\'s Dozen', 'Gather 100,000 Lachryma cubes.', 'cube.earned', 100000, { title: 'Hoarder' });
  C('tu5', 'treasure', 'Cubes', 2, 'count', 'Spender', 'Spend 500 cubes.', 'cube.spent', 500);
  H('tu6', 'treasure', 'Cubes', 3, 'mechanic', 'A Fat Chest', 'Open a chest with 400 cubes in it.', 'chest.cubes.max', 400);
  C('td1', 'treasure', 'The Tithe', 1, 'count', 'A Coin in the Slot', 'Pay the Tithe.', 'tithe.count', 1);
  C('td2', 'treasure', 'The Tithe', 2, 'count', 'Regular Donor', 'Pay the Tithe 10 times.', 'tithe.count', 10);
  C('td3', 'treasure', 'The Tithe', 3, 'endure', 'Devout', 'Pay the Tithe 50 times.', 'tithe.count', 50);
  C('td4', 'treasure', 'The Tithe', 5, 'endure', 'Compulsion', 'Pay the Tithe 200 times.', 'tithe.count', 200, { title: 'Devout' });
  C('td5', 'treasure', 'The Tithe', 3, 'mechanic', 'Beyond the Pity', 'Land an epic or better from the Tithe.', 'tithe.tier.epic', 1);
  C('td6', 'treasure', 'The Tithe', 5, 'mechanic', 'The Long Shot', 'Land a prismatic chest from the Tithe.', 'tithe.tier.prismatic', 1, { hidden: true });
  F('cu1', 'treasure', 'Curios', 1, 'collect', 'A Shelf', 'Own 3 curios.', ownedCurios, 3);
  F('cu2', 'treasure', 'Curios', 2, 'collect', 'A Cabinet', 'Own 8 curios.', ownedCurios, 8);
  F('cu3', 'treasure', 'Curios', 4, 'collect', 'A Wunderkammer', 'Own 14 curios.', ownedCurios, 14);
  F('cu4', 'treasure', 'Curios', 6, 'collect', 'The Whole Cabinet', 'Find every curio.', ownedCurios, CURIOS.length, { title: 'Curator' });
  CHEST_TIERS.forEach((t, i) => F(`cu_t${i}`, 'treasure', 'Curios', Math.min(6, i + 1), 'collect', `${t.name[0].toUpperCase()}${t.name.slice(1)} Curios`, `Find all four ${t.name} curios.`, (L) => CURIOS.filter((c) => c.tier === i && L.get(`curio.${c.id}`) > 0).length, 4, { hidden: i === 4 }));
  C('cu5', 'treasure', 'Curios', 2, 'count', 'Doubles', 'Be given a curio the Book cannot hold (it condenses into cubes).', 'curio.dupe', 1);

  // ---------------------------------------------------------------- ANGLING (the Weir; species.js, fight.js)
  C('an1', 'angle', 'Casting', 1, 'count', 'First Cast', 'Cast the lure.', 'angle.cast', 1);
  C('an2', 'angle', 'Casting', 2, 'count', 'Line and Mind', 'Cast the lure 100 times.', 'angle.cast', 100);
  C('an3', 'angle', 'Casting', 4, 'endure', 'Caster', 'Cast the lure 1,000 times.', 'angle.cast', 1000);
  H('an4', 'angle', 'Casting', 2, 'mechanic', 'Long Arm', 'Cast 18 m.', 'angle.cast.dist', 18, { unit: 'm' });
  H('an5', 'angle', 'Casting', 3, 'mechanic', 'The Far Bank', 'Cast 28 m.', 'angle.cast.dist', 28, { unit: 'm' });
  F('an6', 'angle', 'Casting', 2, 'collect', 'Every Mind', 'Cast the lure with every aspect.', (L) => ASPECTS.filter((a) => L.get(`angle.cast.${a.id}`) > 0).length, ASPECTS.length);
  C('an7', 'angle', 'Casting', 1, 'count', 'Jig', 'Twitch the lure 25 times.', 'angle.twitch', 25);
  C('an8', 'angle', 'Casting', 1, 'count', 'A Sounding', 'Sound the water 10 times.', 'angle.sound', 10);
  C('an9', 'angle', 'Casting', 3, 'mechanic', 'Mooching', 'Cast with the echo of a landed fish 10 times.', 'angle.mooch', 10);
  C('ab1', 'angle', 'The Bite', 1, 'count', 'Something Bit', 'Have a fish take the lure.', 'angle.bite', 1);
  C('ab2', 'angle', 'The Bite', 2, 'endure', 'Patience', 'Feel 100 nibbles at the lure.', 'angle.nibble', 100);
  C('ab3', 'angle', 'The Bite', 2, 'mechanic', 'A Gulp', 'Answer a gulp: the heaviest bite.', 'angle.bite.gulp', 1);
  C('ab4', 'angle', 'The Bite', 3, 'perfect', 'Perfect Timing', 'Set the hook perfectly 10 times.', 'angle.hookset.perfect', 10);
  C('ab5', 'angle', 'The Bite', 4, 'perfect', 'A Steady Hand', 'Set the hook perfectly 100 times.', 'angle.hookset.perfect', 100);
  C('ab7', 'angle', 'The Bite', 2, 'count', 'Sonar', 'Light up 50 fish with soundings.', 'angle.reveal', 50);
  C('ab8', 'angle', 'The Bite', 1, 'count', 'Noticed', 'Have 25 fish notice the lure.', 'angle.notice', 25);
  C('ab6', 'angle', 'The Bite', 1, 'count', 'Stripped Bare', 'Let a fish take the bait and get away.', 'angle.miss', 1, { hidden: true });
  F('af1', 'angle', 'The Fight', 2, 'endure', 'Fighting Fit', 'Spend 5 minutes fighting fish.', (L) => L.get('fish.fight.time') / 60, 5, { unit: 'min' });
  F('af2', 'angle', 'The Fight', 4, 'endure', 'An Hour on the Line', 'Spend an hour fighting fish.', (L) => L.get('fish.fight.time') / 3600, 1, { unit: 'h' });
  H('af3', 'angle', 'The Fight', 3, 'endure', 'A Long Fight', 'Land a fish after 40 seconds.', 'fish.fight.longest', 40, { unit: 's' });
  H('af4', 'angle', 'The Fight', 5, 'endure', 'Iron Line', 'Land a fish after 90 seconds.', 'fish.fight.longest', 90, { unit: 's' });
  C('af5', 'angle', 'The Fight', 3, 'perfect', 'Clean Hands', 'Land 10 fish without the line ever nearing its limit or going slack.', 'fish.clean', 10);
  C('af6', 'angle', 'The Fight', 2, 'mechanic', 'Stand Firm', 'Land 10 fish while braced (crouched).', 'fish.braced', 10);
  C('af7', 'angle', 'The Fight', 3, 'mechanic', 'Ease Off', 'Ride out 25 thrashes and land the fish.', 'fish.thrashes', 25);
  S('af8', 'angle', 'The Fight', 3, 'Quick Work', 'Land a fish in 8 seconds or less.', 'fish.fight.shortest', 8);
  C('af11', 'angle', 'The Fight', 3, 'perfect', 'Well Read', 'Land 10 fish while answering nine tenths of what they asked of you: lean, haul, bow, brace.', 'fish.wellread', 10);
  C('af9', 'angle', 'The Fight', 1, 'count', 'Snapped', 'Have the line snap.', 'angle.escape.snap', 1, { hidden: true });
  C('af10', 'angle', 'The Fight', 2, 'count', 'Running on Empty', 'Lose the lure because the mind ran out.', 'angle.mindgone', 1, { hidden: true });
  C('ac1', 'angle', 'The Catch', 1, 'count', 'First Fish', 'Land a fish.', 'fish.total', 1);
  C('ac2', 'angle', 'The Catch', 1, 'count', 'A Handful', 'Land 10 fish.', 'fish.total', 10);
  C('ac3', 'angle', 'The Catch', 2, 'count', 'A Good Day', 'Land 50 fish.', 'fish.total', 50);
  C('ac4', 'angle', 'The Catch', 3, 'endure', 'Angler', 'Land 250 fish.', 'fish.total', 250);
  C('ac5', 'angle', 'The Catch', 5, 'endure', 'The Weir Is Empty', 'Land 1,000 fish.', 'fish.total', 1000, { title: 'Angler' });
  C('ac6', 'angle', 'The Catch', 3, 'mechanic', 'A Giant of Its Kind', 'Land a giant of its kind.', 'fish.cls.giant', 1);
  C('ac7', 'angle', 'The Catch', 5, 'mechanic', 'Ten Giants', 'Land 10 giants of their kinds.', 'fish.cls.giant', 10);
  H('ac8', 'angle', 'The Catch', 3, 'mechanic', 'Longer Than a Pole', 'Land something 150 cm long.', 'fish.cm.max', 150, { unit: 'cm' });
  H('ac9', 'angle', 'The Catch', 5, 'mechanic', 'Longer Than a Boat', 'Land something 250 cm long.', 'fish.cm.max', 250, { unit: 'cm' });
  F('ac10', 'angle', 'The Catch', 3, 'collect', 'Every Tide', 'Land a fish in every tide.', (L) => TIDES.filter((t) => L.get(`fish.tide.${t.id}`) > 0).length, TIDES.length);
  F('ac11', 'angle', 'The Catch', 3, 'collect', 'Every Aspect', 'Land a fish on every aspect.', (L) => ASPECTS.filter((a) => L.get(`fish.aspect.${a.id}`) > 0).length, ASPECTS.length);
  C('ac12', 'angle', 'The Catch', 2, 'count', 'Given Back', 'Take 500 lachryma from what you have landed.', 'fish.lachryma', 500);
  H('ac13', 'angle', 'The Catch', 2, 'mechanic', 'The Deep End', 'Land a fish from 4 m down.', 'fish.depth.max', 4, { unit: 'm' });
  const nSp = SPECIES.length;
  F('be1', 'angle', 'Bestiary', 2, 'collect', 'Field Notes', 'Land 5 different kinds.', (L) => SPECIES.filter((s) => L.get(`fish.sp.${s.id}`) > 0).length, 5);
  F('be2', 'angle', 'Bestiary', 4, 'collect', 'A Working Bestiary', 'Land 9 different kinds.', (L) => SPECIES.filter((s) => L.get(`fish.sp.${s.id}`) > 0).length, nSp - 1);
  F('be3', 'angle', 'Bestiary', 6, 'collect', 'Naturalist', 'Land every kind.', (L) => SPECIES.filter((s) => L.get(`fish.sp.${s.id}`) > 0).length, nSp, { title: 'Naturalist' });
  for (const sp of SPECIES) {
    const t = Math.min(6, sp.tier);
    C(`sp_${sp.id}_1`, 'angle', 'Bestiary', t, 'collect', sp.name, `Land ${sp.legend ? sp.name : `a ${sp.name}`}.`, `fish.sp.${sp.id}`, 1, { hidden: t >= 4 });
    if (!sp.legend) {
      const big = Math.round(sp.size[0] + (sp.size[1] - sp.size[0]) * 0.85);
      H(`sp_${sp.id}_2`, 'angle', 'Bestiary', Math.min(6, t + 1), 'mechanic', `A Large ${sp.name.replace(/^The /, '')}`, `Land ${sp.name.match(/^[AEIOU]/i) ? 'an' : 'a'} ${sp.name} of ${big} cm or more.`, `fish.cm.${sp.id}`, big, { unit: 'cm' });
      if (t <= 2) C(`sp_${sp.id}_3`, 'angle', 'Bestiary', t + 1, 'endure', `${sp.name}, Often`, `Land ${sp.name} 15 times.`, `fish.sp.${sp.id}`, 15);
    }
  }
  C('dp1', 'angle', 'The Deep', 4, 'mechanic', 'Something Vast', 'See the deep thing breach.', 'angle.breach', 1, { hidden: true });
  C('dp2', 'angle', 'The Deep', 6, 'endure', 'The Drowned Lachryma', 'Land the Drowned Lachryma.', 'fish.legend', 1, { hidden: true, title: 'Drowned King' });
  C('dp3', 'angle', 'The Deep', 3, 'count', 'Tides Turned', 'Watch the tide turn 20 times.', 'angle.tide', 20);

  // ---------------------------------------------------------------- BATTLE (jelly/slipjelly.js; stun.js; the Veritome's flash and reprogramming: veritome/)
  C('jl1', 'battle', 'Slip Jellies', 1, 'count', 'Pop!', 'Burst a slip jelly.', 'jelly.burst', 1);
  C('jl2', 'battle', 'Slip Jellies', 2, 'count', 'Jelly Season', 'Burst 25 slip jellies.', 'jelly.burst', 25);
  C('jl3', 'battle', 'Slip Jellies', 4, 'endure', 'Slipmonger', 'Burst 150 slip jellies.', 'jelly.burst', 150, { title: 'Slipmonger' });
  C('jl4', 'battle', 'Slip Jellies', 2, 'mechanic', 'Not Today', 'Break a slip jelly\'s wind-up with a heavy blow.', 'jelly.cancelled.staggered', 1);
  F('jl5', 'battle', 'Slip Jellies', 2, 'collect', 'Every Way There Is', 'Burst slip jellies three different ways (a shot, a blade, a club...).', (L) => L.under('jelly.burst.').filter(([, v]) => v > 0).length, 3);
  C('fl1', 'battle', 'Reprogramming', 1, 'count', 'Lights Out', 'Stun a creature with the Veritome\'s flash.', 'stun.cause.flash', 1);
  C('fl2', 'battle', 'Reprogramming', 1, 'count', 'Open Mind', 'Open a stunned creature\'s mind with the middle button.', 'reprogram.open', 1);
  C('fl3', 'battle', 'Reprogramming', 2, 'count', 'Root Access', 'Rewrite 15 minds.', 'reprogram.run', 15);
  C('fl4', 'battle', 'Reprogramming', 3, 'mechanic', 'Clean Compile', 'Type a macro\'s line without a single wrong key.', 'reprogram.clean', 1);
  F('fl5', 'battle', 'Reprogramming', 3, 'collect', 'The Whole Program', 'Run eight different macros.', (L) => L.under('reprogram.macro.').filter(([, v]) => v > 0).length, 8);
  C('fl6', 'battle', 'Reprogramming', 2, 'mechanic', 'Good Jelly', 'Make a slip jelly take you for its own kind.', 'reprogram.macro.kin', 1);
  C('fl7', 'battle', 'Reprogramming', 3, 'mechanic', 'Dissolution', 'Take a stunned creature apart with the zandatsu.', 'zandatsu.creature', 1);
  // ---------------------------------------------------------------- EXPLORATION
  C('ex1', 'explore', 'Charting', 1, 'count', 'First Pulse', 'Send out a survey pulse.', 'map.pulse', 1);
  // the clay folk and the chat line (npc/, chat.js, emotes.js)
  C('fk1', 'explore', 'Folk', 1, 'count', 'Small Talk', 'Speak with one of the clay folk.', 'npc.talk', 1);
  F('fk2', 'explore', 'Folk', 2, 'collect', 'Everyone\'s Acquaintance', 'Speak with all four of the clay folk.', (L) => ['saggar', 'pip', 'grog', 'raku'].filter((k) => L.get(`npc.talk.${k}`) > 0).length, 4);
  C('fk3', 'explore', 'Folk', 2, 'count', 'Good Listener', 'Hear the clay folk out: 60 lines.', 'npc.lines', 60);
  F('fk4', 'explore', 'Folk', 3, 'mechanic', 'The Whole Range', 'Hear a folk in five different moods.', (L) => L.under('npc.mood.').filter(([k, v]) => v > 0 && k !== 'npc.mood.calm').length, 5);
  F('fk5', 'explore', 'Folk', 1, 'collect', 'Body Language', 'Use five different emotes (/help lists them).', (L) => L.under('emote.').filter(([k, v]) => v > 0 && k !== 'emote.total').length, 5);
  C('ex2', 'explore', 'Charting', 2, 'count', 'Surveyor', 'Send out 25 survey pulses.', 'map.pulse', 25);
  C('ex3', 'explore', 'Charting', 4, 'endure', 'Cartographer', 'Send out 250 survey pulses.', 'map.pulse', 250);
  C('ex4', 'explore', 'Charting', 2, 'count', 'Ink on the Map', 'Chart 500 areas.', 'map.cells', 500);
  C('ex5', 'explore', 'Charting', 4, 'endure', 'The Whole Picture', 'Chart 10,000 areas.', 'map.cells', 10000, { title: 'Cartographer' });
  C('ex6', 'explore', 'Charting', 2, 'count', 'From Above', 'Survey with the hand.', 'map.pulse.god', 1);
  F('pl1', 'explore', 'Places', 1, 'collect', 'Getting Around', 'Chart 3 places.', (L) => L.firstCount('room.'), 3);
  F('pl2', 'explore', 'Places', 3, 'collect', 'Well Mapped', 'Chart 8 places.', (L) => L.firstCount('room.'), 8);
  F('pl3', 'explore', 'Places', 5, 'collect', 'Every Place', 'Chart every named place.', (L) => L.firstCount('room.'), game.cartography?.anchors?.length || 12);
  F('pl4', 'explore', 'Places', 2, 'endure', 'Basement Dweller', 'Spend 30 minutes in the basement.', (L) => L.get('time.area.basement') / 60, 30, { unit: 'min' });
  F('pl5', 'explore', 'Places', 2, 'endure', 'Sand in the Boots', 'Spend 15 minutes in the dunes.', (L) => L.get('time.area.dunes') / 60, 15, { unit: 'min' });
  F('pl6', 'explore', 'Places', 1, 'count', 'Reached the Dunes', 'Stand on the dunes.', (L) => (L.get('time.area.dunes') > 0 ? 1 : 0), 1);

  // ---------------------------------------------------------------- COLLECTION (the log: slots, shared by every way of getting them)
  F('lg1', 'collect', 'Logged', 1, 'collect', 'Fresh Ledger', 'Log 10 firsts.', (L) => L.firstCount(), 10);
  F('lg2', 'collect', 'Logged', 2, 'collect', 'Getting Filled In', 'Log 30 firsts.', (L) => L.firstCount(), 30);
  F('lg3', 'collect', 'Logged', 3, 'collect', 'Well Read', 'Log 60 firsts.', (L) => L.firstCount(), 60);
  F('lg4', 'collect', 'Logged', 5, 'collect', 'Completionist', 'Log 100 firsts.', (L) => L.firstCount(), 100, { title: 'Completionist' });
  F('lg5', 'collect', 'Logged', 2, 'collect', 'Every Tech, Once', 'Use each movement art once.', (L) => L.firstCount('tech.'), game.techs?.list.length || 17);
  F('lg6', 'collect', 'Logged', 3, 'collect', 'A Shell of Each', 'Fire each shell once.', (L) => L.firstCount('shell.'), SHELL_TYPES.length);

  // ---------------------------------------------------------------- GENERAL
  F('tm1', 'general', 'Time', 1, 'endure', 'Settling In', 'Play for 30 minutes.', (L) => L.play / 60, 30, { unit: 'min' });
  F('tm2', 'general', 'Time', 2, 'endure', 'Regular', 'Play for 2 hours.', (L) => L.play / 3600, 2, { unit: 'h' });
  F('tm3', 'general', 'Time', 4, 'endure', 'Devoted', 'Play for 10 hours.', (L) => L.play / 3600, 10, { unit: 'h' });
  F('tm4', 'general', 'Time', 6, 'endure', 'Lifer', 'Play for 50 hours.', (L) => L.play / 3600, 50, { unit: 'h', title: 'Lifer' });
  C('ss1', 'general', 'Persistence', 1, 'count', 'Back Again', 'Return for a second session.', 'sessions', 2, { cur: (L) => L.sessions });
  C('ss2', 'general', 'Persistence', 3, 'endure', 'Creature of Habit', 'Play in 20 sessions.', 'sessions', 20, { cur: (L) => L.sessions });
  C('rs1', 'general', 'Persistence', 1, 'count', 'Try, Try Again', 'Fall out of the world 10 times.', 'respawn.fall', 10);
  C('rs2', 'general', 'Persistence', 3, 'endure', 'Bottomless', 'Fall out of the world 100 times.', 'respawn.fall', 100);
  F('am1', 'general', 'Achievements', 1, 'collect', 'A Start', 'Complete 10 achievements.', (L, g, a) => a.count(), 10);
  F('am2', 'general', 'Achievements', 3, 'collect', 'Halfway Up the Wall', 'Complete 50 achievements.', (L, g, a) => a.count(), 50);
  F('am3', 'general', 'Achievements', 5, 'collect', 'A Full Wall', 'Complete 100 achievements.', (L, g, a) => a.count(), 100);
  return tiers.slice();
}

export class Achievements {
  constructor(game) {
    this.game = game;
    this.L = game.ledger;
    this.list = buildAchievements(game);
    this.by = Object.fromEntries(this.list.map((a) => [a.id, a]));
    this.seenVersion = -1;
    this.t = 0;
    this.rank = this.rankIndex();
    this.silent = true;
    this.check(); // (whatever was already done, silently: the log stays quiet on load)
    this.silent = false;
  }

  count() { return this.list.filter((a) => this.L.done[a.id]).length; }
  get points() { return this.list.reduce((n, a) => n + (this.L.done[a.id] ? TIERS[a.tier].pts : 0), 0); }
  get maxPoints() { return this.list.reduce((n, a) => n + TIERS[a.tier].pts, 0); }
  rankIndex() { let r = 0; RANKS.forEach(([p], i) => { if (this.points >= p) r = i; }); return r; }
  get rankName() { return RANKS[this.rankIndex()][1]; }
  get titles() { return this.list.filter((a) => a.title && this.L.done[a.id]).map((a) => a.title); }

  /** [current, goal, fraction] for one task. */
  progress(a) {
    const v = a.cur(this.L, this.game, this);
    if (a.dir === 'down') return [v, a.goal, Number.isFinite(v) ? Math.min(1, a.goal / v) : 0];
    return [v, a.goal, Math.max(0, Math.min(1, v / a.goal))];
  }

  isDone(a) { const [, , f] = this.progress(a); return f >= 1 - 1e-9; }

  tick(dt) {
    this.t += dt;
    if (this.t < 0.6) return;
    this.t = 0;
    if (this.L.version !== this.seenVersion) this.check();
  }

  check() {
    this.seenVersion = this.L.version;
    let again = true, guard = 0;
    while (again && guard++ < 4) { // (the achievements-about-achievements can complete in a chain)
      again = false;
      for (const a of this.list) {
        if (this.L.done[a.id] || !this.isDone(a)) continue;
        this.L.done[a.id] = this.L.play;
        this.L.touch();
        again = true;
        if (!this.silent) this.announce(a);
      }
    }
    if (!this.silent) {
      const r = this.rankIndex();
      if (r > this.rank) { this.game.log?.say('ach', `You are now known as a ${RANKS[r][1]}.`); this.rank = r; this.game.events?.emit('rank.up', { rank: RANKS[r][1] }); }
    } else this.rank = this.rankIndex();
  }

  announce(a) {
    const T0 = TIERS[a.tier];
    this.game.log?.say('ach', `Achievement complete (${T0.name}, ${T0.pts} ${T0.pts === 1 ? 'pt' : 'pts'}): ${a.name}.`);
    if (a.title) this.game.log?.say('ach', `You have earned the title "${a.title}".`);
    this.game.events?.emit('achievement', { id: a.id, tier: a.tier, points: T0.pts, title: a.title || null, ach: a.name });
    sfx.systemUnlock?.();
  }
}
