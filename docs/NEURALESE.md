# Neuralese, the language

Espada's, 2026-10-17; **ruled by the owner, 2026-10-17** (the roots, the particles, the compounds and the grammar). The owner: "we can expand neuralese as an actual language, -- Toki Pona comes to mind for
reference." The words the game already speaks stay as they are (`src/npc/neuralese.js`). This document grows them into a language.

- **The roots** are kept in `src/npc/neuraleseroots.js`: 127 roots and 8 particles, each with its senses and where it comes from. That
  file is the source of truth; this document gives the rules.
- **The spelling** is `src/npc/neuralesespelling.js`. It breaks any word into the cells its glyphs draw.
- **The script**, both hands, is in LORE.md, "The neuralese script".
- **The lessons** (in-house, for learning it): https://claude.ai/artifact/XisQctUfyVe4wv1VfvGdvE, eleven lessons, the dictionary, a
  workbench and flashcards in the running hand. Built from these very files by `docs/neuralese/build-lessons.mjs` (its template
  `docs/neuralese/lessons.html`), so rebuild and republish it whenever a root or rule changes.

Neuralese calls itself **LOGA-NUSA**, mind-speech. NUSA means "mind", and it also means "island" (Greek *nous*, mind; Old Javanese
*nusa*, island). In neuralese, an Island of Ego and a mind are said with the same word.

## 0. Why it is shaped like this

- **Prior art.** Toki Pona (Sonja Lang, 2001) shows that about 120 broad roots can say nearly anything when they are combined. *jan
  pona* is "good person": a friend. Neuralese takes four things from it:
  - few roots;
  - wide senses;
  - the head before its modifiers;
  - a handful of particles.
- **Where neuralese differs, and why.**
  - It is the language minds are told what to do in. A macro is a deed said as one hyphenated phrase (STIL-LON), so the hyphen is the
    phrase's mark.
  - The copula is a gap between phrases, not a word: HEMA LON is "home is long".
  - The roots come from East and West both, as the running hand does: Greek, Latin, Sanskrit, Japanese, English.
- **What it teaches.** The game does not explain any of this. It only pairs words with what they do: the Crib Sheet, the ostraca, the
  stelae, the realm names. A player who reads enough learns compounding, as Toki Pona's speakers do. They also learn which root came from
  which tongue, and that teaches a little of where English words come from.

## 1. Sounds and spelling

- **Consonants:** p b f v m (lips; b added 2026-10-23, the voiced stop beside d and g); t d s z sh th n l r (tongue tip); k g h (back of the mouth).
- **Vowels:** a e i o u.
- **Diphthongs:** AI and OY.
- **Spellings:** sh and th are one sound each. X is written k·s.
- **Syllables:** a syllable is (C)(C)V(C).
  - Two consonants may open a syllable: a stop or fricative followed by l or r (GR, KL, PL), or s followed by a stop (ST, SK).
  - One consonant may close a syllable.
- **Splitting a word into syllables:** the next syllable starts with the longest onset allowed (DIP·SA, AS·TRA, MI·KRA).
  `neuralesespelling.js` makes each cut. It refuses a word the rules cannot spell, so a new root is checked where it is written.
- **Stress:** each root is stressed on its first syllable. A hyphenated phrase is said as one breath.

## 2. The grammar

Words never change form. There is no plural, no tense and no gender: context says, or a root does.

1. **A phrase is its head, then its modifiers, joined by hyphens.** STIL-LON is "a long stillness". KERA-ATMA is "a breath-jar": the
   Pneuka Jar. Each modifier changes everything before it.
   - Any root can be a thing, a deed or a quality, depending only on where it stands.
   - In the running hand, a modifier hangs half a row below its head, as it does in the Comb.
2. **A sentence is two phrases side by side: who, then what.**
   - HEMA LON: home is long.
   - IO SIVA: I drink.
   - HOMA-VADA KERA-ATMA: the Courier is the Pneuka Jar.
   - A space always separates phrases. A hyphen always joins a phrase.
3. **NI marks what the deed is done to.** IO SIVA NI UDA: I drink water.
4. **A setting ends with TE.** NIKTA TE, IO LUNO: at night, I rest. A one-word setting may drop its TE, as the old inscriptions do:
   DIPSA SIVA, "thirst: drink" (the sealed room's stele). The stele's terseness is its poetry, so both readings stand.
5. **A command is a deed alone, or O and a deed.** SIVA. O SIVA. A macro is a command (STIL-LON). **A call** puts O after a name:
   AMI O, VENA, "kin, come".
6. **Prepositions are roots at the head of a phrase.** That phrase follows the deed:
   - TOPA, at or in: IO LUNO TOPA-HEMA, I rest at home.
   - VADA, to or for.
   - SHAI, from or away.
   - KITH, with or among: IO ROMI KITH-AMI, I play with kin.
   - MANU, by means of.
   - OMO, like or as.
7. **Not** is VOYD after what it denies, as a modifier: IO SIVA-VOYD, I do not drink. The root that means "to forget" also means "not".
8. **Questions.**
   - KE stands where the unknown would: TU KE?, what are you?
   - A yes-or-no question offers both: TU SIVA VE SIVA-VOYD?, do you drink?
   - **Yes** is SI. **No** is VOYD.
9. **TA joins two who do, or two things done to.** IO TA TU KITH: you and I, together. **VE** offers a choice.
10. **SU regroups.** HEMA-SU-HOMA-MEGA is "the home of the great one". Compare HEMA-HOMA-MEGA, "a great people-home".
11. **Numbers.**
    - The number roots are UNA (one), DUO (two), PENTA (five), DEKA (ten, 2026-10-23), MULTA (many), OMNI (all) and VOYD (none). They are modifiers.
    - Other numbers are sums, read left to right: PENTA-DUO is seven. EMO-PENTA-DUO is the seven feelings.
12. **A name from outside** is written as it sounds, after a root that says what it names: HOMA-RAKU, the person Raku. A name the
    orthography cannot spell is bent until it can, as loanwords are.

## 2a. More grammar (Espada's refinement, 2026-10-23)

The owner asked for the language enriched, to learn it. These fill the holes a new speaker falls into first. Three roots, one particle
and one letter are new; everything else is a rule the grammar already implied, now written down. The owner may veto any of it.

13. **Possession is a modifier.** A pronoun after a thing owns it: HEMA-IO, my home; KERA-TU, your jar. A longer owner takes SU:
    HEMA-SU-HOMA-RAKU, Raku's home.
14. **This and that.** KO is the near one (this, here, now), ONO the far one (that, there, it). KO KE?, what is this? RESA-KO, this thing.
15. **Wanting, being able, beginning.** A root of wanting or power heads its phrase, and the deed modifies it, as any modifier does:
    - IO POTHA-SIVA: I want to drink (I am a drinking want).
    - TU DUNA-VADA: you can go. DUNA is *dynamis*, power.
    - ONO ARKA-KANTA: it starts to sing. ONO KLUZA-KANTA: it stops singing.
    Nothing new: a head and its modifier. A Toki Pona speaker will see their preverbs; ours stay heads.
16. **When, if, because.** A setting (TE) is a when or an if; the speaker does not have to choose. PLUVA TE, IO LUNO TOPA-HEMA: when (if)
    it rains, I rest at home. **Because** is ARKA at the head of a phrase, a preposition like the others: IO LUNO ARKA-NIKTA, I rest
    because of the night.
17. **Time.** No tense; a setting says it when it matters. KRONA-PALA TE, before. KRONA-KO TE, now. KRONA-TALO TE, later.
18. **But** is SED, opening a sentence: IO SIVA. SED UDA VOYD. I drink. But there is no water. (Latin *sed*.) **And** between sentences
    is only the full stop.
19. **More and less** is said by contrast, Toki Pona's way: HEMA-IO MEGA. HEMA-TU MIKRA. My home is bigger than yours.
20. **Numbers past a hand.** DEKA is ten. Sums read biggest first: DEKA-PENTA-DUO, seventeen; DEKA-DEKA, twenty. `numberOf` spells any
    number; past fifty a speaker says MULTA, as a shepherd counts sheep only so far.
21. **Colours** are IRIS and the thing that wears the colour: IRIS-PIRO red, IRIS-HELI yellow, IRIS-FLORA green, IRIS-MARI blue,
    IRIS-KLAI brown, IRIS-HIKA white, IRIS-SKOTA black (`COLOURS`).
22. **Names from outside, bent** (rule 12, made exact; `bendName`): c becomes k (s before e, i, y); ch k before r or l, sh otherwise; j
    z; q and qu k; w v; x ks (z at the start); y i; ph f; gh, and an h after another consonant, dropped; doubled letters one. A cluster
    the syllable rules refuse is opened with **a**, the inherent vowel, which the running hand does not write, so the bent name still
    looks as close as the hand allows. Wanda is VANDA; Calissa KALISA; Christopher KRISTOFER; Strength SATRENATH.

## 2b. Numerals (South, 2026-10-29: "a representation of numbers as well")

The spoken numbers already count the Roman way: by adding, from a one (UNA, Roman I), a two, a hand (PENTA, Roman V, the open hand) and
two hands (DEKA, Roman X). So speech keeps its Roman soul and writing takes the Arabic power: **written numbers are positional, in base
ten, and each digit is drawn as its spoken sum**, so the marks are read in the order they are counted.

23. **The digits.** A digit is at most one bar and up to two pairs, plus a dot:
    - **a bar** is PENTA, five;
    - **a pair**, two dots joined by a short trace, is DUO, two;
    - **a lone dot** is UNA, one;
    - **an open ring**, a pad with nothing on it, is VOYD, zero.

    | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
    | ring | dot | pair | pair, dot | pair, pair | bar | bar, dot | bar, pair | bar, pair, dot | bar, pair, pair |
    | VOYD | UNA | DUO | DUO-UNA | DUO-DUO | PENTA | PENTA-UNA | PENTA-DUO | PENTA-DUO-UNA | PENTA-DUO-DUO |

    The bar sits nearest the line and the dots below it, as speech says the biggest first. Read a digit's marks top to bottom and you
    have said its number.
24. **A number** is its digits left to right, the biggest place first, as in Arabic numerals: one, two, eight is 128. Ten is a dot and a
    ring. Each digit hangs from the line on its own pin, as a chip's legs hang from its body, so no two digits run together.
    - In the running hand, a number is a modifier (rule 11), so it hangs on the modifier's lower bus under its head: EMO with 7 under it
      is the seven feelings. Alone (a count, a mark on a thing) it hangs from a bus of its own.
    - In the Comb, a digit fills one cell with a **doubled border**, so a digit is never read as a syllable: its bar the cell's waist, its
      pairs and dot below it on the lattice's points in the hand's order, zero a ring at the centre.
25. **Saying a written number.** To fifty, it is said as its sum, as the folk count: 17 is DEKA-PENTA-DUO. Past fifty the folk still
    say MULTA, but the System, which keeps every count, reads what it wrote digit by digit with a pause between, as a ledger is read
    aloud: 128 is "UNA, DUO, PENTA-DUO-UNA". (`numeralOf` and `saidOf`, `npc/neuralesespelling.js`.)

Prior art: the Maya's bar and dot (a bar five, a dot one, a shell for zero, by place), the Kaktovik numerals (drawn by Iñupiaq
schoolchildren in 1994 so that a digit's strokes show its value), Roman numerals' tally (I a finger, V the hand), and the zero and place
value that came west from India through the Arabic world. Considered and set aside: the Cistercian monks' numerals, one glyph up to
9999 on a stave; handsome on a seal, but they would teach a second counting nobody speaks.

### The phrasebook (`PHRASES`)

| neuralese | English | how it is built |
|---|---|---|
| VENA-KALO | hello, welcome | a good coming |
| VADA-KALO | goodbye | a good going |
| HELI-KALO / NIKTA-KALO | good day / good night | |
| TU KALO | thank you | you are good |
| IO KRAKA | sorry | I broke it: in a world of clay, an apology owns the break |
| NOMA-IO ESPADA | my name is Espada | my name: Espada |
| NOMA-TU KE? | what is your name? | |
| IO SHIRA / IO SHIRA-VOYD | I understand / I don't | |
| O LOGA-TAKA-VOYD | please speak slowly | speak, not fast |

## 3. The roots, by field

The full list, with senses and sources, is `neuraleseroots.js`.

- **Who:** IO, TU, ONO, HOMA, ATMA, PAIDA.
- **The mind and the feelings:** NUSA, EMO, SHIRA, MAIA, VERA.
  - The seven feelings, in display order: MIRA (Wonder), HILA (Mirth), POTHA (Desire), FURA (Fury), FELA (Gall), MOR (Grief),
    PAVA (Dread).
- **The body:** SOMA, KAPA, KORA, MANU, VIDA, KIKA, STOMA, PEDA.
- **The world:** LAKRI, MARI, UDA, REA, PLUVA, TERA, KLAI, SUNA, LITHA, OROS, KAVA, PIRO, HELI, SELE, NIKTA, ASTRA, SORA, VENTA,
  HIKA, SKOTA, FRIGA, FLORA, DENDRA, THERA, TORI, ZOE.
- **Things made:** KERA, INKA, NOMA, LOGA, SEMA, GRAFA, TOMA, KANTA, IRIS, HODA, PORTA, MURA, NAVA, TEKNA, SEKA, RESA, MONA, FORMA,
  TOPA, KRONA.
- **Deeds:** VADA, VENA, EDA, DONA, PRENA, TENA, PATA, KLUZA, KRAKA, MENDA, META, KRESA, AIDA, PONO, ARKA.
  - The old Functions also belong here: SIVA, LUNO, GRAV, PEXA, FETA, TALO, SHAI, ROMI, MELU.
- **Qualities:** KALO, MALA, MEGA, MIKRA, NEA, PALA, FORTA, TAKA, OMO, ALI, SI.
  - Also the old STIL, EZA, HUSA, LON and DEO.
- **Numbers:** UNA, DUO, PENTA, DEKA, MULTA, OMNI. Written, they are the numerals of 2b.
- **New, 2026-10-23:** KO (this, here, now), DUNA (can, able), DEKA (ten).
- **Particles:** NI, TE, O, KE, SU, TA, VE, SED.

### How the world says itself

These are worked compounds, ruled with the rest.

| neuralese | English | read |
|---|---|---|
| LOGA-NUSA | neuralese | mind-speech |
| MARI-EMO | the Emocean | the sea of feeling |
| NUSA-ATMA | an Island of Ego | an island of self |
| LITHA-LAKRI | Lachrymite | tear-stone |
| LAKRI-EMO-VOYD | crude | Lachryma with no feeling |
| THERA-NUSA / THERA-MARI | a Figment / an Egregore | a beast of the mind / of the sea |
| KERA-ATMA | the Pneuka Jar | the jar of breath |
| HOMA-VADA | the Courier | the one who goes |
| HEMA-MENDA | a Shrine | the house of mending |
| TOPA-KERA / INKA-NOMA | a cradle / your seal | the jar's place / the name-seal |
| TOMA-VERA | the Veritome | the true book (its own Latin roots, re-said) |
| KLUZA-KORA | the Lockheart | the shut heart |

### Sentences to read

- **IO SIVA NI UDA.** I drink water.
- **NIKTA TE, IO LUNO TOPA-HEMA.** At night, I rest at home.
- **NUSA MULTA TOPA-MARI-EMO.** Many islands (many minds) are in the Emocean. The double meaning is on purpose.
- **AMI O, VENA. IO TA TU KITH.** Kin, come. You and I, together.
- **TU SIVA VE SIVA-VOYD?** Do you drink?
- **The stelae, re-read:**
  - DIPSA SIVA. GULA GRAV. VOYD STIL. "Thirst: drink. Hunger: forage. To forget: be still."
  - AMI KITH. HEMA LON. MOR DEO. "Kin huddle. Home is long. Grief runs deep."

## 4. What changed in the game's words

- **The 22 words:** their glosses are kept, and their senses are wider. VOYD is now "not" as well as "forget". TALO is "after" as well
  as "follow". KITH is "with" as well as "huddle". SHAI is "from" as well as "flee".
- **Realm names:** these are read head first now. Four glosses changed to match, in `npc/realmnames.js` and LORE.md:
  - KITH-HEMA: a huddle at home;
  - HUSA-HEMA: the hush of home;
  - AMI-HEMA: kin at home;
  - MOR-LUNO: grief at rest.
- **The Crib Sheet, the ostraca and the stelae:** unchanged.

## 5. Open (for the owner)

The roots and the gap for "is" were ruled with the rest (2026-10-17). Still open:

1. **Whether the folk speak it:** the ancients wrote it on pots. Do any folk today say a line of it in the dialogue box, glossed by the
   Crib Sheet?
2. **How a player writes it:** with `/realmname` only, or anywhere a player can name a thing?
