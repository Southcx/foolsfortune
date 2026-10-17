// ---------------------------------------------------------------------------------------
// NEURALESE, THE ROOTS: the whole root lexicon of neuralese as a language (docs/NEURALESE.md; Espada's, ruled by the owner
// 2026-10-17). About a hundred and thirty roots and a handful of particles; meaning is built by putting roots together, head first, the
// modifiers after it (STIL-LON, a long stillness). The twenty-two words the game already speaks (npc/neuralese.js: the Functions, the
// ostraca, the stelae, the realms' names) are roots here with their glosses kept, and their senses widened.
//
// Prior art: Toki Pona (Sonja Lang, 2001: some 120 to 137 roots, each broad, compounds for the rest, li / e / la / pi as particles), the
// owner's reference; Esperanto's roots drawn from many tongues; Basic English (850 words). Taken from Toki Pona: few roots, broad
// senses, head-first phrases, a handful of particles, numbers by sums. Ours differs where the world asks: the copula is a gap (no li),
// a phrase is hyphenated (as a macro is spoken), and a root's sources are East and West both, as the running hand is.
//
//   ROOTS[WORD] = { gloss, sense, from }   (gloss: its first sense; sense: all it covers; from: where the word comes from)
//   PARTICLES[WORD] = { role, gloss }      FEELINGS[aspect] -> its root      COMPOUNDS[phrase] -> its English (worked examples)
// ---------------------------------------------------------------------------------------

// [word, senses (the first is its gloss), where it comes from]
const TABLE = [
  // the twenty-two the game already speaks (npc/neuralese.js), their glosses kept first
  ['STIL', 'still, stop, calm, motionless', 'English still'],
  ['EZA', 'ease, gentle, soft, comfortable', 'English ease'],
  ['HUSA', 'hush, quiet, silence, whisper', 'English hush'],
  ['MELU', 'melt, soften, dissolve, turn liquid', 'English melt'],
  ['SIVA', 'drink, sip, take in, liquid', 'English sip; Latin sorbere'],
  ['LUNO', 'rest, sleep, lie down', 'Latin luna: the moon, when things rest'],
  ['GRAV', 'forage, seek, search, dig', 'English grub, grave (to dig)'],
  ['PEXA', 'fish, catch from water', 'Latin piscis; Italian pesca'],
  ['KITH', 'huddle, together, with, among, a group', 'English kith'],
  ['ROMI', 'play, game, fun', 'English romp'],
  ['SHAI', 'flee, away, from, avoid', 'English shy'],
  ['HEMA', 'home, house, shelter, inside', 'Old English ham; German Heim'],
  ['MOR', 'mourn, grief, loss, death', 'Latin mors, death; English mourn'],
  ['FETA', 'fetch, bring, carry', 'English fetch'],
  ['TALO', 'follow, after, behind', 'English tail'],
  ['AMI', 'kin, friend, love, belong with', 'French ami; Latin amicus'],
  ['RIVA', 'rival, fight, against, compete', 'Latin rivalis: those who share a stream'],
  ['DIPSA', 'thirst, lack, need', 'Greek dipsa, thirst'],
  ['GULA', 'hunger, appetite, crave', 'Latin gula, the throat'],
  ['VOYD', 'forget, empty, nothing, not, zero', 'English void'],
  ['LON', 'long, far, lasting', 'English long'],
  ['DEO', 'deep, below, under, within', 'English deep'],

  // who
  ['IO', 'I, me, we', 'Italian io'],
  ['TU', 'you', 'Latin tu'],
  ['ONO', 'it, that, they, the one there', 'Japanese ano, sono: that'],
  ['HOMA', 'person, someone, people, the folk', 'Latin homo; Esperanto homo'],
  ['ATMA', 'self, soul, breath, the Vessoul', 'Sanskrit atman, breath and self'],
  ['PAIDA', 'child, young one, small one', 'Greek pais, paidos'],

  // the mind and the feelings
  ['NUSA', 'mind, thought, to think, an island', 'Greek nous, mind; Old Javanese nusa, island: a mind is an island'],
  ['EMO', 'feeling, emotion, mood', 'Latin emovere, to stir out; the Emocean'],
  ['MIRA', 'wonder, awe, marvel', 'Latin mirari, to wonder'],
  ['HILA', 'mirth, cheer, laughter', 'Latin hilaris'],
  ['POTHA', 'desire, longing, want', 'Greek pothos, longing'],
  ['FURA', 'fury, anger, rage', 'Latin furor'],
  ['FELA', 'gall, bitter, sour, disgust', 'Latin fel, gall'],
  ['PAVA', 'dread, fear, terror', 'Latin pavor, dread'],
  ['SHIRA', 'know, understand, learn', 'Japanese shiru, to know'],
  ['MAIA', 'illusion, dream, false, mirage', 'Sanskrit maya, illusion'],
  ['VERA', 'true, real, so', 'Latin verus; the Veritome'],

  // the body
  ['SOMA', 'body, vessel, flesh, shape of a creature', 'Greek soma'],
  ['KAPA', 'head, top, chief, leader', 'Latin caput'],
  ['KORA', 'heart, middle, centre', 'Latin cor; Japanese kokoro'],
  ['MANU', 'hand, hold, use, by means of', 'Latin manus (the King\'s name, Manus)'],
  ['VIDA', 'see, look, eye, sight', 'Latin videre'],
  ['KIKA', 'hear, listen, ear', 'Japanese kiku, to listen'],
  ['STOMA', 'mouth, opening, to speak aloud', 'Greek stoma'],
  ['PEDA', 'foot, leg, walk', 'Latin pes, pedis'],

  // the world
  ['LAKRI', 'tear, Lachryma', 'Latin lacrima'],
  ['MARI', 'sea, the Emocean, wide water', 'Latin mare, maria'],
  ['UDA', 'water', 'Sanskrit udan; Greek hydor'],
  ['REA', 'flow, stream, river, current', 'Greek rheo, to flow'],
  ['PLUVA', 'rain, fall from the sky', 'Latin pluvia'],
  ['TERA', 'ground, land, earth, floor', 'Latin terra'],
  ['KLAI', 'clay, to shape, pottery', 'English clay'],
  ['SUNA', 'sand, dust, grain, the Dunes', 'Japanese suna, sand'],
  ['LITHA', 'stone, hard, crystal', 'Greek lithos'],
  ['OROS', 'mountain, hill, high ground', 'Greek oros'],
  ['KAVA', 'hole, hollow, cave, a Well', 'Latin cavus, hollow'],
  ['PIRO', 'fire, heat, burn, the kiln\'s fire', 'Greek pyr'],
  ['HELI', 'sun, daytime', 'Greek helios'],
  ['SELE', 'moon', 'Greek selene'],
  ['NIKTA', 'night, dark hours', 'Greek nyx, nyktos'],
  ['ASTRA', 'star, above the sky, the Astral', 'Latin astrum; Greek astron'],
  ['SORA', 'sky, above, up, high', 'Japanese sora, sky'],
  ['VENTA', 'wind, air, weather, blow', 'Latin ventus'],
  ['HIKA', 'light, bright, shine', 'Japanese hikari'],
  ['SKOTA', 'dark, shadow, hidden, the Umbral', 'Greek skotos'],
  ['FRIGA', 'cold, frost, ice', 'Latin frigus'],
  ['FLORA', 'plant, flower, leaf', 'Latin flos, floris'],
  ['DENDRA', 'tree, wood', 'Greek dendron'],
  ['THERA', 'beast, animal, creature', 'Greek ther, a wild beast'],
  ['TORI', 'bird, flyer', 'Japanese tori'],
  ['ZOE', 'life, live, alive', 'Greek zoe'],

  // things people make
  ['KERA', 'pot, jar, vessel, container, the Pneuka Jar', 'Greek keramos, pottery'],
  ['INKA', 'seal, stamp, signature', 'Japanese inkan, a seal'],
  ['NOMA', 'name, call by name', 'Latin nomen'],
  ['LOGA', 'word, speech, language, say', 'Greek logos'],
  ['SEMA', 'sign, symbol, glyph, meaning', 'Greek sema, a sign'],
  ['GRAFA', 'write, draw, paint, mark, picture', 'Greek graphein'],
  ['TOMA', 'book, page, record', 'English tome; Greek tomos, a cut'],
  ['KANTA', 'song, music, sing', 'Latin cantare'],
  ['IRIS', 'colour, hue, rainbow', 'Greek iris'],
  ['HODA', 'path, way, road, method', 'Greek hodos'],
  ['PORTA', 'door, gate, threshold', 'Latin porta'],
  ['MURA', 'wall, barrier, edge', 'Latin murus'],
  ['NAVA', 'boat, ship, sail', 'Latin navis'],
  ['TEKNA', 'make, build, craft, tool, machine', 'Greek techne'],
  ['SEKA', 'cut, blade, sword', 'Latin secare'],
  ['RESA', 'thing, object, stuff', 'Latin res'],
  ['MONA', 'money, a cube, price, worth', 'Latin moneta'],
  ['FORMA', 'shape, form, outline', 'Latin forma'],
  ['TOPA', 'place, where; at, in', 'Greek topos'],
  ['KRONA', 'time, when, a while', 'Greek chronos'],

  // what is done
  ['VADA', 'go, move; to, toward, for', 'Latin vadere'],
  ['VENA', 'come, arrive, return', 'Latin venire'],
  ['EDA', 'eat, food', 'Latin edere'],
  ['DONA', 'give, gift, offer', 'Latin donare'],
  ['PRENA', 'take, grab, catch', 'French prendre'],
  ['TENA', 'have, hold, keep', 'Latin tenere'],
  ['PATA', 'open, begin to show', 'Latin patere, to lie open'],
  ['KLUZA', 'close, shut, end', 'Latin clausus'],
  ['KRAKA', 'break, crack, shatter', 'English crack'],
  ['MENDA', 'mend, heal, make whole', 'English mend'],
  ['META', 'change, become, turn into', 'Greek meta'],
  ['KRESA', 'grow, rise, increase', 'Latin crescere'],
  ['AIDA', 'help, aid', 'English aid'],
  ['PONO', 'work, effort, task', 'Greek ponos, toil'],
  ['ARKA', 'begin, first, origin, cause', 'Greek arche'],

  // how a thing is
  ['KALO', 'good, fine, beautiful, well', 'Greek kalos'],
  ['MALA', 'bad, wrong, harmful', 'Latin malus'],
  ['MEGA', 'big, great, important', 'Greek megas'],
  ['MIKRA', 'small, little, few', 'Greek mikros'],
  ['NEA', 'new, fresh, young', 'Greek neos'],
  ['PALA', 'old, ancient, before', 'Greek palaios'],
  ['FORTA', 'strong, power, hard to move', 'Latin fortis'],
  ['TAKA', 'fast, quick', 'Greek tachys'],
  ['OMO', 'same, alike, like, as', 'Greek homos'],
  ['ALI', 'other, different, else', 'Latin alius'],
  ['SI', 'yes, so, agreed', 'Latin sic; Italian si'],

  // how many (numbers are sums: PENTA-DUO is seven)
  ['UNA', 'one, alone, a single', 'Latin una'],
  ['DUO', 'two, a pair', 'Latin duo'],
  ['PENTA', 'five, a hand of', 'Greek pente'],
  ['MULTA', 'many, much, a lot', 'Latin multus'],
  ['OMNI', 'all, every, whole', 'Latin omnis'],
];

export const ROOTS = Object.fromEntries(TABLE.map(([word, sense, from]) => [word, { gloss: sense.split(',')[0].trim(), sense, from }]));

// the particles: grammar's own words, short, never a root's sense (docs/NEURALESE.md, "The grammar")
export const PARTICLES = {
  NI: { role: 'object', gloss: 'marks what the deed is done to: IO SIVA NI UDA, I drink water' },
  TE: { role: 'context', gloss: 'ends a setting: NIKTA TE, IO LUNO, at night, I rest' },
  O: { role: 'address', gloss: 'before a deed, a command (O SIVA, drink); after a name, a call (AMI O, kin)' },
  KE: { role: 'question', gloss: 'stands where the unknown would: TU KE? what are you?' },
  SU: { role: 'regroup', gloss: 'of: the modifiers after it modify as one, HEMA-SU-HOMA-MEGA, the home of the great one' },
  TA: { role: 'and', gloss: 'joins two who do, or two that are done to: IO TA TU KITH, you and I, together' },
  VE: { role: 'or', gloss: 'between two choices; a yes-or-no question is SIVA VE SIVA-VOYD?' },
};

// the seven feelings, most positive to most negative (progress/weather.js's DISPLAY_ORDER)
export const FEELINGS = { wonder: 'MIRA', mirth: 'HILA', desire: 'POTHA', fury: 'FURA', gall: 'FELA', grief: 'MOR', dread: 'PAVA' };

// worked compounds: how the world's things are said with roots alone (ruled with the rest)
export const COMPOUNDS = {
  'LOGA-NUSA': 'neuralese, as it calls itself: mind-speech',
  'MARI-EMO': 'the Emocean: the sea of feeling',
  'NUSA-ATMA': 'an Island of Ego: an island of self (NUSA alone is mind and island both)',
  'LITHA-LAKRI': 'Lachrymite: tear-stone',
  'LAKRI-EMO-VOYD': 'crude: Lachryma with no feeling',
  'THERA-NUSA': 'a Figment: a beast of the mind',
  'THERA-MARI': 'an Egregore: a beast of the sea',
  'KERA-ATMA': 'the Pneuka Jar: the jar of breath',
  'HOMA-VADA': 'the Courier: the one who goes',
  'HEMA-MENDA': 'a Shrine: the house of mending',
  'HEMA-PIRO': 'a kiln: the fire-house',
  'TOPA-KERA': 'a cradle: the jar\'s place',
  'INKA-NOMA': 'your seal: the name-seal',
  'TOMA-VERA': 'the Veritome: the true book',
  'KLUZA-KORA': 'the Lockheart: the shut heart',
  'AMI-OMO': 'a sibling: kin alike',
  'EMO-PENTA-DUO': 'the seven feelings',
};

export const isRoot = (word) => Object.hasOwn(ROOTS, String(word).toUpperCase());
export const isParticle = (word) => Object.hasOwn(PARTICLES, String(word).toUpperCase());
