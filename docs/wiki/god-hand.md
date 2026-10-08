# The god hand

Press ~ and you stop being the Courier. They settle into your Pneuka Jar, and you become a disembodied hand over a turnable
overhead view. The hand lifts, throws, cuts, swells, twists and builds. You use it to learn clay's rules in peace, to fight raids
in the siege, and to catch Figments.

## Using it

| Input | Does |
| --- | --- |
| ~ | become the hand (on solid ground), and back |
| Hold left button | use the selected God Art |
| Hold right button | open the art wheel |
| 1 to 5 | choose an art directly |
| Q, E | turn the view an eighth of a turn |
| Mouse wheel | zoom (8 to 46 m) |
| W A S D, or the screen's edges | pan |
| N | send a survey pulse (charts nearby ground; costs 12 Lachryma, 3 real seconds between) |

The hand reaches **36 m** from the jar. A dome around the jar shows the edge, and a click past it does nothing. Ceilings are cut away
so you can see in.

## The God Arts

Telekinesis is yours from the start. The others are earned: each by an achievement, with a variant that asks more (see the Codex,
GOD ARTS). Every art spends Lachryma.

| Key | Art | Does | Cost | Learned by |
| --- | --- | --- | --- | --- |
| 1 | Telekinesis | lift anything loose and throw it as fast as the hand was moving | 3 a real second held, plus 0.12 a kg | from the start |
| 2 | Sunder | drag a blade across the floor: everything above the line is cut in two along that plane (12 m long, 3.2 m high) | 8, plus 2 per extra thing | 8 pots sliced |
| 3 | Swell | drag up or down on a pot or crate to grow or shrink it (0.4 to 2.6 times); its weight follows | 4 to start, 5 a real second | 10 things thrown by the hand |
| 4 | Wring | twist a pot about its axis, or scallop its walls. It stays the same clay | 6 to start, 6 a real second | 2 places mapped |
| 5 | Manifest | press, drag for length, hold for height: a wall of clay rises (up to 9 m long, 4 m high, 40 real seconds) | 8, plus 0.6 per unit of volume | 4 places mapped and 10 surveys |

Variants: Heavy Hand (cheaper holds, harder throws), Guillotine (longer, taller blade), Colossus (swell to 4 times), Wringer,
Bastion (6 m high, 14 m long, stands 90 real seconds).

## Where it works

The arts work only on ground you have explored (the **Zone of Influence**), shown by a veil on the floor. Around the jar the ground
is always known. Outside it, the art does not answer and the cursor ring shows it.

## The jar can be hurt

Raiders, a lobber's ball, a blast or something you throw can crack the jar. It has 100 health. At zero it shatters, and it is
reforged 7 real seconds later with its old cracks as gold seams.

| Blow to the jar | Damage |
| --- | --- |
| A raider's clap | 7 |
| A lobber's ball | 14 |
| A blast | 22 |
| Something thrown | 4 |

## Raids

**Raids** are waves of crimson clapperjars that run for the jar. They happen in one room only, **the siege** in the basement, so you can
learn the hand in peace elsewhere. The first wave comes after 22 real seconds, then one every 34 real seconds, each larger than the
last. Throw raiders away, cut them, pin them, make them dance (Solace), or turn them into guards that mend the jar.

## Catching a Figment

You can bind a stunned Figment into your Pneuka Jar with Telekinesis.

1. Stun a Figment (see [The tools](tools.md): the Veritome's Flash).
2. Grab it with Telekinesis and hold it over the jar's mouth.
3. It **struggles**, tugging the hand off the mouth. The struggle lasts 1 real second per class of the Figment, plus 1 (a class 0 takes
   1 second, a class 4 takes 5).
4. Hold it there to the end: it is drawn in and **bound**, certain.
5. Let go, or let its stun run out, and it is free where it falls.

The jar stands still the whole time, and anything fighting round it can crack it. Bound Figments wait for the Spirit Garden.

## For the divisions

- The hand, its camera and input: `src/godhand/godhand.js`; the arts: `src/godhand/arts.js`; the jar: `src/godhand/jar.js`
- The catch: `src/godhand/catch.js`
- Numbers: `god` and `arts` in `src/core/config.js`; art goals and variants: `GOD_ARTS` in `src/progress/skills.js`
- Not verified: the ground a Wring or Manifest needs (the skills blurb says "understood" ground, but `arts.js` gives all five arts `needs: 1`); the siege being the only room with raids (taken from the glossary)
