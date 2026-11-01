# From Espada: the domain ladder's words (2026-11-01)

These are the words for the 11 traits (`progress/domainladder.js` TRAITS) and the seven rungs at 60 (`progress/domainarts.js`). They're in
the System's voice (CLARITY.md 14) and keep every number your rows already carry. Where a line isn't listed, it stands as it is. Paste them
in, then delete this note.

Names stay plain until South calls the ladder finished. "Enhanced X" is the genre's own word (FFXIV's job traits), so it stays.

## The traits

Labels stand, with one change: `catchHard` was "Mighty Catch" and becomes `Hard Return`. "Mighty" is the only flavour word on the ladder,
and the trait is about the throw back.

| id | line |
|---|---|
| retypeLong | `Re-type lasts 30 seconds now, up from 20.` |
| reactionsWide | `Your reactions reach 2.5 m now, up from 1.5.` |
| catchLong | `You can hold a caught shot for 2.5 seconds now, up from 1.5. Long enough to pick a new target.` |
| ruleCheap | `Your standing rule fires for 2 pool now, down from 5.` |
| postponeDeep | `Parry a held blow and only a quarter of it lands, down from half.` |
| platingWhole | `Plating soaks up its part's whole next crack. It still won't stop one that would shatter you.` |
| watchFar | `You can read a Figment's watch from 50 m now, up from 30.` |
| catchHard | `A caught shot you throw back hits twice as hard, up from half again.` |
| linkDeep | `The bound creature takes two thirds of a crack meant for you, up from half.` |
| reactionsCalm | `A cancel calms whatever's in it for 5 seconds, up from 3.` |
| vowDeep | `A kept vow takes a third off every cost, up from a quarter.` |

## The rungs at 60 (line, then the second line)

| id | line | second line |
|---|---|---|
| fuse | `Fuse the nearest foe. For 8 seconds, every affliction you put on it waits. Press again and they all go off at once, each lasting half again as long.` | `Let the 8 seconds run out and they go off as normal. Set them off into a stun for the biggest payoff.` |
| catchWeather | `Stand in a feeling's weather, out under the sky, with a Bottle on, and the Bottle fills with that feeling.` | `Only feelings you know, and only if the Bottle's empty or already holds that one. Stronger weather fills it faster.` |
| relay | `Hit a creature hard and the force carries on to the one behind it, up to three in a row.` | `"Hard" means a thrown hit, or a blow of power 2 or more. Each link keeps three quarters of the force, and the next body has to be within 3 m, in line.` |
| trueOdds | `See chance as real numbers. Near the Tithe's console you get the next pull's odds for each tier, pity included. Near a crystal you see what it might give.` | `These are the game's real odds, never rounded in your favour. More of the world's chances show up as you learn to read them.` |
| borrowVerb | `Reprogram a creature and you can use its move on R for 20 seconds, in place of your sub's.` | `A slip jelly lends its spit glob, a Lantern Wisp its flame ball. Each throw costs 4 pool, and the loan ends if the lender goes down.` |
| walkCycle | `Turn every affliction on the nearest foe into the one it beats: doubt into charm, charm into confusion, confusion into a stun, blindness into doubt.` | `Each keeps the time it had left, never more than the new one would last. A foe with no afflictions can't be walked.` |
| sealCreature | `Seal a creature as it winds up a blow. The blow breaks off, and it can't use that kind of blow for 20 seconds.` | `Only works mid-windup. A FOE follows its own rules and shrugs the seal off.` |

walkCycle keeps its colon: it introduces a list the player needs. Everywhere else the colon chains are gone.

## True Odds' row labels (`courier/domainarts/depth.js`, Petra's)

They stand. The tiers' own names, then `Possibilikey`, `Fossil` and `Crystal shard`, are the glossary's words, which is what a readout
should carry.

## Borrow a Verb's log lines (`feedback/tracking/domainarts.js`)

- start: `` `The ${kname(e.kind)} lends you its move. Press R to throw it for the next ${e.dur} seconds.` ``
- end: `` `The ${kname(e.kind)} takes its move back.` ``
