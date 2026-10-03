// ---------------------------------------------------------------------------------------
// ECOLOGY: the world as a creature sees it, in two halves.
//
// AFFORDANCES: what the world offers a body with wants. Water to drink and soak in, food to eat, shade to rest in, a den to sleep in,
// something shiny to look at, prey. A place that offers something says so here (`offer`: the oasis's shallows, a palm's shade, a
// den); things that come and go are found by a PROVIDER asked when needed (`provide`: the baubles lying on the sand, wet slip, the fish
// in the pond). A creature's mind asks `find('water', where, how far)` and never knows what a pond is: put a trough in a new room,
// offer it as water, and every creature that thirsts will find it.
//
// RELATIONS: what each kind of thing is to each other kind: KIN (stay near, answer their calls, mourn them), PREY (hunt it when
// hungry), THREAT (keep away, flee when hurt), RIVAL (drive it off its ground), CURIOUS (go and look), NEUTRAL. A table by kind, with
// an individual's own exceptions on top (`c.rel`, a Map from a kind or a particular thing to a relation): a jelly reprogrammed to take
// the Courier for kin follows them and fights what they fight, without its kind changing its mind about them.
//
//   eco.offer({ kind: 'water', pos, radius: 2 })   eco.provide('food', (pos, range) => [{ pos, ref, amount }])   eco.withdraw(o)
//   eco.find('shade', pos, 30, { filter: (a) => ..., near: true })   eco.all('food', pos, 12)
//   eco.relation(creature, other) -> 'kin' | 'prey' | 'threat' | 'rival' | 'curious' | 'neutral'     eco.relate('jelly', 'fish', 'prey')
//   kindOf(entity) -> 'courier' | a creature's kind | 'clapperjar' | ...
//
// Prior art: The Sims' smart objects (objects advertise what they satisfy; the Sim picks the best advertisement for its needs: Will
// Wright and Don Hopkins), and Rain World's relationship table (every creature type is something to every other: eats, afraid of,
// ignores, antagonizes, with individual exceptions learned in play: Joar Jakobsson and James Primate), and the food chains of
// Monster Hunter's and Breath of the Wild's open fields.
// ---------------------------------------------------------------------------------------

export const REL = { KIN: 'kin', PREY: 'prey', THREAT: 'threat', RIVAL: 'rival', CURIOUS: 'curious', NEUTRAL: 'neutral' };

/** The kinds' standing relations (a row is how the first kind sees each other kind). Unlisted pairs are neutral. */
const TABLE = {
  slipjelly: { slipjelly: REL.KIN, courier: REL.PREY, fish: REL.PREY, clapperjar: REL.CURIOUS, spirit: REL.RIVAL },
  // a smoke spirit (spirits.js: the Crucibelle's and the Lockheart's): the Courier's, and against whatever is against them
  spirit: { spirit: REL.KIN, courier: REL.KIN, slipjelly: REL.RIVAL },
  clapperjar: { clapperjar: REL.KIN, courier: REL.CURIOUS, slipjelly: REL.THREAT },
};

export const kindOf = (e) => (!e ? null : e.isPlayer || e.type === 'player' ? 'courier' : e.type === 'creature' ? e.kind : e.type === 'clapper' ? 'clapperjar' : e.kind ?? e.type ?? null);

export class Ecology {
  constructor(game) {
    this.game = game;
    this.offers = [];
    this.providers = new Map(); // kind -> [fn]
    this.table = JSON.parse(JSON.stringify(TABLE));
  }

  // ---------------------------------------------------------------- affordances
  offer(o) { o.radius ??= 1; o.amount ??= Infinity; o.alive ??= true; this.offers.push(o); return o; }
  withdraw(o) { o.alive = false; const i = this.offers.indexOf(o); if (i >= 0) this.offers.splice(i, 1); }
  provide(kind, fn) { if (!this.providers.has(kind)) this.providers.set(kind, []); this.providers.get(kind).push(fn); }

  /** Everything of a kind within `range` of `pos` (standing offers and what the providers find). */
  all(kind, pos, range) {
    const out = [];
    for (const o of this.offers) if (o.alive && o.kind === kind && o.amount > 0 && dist2(o.pos, pos) < (range + o.radius) ** 2) out.push(o);
    for (const fn of this.providers.get(kind) || []) { try { for (const o of fn(pos, range) || []) { o.kind ??= kind; o.radius ??= 0.3; out.push(o); } } catch { /* a provider that failed offers nothing */ } }
    return out;
  }
  /** The best of a kind within range: the nearest (its radius allowed for), or the highest `score(a, d)`. */
  find(kind, pos, range, { filter = null, score = null } = {}) {
    let best = null, bs = -Infinity;
    for (const a of this.all(kind, pos, range)) {
      if (filter && !filter(a)) continue;
      const d = Math.max(0, Math.sqrt(dist2(a.pos, pos)) - (a.radius ?? 0));
      const s = score ? score(a, d) : -d;
      if (s > bs) { bs = s; best = a; }
    }
    if (best) best.d = Math.max(0, Math.sqrt(dist2(best.pos, pos)) - (best.radius ?? 0));
    return best;
  }

  // ---------------------------------------------------------------- relations
  relate(a, b, rel) { (this.table[a] ||= {})[b] = rel; }
  /** What `other` is to creature `c`: its own exceptions first (by the thing itself, then by its kind), then the table. */
  relation(c, other) {
    const k = kindOf(other);
    const own = c.rel?.get(other) ?? c.rel?.get(k);
    if (own) return own;
    return this.table[c.kind]?.[k] ?? REL.NEUTRAL;
  }
}

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 * 0.25 + (a.z - b.z) ** 2; // (height counts for less: things on a slope)
