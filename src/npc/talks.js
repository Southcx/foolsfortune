// ---------------------------------------------------------------------------------------
// THE TALKS: what the clay folk say. Each talk is a set of nodes; a node is lines (each with its mood, the folk's feeling while it
// is said) and then choices (the Courier's words) or a next. A line's text is markup (npc/dialogue.js: {big}, {shake}, {p:0.4},
// {mood:fear}, {burst}...) or a function of the game, so a folk can know what the Courier has done (the ledger: pots broken,
// clapperjars sent back to the kiln, fish landed, cubes saved). `start` is the first meeting, `again` every one after.
//
// The folk (npc/people.js says where they stand):
//   MISTRESS SAGGAR   keeper of the kiln (the workshop). Warm, proud, shouts about pots. A Western voice (the hexachord).
//   PIP               her apprentice (hiding in the basement hub). Afraid of the clapperjars, of the dark, of most things. Yo.
//   OLD GROG          an angler on the Weir's pier (the dunes). Slow, sad, kind, remembers the town that was. In.
//   RAKU              treasurer of the Weir (by the Tithe). Sly, vain, loves cubes, hates the prismatic chests. The soft hexachord.
// ---------------------------------------------------------------------------------------
import { TITHE } from '../treasure.js';

const L = (g, k) => g.ledger?.get(k) || 0;

export const TALKS = {
  saggar: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'surprise', text: 'Oh! {big}Courier!{/} {p:0.3}{mood:joy}Come in, come in, mind the {wave}slip{/} on the floor.' },
        { mood: 'calm', text: "I'm Saggar. I keep the kiln. Everything in this workshop came out of her belly, one way or another." },
        { mood: 'sly', text: "Even you, I shouldn't wonder. {p:0.5}{small}Don't ask me how.{/}" },
      ], next: 'menu' },
      again: { lines: [{ mood: 'joy', text: 'Back again? {bounce}Good.{/} The kiln likes company.' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: 'What are the clapperjars?', go: 'jars' },
        { text: 'About the pots I broke…', go: 'pots' },
        { text: 'What is Lachryma?', go: 'lach' },
        { text: 'Goodbye.', go: 'bye' },
      ] },
      jars: { lines: [
        { mood: 'calm', text: "The clapperjars? The kiln makes them when she's {gold}too full{/} of Lachryma. Little figments. They clap, they steal, they {wave}dance{/} when nobody's looking." },
        { when: (g) => L(g, 'clapper.down') > 0, mood: 'anger', k: 1, text: (g) => `And YOU have knocked {hot}{big}${L(g, 'clapper.down')}{/}{/} of my little ones to bits! {burst}{quake:0.3}` },
        { when: (g) => L(g, 'clapper.down') === 0, mood: 'joy', text: "And you've not hurt a single one. {wave}Good.{/}" },
        { mood: 'sad', text: "They come back, mind. Clay always comes back. {p:0.4}{slow}That's the whole trouble with clay.{/}" },
      ], next: 'menu' },
      pots: { lines: [
        { when: (g) => L(g, 'break.total') === 0, mood: 'confused', text: "You… haven't broken anything? {glyph:ask}In MY workshop? {p:0.3}{wobble}Are you feeling well?{/}" },
        { when: (g) => L(g, 'break.total') > 0 && L(g, 'break.total') < 50, mood: 'sly', text: (g) => `Only {gold}${L(g, 'break.total')}{/}? I've seen apprentices break more before breakfast.` },
        { when: (g) => L(g, 'break.total') >= 50, mood: 'anger', k: 1, text: (g) => `{shake}{big}${L(g, 'break.total')} POTS.{/}{/} {p:0.4}Do you know how long a pot takes to {hot}throw{/}, to {hot}dry{/}, to {hot}fire{/}?{burst}{quake:0.35}` },
        { when: (g) => L(g, 'break.total') >= 50, mood: 'calm', text: '{p:0.3}…Oh, never mind. They grow back. Everything in here grows back. {small}I just like to shout about it.{/}' },
      ], next: 'menu' },
      lach: { lines: [
        { mood: 'awe', text: 'Lachryma… {slow}the tears of the world{/}, my old master called it. Black as a kiln at midnight, and every colour at once when the light finds it.' },
        { mood: 'whisper', text: "It isn't ours, you know. We only borrow it. {p:0.4}The System counts every drop." },
        { mood: 'fear', text: "And when there's too much of it in one place… {p:0.3}the chests go {cold}{big}prismatic{/}{/}. {burst}{p:0.3}I don't go near those." },
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
      bye: { lines: [{ mood: 'fear', text: "Bye! I'll just… stay here. {small}In the corner. Where it's safe.{/}" }] },
    },
  },

  grog: {
    start: 'hello', again: 'again',
    nodes: {
      hello: { lines: [
        { mood: 'calm', text: '{slow}Mm.{/} {p:0.6}A visitor. Not many come this far into the dunes.' },
        { mood: 'sad', text: "I've fished this pool since it was a {small}puddle{/}. Since before the sand came. {p:0.5}{slow}Since before the Weir was a weir.{/}" },
        { mood: 'awe', text: 'Do you see how the water holds the sky? {p:0.3}{slow}That\'s the Lachryma in it.{/} The tide brings it up from somewhere deep.' },
      ], next: 'menu' },
      again: { lines: [{ mood: 'calm', text: '{slow}Mm.{/} {p:0.4}The Courier again. {bob}Sit a while.{/}' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: "What's in the water?", go: 'fish' },
        { text: 'Why so sad?', go: 'sad' },
        { text: 'Any advice?', go: 'advice' },
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
        { mood: 'awe', text: '{p:0.4}But you came. {p:0.3}{lach}Maybe the town\'s coming back.{/}' },
      ], next: 'menu' },
      advice: { lines: [
        { mood: 'calm', text: "Mind the {gold}tides{/}. Some fish only come up when the water's high, others only in the slack." },
        { mood: 'sly', text: 'And tie on something they {wave}like{/}. A fish knows what it wants. {p:0.3}{small}Like most of us.{/}' },
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
      again: { lines: [{ mood: 'sly', text: 'Ah, my {gold}favourite{/} customer!' }], next: 'menu' },
      menu: { lines: [], choices: [
        { text: "What's the Tithe?", go: 'tithe' },
        { text: 'How many cubes have I got?', go: 'cubes' },
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
      flatter: { lines: [
        { mood: 'surprise', text: '{big}Lovely?{/}{burst} {p:0.3}{mood:joy}It\'s raku! {wave}Pulled out of the kiln red-hot and dropped in sawdust!{/}' },
        { mood: 'joy', text: "That's where the {lach}crackle{/} comes from. {p:0.3}{small}It hurt a lot, actually.{/} But look at me {gold}shine{/}!" },
      ], next: 'menu' },
      bye: { lines: [{ mood: 'sly', text: 'Come back {gold}richer{/}!' }] },
    },
  },
};
