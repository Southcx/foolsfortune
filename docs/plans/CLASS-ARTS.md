# CLASS ARTS: two new arts a class (Dovina, 2026-10-29)

**Asked:** South, 2026-10-29: "We need new arts for the classes." CLASSES.md 6.3 had ruled the shape (the owner, 2026-10-24: "having a
class accentuates the abilities you can use, but doesn't preclude you from using them"): a class has two arts, opened while you read as
it, kept in every class after, accented in its own. The data is `src/progress/classarts.js` (`CLASS_ARTS`, 76 rows); the log's lines
are `feedback/tracking/classarts.js`; `/art` lists and wears them.

## 1. The rules

- **Two kinds, one of each a class** (Final Fantasy Tactics' action set and reaction):
  - an **action**: a new verb on one key, the input action `art` (Petra's to bind; on touch, the near shelf's first tile, MOBILE.md 4.1),
    paid from the pool, with a cooldown;
  - a **reaction**: it fires itself when its moment comes (a parry, an empty pool, a shatter).
- **Opened by playing as the class** (arts only by achievement; DESIGN.md 22), whichever way comes first:
  - **the count way:** real time played while you read as it: **45 real minutes** for its action, **90** for its reaction
    (`class.<id>.secs` in the ledger);
  - **the feat way:** its feat, done n times while you read as it (`class.<id>.<feat>`; the feats are the art's own theme: Onrush opens
    on downs, Water Walk on paint laid, Scout on photographs). A sharp player who reads the card opens it in a session; anyone opens it in time.
- **Kept in every class.** Once open, an art is yours to wear whatever you read as. **One action and one reaction are worn** at a time
  (`game.classArts.worn`; the first opened fills an empty slot; `/art <id>` wears another; the Pneuka Box's loadout page is next).
- **Accented in its own class:** while you read as the art's class, its sizes grow x1.25 (reach, duration, power), a multiplier's bonus
  x1.25 (a 1.3 becomes 1.375), and its cost x0.8. The class on the board is the source you can see.
- **Never a base change:** every art is a new verb or a modifier built from parts the game has (statuses, the pool, the Lachrymato
  Bottles, blink, signatures, decoys, the god hand's matter, Luck's re-roll, the weather). None touches the core movement; none is an
  assist (assists stay knacks).
- **Numbers are first numbers,** measured as each wave is built (against SUSTAINED 2.6 power a second for a damage art, ECON's aim for
  anything that pays).

## 2. What each suit and rank means (so the 76 cohere)

| | Page (study) | Knight (charge) | Queen (keep) | King (command) |
| --- | --- | --- | --- | --- |
| **Wands** (fire, will) | a spark, a first strike | a dash through them | heat that builds | a roar that breaks windups |
| **Cups** (water, feeling) | an offering that calms | walking on Lachryma | filling from the sky, reading agitation | stilling every mind near |
| **Swords** (air, mind) | scouting, learning faster | the riposte | seeing every windup | a verdict on one foe |
| **Pentacles** (earth, matter) | prospecting, thrift | the brace | the harvest, the hearth | a wall of ground, the dividend |

The zodiac Majors take their card's meaning (the Emperor rams, Strength tames, Death reaps, the Star wishes on the sky), the World
completes, and the other eight wait on their read (CLASSES.md 3) with their arts already written.

## 3. The 76

### The Fool

| class | action | reaction |
| --- | --- | --- |
| the Fool | **Beginner's Luck** (beginnersLuck): Your next roll of chance within 30 s is thrown twice, and the better throw is kept. Cost 10. Cooldown 60 s. Feat: flees made good x3. | **Running on Empty** (zero): When your pool runs dry, your blows and shots cost nothing for 4 s. Cooldown 45 s. Feat: creatures downed x25. |

### Wands (will)

| class | action | reaction |
| --- | --- | --- |
| the Page of Wands | **Spark** (spark): Flick an ember up to 14 m: it staggers what it hits and burns away any slick or blot it lands on. Cost 6. Cooldown 8 s. Feat: blots and slicks washed x10. | **First Strike** (eager): Your first blow of a fight deals x1.5 damage. Feat: big creatures downed x10. |
| the Knight of Wands | **Onrush** (charge): Dash 8 m forward, striking everything in your path. Cost 8. Cooldown 6 s. Feat: creatures downed x40. | **Momentum** (momentum): Sprint for 3 s and your next blow deals x1.3 damage. Feat: trick combos banked at x4 x5. |
| the Queen of Wands | **Stoke** (kindleHeart): For 6 s your blows build statuses x1.5 faster and your pool fills x1.5 faster. Cost 15. Cooldown 30 s. Feat: creatures stunned deep x10. | **Afterglow** (warmth): A feeling you drink stays in you twice as long. Feat: feelings awakened to x1. |
| the King of Wands | **Roar** (command): Stagger every creature within 8 m and break off its windup. Cost 20. Cooldown 40 s. Feat: blows parried x30. | **Rally** (rally): Each creature you down gives you back 5 of your pool. Feat: creatures downed x60. |

### Cups (feeling)

| class | action | reaction |
| --- | --- | --- |
| the Page of Cups | **Offering** (offering): Set down a cup of 10 of your pool: creatures within 6 m drink from it and are calmed for 4 s. Cooldown 30 s. Feat: fish let go x5. | **Kindness** (tender): Letting a fish go, or granting a spirit's wish, mends 1 crack. Feat: spirits' wishes granted x3. |
| the Knight of Cups | **Water Walk** (wade): For 5 s you walk on liquid Lachryma, and run x1.2 faster through paint. Cost 8. Cooldown 20 s. Feat: patches of paint laid x10. | **Gallant** (gallant): A parry gives you back 4 of your pool. Feat: blows parried x20. |
| the Queen of Cups | **Catch the Rain** (wellUp): Under falling weather, fill 30% of a Lachrymato Bottle from the sky. Cooldown 60 s. Feat: fish caught x15. | **Empath** (empath): You see a creature's agitation at once, and drain x1.25 more from it in its best band. Feat: drains x15. |
| the King of Cups | **Still Waters** (stillWaters): Every creature within 6 m settles: its mind to Balanced, its agitation to its best band. Cost 20. Cooldown 45 s. Feat: clean reprogrammings x3. | **Steady** (steady): While your pool is over half full, your cracks mend twice as fast. Feat: spirits bound x3. |

### Swords (mind)

| class | action | reaction |
| --- | --- | --- |
| the Page of Swords | **Scout** (scout): For 6 s, every creature and source of Lachryma within 40 m is tagged through walls. Cost 8. Cooldown 20 s. Feat: great photographs x5. | **Quick Study** (quickStudy): You learn a kind of creature twice as fast. Feat: windups read x20. |
| the Knight of Swords | **Riposte Rush** (ripostRush): Within 1 s of a parry, blink behind the attacker and strike it hard. Cost 6. Cooldown 4 s. Feat: blows parried x25. | **Edge** (edge): A blow to a weak point builds its status x1.5 faster. Feat: creatures downed by a blow they are weak to x15. |
| the Queen of Swords | **Clear Sight** (clearSight): For 8 s, every windup shows its Figment telegraph in full. Cost 10. Cooldown 30 s. Feat: windups read x40. | **Cut Through** (cutThrough): A status that is resisted does not make the creature harder to affect. Feat: creatures stunned deep x10. |
| the King of Swords | **Mark for Death** (verdict): Mark a creature for 8 s: your blows on it deal x1.3 damage and it cannot resist them. Cost 15. Cooldown 35 s. Feat: creatures downed by a blow they are weak to x30. | **Judge** (judge): A kind of creature you have photographed takes x1.1 damage from you. Feat: great photographs x15. |

### Pentacles (matter)

| class | action | reaction |
| --- | --- | --- |
| the Page of Pentacles | **Prospect** (prospect): Ping the strongest Lachryma up to 30 m ahead of you, as the dowse does. Cost 5. Cooldown 10 s. Feat: crystals struck on the sweet spot x10. | **Thrift** (thrift): Your shells cost 10% less to fire. Feat: caster shells fired x30. |
| the Knight of Pentacles | **Bulwark** (bulwark): Brace for 3 s: blows deal 60% less damage, but you cannot move. Cost 10. Cooldown 20 s. Feat: blows parried x15. | **Steadfast** (steadfast): Stand still for 2 s and the next blow you take cracks nothing. Feat: crates salvaged x10. |
| the Queen of Pentacles | **Harvest** (harvest): Ripen one Spirit Garden bed at once, or strike 1 more cube from a crystal. Cooldown gameDay s. Feat: beds tended to bloom x10. | **Hearth** (hearth): Resting at a Shrine mends 1 crack too. Feat: spirits' wishes granted x5. |
| the King of Pentacles | **Earth Wall** (stronghold): Raise a wall of ground 4 m wide and 2.5 m high in front of you for 6 s. Cost 15. Cooldown 30 s. Feat: creations raised x5. | **Dividend** (dividend): The first of each thing in a game day pays 25% more. Feat: made tracks validated x2. |

### The zodiac Majors

| class | action | reaction |
| --- | --- | --- |
| the Emperor | **Ram** (ram): A wave of force ahead of you knocks everything within 10 m back 6 m. Cost 12. Cooldown 15 s. Feat: creatures downed x50. | **Unshaken** (dominion): Hold your ground through a windup and its blow cannot stagger you. Feat: blows parried x30. |
| Strength | **Tame** (tame): A creature stunned or out cold fights beside you for 15 s. Cost 20. Cooldown 60 s. Feat: creatures stunned deep x15. | **Courage** (courage): With your pool under a quarter, your blows deal x1.25 damage. Feat: creatures downed x40. |
| Temperance | **Blink Mark** (arrowOfTime): Throw a mark up to 18 m; press again within 1.5 s to blink to it. Cost 8. Cooldown 6 s. Feat: blinks x40. | **Spillover** (moderation): What your pool cannot hold tops up a Lachrymato Bottle instead. Feat: songs played at fever x5. |
| the Chariot | **Ride** (ride): Take the reins of a staggered creature for 8 s: it moves and fights as you steer. Cost 20. Cooldown 60 s. Feat: gold medals x3. | **Reins** (reins): The Solar Skiff and your ship take 30% less from a hit. Feat: crossings sailed x3. |
| Death | **Reap** (reap): A sweep that downs any creature within 3 m that is under 15% of its health. Cost 12. Cooldown 20 s. Feat: creatures downed x60. | **Rebirth** (rebirth): Once a game day, a blow that would shatter you leaves you whole instead. Feat: creatures downed by a blow they are weak to x25. |
| the Moon | **Vanish** (mirageStep): Leave a decoy of yourself and go unseen for 3 s. Cost 12. Cooldown 25 s. Feat: windups read x30. | **Tides** (tides): At night your pool fills x1.3 faster. Feat: fish caught x10. |
| Justice | **Payback** (weigh): The next blow you take within 4 s is dealt back in full to whoever struck it. Cost 12. Cooldown 25 s. Feat: blows parried x40. | **Grudge** (due): A creature that hurt you takes x1.3 damage from your next blow. Feat: creatures downed x40. |
| the Star | **Starlight** (wish): Under the open night sky, turn the weather where you stand toward Wonder for 1 game hour. Cost 30. Cooldown gameDay s. Feat: vantage points reached x3. | **Hope** (hope): Made whole after a shatter, you come back with half your pool. Feat: feelings awakened to x2. |
| the Lovers | **Encore** (echo): Your last tool move plays again from where you stood, 1 s later. Cost 10. Cooldown 15 s. Feat: lends x40. | **Choice** (choice): When you swap your main and sub, your next lend is free. Feat: lends x20. |
| the Devil | **Shackle** (bind): Chain a creature where it stands for 5 s; it cannot resist. Cost 15. Cooldown 30 s. Feat: creatures stunned deep x20. | **Excess** (temptation): While your pool overflows, your blows deal x1.2 damage. Feat: drains x20. |
| the Hierophant | **Sanctum** (sanctum): A circle 5 m across for 8 s: nothing outside may enter, and nothing done inside costs pool. Cost 20. Cooldown 60 s. Feat: glyphs drawn with two sigils or more x10. | **Teaching** (teaching): Practising a Movement Art counts x1.5 toward opening it. Feat: blinks x50. |
| the Hermit | **Lamp** (lantern): A lamp for 20 s that shows hidden things within 8 m and keeps Dread's fog off you. Cost 8. Cooldown 30 s. Feat: Wells charted x2. | **Solitude** (solitude): With no sibling or spirit within 12 m, everything costs 15% less. Feat: aberrants' secrets found x1. |

### The World

| class | action | reaction |
| --- | --- | --- |
| the World | **Completion** (completion): For 10 s every art you know costs nothing and cools down twice as fast. Cost 30. Cooldown 120 s. Feat: aberrants' secrets found x2. | **Wholeness** (wholeness): Your spread's four tallies each count 10% more. Feat: crossings sailed x5. |

### The other eight (their read not built)

| class | action | reaction |
| --- | --- | --- |
| the Magician | **Quick Swap** (sleight): Swap your next shell or move for any other the tool knows, without opening the Pneuka Box. Cost 5. Cooldown 10 s. Feat: caster shells fired x50. | **Will** (will): Celestial mode's sigils cost 30% less. Feat: glyphs drawn with two sigils or more x20. |
| the High Priestess | **Veil** (veil): A creature within 12 m loses track of you and forgets what it knew of you. Cost 10. Cooldown 20 s. Feat: windups read x30. | **Intuition** (intuition): An aberrant's secret shows you where it begins. Feat: aberrants' secrets found x1. |
| the Empress | **Overgrowth** (bloom): A thicket grows within 6 m for 10 s, blocking creatures and slowing them by half. Cost 15. Cooldown 30 s. Feat: beds tended to bloom x15. | **Abundance** (abundance): Your Spirit Garden beds each yield 1 more. Feat: spirits' wishes granted x5. |
| the Wheel of Fortune | **Spin** (spin): Luck's re-roll is yours again, now. Cooldown gameDay s. Feat: flees made good x3. | **Fortune** (fortune): Luck grows x1.25 faster from the unlikely things you live through. Feat: gold medals x3. |
| the Tower | **Collapse** (collapse): Bring the ground down within 4 m, stunning everything under it. Cost 18. Cooldown 30 s. Feat: creatures stunned deep x20. | **Upheaval** (upheaval): A guard you break stays broken twice as long. Feat: blows parried x30. |
| the Sun | **Daybreak** (daybreak): A flash of daylight blinds what is within 10 m and lights the dark for 1 game hour. Cost 12. Cooldown 30 s. Feat: great photographs x10. | **Radiance** (radiance): Your photographs score 20% higher. Feat: great photographs x25. |
| the Hanged Man | **Hang Time** (suspend): Hang in the air for 3 s while time round you slows by half. Cost 10. Cooldown 20 s. Feat: big grapple swings x20. | **Surrender** (surrender): A blow taken while you guard gives back the pool it cost. Feat: blows parried x30. |
| Judgement | **Settle the Score** (reckoning): Every creature within 12 m that hurt you takes back 30% of all it dealt you, at once. Cost 25. Cooldown 60 s. Feat: creatures downed x80. | **Second Chance** (secondChance): Once a game day, a failed flee or a lost duel may be tried again. Feat: puzzle duels won x10. |

## 4. Waves (four classes a wave, CLASSES.md 6; each measured before the next)

1. **The Fool and the four Knights** (10 arts): the Fool is everyone's start, and a one-card spread reads a Knight most often (CLASSES.md 2).
2. The four Pages and the four Queens.
3. The four Kings, the World, and the fire signs (the Emperor, Strength, Temperance).
4. The water, air and earth signs.
5. The other eight, once their read is built.

## 5. Who builds what

| who | what |
| --- | --- |
| Dovina | the rules and numbers (`classarts.js`), the opening, the slots, the accent, the log; each wave measured |
| Petra | the input action `art`; each wave's actions and reactions in play, reading `game.classArts.numbers(slot)` (its numbers already accented); the Box's page for wearing |
| Calissa | each art's look; the art tile (the near shelf's first on touch) |
| Wanda | each art's sound |
| Espada | done (2026-10-29): the 76 labels and lines, the log's lines and the feat words (`FEAT_WORDS`); the lore names once South calls the arts finished |
