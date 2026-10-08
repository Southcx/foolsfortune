# Creatures and folk

Creatures are the things in the world that move on their own and can be hurt. The folk are the clay people who talk to you. This page
says who you meet, what each does, and how to deal with them.

## Clapperjars

Clapperjars are small living pots, and the folk's lowest tier. You meet them in the workshop. They mostly mind their own business.

| What they do | When |
| --- | --- |
| Wander, nap, eat baubles | when left alone |
| Taunt (clap their lids) | when they notice you |
| Hide behind a big pot and cower | when frightened |
| Bolt away | at a near miss |
| Shatter | from a shot, a cut, a blast or a long fall |

A stunned clapperjar stops and sways. A mortar or a shot can also knock it about.

## Slip jellies

A slip jelly is a blob of wet sand on four toes. It is the first creature that fights back. Three live on the flats around the Weir
in the Dunes.

How it fights:

| Move | What you see | Time |
| --- | --- | ---: |
| **Lunge** | it sinks and quivers, then leaps at you in an arc. Landing on you knocks you flat | 0.8 real seconds of warning |
| **Spit** | it leans back and swells, then lobs a glob of slip that splashes where it lands | 0.6 real seconds of warning |
| **Glide** | it slides toward you on its own slip, leaving a wet trail you can dive into | always |

Parry the warning (**V**) to break it off. See [The tools](tools.md).

What it does when you are not there: it drinks at the pond, rests in the shade, eats Lachryma it finds, calls its kin when it sees you,
hunts you if you hurt one, and mourns where one burst. It runs away if it is frightened enough.

| Number | Value |
| --- | ---: |
| Hit points | 8 |
| Stun lasts | 5 real seconds |
| Bursts into | slip and 6 cubes |
| Forms again | 40 real seconds later, if you are over 10 m from its home |

A **Great Slip Jelly** is the same body, much bigger. It is the boss of the Great Dunemaw. See [The Great Dunemaw](great-dunemaw.md).

## Stunning

Anything that can be stunned has a poise meter. A flash from the Veritome, heavy blows and catching it mid-leap fill the meter. When it
is full, the creature is **stunned**. It stops, sways and gold stars circle its head.

| Number | Value |
| --- | ---: |
| Slip jelly stun | 5 real seconds |
| Damage taken while stunned | x1.5 |
| Immune after it comes to | 6 real seconds (the meter fills at a quarter of the rate) |

A stunned creature is open to things a thinking opponent would refuse:

- **Zandatsu** (the Sondelass): cuts it into pieces that come undone into Lachryma and cubes.
- **Reprogramming** (the Veritome): rewrite its mind with a macro.
- **Catching** (Lockheart coffin or the god hand): take the Figment whole into your Pneuka Jar. See [The Spirit Garden](spirit-garden.md).

A creature that is not stunned will refuse these, and shows a resist mark when you try.

## Spirits

A spirit is a slip jelly made of smoke. You call one up with the Crucibelle's summon song or a Lockheart's luck. It follows you and
fights what you fight. Your own blows pass through it.

| Number | Value |
| --- | ---: |
| Most at once | 4 (calling a fifth sends the oldest away) |
| Lasts | 30 real seconds by default, then goes back into smoke |

A spirit never forms again once it is struck down. A Figment you catch and keep in the garden is a different thing: it lives there.

## Mortars

In the movement lab, clay mortars throw a glazed ball at you every few seconds. A ball that hits knocks you back and does no more.
Parry one with a kick and it goes back the way you are looking. A target it hits rings.

## The clay folk

The folk are clapperjars grown up and glazed. Press **F** at one to talk. Each speaks in a voice of bells and clay. Their body shows
their mood, and what they say is also written to the log. They know what you have done.

| Who | Where | What they do |
| --- | --- | --- |
| Mistress Saggar | the workshop | keeps the kiln |
| Pip | the basement hub (hiding) | the apprentice potter |
| Old Grog | the Weir's pier | angler; buys fish, sells lures and crude |
| Raku | the Weir's treasury | treasurer; sells keys and coffins, haggles, runs the Tithe |
| The Purser | Margarite's dock | the King's buyer of crude, maps and materials |
| Letty Marque | Margarite's dock | posts bounties |

The shops are on [Things and money](economy.md). Some Figments and Egregores (real human myths, such as Charybdis the Whale) live on
the Emocean. See [The Emocean](emocean.md).

## For the divisions

- `docs/AI.md`: how a mind is built. `docs/GLOSSARY.md`: creature, mind, status, stun, Figment.
- `src/creatures/` (`creatures.js`, `clappers.js`, `stun.js`, `spirits.js`, `bound.js`, `lobber.js`), `src/creatures/jelly/` (the body and
  its mind), `src/creatures/ai/` (the shared parts).
- `src/npc/` (`people.js`, `folk.js`, `dialogue.js`, `talks.js`, `clayese.js`).
