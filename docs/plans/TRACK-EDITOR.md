# The track editor and the traps (a plan)

The owner, 2026-10-24: "an Ultimate Chicken Horse type track editing system, taking advantage of our suite of god hand abilities. So we
need more interesting trap hazards, and the ability to take control of them via Possession, ostensibly so other players could then use
them to interfere with your run. Crawl (Powerhoof) used this to great effect. What do you think, what would you add, and what games have
the best track customization tooling?"

Dovina's plan. Status: **a plan, nothing built.** Plain names throughout (CLAUDE.md, "Plain names until settled"): **the track editor**,
**a trap**, **possessing a trap**, **the build lot**, **the party mode**, **the haunt mode**. The rail's "a hazard" (a pillar, arch or gate
on the crossing) is a different thing; these are traps.

## 1. The verdict

Yes, and it fits this game better than almost any other, because most of it is already built:

- **A track is data.** `world/raceway/track.js` builds a track from control points (`[x, z, y, width, wind]`) and a features list (gates,
  plates, kickers, ramps, rails, rings, lanes, geysers, buoys, pots). An editor writes the same format. Nothing new runs a race.
- **The god hand already shapes ground.** Shape, Carve and Scoop move the island's matter; Sculpt raises ramps, arches, bridges and
  pillars; Setfast keeps them; Manifest raises walls; Portal, Fold, Slab, Gust, Totem, Ward and Stamp are each a tool an editor would
  want. The editor is the god hand at the Raceway, not a new UI.
- **The ruler validates and prices any track.** `progress/skiffruler.js` times a reference race on any line, so a made track gets par,
  medals and a PI read the moment it is laid, before anyone is good at it. Trackmania needs the author's own time for this.
- **Possession is a domain already.** Take ("play a creature from above") is exactly Crawl's ghost; Read ("see a creature's next
  intent") is exactly the rider's counter to it.
- **There are opponents to fill the seats.** The clapperjar rivals and the siblings can race the track and possess its traps, so the
  owner, who mostly plays alone, gets the party loop with bots; guests (the published page's room) fill seats when there are people.

**The risk** is the usual one: an editor is a product of its own. So it ships in waves (section 10), and the first wave is traps on the
existing tracks, played against bots, with no editor at all. If traps are not fun on the Sun Circuit, no editor saves them.

## 2. Prior art, and what to take

| game | what it does best | what we take |
| --- | --- | --- |
| **Ultimate Chicken Horse** (Clever Endeavour, 2016) | Each round every player picks a piece from a party box, places it, then all run. Points for finishing only if not everyone finishes ("too easy": no points), a bonus for being the only one, points for a trap that kills. | The round loop, and the self-balancing score: a trap placed to wreck everyone, or a track too easy, scores nothing. |
| **Crawl** (Powerhoof, 2017) | One hero; the dead play ghosts who possess traps and monsters in the dungeon. Whoever lands the killing blow becomes the hero. Ghosts grow stronger (wrath) the longer they haunt. | The haunt mode whole: wreck the rider, take the board. The possessor's growing pressure. |
| **Trackmania** (Nadeo) | A block editor on a grid; a track must be **validated** (finished by its author) to be published; the author's time sets the medals (gold 106%, silver 120%, bronze 150%); ghosts; a track as a shareable code. | Validation, medals from a time, ghosts, share codes. Our ruler also gives medals before any author time exists. |
| **ModNation Racers** (United Front, 2010) | **Drive to lay the road**: a paver follows your line, terrain raised and cut around it, then props auto-populated; a theme; a complexity meter. | Ride the skiff to lay the line; the ground fitted to it as `park.js` already pulls the sand to a track; a budget meter. |
| **Super Mario Maker 2** (Nintendo, 2019) | A clear check before upload; parts with clear rules and limits; tags, likes; Endless Challenge. Readability first: every part reads at a glance. | The clear check (= validation); every trap reads at a glance (a tell and an answer); a later "endless" of shared tracks. |
| **Trials Evolution / Rising** (RedLynx) | Two editors: Lite (place and play) and Pro (event triggers that script traps and gates). | Two depths: placing traps with their default cycles, and (later) a trigger per trap ("when a rider passes gate 3"). |
| **Forza Horizon 5 EventLab** (Playground) | Rules and blueprints: if-then rules that turn a track into a game mode. | A track's rules (no flares, low grip) as modifiers with a visible source, Spellscription's (section 5). |
| **LittleBigPlanet Karting / Hot Wheels Unleashed** | The thermometer (a budget everyone understands); snap-together pieces. | One budget meter, shared by the performance gate and the design (no trap carpet). |
| **Fall Guys Creative** | Obstacles with exposed timing (period, offset). | Each trap's cycle as two numbers you can set. |

## 3. The editor (the god hand at the build lot)

- **Where:** the race board gets a BUILD tab; it opens the **build lot**, a stretch of open sand in the park set aside for made tracks
  (one at a time, its own render zone, the park's ground kit). The god hand (~) is how you edit there: the scope rule holds (begun from
  its own room's thing, gone when you leave).
- **Lay the line (two ways):**
  1. **Ride it** (ModNation's paver): start recording at the lot's start and sail; a control point is laid every ~40 m from your line,
     its width from your speed, its height from the sand; cross your own start to close the loop.
  2. **Draw it** with the hand, as Herd draws a line for creatures: a stroke on the ground becomes the line.
  Then the hand drags control points, and Shape raises or lowers them.
- **Shape the ground** with the powers you have, each at its domain's level (so a new player's editor is small and grows):

  | power (domain) | in the editor |
  | --- | --- |
  | Shape, Carve, Scoop (the matter's verbs) | banks, cuts, bowls, a ford's dip |
  | Sculpt, Setfast (Manifestation) | ramps, kickers, arches, bridges, pillars; set so they stay |
  | Manifest (Manifestation) | walls, a track's edge |
  | Slab (Psychokinesis) | move a stretch of ground whole |
  | Portal (Ouranurgy) | a portal pair: a shortcut, or a trap (section 4) |
  | Fold (Ouranurgy) | swap two patches: a layout's quick edit |
  | Gust (Psychokinesis) | a stretch's wind (the control point's `wind`) |
  | Totem (Manifestation) | a stretch's weather held (a race's condition, local) |
  | Ward, Stamp (Spellscription) | a track's rules (section 5); copy and press a stretch elsewhere |
  | Course, Strata (Divination) | see the line the reference rider takes; see the layers before you cut |

- **Place the kit:** gates (auto-spaced, movable), sun plates, kickers, rails, rings, vein lanes, buoys, geysers, pots, siphons, and the
  traps (section 4). Snapped to the line by its `s` (metres along it), as `features` already are.
- **The budget meter:** one bar (LittleBigPlanet's thermometer): each piece has a cost (its draw calls and lights, Petra's to measure),
  and traps cost more. Full is full.
- **Validate:** ride the track to the line once. Until then it can only be practised. The ruler runs at once and shows the reference
  race, the PI read, and the medals (the Sun Circuit's 0.718 ratio, as the Gorge Run's and the Coaster's were set); your own time is the
  author's, kept beside them.
- **Keep and share:** a track is a short JSON (its control points, features and traps), kept in the save (`raceTracks`, three slots)
  and shown as a code (Trackmania's) a guest can paste; guests in the room ride the host's tracks directly.

## 4. The traps

Each trap is a thing in the world with four parts. Without all four it is not a trap; it is a wall.
1. **A cycle:** what it does on its own (period and offset you can set: Fall Guys').
2. **A tell:** at least 0.6 real s of warning, in the Figment attack telegraph's grammar (where, when, what kind); never an unseen blow.
3. **An answer:** one of the skiff's own verbs beats it: the hop, the carve, the shoulder, the pop, the glide, the grind, or the parry.
4. **A possessed mode:** what a possessor does with it, and its cooldown.

The core movement is never touched: a trap is a modifier with a source you can see (DESIGN.md 22, "base change bad, modifiers good").

| trap | placed with (domain) | its cycle | possessed: you | its answer | from |
| --- | --- | --- | --- | --- | --- |
| **The antlion** (the pits' maw, out of its pit) | Take (Possession) | follows the line behind the leader | steer it, lunge | speed, a carve's push, a hop over the lunge | the escape's chaser, `escape.js` |
| **Rising pillars** | Sculpt (Manifestation) | a lane of pillars rises and falls in turn | pick the lane that rises | read the tell, take another lane or a rail | Fall Guys' pistons |
| **The pendulum** | Totem (Manifestation) | a stone arm swings across the line | its speed and its stop | time it, or duck under in the manual | every platformer |
| **A gust gate** | Gust (Psychokinesis) | a shove across the track every few seconds | aim and fire it | carve into it, or ride it into a gap | Wave Race's wind, the rail's gale |
| **A boulder** | Telekinesis (Psychokinesis) | rolls down a slope onto the line | when it rolls | the shoulder breaks it, or the hop | Indiana Jones, Excitebike's obstacles |
| **A sinkhole** | Scoop (Psychokinesis) | the ground opens for a beat | open it under a rider | hop or glide over | Mario Kart's pits |
| **A crude gusher** | Transmute (Alteration) | spills a slick across a lane (grip falls) | aim the spill | a lane's Lachrymite, a pop over it | `vfx/slicks.js` |
| **A portal pair** | Portal (Ouranurgy) | a shortcut while lit | flip it to send riders back | Read shows which way it points | `vfx/caster/portal.js` |
| **A hasten field** | Hasten (Ouranurgy) | a patch where time runs fast | stop time in it (the board slows) | go round, or carve through before it shuts | Braid |
| **A storm cell** | Storm, a miracle (Spellscription) | bolts fall on marked spots | place each strike | the marks; the hop | the god hand's Storm |
| **A ward gate** | Ward (Spellscription) | a circle the board cannot cross shuts for a beat | shut it on a rider | timing; another route | the god hand's Ward |
| **A Wisp turret** | a Lantern Wisp (the Dunes' creature) | casts its flame at the leader | aim it | **the parry** (V) sends it back and stuns the turret (and its possessor's control) | the Wisp's own fight |
| **A pot catapult** | Muster (Possession) | clapperjars lob pots onto the line | aim the lob | smash it for combo points (the pot smash's) or dodge | `pottrial.js` |
| **A siphon** | (built) | drinks the pool to a quarter | open it on a rider | ride a vein lane after it | `siphons.js` |

Fourteen traps, every domain represented and no new domain (the law). The first wave is four (section 10).

## 5. A track's rules (Spellscription)

Forza's EventLab, small: a track may carry up to three rules, each a modifier with a visible source (a stele at the start, its words
on it): no flares, low grip, the pool drains as you ride (Gall), every plate doubled, rings only, night only. They are written with
Ward and Stamp, so Spellscription is the rule-writer's domain.

## 6. Possession

- **Who:** you, a sibling (a bot), or a guest. A possessor sees from above, as the god hand does, and holds one trap at a time; moving
  to another trap takes a real second.
- **Fairness, by rule:** a possessed trap keeps its tell (never shorter than 0.6 real s), has a cooldown after it fires (2 to 4 real s by
  trap), and cannot fire within 30 m after a gate (a rider always gets a breath; Mario Maker's no-unavoidable-damage rule). A validated
  track is finishable with no one possessing, so possession adds pressure, never a certain wreck.
- **The rider's counter:** Read (Divination) shows a possessed trap's next intent a beat early, the possessor's aim as a ghost line.
  So Divination is the rider's domain, as Possession is the haunter's.
- **Crawl's wrath:** a possessor who goes a lap without a wreck grows its trap's power a step (a wider gust, a longer pillar), up to three;
  a wreck resets it. Pressure rises the longer the rider gets away with it.

## 7. The modes

| mode | who | the loop | taken from |
| --- | --- | --- | --- |
| **Build and ride** | you | lay a track, validate it, set your records and ghosts, beat the ruler's medals | Trackmania |
| **The party mode** | 2 to 4: you, siblings, guests | each round each picks a trap from a box of three and places it with the hand; all ride; points for finishing (only if not all finish), first, alone, and a trap's wreck; first to a score wins; the track keeps growing | Ultimate Chicken Horse |
| **The haunt mode** | 1 rider, 1 to 3 haunters | the rider races for laps; the haunters possess traps; whoever wrecks the rider takes the board; first to three laps wins | Crawl |
| **A haunted race** (on the existing tracks) | you riding, siblings haunting; or you haunting the clapperjars' race | the first wave's mode: no editor needed | Crawl, on our tracks |

## 8. Rewards and the ledger (mine)

- **No cubes from a made track's race.** A track you made can be made easy; paying for it is a farm. Made tracks pay in the ledger
  (achievements: a track validated, a party won, a haunt won, a wreck by each trap, a gold on a shared track), and in titles.
- **The existing tracks' haunted races pay as races do** (their medals, the wager), since those tracks are the house's.
- **Trap kinds open as god powers do:** each trap by its power's domain level (the count way) or a feat on the Raceway (the feat way):
  arts only by achievement.

## 9. Beyond the editor: what else makes the racing ours

1. **Plates on the beat.** The sun plates pulse with the race cue's beat (Wanda's music clock); a plate crossed on the beat pays more
   (Audiosurf, Crypt of the NecroDancer). The Crucibelle player's instinct pays on the sand.
2. **Paint the line.** The Soul Brush in practice paints a feeling's paint on the track (the paint map): Wonder's paint grips, Grief's is
   slick. A sibling in the party mode paints the line against you. It is the paint map's own data, already there.
3. **Steal a flare.** The Lockheart's gulp as a shoulder variant: a takedown drinks the rival's banked flare (Burnout's takedown boost).

## 10. Build order

| wave | what | who |
| --- | --- | --- |
| W1 | **The trap kit** as data (`progress/traps.js`: cycle, tell, answer, possessed mode, cooldown) and four traps on the existing tracks: rising pillars, the gust gate, the antlion, the Wisp turret. Played against the clapperjars, nobody possessing. | Dovina (rules, data), Petra (the world runtime), Calissa (looks, tells), Wanda (sounds) |
| W2 | **Possession:** you possess traps in the clapperjars' race, siblings possess traps against you (a bot possessor). The haunted race. Read as the counter. | Dovina (rules, the bot's choices), Petra (the camera and control) |
| W3 | **The editor:** the build lot, lay the line (ride it, draw it), place the kit and traps with the hand, the budget meter, validate, the ruler's medals. | Petra (the god hand at the lot, the lot), Dovina (the track format, validation, budget, ruler) |
| W4 | **The party and haunt modes** with siblings and guests; the remaining traps; a track's rules. | Dovina, Petra |
| W5 | **Sharing:** track codes, a guest riding the host's track, a shelf of tracks. | Petra (the room), Dovina |

## 11. Questions for the owner

1. **Multiplayer:** live guests in the room for the party and haunt modes, or bots and shared tracks only for now?
2. **The first four traps:** rising pillars, the gust gate, the antlion and the Wisp turret, or your four?
3. **Rewards:** made tracks pay no cubes (section 8). Agreed?
4. **W1 first** (traps on the existing tracks, no editor), or straight to the editor?

**Answered** (the owner, 2026-10-24: "Let's do bots and shared tracks, go with seven initial trap types, we can copy other games' homework
on trap design. I agree no cubes for UGC. Go full steam on an editor"): bots and share codes for now, no live guests; seven traps
(section 4 and `progress/traps.js`); no cubes from made tracks; the editor built at once, W1 to W3 in one round.

## 12. What is built (round of 2026-10-24)

**One format (rewritten the same day, the owner: "if you come across a more elegant way to fold in the existing racing content, rewrite
the module as necessary").** The first build kept made tracks apart: their own piece list, their own placeholder builder, a flat lot with
pieces added on top of the ground. Now a made track IS a house track:

- **The format** (`progress/trackdef.js`, v2): points `[x, z, y, halfWidth]` (y up to 30 m over the lot's floor), and every piece and
  trap placed on the line by `u` (its share of the line from the start) and `lat` (metres right of it), so it slides with the line as the
  line is edited. `toTrackDef` turns it into a `track.js` definition: the Sun Circuit's kind of line, the house's own features.
- **The palette is the house kit** (`progress/trackpieces.js`): kicker, side ramp, whoops, bowl, glide lip, boost pad (sun plate),
  recharge strip (vein lane), geyser, rail, sun ring, and three the kit gained for it (a lone column, a wall across part of the track,
  an arch to thread: `kit.js`, open to any track). Sizes are the park's: a made kicker is the Sun Circuit's kicker. A span (whoops, a
  bowl, a glide lip, a rail) takes two clicks.
- **The ground is the park's** (`world/raceway/madetrack.js`): the lot's samples of the park's terrain are rewritten to the track's
  corridor (its heights, banks, kickers, ramps, whoops, berms) and a physics height field is laid over the lot; the board rides it through
  the same `heightAt` as every track. The lot sits on the terrain's grid, so this is the park's ground cell for cell.
- **The furniture is the park's** (`kit.js kitOf`, `marksOf`; `railsrings.js railsOf`, `ringsOf`): the builders that lay the park's three
  tracks now lay one track at a time, and the made track is laid by them.
- **Traps are a track feature** (`traps` in `track.js`, `world/raceway/traps.js .use(T)`): a made track's always; the Sun Circuit, the
  Gorge Run and the Coaster each carry a layout (seven, six, six traps, each where the track already asks something of the board), set up
  only for the **haunted race** and **the haunt** on that track (two new rows per track on the race board). The park's own races are
  never changed by them (DESIGN.md 22: a modifier you choose). `race.haunted` counts haunted races on any track.
- **The editor** (`world/raceway/editor.js`): the cursor meets the ground as shaped (`raceway.pick`); a point's height and width by keys or
  the SELECTED buttons (Raise, Lower, Wider, Narrower); a trap's period and offset the same (Slower, Faster, Later, Sooner); ride it lays
  points at the height you ride. Camera 40 to 170 m up, a map of the lot in the panel, pegs and a selection ring.
- **Checks** (`validate`): on the lot, length 500 to 3,200 m, no bend under 14 m, no climb steeper than 1 in 3 between points (a drop is
  a jump: any), no two stretches running into each other, the budget (100), the start's 60 m and 30 m after each gate clear of traps.
- **Medals** on a made track: the reference race (the ruler, three laps) times 0.718 gold, 0.802 silver, 0.929 bronze, the park's own
  ratios. **The author time:** a validate run's lap, kept with the geometry's hash. **The share code:** `FF2-<base64url>-<sum>`
  (version 1 codes were never shared; progress resets each build).
- **The portal's mercy:** a possessed portal sends a rider back as far as its shortcut would carry it on; a rider so sent is spared that
  portal until past it.
- **Measured** (headless, `scripts/raceway/drive.mjs`): the demo "The Lot Loop" (1,244 m, an 18 m mesa with a glide lip off it, twelve
  pieces, seven traps, budget 91): checks clean, medals gold 107 s, silver 119 s, bronze 138 s; a validate lap of 53.8 s, up onto the
  mesa and off it, two trap hits. A haunted race on the Sun Circuit: three laps (121.7, 108.6, 111.1 s), the bots fired 18 times, 17 hits,
  3 portal warps, fourth place. The haunt on the Gorge Run, firing the next trap every third of a second: 10 wrecks, the winner in 378 s
  against a par of 421 (the reference race 468 s): broken through easily, so HAUNT.parK (0.9) wants tuning per track, likely lower on the
  long tracks, once the owner has played it.
- **Not yet:** the traps' and pieces' looks and tells beyond placeholders (Calissa), their sounds (Wanda), their names (Espada), the
  party mode and live guests (W4, W5), Read showing a possessed trap's next intent, trap kinds opened by achievement (they open with
  their god powers for now), fords and bridges on a made track (the lot's ground is only raised, never cut).
