// ---------------------------------------------------------------------------------------
// DECOR: the pieces a player places in the Spirit Garden for their looks, what each costs and where it comes from, the shed's storage,
// and the garden's rating (docs/plans/GARDEN-COZY.md section D, a plan the owner prunes; plain-named until the owner rules). Rules and
// state only: placing a piece on its planetoid's grid is Petra's (the decor layer), drawing it Calissa's, its sound Wanda's.
//
// - THE CATALOGUE: about forty pieces, the plain things every garden wants and five sets, one a feeling, plus pieces that sound, pieces
//   of a season and pieces of briar. Each has two ways or more to get it (CLAUDE.md: every source of growth has a count way and a feat
//   way). A piece once owned stays in the catalogue, bought again for more copies; a tint is free once the piece is owned.
// - STORAGE: a piece bought is one copy in the shed's storage; placing takes it out, picking it up puts it back whole.
// - THE RATING: variety over quantity, region by region (a quarter of a cube face of a planetoid's decor grid): a region's points are
//   half a point a piece up to three pieces a kind, plus three quarters of a point a kind, so a field of one piece scores little and a
//   corner of six kinds scores well; a region over CLUTTER of its cells full scores half; a set finished near its centrepiece adds
//   SET.bonus. Never shown as a number: as the lotuses open on the Dantian's lake (LOTUSES), in the folk visitors' remarks, in the log.
//
// Prior art: Animal Crossing: New Horizons' island rating (scenery scored by variety in each 8x8 cell, a cluttered cell penalised, the
// rating said by Isabelle and never shown; nintendolife.com's data-mined guide), its storage and remakes (a piece picked up kept whole,
// a variant free once owned), the Happy Home Academy (a matched set scores double), Viva Pinata's garden that draws visitors by what it
// shows, and Stardew Valley's bundles (a set finished restores something you can see).
//
//   DECOR[id] = { name, set, size, tints, from: [sources] }   SETS, SOURCES, LOTUSES, CLUTTER, SET   priceOf(id) -> cubes
//   regionPoints(pieces) -> n   rating(pieces, { cellsOf }) -> { points, lotuses, regions, sets }   (pieces: [{ id, region, pos }])
//   game.decor = new Decor(game)   .owns(id)   .stored(id)   .give(id, from)   .buy(id) -> { ok, why? }   .take(id) -> bool   .put(id)
//   .place(id, at, { yaw, tint }) -> i   .move(i, at?, yaw?)   .remove(i)   .s.placed: [[id, planetoid, face, iu, iv, yaw, tint]]
//   events: decor.get { id, from, n }   decor.buy { id, cubes }   decor.refuse { id, why }   decor.place / decor.move / decor.remove { id, planetoid }
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';

/** Where a piece comes from (two or more a piece): the shed's catalogue; a spirit's gift on the doorstep at dawn; a spirit's thanks for a
 *  wish; a visitor's gift; a lotus opening (its set's recipe: then bought); a season's (that season only); briar fruit. */
export const SOURCES = ['shop', 'gift', 'wish', 'visitor', 'lotus', 'season', 'briar'];
/** The sets: five feelings' (their place in the Five Phases, SPIRIT-GARDEN.md 1), the sounding pieces, the seasons, the briar. */
export const SETS = {
  plain: { name: 'Garden Basics' },
  wonder: { name: 'Moss and Stone' }, mirth: { name: 'Festival' }, desire: { name: 'Tea Garden' }, grief: { name: 'Rain Garden' },
  dread: { name: 'Koi Pond' }, sound: { name: 'Sound' }, season: { name: 'Seasons' }, briar: { name: 'Briar' },
};
const P = (name, set, size, tints, from, season) => ({ name, set, size, tints, from, ...(season ? { season } : {}) });
/** The catalogue (names plain, Espada's to rule; the looks Calissa's). `size`: small 1 cell, medium 2 x 2, large 3 x 3, centre 4 x 4. */
export const DECOR = {
  // the plain things every garden wants (bought any time)
  pathStone: P('Path Stone', 'plain', 'small', 4, ['shop', 'gift']),
  steppingStone: P('Stepping Stone', 'plain', 'small', 4, ['shop', 'gift']),
  bambooFence: P('Bamboo Fence', 'plain', 'small', 4, ['shop', 'visitor']),
  gardenGate: P('Garden Gate', 'plain', 'medium', 4, ['shop', 'visitor']),
  bench: P('Bench', 'plain', 'medium', 4, ['shop', 'gift']),
  planterBox: P('Planter Box', 'plain', 'small', 4, ['shop', 'gift']),
  flowerPot: P('Flower Pot', 'plain', 'small', 4, ['shop', 'gift']),
  waterBasin: P('Water Basin', 'plain', 'small', 4, ['shop', 'wish']),
  rock: P('Rock', 'plain', 'small', 4, ['shop', 'gift']),
  boulder: P('Boulder', 'plain', 'medium', 4, ['shop', 'visitor']),
  bridge: P('Bridge', 'plain', 'large', 4, ['shop', 'wish']),
  arbor: P('Arbor', 'plain', 'large', 4, ['shop', 'wish']),
  // Wonder: moss and stone (wood)
  stoneLantern: P('Stone Lantern', 'wonder', 'medium', 4, ['shop', 'gift']),
  mossMound: P('Moss Mound', 'wonder', 'small', 4, ['shop', 'gift']),
  gravelBed: P('Raked Gravel', 'wonder', 'medium', 4, ['shop', 'wish']),
  bonsaiStand: P('Bonsai Stand', 'wonder', 'small', 4, ['gift', 'wish']),
  moonDeck: P('Moon-Viewing Deck', 'wonder', 'centre', 4, ['lotus', 'wish']),
  // Mirth: a festival (fire)
  lanternString: P('Lantern String', 'mirth', 'small', 4, ['shop', 'gift']),
  festivalDrum: P('Festival Drum', 'mirth', 'medium', 4, ['shop', 'visitor']),
  pinwheel: P('Pinwheel', 'mirth', 'small', 4, ['shop', 'gift']),
  streamerPole: P('Streamer Pole', 'mirth', 'small', 4, ['gift', 'wish']),
  bandstand: P('Bandstand', 'mirth', 'centre', 4, ['lotus', 'wish']),
  // Desire: a tea garden (earth)
  teaTable: P('Tea Table', 'desire', 'medium', 4, ['shop', 'gift']),
  floorCushion: P('Floor Cushion', 'desire', 'small', 4, ['shop', 'gift']),
  parasol: P('Parasol', 'desire', 'medium', 4, ['shop', 'visitor']),
  teaKettle: P('Tea Kettle', 'desire', 'small', 4, ['gift', 'wish']),
  teaHouse: P('Tea House', 'desire', 'centre', 4, ['lotus', 'wish']),
  // Grief: a rain garden (metal)
  rainChain: P('Rain Chain', 'grief', 'small', 4, ['shop', 'gift']),
  willow: P('Weeping Willow', 'grief', 'large', 4, ['shop', 'wish']),
  rainBarrel: P('Rain Barrel', 'grief', 'small', 4, ['shop', 'gift']),
  windBell: P('Wind Bell', 'grief', 'small', 4, ['gift', 'visitor']),
  rainPavilion: P('Rain Pavilion', 'grief', 'centre', 4, ['lotus', 'wish']),
  // Dread: a koi pond (water)
  koiBridge: P('Koi Bridge', 'dread', 'large', 4, ['shop', 'wish']),
  mistStone: P('Mist Stone', 'dread', 'small', 4, ['shop', 'gift']),
  lilyPads: P('Lily Pads', 'dread', 'small', 4, ['shop', 'gift']),
  stoneFrog: P('Stone Frog', 'dread', 'small', 4, ['gift', 'visitor']),
  moonGate: P('Moon Gate', 'dread', 'centre', 4, ['lotus', 'wish']),
  // what sounds where it stands (GARDEN-COZY.md B5: Wanda's)
  windChime: P('Wind Chime', 'sound', 'small', 4, ['shop', 'gift']),
  musicBox: P('Music Box', 'sound', 'small', 4, ['wish', 'visitor']),
  gramophone: P('Gramophone', 'sound', 'medium', 4, ['wish', 'lotus']),
  // a season's (E): bought in its season, given in any
  blossomTree: P('Blossom Tree', 'season', 'large', 2, ['season', 'gift'], 'spring'),
  reedScreen: P('Reed Screen', 'season', 'medium', 2, ['season', 'gift'], 'summer'),
  pumpkinLantern: P('Pumpkin Lantern', 'season', 'small', 2, ['season', 'gift'], 'autumn'),
  snowLantern: P('Snow Lantern', 'season', 'small', 2, ['season', 'gift'], 'winter'),
  // briar (A6): made from briar fruit, or brought by a briar visitor
  brambleHedge: P('Bramble Hedge', 'briar', 'small', 2, ['briar', 'visitor']),
  thornArch: P('Thorn Arch', 'briar', 'medium', 2, ['briar', 'visitor']),
  briarThrone: P('Briar Throne', 'briar', 'centre', 2, ['briar', 'wish']),
};
/** A piece's cells on the grid by its size (GARDEN-COZY.md D1: about a metre a cell). */
export const CELLS = { small: 1, medium: 4, large: 9, centre: 16 };
/** What a piece costs: its size's minutes of play (ECON.decor). */
export const priceOf = (id) => Math.round((ECON.decor[DECOR[id]?.size] || 0) * ECON.perMinute);

/** The rating's numbers. A region's points: `piece` a piece, counted up to `perKind` of each kind, plus `kind` a kind. */
export const REGION = { piece: 0.5, perKind: 3, kind: 0.75 };
/** A region more than this share of its cells full is cluttered and scores half (Animal Crossing's 45 of 64). */
export const CLUTTER = { full: 0.7, scale: 0.5 };
/** A set finished: every piece of it placed within `reach` metres of its centrepiece on one planetoid adds `bonus`. */
export const SET = { reach: 8, bonus: 15 }; // (a set finished is worth about a lake lotus: measured, scripts/garden-cozy.mjs)
/** The lotuses on the Dantian's lake open at these points (0 to 5). Measured against the first set (scripts/garden.mjs): about 40
 *  pieces well spread earn 3, so 4 and 5 ask for the sets finished and the catalogue's breadth. */
export const LOTUSES = [8, 20, 40, 70, 110];

/** A region's points from its pieces (variety over quantity). */
export function regionPoints(pieces = []) {
  const by = {};
  for (const p of pieces) by[p.id] = (by[p.id] || 0) + 1;
  const kinds = Object.keys(by).length;
  return Object.values(by).reduce((n, c) => n + Math.min(c, REGION.perKind) * REGION.piece, 0) + kinds * REGION.kind;
}

/** The garden's rating from its placed pieces: [{ id, region, pos: [x, y, z], planet }]. `cellsOf(region)`: a region's cells (64 if
 *  not said). Returns the points, the lotuses open, the points by region and the sets finished. */
export function rating(pieces = [], { cellsOf = () => 64 } = {}) {
  const regions = {};
  for (const p of pieces) (regions[p.region] ||= []).push(p);
  let points = 0; const byRegion = {};
  for (const [r, list] of Object.entries(regions)) {
    const full = list.reduce((n, p) => n + (CELLS[DECOR[p.id]?.size] || 1), 0) / Math.max(1, cellsOf(r));
    const pts = regionPoints(list) * (full > CLUTTER.full ? CLUTTER.scale : 1);
    byRegion[r] = +pts.toFixed(2); points += pts;
  }
  const sets = [];
  for (const set of Object.keys(SETS)) {
    const ids = Object.keys(DECOR).filter((id) => DECOR[id].set === set), centre = ids.find((id) => DECOR[id].size === 'centre');
    if (!centre) continue;
    for (const c of pieces.filter((p) => p.id === centre)) {
      const near = (id) => pieces.some((p) => p.id === id && p.planet === c.planet && Math.hypot(p.pos[0] - c.pos[0], p.pos[1] - c.pos[1], p.pos[2] - c.pos[2]) <= SET.reach);
      if (ids.every((id) => id === centre || near(id))) { sets.push(set); points += SET.bonus; break; }
    }
  }
  const lotuses = LOTUSES.filter((n) => points >= n).length;
  return { points: +points.toFixed(2), lotuses, regions: byRegion, sets };
}

const fresh = () => ({ owned: {}, stored: {}, placed: [] }); // (placed: [id, planetoid, face, iu, iv, yaw, tint] a piece: half-cells on the decor grid, world/garden/decorgrid.js; with storage in one section, so the two always agree)

export class Decor {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('decor', { scope: 'player', version: 1,
      dump: () => this.s,
      load: (d) => { if (d && typeof d.owned === 'object') this.s = { ...fresh(), ...d }; },
      reset: () => { this.s = fresh(); } });
  }
  owns(id) { return !!this.s.owned[id]; }
  stored(id) { return this.s.stored[id] || 0; }
  /** What the shed's catalogue offers now: every piece once owned; the plain pieces always; a set's shop pieces once any piece of that
   *  set is owned (a gift or a wish brings the set in: discovery, Animal Crossing's catalogue); a season's in its season. */
  catalogue(season = null) {
    const met = new Set(Object.keys(this.s.owned).map((id) => DECOR[id]?.set));
    return Object.keys(DECOR).filter((id) => { const D = DECOR[id];
      if (this.owns(id)) return true;
      if (D.from.includes('season')) return D.season === season;
      return D.from.includes('shop') && (D.set === 'plain' || met.has(D.set)); });
  }
  /** A piece given (a gift, a wish's thanks, a visitor's, a lotus's recipe, briar fruit made into it): one copy to storage. */
  give(id, from = 'gift', n = 1) {
    if (!DECOR[id]) return false;
    const first = !this.s.owned[id];
    this.s.owned[id] = true; this.s.stored[id] = (this.s.stored[id] || 0) + n;
    this.game.events?.emit('decor.get', { id, from, n, first, by: 'courier' });
    this.game.save?.dirty('decor');
    return true;
  }
  /** A piece bought at the shed's catalogue: its price in cubes, one copy to storage. */
  buy(id, { season = null } = {}) {
    const no = (why) => { this.game.events?.emit('decor.refuse', { id, why, by: 'courier' }); return { ok: false, why }; };
    if (!DECOR[id]) return no('unknown');
    if (!this.catalogue(season).includes(id)) return no('locked');
    const c = priceOf(id);
    if (!this.game.cubes?.spend?.(c, 'decor')) return no('cubes');
    this.game.events?.emit('decor.buy', { id, cubes: c, by: 'courier' });
    this.give(id, 'shop');
    return { ok: true };
  }
  /** Placing takes a copy out of storage; picking up puts it back. */
  take(id) { if (!this.stored(id)) return false; this.s.stored[id]--; this.game.save?.dirty('decor'); return true; }
  /** The layout: a piece from storage set at a cell `at` = { planetoid, face, iu, iv } (half-cells), turned `yaw` steps, in `tint`.
   *  Returns its index, or -1 when none is in storage. */
  place(id, at, { yaw = 0, tint = 0 } = {}) {
    if (!this.take(id)) { this.game.events?.emit('decor.refuse', { id, why: 'stored', by: 'courier' }); return -1; }
    this.s.placed.push([id, at.planetoid, at.face, at.iu, at.iv, yaw, tint]);
    this.game.events?.emit('decor.place', { id, planetoid: at.planetoid, by: 'courier' });
    return this.s.placed.length - 1;
  }
  /** A placed piece moved or turned where it stands (no storage touched). */
  move(i, at, yaw) {
    const P = this.s.placed[i]; if (!P) return false;
    if (at) { P[1] = at.planetoid; P[2] = at.face; P[3] = at.iu; P[4] = at.iv; } if (yaw != null) P[5] = yaw;
    this.game.save?.dirty('decor'); this.game.events?.emit('decor.move', { id: P[0], planetoid: P[1], by: 'courier' }); return true;
  }
  /** A placed piece picked up: back to storage whole. */
  remove(i) {
    const P = this.s.placed[i]; if (!P) return false;
    this.s.placed.splice(i, 1); this.put(P[0]);
    this.game.events?.emit('decor.remove', { id: P[0], planetoid: P[1], by: 'courier' }); return true;
  }
  /** Every piece on a planetoid that was taken away (a reset never loses a piece: they go back to storage). */
  clearPlanetoid(planetoid) { for (let i = this.s.placed.length - 1; i >= 0; i--) if (this.s.placed[i][1] === planetoid) this.remove(i); }
  put(id) { if (!DECOR[id]) return false; this.s.stored[id] = this.stored(id) + 1; this.game.save?.dirty('decor'); return true; }
}
