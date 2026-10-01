// ---------------------------------------------------------------------------------------
// THE BESTIARY: what the Veritome knows about the creatures of the workshop, learned from photographs. Every creature has FACTS, and
// every fact is learned from a photograph of the creature DOING something (a clapperjar asleep, mending, cowering behind a pot, set on
// by one of its own; a fish circling a lure, taking it, clear of the water). A fact is a sentence of flavour, and the useful ones carry
// BATTLE information too (what wakes it, what it sees, what it is drawn to). How much of a creature is known is its UNDERSTANDING:
//
//   GLIMPSED   it has been photographed at all
//   OBSERVED   three of its facts
//   STUDIED    two thirds of them
//   UNDERSTOOD every one
//
// Understanding is the currency other systems read: a creature the Courier understands is one the Soul Brush will one day be able to
// paint a likeness of, and the Angling shelf already shows a fish's habits as soon as they are photographed rather than only after
// three landings. Nothing here is set by a hook; a fact is known because a photograph of it was appraised (darkroom.js).
//
// Prior art: Pokémon Snap (the behaviours worth photographing are the rare ones: a Pokémon asleep, dancing, fighting another),
// Monster Hunter's Hunter's Notes (a monster's weaknesses and habits filled in as you learn them, the battle part marked), Dark Cloud 2's
// scoops (a photograph of the right thing is an idea), and the Pokédex (seen, then known).
//
//   CREATURES[id] = { name, glyph, facts: [{ id, text, battle?, when(subject) -> bool }] }     creatureOf(subject) -> id | null
//   const b = new Bestiary(state)   b.learn(subject) -> [new facts]   b.knows(id, fact)   b.understanding(id) -> { n, of, tier, k }
// ---------------------------------------------------------------------------------------
import { SPECIES, ASPECTS, TIDES } from '../angling/species.js';

const st = (...need) => (s) => need.some((x) => s.states.includes(x));
const FIGHT = { drift: 'in slow swimming turns', dart: 'in quick flicks', thrash: 'in coils and thrashes: ease off at the tremble', run: 'in long runs: give it line', sweep: 'side to side: follow it', leap: 'leaping clear, and landing hard', anchor: 'by being immovable: reel steadily', legend: 'in phases: it changes as it tires' };

export const TIERS = ['UNKNOWN', 'GLIMPSED', 'OBSERVED', 'STUDIED', 'UNDERSTOOD'];

const CLAPPER = {
  name: 'Clapperjar', glyph: '⚱',
  blurb: 'A little clay figment with a lid for a mouth, full of Lachryma. They come out of the kiln warm and never quite cool.',
  facts: [
    { id: 'seen', when: () => true, text: 'A clapperjar: terracotta, hollow, and full of what the workshop weeps. It claps its lid when it has something to say.' },
    { id: 'nap', when: st('nap'), battle: true, text: 'It naps only when no one is within nine paces, and wakes badly: come within three and it bolts.' },
    { id: 'forage', when: st('forage'), battle: true, text: 'It eats loose Lachryma off the floor, and keeps every bauble it swallows: a fed jar breaks open richer.' },
    { id: 'celebrate', when: st('celebrate'), text: 'It twirls after it has swallowed something. It is very pleased with itself, briefly.' },
    { id: 'mend', when: st('mend'), battle: true, text: 'Kintsugi: it mends cracked pots and rebuilds wrecks with gold, but never with the Courier close. A pot it has mended pays more when broken.' },
    { id: 'taunt', when: st('taunt'), battle: true, text: 'It claps at the Courier when it can see her (eight paces, never through a wall), and then runs.' },
    { id: 'cower', when: st('cower', 'hide'), battle: true, text: 'Frightened, it runs for the biggest pot near and cowers behind it. Break the pot and it has nowhere left.' },
    { id: 'air', when: st('air'), battle: true, text: 'It is not made for falling: a long enough drop shatters it.' },
    { id: 'dance', when: st('dance'), text: 'It cannot help dancing to a Groove shell. Nobody has asked whether it enjoys it.' },
    { id: 'stunned', when: st('stunned'), battle: true, text: 'Held to what is real, it sees stars and cannot move for a few seconds: long enough for a blade.' },
    { id: 'scalded', when: st('scalded'), text: 'Molten slip sets it hopping. Clay remembers the kiln.' },
    { id: 'greed', when: st('greed'), text: 'Some never stop eating. The fat ones are fat with what the Courier dropped.' },
    { id: 'raider', when: st('raider'), battle: true, text: 'In the Siege some come out of the kiln wanting only one thing: the god hand\'s vessel, broken.' },
    { id: 'infight', when: st('infight'), battle: true, text: 'They are not all of one mind. A jar the god hand has turned will run down a raider and knock it flat.' },
  ],
};

/** A fish's facts, written from what the angling already knows of the species (species.js): the photograph only reveals it. */
function fishFacts(sp) {
  const best = sp.aff.indexOf(Math.max(...sp.aff)), all = sp.aff.every((a) => a >= 0.99);
  return [
    { id: 'seen', when: () => true, text: sp.blurb },
    { id: 'lives', when: st('roam'), battle: true, text: `It keeps ${sp.depth[0]}–${sp.depth[1]} m down, and comes at the ${sp.tides.map((t) => TIDES[t].name.toLowerCase()).join(', ')} tide.` },
    { id: 'wants', when: st('inspect', 'stalk'), battle: true, text: all ? 'It comes to no one feeling: only to the echo of something large, landed at the top of the tide.' : `It circles a lure that carries ${ASPECTS[best].name.toLowerCase()} (${ASPECTS[best].hint}).` },
    { id: 'bites', when: st('bite'), battle: true, text: `Its bite comes as ${sp.bite.join(', then ')}; strike on the ${sp.bite[sp.bite.length - 1]}.` },
    { id: 'fights', when: st('fight', 'air'), battle: true, text: `On the line it fights ${FIGHT[sp.style] || 'its own way'}.` },
    { id: 'shy', when: st('flee'), text: sp.shy >= 0.35 ? 'It startles easily and is gone at the first wrong move.' : 'It is slow to frighten; it comes back.' },
  ];
}

export const CREATURES = { clapper: CLAPPER };
for (const sp of SPECIES) CREATURES[`fish.${sp.id}`] = { name: sp.name, glyph: '❧', blurb: sp.blurb, fish: sp.id, tier: sp.tier, legend: !!sp.legend, facts: fishFacts(sp) };
export const CREATURE_IDS = Object.keys(CREATURES);

/** Which creature a photographed subject is (or null: a pot is not a creature). */
export const creatureOf = (s) => (s.kind === 'clapper' ? 'clapper' : s.kind === 'fish' && s.sub ? `fish.${s.sub}` : null);

export class Bestiary {
  /** `state`: the Book's saved { [creature]: [fact ids] } (kept by reference: the Book saves it). */
  constructor(state = {}) { this.known = state; }
  knows(id, fact) { return !!this.known[id]?.includes(fact); }
  seen(id) { return !!this.known[id]?.length; }

  /** The facts a photographed subject shows that are not known yet; learning them. */
  learn(s) {
    const id = creatureOf(s), C = id && CREATURES[id];
    if (!C) return [];
    const out = [];
    for (const f of C.facts) {
      if (this.knows(id, f.id)) continue;
      let ok = false;
      try { ok = f.when(s); } catch { ok = false; }
      if (!ok) continue;
      (this.known[id] ||= []).push(f.id);
      out.push({ creature: id, fact: f.id, battle: !!f.battle, text: f.text });
    }
    return out;
  }

  understanding(id) {
    const C = CREATURES[id], n = this.known[id]?.length || 0, of = C ? C.facts.length : 0;
    const tier = n === 0 ? 0 : n >= of ? 4 : n >= Math.ceil(of * 2 / 3) ? 3 : n >= 3 ? 2 : 1;
    return { n, of, tier, name: TIERS[tier], k: of ? n / of : 0 };
  }
}
