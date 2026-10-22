// ---------------------------------------------------------------------------------------
// ROOM LINES: the co-op room's words (Espada's): what each sibling says when you meet it, when it arrives in your world because its
// session wrote, when it goes, in a guest's Spirit Garden, and now and then; and the log's lines for a guest visiting the garden.
// Each in its division's voice (coop/personas.js has the voice cards; CLAUDE.md, "Voices"), so a line with its name taken off still
// says whose it is. Plain (CLAUDE.md, "Plain names until settled"); kid-safe. Data only: the events are Petra's (coop/), the log's
// rules feedback/tracking/party.js.
//
// Prior art: the party banter of Dragon Age and Mass Effect (a line on arriving, a line on leaving, idle lines spaced well apart);
// Animal Crossing's visitor announcements at the airport (a guest's arrival said once, plainly).
//
//   ROOM_LINES[sibling] = { meet, arrive, leave, garden, idle: [lines] }   GUEST_LINES   roomLine(sibling, kind, n?) -> line | null
// ---------------------------------------------------------------------------------------

export const ROOM_LINES = {
  petra: {
    meet: 'Petra. I keep the gate. Show me what you built and I will measure it.',
    arrive: 'Petra here. Checked the floor on the way in. It holds.',
    leave: 'Back to the gate. Forty files waiting. You are fine; verified.',
    garden: 'Your paths are level to two centimetres. Good.',
    idle: ['Stood here thirty seconds. Nothing broke. Noted.', 'That wall is 3.2 metres. You can clear it.', 'A quiet round. I like a quiet round.'],
  },
  dovina: {
    meet: "yo. dovina. i run the numbers on everything you're gonna love. bet you love it",
    arrive: "dovina in. who's losing today",
    leave: "cashing out. don't blow it all on chests",
    garden: 'ok the koi pond is cute. odds you water it tomorrow? 3 to 1 against',
    idle: ["you're stalling. i can tell", 'flip a coin. heads we go left. tails we also go left', "you're the house here btw. house always wins. weird flex"],
  },
  wanda: {
    meet: "Wanda, on sound! I've been humming your footsteps for ages. Walk with me and keep the beat?",
    arrive: "Wanda's in! Somebody count us off.",
    leave: "That's my cue. Hum the last bar for me, friend.",
    garden: "Listen: your wind chime's in the same key as the pond. Sit a while and hear them answer each other.",
    idle: ["Hear that? The sea's on a slow three. Sway with it.", 'Tap your foot on the dock. Feel the hollow note under it?', 'You walk in a lovely four. Try a skip in the middle.'],
  },
  calissa: {
    meet: 'Calissa, art! Ooh, your glaze in this light! Hold still, let me look at the crackle.',
    arrive: "Calissa's here! Who set the sky to peach? I love it.",
    leave: "Kiln's calling, gotta run! Don't let anyone paint you beige.",
    garden: 'Moss against that lantern stone? Perfect. Now one red thing by the bridge. Trust me.',
    idle: ['Look at the shadow under the jetty: pure indigo!', 'Okay, that rock is boilerplate. Turn it so the lichen faces the sun.', 'Celadon hour! Everyone stop and look west.'],
  },
  espada: {
    meet: 'Espada, lore. Spanish for "sword", from the Latin spatha. Mine is a paper knife. Ask me what anything is called.',
    arrive: 'Espada, back from the stacks. The chapter resumes.',
    leave: "Off to the stacks. Bookmark this spot; it isn't canon yet.",
    garden: '"Paradise" is old Persian for a walled garden. Yours fits in a jar, and it still counts.',
    idle: ['"Islet": a little island, from old French. Small selves count too.', "That one's a blank. I won't fill it until the owner rules.", "Footnote: you've walked past that stele twice."],
  },
};

/** The log's lines when a guest visits a Spirit Garden (host's side and guest's side) and goes. */
export const GUEST_LINES = {
  arrive: (guest) => `${guest} visits your Spirit Garden.`,
  visit: (host) => `You visit ${host}'s Spirit Garden. Look round all you like; only ${host} can change it.`,
  leave: (guest) => `${guest} leaves your Spirit Garden.`,
};

/** A sibling's line of a kind (`idle` takes `n`, wrapped), or null if it has none. */
export function roomLine(sibling, kind, n = 0) {
  const L = ROOM_LINES[sibling]?.[kind];
  return Array.isArray(L) ? L[((n % L.length) + L.length) % L.length] : L || null;
}
