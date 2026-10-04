// ---------------------------------------------------------------------------------------
// THE TALKS: what the clay folk say. Each talk is a set of nodes; a node is lines (each with its mood, the folk's feeling while it
// is said) and then choices (the Courier's words) or a next. A line's text is markup (npc/dialogue.js: {big}, {shake}, {p:0.4},
// {mood:fear}, {burst}...) or a function of the game, so a folk can know what the Courier has done (the ledger: pots broken,
// clapperjars sent back to the kiln, fish landed, cubes saved). `start` is the first meeting, `again` every one after.
//
// Who they are is docs/LORE.md: every folk is a fragment of Kaolin Anagami, the ego this island is, and knows it. The finer the pot,
// the bigger its share of him (and the finer its shape), and the tier sets how it speaks of the Prince of Clay (his main avatar): the
// stoneware folk in awe and by hearsay ("the Prince", "the Immaculate One"), the porcelain by his inventions and his tomfoolery, the
// Court in worried whispers. The higher tiers wait for their models (docs/LORE.md).
//
// The folk (npc/people.js says where they stand):
//   MISTRESS SAGGAR   stoneware. Head maid of a workshop facility, keeper of its kiln; knows the Prince by hearsay. Warm, proud, loud. Hexachord.
//   RAKU              porcelain. Treasurer of the Weir, a greedy little miser who haggles. Vain of his crackle. The soft hexachord.
//   OLD GROG          stoneware. Angler of the Weir's pier, in the dunes. Slow, sad, kind, remembers the town that was. In.
//   PIP               stoneware, not yet glazed. Saggar's apprentice, hiding in the basement hub. Afraid of most things. Yo.
// ---------------------------------------------------------------------------------------
import { TITHE } from '../world/treasure/treasure.js';

const L = (g, k) => g.ledger?.get(k) || 0;

export const TALKS = {
  saggar: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'surprise', text: 'Oh! {big}Courier!{/} {p:0.3}{mood:joy}Come in, come in, mind the {wave}slip{/} on the floor.' },
        { mood: 'calm', text: "I'm Saggar. I keep the kiln. Everything on this island came out of her belly, one way or another." },
        { mood: 'sly', text: "You too. {p:0.4}The Immaculate One fired you in her with his own hands, they say. {p:0.3}{small}Wouldn't let a soul near the door.{/}" },
      ], next: 'menu' },
      again: { lines: [{ mood: 'joy', text: 'Back again? {bounce}Good.{/} The kiln likes company. {p:0.3}{small}So do I.{/}' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: 'What are the clapperjars?', go: 'jars' },
        { text: 'About the pots I broke…', go: 'pots' },
        { text: 'What is Lachryma?', go: 'lach' },
        { text: 'Tell me about the Prince.', go: 'prince' },
        { text: 'Goodbye.', go: 'bye' },
      ] },
      jars: { lines: [
        { mood: 'calm', text: "The clapperjars? Earthenware. {p:0.3}The hive's little workers, fresh-baked, too small to hold a thought for long. The kiln makes them when she's {gold}too full{/}." },
        { when: (g) => L(g, 'clapper.down') > 0, mood: 'anger', k: 1, text: (g) => `And YOU have knocked {hot}{big}${L(g, 'clapper.down')}{/}{/} of my little ones to bits! {burst}{quake:0.3}` },
        { when: (g) => L(g, 'clapper.down') > 0, mood: 'calm', text: '{p:0.3}…Oh, there\'s always more. {small}The Prince never misses the little ones, they say.{/}' },
        { when: (g) => L(g, 'clapper.down') === 0, mood: 'joy', text: "And you've not hurt a single one. {wave}Good.{/}" },
        { mood: 'sad', text: "They come back, mind. The slip runs home and she bakes them again. {p:0.4}{slow}That's the whole trouble with clay.{/}" },
      ], next: 'menu' },
      pots: { lines: [
        { when: (g) => L(g, 'break.total') === 0, mood: 'confused', text: "You… haven't broken anything? {glyph:ask}In MY workshop? {p:0.3}{wobble}Are you feeling well?{/}" },
        { when: (g) => L(g, 'break.total') > 0 && L(g, 'break.total') < 50, mood: 'sly', text: (g) => `Only {gold}${L(g, 'break.total')}{/}? I've seen apprentices break more before breakfast.` },
        { when: (g) => L(g, 'break.total') >= 50, mood: 'anger', k: 1, text: (g) => `{shake}{big}${L(g, 'break.total')} POTS.{/}{/} {p:0.4}Do you know how long a pot takes to {hot}throw{/}, to {hot}dry{/}, to {hot}fire{/}?{burst}{quake:0.35}` },
        { when: (g) => L(g, 'break.total') >= 50, mood: 'calm', text: '{p:0.3}…Oh, never mind. Pots grow back. {small}I just like to shout about it.{/}' },
        { mood: 'whisper', text: "Only leave the fine ones be. {p:0.4}They say he has favourites. {p:0.3}{small}And that he sulks.{/}" },
      ], next: 'menu' },
      lach: { lines: [
        { mood: 'awe', text: 'Lachryma… {slow}the tears of the world{/}, the old mistress of this kiln called it. Black as a kiln at midnight, and every colour at once when the light finds it.' },
        { mood: 'whisper', text: "It's in everything. The clay, the slip, me. {p:0.4}Let too much of it into a pot and the pot goes {cold}strange{/}. {p:0.4}{slow}Then it goes wrong.{/}" },
        { mood: 'calm', text: "You can stand it. {p:0.3}That's what you're for. {p:0.4}{small}The rest of us had better not try.{/}" },
        { mood: 'fear', text: "And when there's too much of it in one place… {p:0.3}the chests go {cold}{big}prismatic{/}{/}. {burst}{p:0.3}I don't go near those." },
      ], next: 'menu' },
      prince: { lines: [
        { mood: 'awe', text: 'The {lach}Immaculate One{/}? {p:0.4}{slow}I\'ve never been in a room with him.{/} All my years at this kiln, and never once.' },
        { mood: 'calm', text: "His work comes down the hill, though. A cup of his passed through my kiln once, for a second firing. {p:0.4}{small}I didn't sleep for a week.{/}" },
        { mood: 'sad', text: 'You look at a thing like that and you think, why do I bother. {p:0.5}{slow}And then you fire the next pot anyway.{/}' },
        { mood: 'joy', text: "{p:0.3}That's the whole trick of it, Courier. {p:0.4}{small}The next pot.{/}" },
      ], next: 'menu' },
      bye: { lines: [{ mood: 'joy', text: 'Off you go, then. {wave}Mind the slip!{/}' }] },
    },
  },

  pip: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'fear', k: 1, text: '{shake}{big}AH!{/}{/}{burst} {p:0.5}Oh. Oh, it\'s only you. I thought you were a clapperjar.' },
        { mood: 'fear', text: "I'm Pip. I'm Mistress Saggar's apprentice. {p:0.4}{small}I'm hiding.{/}" },
        { mood: 'sad', text: 'She sent me down for glaze and the clapperjars {tremble}clapped at me{/}. All of them. {slow}At once.{/}' },
      ], next: 'menu' },
      again: { lines: [{ mood: 'fear', text: '{shake}Is it gone?{/} {p:0.4}{mood:joy}Oh, it\'s you again. {bounce}Hello!{/}' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: 'Why are you scared of them?', go: 'scared' },
        { text: 'Want me to deal with them?', go: 'deal' },
        { text: 'Have you met the Prince?', go: 'prince' },
        { text: 'Bye, Pip.', go: 'bye' },
      ] },
      scared: { lines: [
        { mood: 'fear', text: 'Have you {big}heard{/} them? {shake}Clap clap clap{/}, right behind you, and when you turn round they\'re {wave}dancing{/} like nothing happened!' },
        { mood: 'confused', text: 'And they {wobble}steal the baubles{/}. What does a jar want with a bauble? {glyph:ask}Where does it {big}put{/} it?' },
        { mood: 'sad', text: 'I want to be a potter. {p:0.4}{slow}Potters aren\'t supposed to be afraid of pots.{/}' },
      ], next: 'menu' },
      deal: { lines: [
        { when: (g) => L(g, 'clapper.down') >= 10, mood: 'joy', k: 1, text: (g) => `You've already sent {gold}${L(g, 'clapper.down')}{/} of them back to the kiln? {burst}{bounce}You're amazing!{/} {p:0.3}{small}Don't tell Mistress Saggar I said that.{/}` },
        { when: (g) => L(g, 'clapper.down') < 10, mood: 'surprise', text: 'You would? {big}Really?{/}{burst} {p:0.3}{mood:joy}{wave}Thank you thank you thank you!{/}' },
        { mood: 'fear', text: 'But be careful. They clap {big}louder{/} when they\'re scared.' },
      ], next: 'menu' },
      prince: { lines: [
        { mood: 'awe', text: 'The {lach}Immaculate One{/}? {p:0.4}{slow}Once.{/} From the very back of the hall. {p:0.3}He was holding a cup.' },
        { mood: 'awe', text: 'Just a cup. {p:0.5}And it was the most {big}perfect{/} thing I have ever seen, and I had to sit down on the floor.' },
        { mood: 'sad', text: 'I made a cup after that. {p:0.4}It leans. {p:0.5}{small}I keep it under my bed, so it doesn\'t have to see his.{/}' },
        { mood: 'joy', text: 'One day I\'ll make something he looks at twice. {p:0.4}{small}Or once. Once would be fine.{/}' },
      ], next: 'menu' },
      bye: { lines: [{ mood: 'fear', text: "Bye! I'll just… stay here. {small}In the corner. Where it's safe.{/}" }] },
    },
  },

  grog: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'calm', text: '{slow}Mm.{/} {p:0.6}A visitor. Not many come this far into the Dunes.' },
        { mood: 'sad', text: "I've fished this pool since it was a {small}puddle{/}. Since before the sand came. {p:0.5}{slow}Since before the Weir was a weir.{/}" },
        { mood: 'awe', text: 'Do you see how the water holds the sky? {p:0.3}{slow}That\'s the Lachryma in it.{/} The tide brings it up from somewhere deep.' },
      ], next: 'menu' },
      again: { lines: [{ mood: 'calm', text: '{slow}Mm.{/} {p:0.4}The Courier again. {bob}Sit a while.{/}' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: "What's in the water?", go: 'fish' },
        { text: 'Why so sad?', go: 'sad' },
        { text: 'Any advice?', go: 'advice' },
        { text: 'Do you buy fish?', go: 'buyfish' },
        { text: 'What do you make of the Prince?', go: 'prince' },
        { text: "Let's trade.", do: (g) => g.shops?.open('grog'), go: null },
        { text: 'Goodbye.', go: 'bye' },
      ] },
      fish: { lines: [
        { when: (g) => L(g, 'fish.total') === 0, mood: 'sly', text: "You've not caught a thing yet. {p:0.4}Good. {small}The pool likes a patient angler.{/}" },
        { when: (g) => L(g, 'fish.total') > 0, mood: 'joy', text: (g) => `You've landed {gold}${L(g, 'fish.total')}{/} already. {bob}The pool must like you.{/}` },
        { mood: 'fear', text: "But there's something {cold}big{/} down there. {p:0.4}I've seen its shadow when the tide turns.{glyph:bang1} {shake}{big}Bigger than the pier.{/}{/}{burst}" },
      ], next: 'menu' },
      sad: { lines: [
        { mood: 'sad', text: 'Sad? {p:0.7}{slow}No… just old.{/} The clay forgets things, when it\'s fired twice.' },
        { mood: 'sad', text: 'There was a town here once. {p:0.4}Jars and jugs and big round-bellied pots, all talking at once. {p:0.6}{slow}Now there\'s me, and the fish, and the wind.{/}' },
        { mood: 'fear', text: 'Too near the Well, they were. {p:0.5}{slow}It got into them.{/} {p:0.6}{small}Some of them are still out there. You\'ll have met them.{/}' },
        { mood: 'awe', text: '{p:0.4}But you came. {p:0.3}{lach}Maybe the town\'s coming back.{/}' },
      ], next: 'menu' },
      advice: { lines: [
        { mood: 'calm', text: "Mind the {gold}tides{/}. Some fish only come up when the water's high, others only in the slack." },
        { mood: 'sly', text: 'And tie on something they {wave}like{/}. A fish knows what it wants. {p:0.3}{small}Like most of us.{/}' },
      ], next: 'menu' },
      buyfish: { lines: [
        { mood: 'calm', text: "I'll buy what you land, and pay fair. {p:0.4}{small}Fairer than the fez up the beach, anyway.{/}" },
        { when: (g) => L(g, 'fish.total') >= 20, mood: 'joy', text: '{bob}You keep me busy.{/} {p:0.4}The little ones I put back, mostly. {slow}Mm.{/} {small}Don\'t tell Raku.{/}' },
        { mood: 'calm', text: 'And film for that book of yours, while you\'re here. {p:0.3}The pool likes having its picture taken. {small}Slowly.{/}' },
      ], next: 'menu' },
      prince: { lines: [
        { mood: 'awe', text: 'The Prince? {p:0.5}{slow}Mm.{/} {p:0.4}I saw him throw a bowl once, before the sand. One pull of the wheel.' },
        { mood: 'sad', text: "I've been making pots ever since, and I've never made that bowl. {p:0.5}{small}Nobody will.{/} {p:0.4}{slow}That's all right.{/}" },
        { mood: 'calm', text: "{p:0.3}I'm the bit of him that sits by water and remembers. {p:0.5}{small}Somebody has to.{/}" },
      ], next: 'menu' },
      bye: { lines: [{ mood: 'sad', text: "{slow}Mm.{/} Come back when the tide's in." }] },
    },
  },

  raku: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'sly', text: 'Welcome, welcome, {gold}welcome{/}! Raku, treasurer of the Weir, at your service. {p:0.4}{small}For a small fee.{/}' },
        { mood: 'joy', text: "You've come about the {lach}Tithe{/}, of course. {bounce}Everyone does, eventually.{/}" },
      ], next: 'menu' },
      again: { lines: [{ mood: 'sly', text: 'Ah, my {gold}favourite{/} customer! {p:0.3}{small}Is that a purse I hear?{/}' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: "Let's trade.", do: (g) => g.shops?.open('raku'), go: null },
        { text: "What's the Tithe?", go: 'tithe' },
        { text: 'How many cubes have I got?', go: 'cubes' },
        { text: 'Do you buy curios?', go: 'curios' },
        { text: 'What is the Prince like?', go: 'prince' },
        { text: 'Your glaze is lovely.', go: 'flatter' },
        { text: 'Goodbye.', go: 'bye' },
      ] },
      tithe: { lines: [
        { mood: 'sly', text: (g) => `Feed the console {gold}${TITHE.cost} cubes{/}, and the treasury sends down a {big}sealed chest{/}. Simple! {p:0.4}{small}Mostly.{/}` },
        { mood: 'awe', text: "Sometimes it's a little chest. Sometimes {slow}it's a very, very big one{/}." },
        { mood: 'fear', k: 1, text: 'And sometimes it goes {cold}{shake}prismatic{/}{/} and the lights go out and everyone dances and {big}I hate it{/}.{burst}' },
      ], next: 'menu' },
      cubes: { lines: [
        { when: (g) => (g.cubes?.balance || 0) >= TITHE.cost, mood: 'joy', k: 1, text: (g) => `{gold}{big}${g.cubes.balance}{/}{/} cubes!{burst} {bounce}Oh, we're going to be such good friends.{/}` },
        { when: (g) => (g.cubes?.balance || 0) < TITHE.cost, mood: 'sad', text: (g) => `Only {gold}${g.cubes?.balance || 0}{/}? {p:0.5}{slow}Oh dear. Oh dear, oh dear.{/} Open a few chests and come back.` },
      ], next: 'menu' },
      curios: { lines: [
        { mood: 'sly', text: 'Curios! {p:0.3}Little things with a life behind them. {p:0.4}I buy them, yes. {gold}Lovingly.{/} {p:0.3}{small}Cheaply.{/}' },
        { mood: 'joy', text: "A curio is worth a fortune. {p:0.4}{small}When I'm selling it.{/} {p:0.3}When you're selling it, it's worth {wobble}sentiment{/}, and I pay very well for sentiment." },
      ], next: 'menu' },
      prince: { lines: [
        { mood: 'awe', text: 'His Highness? {p:0.3}A genius, naturally. {p:0.4}{small}An expensive one.{/}' },
        { mood: 'confused', text: 'Last month he had me buy a whole barrow of gold leaf so he could gild a {wobble}puddle{/}. {glyph:ask}{p:0.5}{small}It was a very good puddle.{/}' },
        { mood: 'sly', text: "But the {gold}inventions{/}! {p:0.3}Every one a marvel, and every one a bill. {p:0.4}{slow}Somebody has to keep the books, while he plays.{/}" },
      ], next: 'menu' },
      flatter: { lines: [
        { mood: 'surprise', text: '{big}Lovely?{/}{burst} {p:0.3}{mood:joy}It\'s raku! {wave}Pulled out of the kiln red-hot and dropped in sawdust!{/}' },
        { mood: 'joy', text: "That's where the {lach}crackle{/} comes from. {p:0.3}{small}It hurt a lot, actually.{/} But look at me {gold}shine{/}!" },
      ], next: 'menu' },
      bye: { lines: [{ mood: 'sly', text: 'Come back {gold}richer{/}!' }] },

      // THE HAGGLE (progress/shop/haggle.js keeps the numbers; shops.js the deal): his answer to what the Courier last did, then what they can do next
      haggle: {
        lines: [{ mood: (g) => hagMood(g), text: (g) => hagLine(g) }],
        choices: [
          ...[0, 1, 2].map((i) => ({ when: (g) => !H(g)?.done && g.shops.hagOffers().length > i, text: (g) => `Offer ${g.shops.hagOffers()[i]} cubes.`, do: (g) => g.shops.hagOffer(i), go: 'haggle' })),
          { when: (g) => !H(g)?.done && H(g).flattered < 3, text: (g) => FLATTERY[Math.min(2, H(g).flattered)], do: (g) => g.shops.hagFlatter(), go: 'haggle' },
          { when: (g) => !H(g)?.done && !H(g).clinked && g.cubes.balance >= H(g).ask, text: 'Clink a few cubes on the counter.', do: (g) => g.shops.hagClink(), go: 'haggle' },
          { when: (g) => H(g)?.done === 'last' && g.cubes.balance >= H(g).ask, text: (g) => `Pay ${H(g).ask}.`, do: (g) => g.shops.hagAccept(), go: 'haggle' },
          { when: (g) => H(g)?.done === 'deal', text: 'Shake on it.', do: (g) => g.shops.hagClose(), go: null },
          { when: (g) => H(g) && H(g).done !== 'deal', text: (g) => (H(g).done === 'last' ? 'Leave it.' : 'Walk away.'), do: (g) => (H(g).done === 'last' ? g.shops.hagDrop() : g.shops.hagWalk()), go: (g) => (g.shops.hag ? 'haggle' : 'hagbye') },
        ],
      },
      hagbye: { lines: [{ mood: 'sad', text: (g) => pick(RAKU_HAGGLE.gone, g) }] },
    },
  },
};

// ---------------------------------------------------------------------------------------
// RAKU HAGGLES: what he says to each move (progress/shop/haggle.js names the moves). {ask} is his price now, {offer} theirs (the Courier's), {price} the deal.
// Any number of lines to a move: they are taken in turn. The mood of each line is his (progress/shop/haggle.js moodOf), so his body shows it.
// He is a greedy little miser of the porcelain tier: vain of his crackle, in love with the sound of cubes, wounded by every discount.
const H = (g) => g.shops?.hag?.h;
const pick = (pool, g) => {
  const h = H(g), t = pool[(h?.said || 0) % pool.length];
  return t.replace(/\{ask\}/g, `{gold}${h?.ask ?? ''}{/}`).replace(/\{offer\}/g, `{gold}${h?.last ?? ''}{/}`).replace(/\{price\}/g, `{gold}${h?.price ?? ''}{/}`);
};
const hagMood = (g) => g.shops?.hagMood?.() || 'sly';
const hagLine = (g) => { const h = H(g); return h ? pick(RAKU_HAGGLE[h.step] || RAKU_HAGGLE.counter, g) : '…'; };
const FLATTERY = ['That fez is magnificent.', 'Your crackle catches the light beautifully.', 'Has anyone told you that you shine?'];
export const RAKU_HAGGLE = {
  open: [
    'For you? {ask} cubes. {p:0.3}{small}A bargain, really. I\'m practically giving it away.{/}',
    'Ah, a {lach}discerning{/} eye! {ask} cubes, and I\'m robbing myself.',
    '{ask}. {p:0.4}{slow}And not a cube less.{/} {p:0.3}{small}Probably.{/}',
    'That one? {p:0.3}{wobble}Oh, that one\'s special.{/} {p:0.4}{ask}.',
  ],
  counter: [
    '{offer}? {p:0.3}{wobble}Ha!{/} {ask}, and that\'s me being {gold}generous{/}.',
    'Mm. {p:0.4}{ask}. {small}You drive a hard bargain. I hate it.{/}',
    'I could go to {ask}. {p:0.3}{slow}Could.{/}',
    '{offer}… {p:0.4}{slow}{offer}…{/} {p:0.3}No. {ask}. {small}I have mouths to feed. Mine.{/}',
  ],
  insult: [
    '{big}{offer}?!{/}{burst} {p:0.3}{shake}Are you trying to {hot}ruin{/} me?{/}',
    '{hot}{offer}!{/} {p:0.3}I\'ve had better offers from the {wave}fish{/}.{burst}',
    'Out. {p:0.5}{small}No, stay. But that was rude.{/}',
    '{offer}. {p:0.5}{slow}I\'m going to pretend you didn\'t say that.{/} {p:0.3}{small}I won\'t, though.{/}',
  ],
  flatter: [
    'Oh, {bounce}stop{/}. {p:0.3}{small}Don\'t stop.{/}',
    'It {gold}is{/} a fine fez, isn\'t it? {p:0.3}{wave}Red-hot, then sawdust!{/}',
    'Flattery! {p:0.3}{small}It works, you know.{/} {ask}, for you.',
  ],
  bored: [
    '{slow}Yes, yes, I shine.{/} {p:0.4}{ask}.',
    'Compliments don\'t pay for keys, Courier.',
    'You said that already. {p:0.3}{ask}.',
  ],
  clink: [
    '{big}Ooh.{/}{burst} {p:0.3}{lach}That sound.{/} {p:0.4}Well. {ask}, then.',
    'Cubes on the counter! {wave}Now we\'re talking.{/}',
    '{slow}Mmm.{/} {p:0.3}Put them a little closer.',
  ],
  last: [
    '{ask}. {p:0.4}{slow}My last word.{/}',
    'That\'s it, I\'m tired. {ask} or nothing.',
    'Enough! {ask}. {p:0.3}{small}Final. Really final.{/}',
  ],
  callback: [
    '{big}Wait!{/}{burst} {p:0.3}{ask}. Just for you. {p:0.3}{small}Don\'t tell anyone.{/}',
    'Oh, come back, come back! {ask}!',
    '{shake}Fine!{/} {ask}, you {hot}bandit{/}.',
  ],
  deal: [
    '{burst}{bounce}Done!{/} {price} cubes. {p:0.3}{small}Pleasure, as always.{/}',
    'A deal! {price}. {p:0.3}{wave}Lovely, lovely.{/}',
    '{price}. {p:0.4}{slow}I\'ll weep later.{/}',
    '{price}, and it\'s yours. {p:0.4}{small}Count them out slowly. I like to listen.{/}',
  ],
  gone: [
    '{slow}Fine.{/} {p:0.4}Go. {small}I didn\'t want to sell it anyway.{/}',
    'Off you go, then. {p:0.4}{small}Cheapskate.{/}',
    'Your loss! {p:0.5}{slow}Mostly.{/}',
  ],
};
