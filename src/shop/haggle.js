// ---------------------------------------------------------------------------------------
// THE HAGGLE: a price talked down with a greedy miser (Raku). Pure logic, no DOM: the talk itself is Raku's dialogue (npc/talks.js,
// the 'haggle' node), whose choices call these and whose lines read the state, so every offer and every answer is said in his window
// and written to the log, and his body shows how he feels (npc/folk.js) while he says it.
//
// He asks his LIST price (the worth, marked up: econ/table.js) and will come down, but never below his FLOOR (just over the worth:
// he never sells at a loss). What moves him is his MOOD (-1 sulking .. 1 delighted) and his PATIENCE (how many more offers he will
// hear). The Courier can:
//   OFFER a price (three are put to them: a lowball, a fair one, a near one). At or over his ask, a deal. Far under his floor, an
//     insult: he sulks and loses patience. Otherwise he counters, coming down by more the better his mood, and may take an offer over
//     his floor outright if he is pleased enough.
//   FLATTER him (his glaze, his fez). Each time is worth less than the last, and the third time he sees through it.
//   CLINK cubes on the counter: greed warms him, but now he knows they can pay, and his floor creeps up. Once.
//   WALK AWAY. If he is in a good enough mood he calls them back with one last price; otherwise he lets them go.
// When his patience runs out he names a last price and will not move again.
//
// Prior art: Recettear (the customer's tolerance as a hidden range, their face as the only reading of it, and the gain in reading
// it), Moonlighter's price reactions, Potion Craft's haggling (a mood bar moved by the merchant's temper and your offers), and the
// bazaar haggle of Kenshi and Mount & Blade (flattery and walking away as real moves).
//
//   const h = startHaggle({ worth, list, floor, purse })   offers(h) -> [cubes x3]   offer(h, x)  flatter(h)  clink(h)  walk(h)
//   h.step: 'open' | 'counter' | 'insult' | 'flatter' | 'bored' | 'clink' | 'deal' | 'last' | 'callback' | 'gone'
//   h.ask (his price now)   h.done ('deal' | 'last' | 'gone' | null)   h.price (agreed)   moodOf(h) -> a folk mood
// ---------------------------------------------------------------------------------------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const round = (x) => Math.max(1, Math.round(x));

export function startHaggle({ worth, list, floor, purse = Infinity, rnd = Math.random }) {
  return { worth, list: round(list), floor: round(floor), ask: round(list), purse, mood: 0, patience: 3 + (rnd() < 0.4 ? 1 : 0), flattered: 0, clinked: false, step: 'open', done: null, price: null, last: null, rnd, said: 0 };
}

/** The three prices put to them: a lowball, a fair one and a near one, under his ask (and within their purse if they can). */
export function offers(h) {
  const a = h.ask, f = h.floor;
  const xs = [round(f * 0.7), round((a + f) / 2 - (a - f) * 0.15), round(a - Math.max(1, (a - f) * 0.2))];
  return [...new Set(xs.map((x) => clamp(x, 1, a - 1)))].filter((x) => x < a);
}

const settle = (h, x, step = 'deal') => { h.price = round(x); h.done = 'deal'; h.step = step; h.ask = h.price; return h; };
const tire = (h) => { if (h.patience <= 0 && !h.done) { h.done = 'last'; h.step = 'last'; h.ask = round(Math.max(h.floor, h.ask)); } return h; };

export function offer(h, x) {
  if (h.done) return h;
  h.last = x; h.said++;
  if (x >= h.ask) return settle(h, h.ask);
  if (x < h.floor * 0.78) { h.mood = clamp(h.mood - 0.4, -1, 1); h.patience -= 1; h.step = 'insult'; return tire(h); }
  // over his floor and he is pleased: he may simply take it
  const take = x >= h.floor ? clamp(0.15 + 0.55 * Math.max(0, h.mood) + 0.3 * (x - h.floor) / Math.max(1, h.ask - h.floor), 0, 0.92) : 0;
  if (h.rnd() < take) return settle(h, x);
  // otherwise he counters, coming down by more the happier he is (and never past his floor, nor below what they offered)
  const give = 0.2 + 0.35 * Math.max(0, h.mood + 0.3);
  h.ask = round(Math.max(h.floor, x + 1, h.ask - (h.ask - x) * give));
  h.mood = clamp(h.mood - 0.08, -1, 1);
  h.patience -= 1; h.step = 'counter';
  return tire(h);
}

export function flatter(h) {
  if (h.done) return h;
  h.flattered++; h.said++;
  if (h.flattered >= 3) { h.mood = clamp(h.mood - 0.25, -1, 1); h.patience -= 1; h.step = 'bored'; return tire(h); }
  h.mood = clamp(h.mood + 0.4 / h.flattered, -1, 1); h.step = 'flatter';
  return h;
}

export function clink(h) {
  if (h.done || h.clinked) return h;
  h.clinked = true; h.said++;
  h.mood = clamp(h.mood + 0.35, -1, 1);
  h.floor = round(Math.min(h.ask, h.floor * 1.06)); // (he has seen you can pay)
  h.step = 'clink';
  return h;
}

export function walk(h) {
  if (h.done === 'deal') return h;
  h.said++;
  if (h.mood > 0.15 && h.step !== 'callback' && !h.calledBack) {
    h.calledBack = true; h.ask = round(Math.max(h.floor, (h.ask + h.floor) / 2)); h.done = 'last'; h.step = 'callback';
    return h;
  }
  h.done = 'gone'; h.step = 'gone';
  return h;
}

/** Take his last price (after 'last' or 'callback'). */
export const accept = (h) => settle(h, h.ask);

/** How he feels, as one of the folk's moods (npc/folk.js). */
export function moodOf(h) {
  if (h.step === 'deal') return h.price >= h.list * 0.9 ? 'joy' : 'sly';
  if (h.step === 'insult' || h.mood < -0.5) return 'anger';
  if (h.step === 'gone') return 'sad';
  if (h.step === 'bored') return 'confused';
  if (h.step === 'clink') return 'awe';
  if (h.step === 'flatter') return 'joy';
  if (h.mood < -0.15) return 'sad';
  return 'sly';
}
