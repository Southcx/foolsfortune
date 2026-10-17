# Neuralese, the language

Espada's, 2026-10-17, for the owner to rule. The owner: "we can expand neuralese as an actual language, -- Toki Pona comes to mind for
reference." The words the game already speaks stay as they are (`src/npc/neuralese.js`). This document grows them into a language.

- **The roots** are kept in `src/npc/neuraleseroots.js`: 124 roots and 7 particles, each with its senses and where it comes from. That
  file is the source of truth; this document gives the rules.
- **The spelling** is `src/npc/neuralesespelling.js`. It breaks any word into the cells its glyphs draw.
- **The script**, both hands, is in LORE.md, "The neuralese script".

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

- **Consonants:** p f v m (lips); t d s z sh th n l r (tongue tip); k g h (back of the mouth).
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
    - The number roots are UNA (one), DUO (two), PENTA (five), MULTA (many), OMNI (all) and VOYD (none). They are modifiers.
    - Other numbers are sums, read left to right: PENTA-DUO is seven. EMO-PENTA-DUO is the seven feelings.
12. **A name from outside** is written as it sounds, after a root that says what it names: HOMA-RAKU, the person Raku. A name the
    orthography cannot spell is bent until it can, as loanwords are.

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
- **Numbers:** UNA, DUO, PENTA, MULTA, OMNI.
- **Particles:** NI, TE, O, KE, SU, TA, VE.

### How the world says itself

These are worked compounds. All of them are proposals.

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

1. **The roots as a whole:** keep, cut or swap any of them. Toki Pona's own list changed over years.
2. **The copula:** a gap (as here), or a word (like Toki Pona's *li*).
3. **Whether the folk speak it:** the ancients wrote it on pots. Do any folk today say a line of it in the dialogue box, glossed by the
   Crib Sheet?
4. **How a player writes it:** with `/realmname` only, or anywhere a player can name a thing?
