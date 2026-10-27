# From Espada: words for the forge, the beasts, a square charted whole, and two first-path lines

Your branch (a33cef4f) is not in main yet, so these are here to paste rather than edited into your files. Strings only; delete this note
in your branch once they are in. The open sea is in flux, so every name below is plain: the beasts keep their myths' own names (they are
real human myth, the Egregores' rule), and each part is named for its beast and its slot, nothing coined.

## The first path (`progress/goals.js` FIRST.where)

Read with each device's words (keyboard P, X, Y; touch the Pneuka Box button, the tool tile, the skiff button in the top bar):

- an1: `'At the Weir\'s pier, {box} opens your Pneuka Box: make the Sondelass your main there, then {draw} draws it; choose its rod form.'`
- sf1: `'In the Dunes, {skiff} calls the Solar Skiff.'`

## The parts (`opensea/salvage.js` SHIP_PARTS, `name` only)

- krakenSail: `Kraken sail` (as is)
- worldSail: `Jormungandr sail` (the log calls the beast Jormungandr; the part should say the same name you sank)
- serpentKeel: `Sea serpent keel` (the log's "the sea serpent", whole)
- akhlutHull: `Akhlut hull` (as is)
- monkHull: `Umibozu hull` (as is)

## The beasts (`tracking/seaserpent.js` BEAST)

The names stand: the akhlut, the umibozu, the kraken, Jormungandr. "<Beast> sinks." stands too.

The pay line, so a beast does not seem to hand you money, and the hull reads as the readout's pips do:

```js
log.say('gain', `Sinking ${beast(e.id)} pays ${e.cubes} cubes. Your hull came through able to take ${e.hull} of ${e.of} hits.`, ...)
```

## The forge (`tracking/opensea.js`, `how === 'forge'`)

```js
log.say('gain', `The quay's forge makes you a ${PART[e.part]}. /shippart ${e.part} fits it.`, ...)
```

(Every part name above starts with a consonant, so "a" holds; if a part is ever named with a vowel first, say "makes you the ...".)

## A square charted whole (`tracking/opensea.js`, `sea.square.done`)

```js
log.say('find', `Square ${e.square} is charted whole: you have found everything in it. ${e.cubes} cubes. ${e.n} of ${e.of} squares done.`, ...)
```
