// ---------------------------------------------------------------------------------------
// A SIBLING POINTS: what the world gives is yours to take, so a sibling never picks anything up (Dovina's rulings, COOP.md C6); it
// points instead. Every few seconds it asks for what lies loose near it (the ecology's `shiny`: a cube of Lachryma on the ground; and
// what has dropped from the Pneuka Box onto the ground, game.ground) and pops a small gold mark over the nearest it has not pointed at
// yet (vfx/glyphs.js: a mark in the world, never text). Each thing is pointed at once by the party, not once by each. Espada, curious,
// looks further (18 m against 10).
//
// Prior art: Dragon's Dogma's pawns calling out loot ("Over here!"), the companion pings of Apex Legends (a mark on the thing, not a
// sentence), and Navi's "Hey! Look!" turned into a mark that does not talk.
//
//   const P = new SiblingPoint(sibling, seen)   P.update(dt, game)   (seen: the party's WeakSet of what has been pointed at)
// ---------------------------------------------------------------------------------------

const EVERY = 3, RANGE = 10, FAR = 18; // (seconds between looks; metres it looks, and Espada's)

export class SiblingPoint {
  constructor(S, seen) { this.S = S; this.seen = seen; this.t = 1 + (S.id.length % 3); this.range = S.id === 'espada' ? FAR : RANGE; }

  update(dt, game) {
    if ((this.t -= dt) > 0) return;
    this.t = EVERY;
    const at = this.S.pos, out = [];
    for (const o of game.ai?.eco?.all?.('shiny', at, this.range) || []) out.push({ ref: o.ref, pos: o.pos, what: o.what || 'shiny' });
    for (const it of game.ground?.list || []) if (it.pos && it.pos.distanceTo(at) < this.range) out.push({ ref: it, pos: it.pos, what: it.id || 'item' });
    let best = null, bd = Infinity;
    for (const o of out) { if (!o.ref || this.seen.has(o.ref)) continue; const d = o.pos.distanceTo(at); if (d < bd) { bd = d; best = o; } }
    if (!best) return;
    this.seen.add(best.ref);
    game.glyphs?.pop('bang1', best.pos.clone().setY(best.pos.y + 0.9), { color: 0xffd76a, size: 0.35 });
    game.events.emit('sibling.point', { sibling: this.S.id, what: best.what, by: 'sibling' });
  }
}
