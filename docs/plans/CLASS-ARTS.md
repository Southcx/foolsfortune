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
  - **the feat way:** its feat, done n times while you read as it (`class.<id>.<feat>`; the feats are the art's own theme: Charge opens
    on downs, Wade on paint laid, Scout on photographs). A sharp player who reads the card opens it in a session; anyone opens it in time.
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
| the Fool | **Beginner's Luck** (beginnersLuck): Your next roll of chance is thrown twice, the better kept. Cost 10. Cooldown 60 s. Feat: flee x3. | **Zero** (zero): When your pool runs dry, your next blows and shots cost nothing for a moment. Cooldown 45 s. Feat: down x25. |

### Wands (will)

| class | action | reaction |
| --- | --- | --- |
| the Page of Wands | **Spark** (spark): Flick an ember: it lights a slick or blot it lands on, burning it away, and staggers. Cost 6. Cooldown 8 s. Feat: mop x10. | **Eager** (eager): Your first blow of a fight lands harder. Feat: firstBlood x10. |
| the Knight of Wands | **Charge** (charge): Dash forward, striking all in your path. Cost 8. Cooldown 6 s. Feat: down x40. | **Momentum** (momentum): Sprint for a few seconds and your next blow lands harder. Feat: combo x5. |
| the Queen of Wands | **Kindle Heart** (kindleHeart): For a while your blows build statuses faster and your pool fills faster. Cost 15. Cooldown 30 s. Feat: stunDeep x10. | **Warmth** (warmth): A feeling you drink stays in you twice as long. Feat: awaken x1. |
| the King of Wands | **Command** (command): A roar: every creature near you is staggered and its windup broken. Cost 20. Cooldown 40 s. Feat: parry x30. | **Rally** (rally): A creature downed gives you back some of your pool. Feat: down x60. |

### Cups (feeling)

| class | action | reaction |
| --- | --- | --- |
| the Page of Cups | **Offering** (offering): Set down a cup of your pool: creatures near it drink and are calmed. Cooldown 30 s. Feat: release x5. | **Tender** (tender): A fish let go or a spirit's wish granted mends one crack. Feat: wish x3. |
| the Knight of Cups | **Wade** (wade): For a while you walk on liquid Lachryma and run faster through paint. Cost 8. Cooldown 20 s. Feat: paint x10. | **Gallant** (gallant): A parry gives you back some of your pool. Feat: parry x20. |
| the Queen of Cups | **Well Up** (wellUp): Under falling weather, fill a Lachrymato Bottle from the sky. Cooldown 60 s. Feat: fish x15. | **Empath** (empath): You read a creature's agitation at once, and drain more in its best band. Feat: drain x15. |
| the King of Cups | **Still Waters** (stillWaters): Every creature near you settles to Balanced, its agitation to its best band. Cost 20. Cooldown 45 s. Feat: reprogram x3. | **Steady** (steady): While your pool is over half, your cracks mend twice as fast. Feat: bind x3. |

### Swords (mind)

| class | action | reaction |
| --- | --- | --- |
| the Page of Swords | **Scout** (scout): Every signature and creature near you is tagged through walls for a while. Cost 8. Cooldown 20 s. Feat: photo x5. | **Quick Study** (quickStudy): You come to know a kind of creature twice as fast. Feat: windup x20. |
| the Knight of Swords | **Riposte Rush** (ripostRush): Just after a parry, blink behind the attacker and strike. Cost 6. Cooldown 4 s. Feat: parry x25. | **Edge** (edge): A blow to a creature's weak point builds its status faster. Feat: downWeak x15. |
| the Queen of Swords | **Clear Sight** (clearSight): For a while every windup shows its Figment telegraph whole. Cost 10. Cooldown 30 s. Feat: windup x40. | **Cut Through** (cutThrough): A status that is resisted does not harden the mind that resisted it. Feat: stunDeep x10. |
| the King of Swords | **Verdict** (verdict): Mark a creature: for a while your blows on it land harder and it cannot resist them. Cost 15. Cooldown 35 s. Feat: downWeak x30. | **Judge** (judge): A kind you have photographed takes more from you. Feat: photo x15. |

### Pentacles (matter)

| class | action | reaction |
| --- | --- | --- |
| the Page of Pentacles | **Prospect** (prospect): Ping the strongest Lachryma in front of you, as the dowse does. Cost 5. Cooldown 10 s. Feat: sweet x10. | **Thrift** (thrift): Your shells cost less to fire. Feat: shell x30. |
| the Knight of Pentacles | **Bulwark** (bulwark): Brace where you stand: blows land far softer, but you cannot move. Cost 10. Cooldown 20 s. Feat: parry x15. | **Steadfast** (steadfast): Stand still a moment and the next blow you take cracks nothing. Feat: salvage x10. |
| the Queen of Pentacles | **Harvest** (harvest): Ripen a Spirit Garden bed at once, or strike one more cube from a crystal. Cooldown a game day. Feat: tend x10. | **Hearth** (hearth): Resting at a Shrine mends a crack too. Feat: wish x5. |
| the King of Pentacles | **Stronghold** (stronghold): Raise a wall of the ground in front of you, for cover. Cost 15. Cooldown 30 s. Feat: sculpt x5. | **Dividend** (dividend): Each game day's first of a thing pays a quarter more. Feat: build x2. |

### The zodiac Majors

| class | action | reaction |
| --- | --- | --- |
| the Emperor | **Ram** (ram): A wall of force ahead of you knocks everything back. Cost 12. Cooldown 15 s. Feat: down x50. | **Dominion** (dominion): Hold your ground through a windup and its blow cannot stagger you. Feat: parry x30. |
| Strength | **Tame** (tame): A creature stunned deep enough fights beside you for a while. Cost 20. Cooldown 60 s. Feat: stunDeep x15. | **Courage** (courage): With your pool under a quarter, your blows land harder. Feat: down x40. |
| Temperance | **Arrow of Time** (arrowOfTime): Throw a mark; press again soon after to blink to it. Cost 8. Cooldown 6 s. Feat: blink x40. | **Moderation** (moderation): What your pool cannot hold tops up a Lachrymato Bottle instead. Feat: song x5. |
| the Chariot | **Ride** (ride): Take the reins of a staggered creature: it moves and fights as you steer it. Cost 20. Cooldown 60 s. Feat: gold x3. | **Reins** (reins): The Solar Skiff and your ship take less from a hit. Feat: crossing x3. |
| Death | **Reap** (reap): A sweep that ends any creature near its end. Cost 12. Cooldown 20 s. Feat: down x60. | **Rebirth** (rebirth): Once a game day, a blow that would shatter you leaves you whole instead. Feat: downWeak x25. |
| the Moon | **Mirage Step** (mirageStep): Leave a decoy of yourself and go unseen for a moment. Cost 12. Cooldown 25 s. Feat: windup x30. | **Tides** (tides): At night your pool fills faster. Feat: fish x10. |
| Justice | **Weigh** (weigh): The next blow you take is returned in full to whoever dealt it. Cost 12. Cooldown 25 s. Feat: parry x40. | **Due** (due): A creature that hurt you takes more from your next blow. Feat: down x40. |
| the Star | **Wish** (wish): Under the open night sky, turn the weather where you stand toward Wonder for a game hour. Cost 30. Cooldown a game day. Feat: vantage x3. | **Hope** (hope): Made whole after a shatter, you come back with half your pool. Feat: awaken x2. |
| the Lovers | **Echo** (echo): Your last tool move repeats from where you stood a moment later. Cost 10. Cooldown 15 s. Feat: lend x40. | **Choice** (choice): Swap your main and sub, and your next lend is free. Feat: lend x20. |
| the Devil | **Bind** (bind): Chain a creature where it stands; it cannot resist. Cost 15. Cooldown 30 s. Feat: stunDeep x20. | **Temptation** (temptation): While your pool overflows, your blows land harder. Feat: drain x20. |
| the Hierophant | **Sanctum** (sanctum): A warded circle: nothing outside may enter, and blows inside cost no pool. Cost 20. Cooldown 60 s. Feat: glyph x10. | **Teaching** (teaching): The Movement Arts' count way counts more for you. Feat: blink x50. |
| the Hermit | **Lantern** (lantern): A lamp that reveals hidden things and keeps Dread's fog off you. Cost 8. Cooldown 30 s. Feat: charted x2. | **Solitude** (solitude): With no sibling or spirit near you, everything costs less. Feat: secret x1. |

### The World

| class | action | reaction |
| --- | --- | --- |
| the World | **Completion** (completion): For a while every art you know cools twice as fast and costs nothing. Cost 30. Cooldown 120 s. Feat: secret x2. | **Wholeness** (wholeness): Your spread's four tallies all count a little more. Feat: crossing x5. |

### The other eight (their read not built)

| class | action | reaction |
| --- | --- | --- |
| the Magician | **Sleight** (sleight): Swap your next shell or move for any other the tool knows, without the Box. Cost 5. Cooldown 10 s. Feat: shell x50. | **Will** (will): Celestial mode's sigils cost less. Feat: glyph x20. |
| the High Priestess | **Veil** (veil): A creature forgets you: it loses you and what it knew of you. Cost 10. Cooldown 20 s. Feat: windup x30. | **Intuition** (intuition): An aberrant's secret shows you where it begins. Feat: secret x1. |
| the Empress | **Bloom** (bloom): A thicket grows from the ground, blocking and slowing creatures. Cost 15. Cooldown 30 s. Feat: tend x15. | **Abundance** (abundance): Your Spirit Garden beds yield one more. Feat: wish x5. |
| the Wheel of Fortune | **Spin** (spin): Luck's re-roll is yours again, now. Cooldown a game day. Feat: flee x3. | **Fortune** (fortune): Luck grows faster from the unlikely things you live through. Feat: gold x3. |
| the Tower | **Collapse** (collapse): Bring the ground down on everything in an area, stunning it. Cost 18. Cooldown 30 s. Feat: stunDeep x20. | **Upheaval** (upheaval): A guard you break stays broken twice as long. Feat: parry x30. |
| the Sun | **Daybreak** (daybreak): A flash of daylight blinds what is near and lights the dark for a game hour. Cost 12. Cooldown 30 s. Feat: photo x10. | **Radiance** (radiance): Your photographs score higher. Feat: photo x25. |
| the Hanged Man | **Suspend** (suspend): Hang in the air a moment while time slows round you. Cost 10. Cooldown 20 s. Feat: swing x20. | **Surrender** (surrender): A blow taken while guarding gives back its pool. Feat: parry x30. |
| Judgement | **Reckoning** (reckoning): Every creature you have hurt nearby takes a share of all it has taken from you, at once. Cost 25. Cooldown 60 s. Feat: down x80. | **Second Chance** (secondChance): Once a game day, a failed flee or a lost duel may be tried again. Feat: duelWin x10. |

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
| Espada | the 76 labels and lines (placeholders now), and the log's line on learning one |
