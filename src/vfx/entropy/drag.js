// ---------------------------------------------------------------------------------------
// THE CARD DRAG (plain name; South, 2026-11-06: "I know you can make the card interactions with the board much better with dragging and
// contextual previews", "the hungry dice should be able to be fed at any point during the turn"): a card of your hand picked up with the
// mouse or a finger and dropped where it goes, for the board view (boardview.js). As it is lifted, every place it may go lights (a tile
// through look.tiles.light, a token, the Hungry Die, your discard pile); held over one, what would happen is shown there before you let
// go (preview.js: the tile's sum and its new one, 21 in your colour with the tile lifting in it, BUST in red, a court card's ghost and its
// march, a hurt and its x2, the die's fed count and next size) and the coach's words for it in the tip; let go, it is played; let go over
// nothing, it springs home. An ace asks 1 or 11 as two plates at the tile, each with its own preview. Looks and clicks only: what may be
// done is the coach's (session.coach()), the move the same `session.move` a click makes. A card picked in the play step whose places only
// exist once it is picked has them worked out on a copy of the state (rules.js cloneState, the coach on it), and played as two moves.
// Dovina's shapes (claude/dovina-design c12516f): a move whose pieceIds name a card and a token `k:<id>` (a place move { on, v }) is a
// card on that token; `{ feed: card }` (pieceIds [c, die:<seat>]) or the old `to: 'feed'` feeds the Hungry Die; `to: 'discard'` goes on
// your discard pile; what each does is the coach's `extra.preview(card, target)` (rules.js previewPlay) when it carries one, else worked
// out here (a hurt the card's value, x2 against the opposite suit: wands and cups, swords and pentacles).
//
// Prior art: Hearthstone's and Slay the Spire's card dragged out of the hand to its target (the arrow, the lit targets, the card shrinking
// over one), Balatro's held card tilting with its motion, Into the Breach's preview before you commit, Marvel Snap's card springing home.
//
//   new CardDrag(view)   .targets(card) -> Map(id -> [opt])   .begin(card, x, y, touch)   .move(x, y)   .end() -> bool   .cancel()
//   .tick(dt, t)   .on   .card   .over   .held() -> { x, y, small, tilt }   .lights(up)   .tip()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { cloneState, sidesOf, speedOf, ENTROPY_RULES as R } from '../../progress/casino/entropy/rules.js';
import { nameOf, isCourt, courtRank, rankOf, suitOf, valuesOf } from '../../progress/casino/entropy/cards.js';
import { coach as coachOf } from '../../progress/casino/coach/index.js';
import { LOOK } from './pieces.js';
import { DragPreview } from './preview.js';

export const CARD_DRAG = { start: 7, red: '#ff5a4a', redHex: 0xff4a3a, tilt: 0.0016, tiltMax: 0.35, small: 0.48, opposite: [3, 2, 1, 0] }; // (opposite suits by index: cups-wands, swords-pentacles)
const isFeed = (m) => m && (m.feed != null || m.to === 'feed'), isDiscard = (m) => m && m.to === 'discard';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const OURS = LOOK.sideCss(0);

export class CardDrag {
  constructor(view) {
    this.view = view; this.on = false; this.card = null; this.over = null; this.cache = new Map(); this.cacheKey = null;
    this.p = { x: 0, y: 0 }; this.vx = 0; this.tilt = 0; this.ink = new THREE.Color(); this.red = new THREE.Color(CARD_DRAG.redHex); this.ours = new THREE.Color(LOOK.ours);
  }
  attach(kit, root) { this.preview = new DragPreview(kit, root, this.view.game.camera); }
  detach() { this.cancel(); this.preview = null; this.cache.clear(); }

  // ------------------------------------------------------------- where a card may go
  /** Every place `card` may be dropped now, each with its options (an ace's two on one tile): Map(id -> [{ cm, kind, run }]). */
  targets(card) {
    const V = this.view, key = V.coachKey; if (key !== this.cacheKey) { this.cache.clear(); this.cacheKey = key; }
    if (this.cache.has(card)) return this.cache.get(card);
    const s = V.session, S = s?.S, C = V.coach, P = V.P, out = new Map(), cid = `c:${card}`;
    const put = (id, o) => { o.card = card; if (!out.has(id)) out.set(id, []); out.get(id).push(o); };
    const direct = (cm, pre = [], CC = C) => {
      const m = cm.move, ids = cm.pieceIds || [], run = pre.length ? () => this.chain(pre, m) : () => s.move(m);
      const tgt = m.at ? { at: m.at, v: m.v } : m.on != null ? { on: m.on, v: m.v } : null, pv = tgt ? CC?.extra?.preview?.(card, tgt) || null : null; // (the rules' own preview when the coach carries one: rules.js previewPlay)
      if (isFeed(m) && (ids.includes(cid) || m.card === card || m.feed === card)) return put('die:0', { cm, kind: 'feed', run });
      if (isDiscard(m) && (ids.includes(cid) || m.card === card)) return put('disc:0', { cm, kind: 'discard', run });
      if (!ids.includes(cid)) return;
      const tok = ids.find((id) => id.startsWith('k:')), tile = ids.find((id) => id.startsWith('t:'));
      if (tok) return put(tok, { cm, kind: 'hurt', run, pv });
      if (tile) return put(tile, { cm, kind: isCourt(card) ? 'token' : 'sum', run, pv });
    };
    if (C && P?.seat === 0 && S) {
      for (const cm of C.moves) direct(cm);
      // its places only come once it is picked (the play step): worked out on a copy, played as two moves
      const steps = [];
      if (P.kind === 'place' && P.card !== card) { const b = P.moves.find((m) => m.back); if (b) steps.push(b); }
      if (P.kind === 'play' || steps.length) {
        const C2 = this.sim(steps); const pick = C2 && this.simP?.kind === 'play' && this.simP.moves.find((m) => m.card === card);
        if (pick) { const C3 = this.sim([...steps, pick]); if (C3 && this.simP?.kind === 'place') for (const cm of C3.moves) if (!cm.move.back) direct(cm, [...steps, pick], C3); }
      }
    }
    this.cache.set(card, out); return out;
  }
  /** The coach for the state after `steps` (on a copy: the table's own state is never touched). */
  sim(steps) {
    const s = this.view.session; try {
      const S = cloneState(s.S), T = s.T; for (const m of steps) T.game.apply(S, m, () => 0.5);
      this.simP = T.game.pending(S); return this.simP?.seat === 0 ? coachOf(T, S, 0, {}) : null;
    } catch { this.simP = null; return null; }
  }
  /** Moves `pre` made, then the one in the pending that matches `m` (the copy's move objects are not the table's). */
  chain(pre, m) {
    const s = this.view.session; for (const p of pre) { const live = s.T.game.pending(s.S)?.moves.find((x) => same(x, p)); if (!live) return; s.move(live); }
    const last = s.T.game.pending(s.S)?.moves.find((x) => same(x, m)); if (last) s.move(last);
  }

  // ------------------------------------------------------------- the hand
  begin(card, x, y, touch) {
    if (!this.targets(card).size) return false;
    this.on = true; this.card = card; this.touch = !!touch; this.p = { x, y }; this.vx = 0; this.over = null; this.view.plates?.choose(null); return true;
  }
  move(x, y) { if (!this.on) return; this.vx = this.vx * 0.6 + (x - this.p.x) * 0.4; this.p = { x, y }; }
  /** Let go: played (an ace's two values as plates at the tile), or sprung home (returns false). */
  end() {
    if (!this.on) return false; const card = this.card, over = this.over, opts = over ? this.targets(card).get(over) : null; this.cancel();
    if (!opts?.length) { const e = this.view.cards?.get(card); if (e) e.spring = 1; return false; }
    if (opts.length === 1) { if (opts[0].kind === 'feed') { const e = this.view.cards?.get(card); if (e) this.view.corners?.feast(card, { x: e.x + innerWidth / 2, y: e.y }); } opts[0].run(); return true; } // (fed: the card flies into the corner's die, corners.js)
    const at = this.screenOf(over), cms = opts.map((o) => ({ ...o.cm, run: o.run, label: o.cm.move.v != null ? `As ${o.cm.move.v}` : o.cm.label, preview: this.say(o) }));
    this.view.plates?.choose(cms, at.x, at.y); return true;
  }
  cancel() { this.on = false; this.card = null; this.over = null; this.preview?.hide(); }
  screenOf(id) { if (id === 'die:0' && this.view.corners?.on) return this.view.corners.dieScreen(); const v = this.posOf(id, new THREE.Vector3()).project(this.view.game.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; }
  /** Where a target stands in the world (a tile's top, a token, the die, the discard pile). */
  posOf(id, out) {
    const V = this.view;
    if (id.startsWith('t:')) { const [x, z] = id.slice(2).split('.').map(Number); return V.look.tiles.top(x, z, out); }
    if (id.startsWith('k:')) { const e = V.tokens.get(+id.slice(2)); return out.copy(e ? e.pos : V.bomb.group.position); }
    if (id === 'die:0') return out.copy(V.dice[0].pos);
    if (id === 'disc:0') return out.copy(V.piles[0].disc.group.position);
    return out.set(0, 0, 0);
  }
  /** Where the held card is drawn (the overlay's px, y up from the bottom): under the cursor, over the finger, small over a target. */
  /** (Over a target it steps aside, small, so the preview under it shows.) */
  held(ch) { const o = this.over ? ch * 0.75 : 0; return { x: this.p.x - innerWidth / 2 + o, y: innerHeight - this.p.y + (this.touch ? ch * 0.6 : 0) + o * 0.5, small: this.over ? CARD_DRAG.small : 1.06, tilt: Math.max(-CARD_DRAG.tiltMax, Math.min(CARD_DRAG.tiltMax, -this.vx * CARD_DRAG.tilt * 20)) }; }

  // ------------------------------------------------------------- what it would do
  /** An option's outcome as words (the plates' small line, the tip). */
  say(o) {
    const m = o.cm.move, S = this.view.session.S;
    if (o.cm.preview) return o.cm.preview;
    if (o.kind === 'sum') { const T = S.tiles[m.at[1] * R.size + m.at[0]], sum = T.s + m.v; return sum === R.twentyOne ? 'Exactly 21: the tile turns yours' : sum > R.twentyOne ? `${T.s} + ${m.v}: bust, back to 0` : `${T.s} to ${sum}`; }
    if (o.kind === 'hurt') { const h = this.hurtOf(o); return `${h.dmg} damage${h.x2 ? ' (x2: the opposite suit)' : ''}${h.falls ? ': it falls' : ''}`; }
    return o.cm.what || '';
  }
  hurtOf(o) {
    const m = o.cm.move, S = this.view.session.S, id = +(o.cm.pieceIds.find((x) => x.startsWith('k:')) || 'k:0').slice(2), t = S.tokens.find((x) => x.id === id), cs = suitOf(o.card);
    if (o.pv?.dmg != null) return { dmg: o.pv.dmg, x2: o.pv.mult === 2, t, hp: o.pv.hp, falls: o.pv.falls ?? o.pv.kind === 'down' };
    const x2 = !!t && CARD_DRAG.opposite[cs] === t.suit, v = m.v ?? Math.max(...valuesOf(o.card)), dmg = m.dmg ?? v * (x2 ? 2 : 1);
    return { dmg, x2, t, hp: t?.hp, falls: t?.hp != null && t.hp - dmg <= 0 };
  }
  /** The preview's plate, ghost and path for the target under the card. */
  show(id, opts) {
    const V = this.view, S = V.session.S, at = this.posOf(id, new THREE.Vector3()), o = opts[0], m = o.cm.move, card = this.card;
    if (o.kind === 'sum') {
      const T = S.tiles[m.at[1] * R.size + m.at[0]];
      if (opts.length > 1) { const segs = []; opts.forEach((q, i) => { const sum = T.s + q.cm.move.v; if (i) segs.push({ t: '/', color: LOOK.inkDim }); segs.push({ n: sum > R.twentyOne ? 0 : sum, color: sum === R.twentyOne ? OURS : sum > R.twentyOne ? CARD_DRAG.red : LOOK.ink }); }); return this.preview.show({ at, segs: [{ n: T.s, color: LOOK.inkDim }, { arrow: true }, ...segs] }); }
      const pv = o.pv, sum = pv?.kind === 'turn' ? R.twentyOne : pv?.kind === 'bust' ? Math.max(R.twentyOne + 1, (pv.was ?? T.s) + m.v) : pv?.sum ?? T.s + m.v;
      if (sum === R.twentyOne) return this.preview.show({ at, segs: [{ n: T.s, color: LOOK.inkDim }, { arrow: true }, { n: 21, color: OURS }, { t: T.o === 0 ? 'yours' : 'turns yours', color: OURS }] });
      if (sum > R.twentyOne) return this.preview.show({ at, segs: [{ t: 'bust', color: CARD_DRAG.red }, { n: sum, color: CARD_DRAG.red }, { arrow: true, color: CARD_DRAG.red }, { n: 0, color: CARD_DRAG.red }] });
      return this.preview.show({ at, segs: [{ n: T.s, color: LOOK.inkDim }, { arrow: true }, { n: sum }, { t: `${R.twentyOne - sum} to 21`, color: LOOK.inkDim }] });
    }
    if (o.kind === 'token') {
      const rank = o.pv?.rank ?? courtRank(card) + (S.cls[0] === 'empress' ? R.empressRank : 0), speed = o.pv?.speed ?? speedOf(S, { owner: 0, suit: suitOf(card), speed: courtRank(card) }, R), [x, z] = m.at, path = [];
      for (let k = 1, nz = z - 1; k <= speed && nz >= 0; k++, nz--) { if (S.bomb.x === x && S.bomb.z === nz) break; const u = S.tokens.find((q) => q.x === x && q.z === nz); if (u?.owner === 0) break; path.push(V.look.tiles.top(x, nz, new THREE.Vector3())); if (u) break; }
      return this.preview.show({ at, segs: [{ t: `rank ${rank}` }, ...(o.pv?.hp != null ? [{ n: o.pv.hp, color: OURS }, { t: 'hp', color: LOOK.inkDim }] : []), { t: `${speed} a turn`, color: OURS }], path, dir: -1, ghost: { suit: suitOf(card), owner: 0, rank, speed, at }, rise: 0.2, dz: 1.5 }) // (the plate before the tile, toward you: the column ahead is the march's);
    }
    if (o.kind === 'hurt') {
      const h = this.hurtOf(o), segs = [{ n: h.dmg, color: CARD_DRAG.red }, { t: 'damage', color: CARD_DRAG.red }];
      if (h.x2) segs.push({ t: 'x2', color: '#ffd36a' });
      if (h.hp != null) { const left = Math.max(0, h.hp - h.dmg); segs.push({ n: h.hp, color: LOOK.inkDim }, { arrow: true }, left && !h.falls ? { n: left } : { t: 'down', color: CARD_DRAG.red }); }
      return this.preview.show({ at, segs, rise: 3.2 });
    }
    if (o.kind === 'feed') { const f = S.fed[0], a = sidesOf(f), b = sidesOf(f + 1), ds = this.screenOf(id); return this.preview.show({ at, screen: { x: ds.x, y: ds.y - ds.r * 3.4 }, segs: [{ t: 'fed' }, { n: f, color: LOOK.inkDim }, { arrow: true }, { n: f + 1 }, ...(b !== a ? [{ n: `d${a}`, color: LOOK.inkDim }, { arrow: true }, { n: `d${b}`, color: OURS }] : [{ t: `d${a}`, color: LOOK.inkDim }])], rise: 2.3 }); }
    return this.preview.show({ at, segs: [{ t: o.kind === 'discard' ? 'discard' : o.cm.label }], rise: 1.2 });
  }
  tick(dt, t) {
    if (!this.on) { this.preview?.tick(dt, t); return; }
    const V = this.view, T = this.targets(this.card); let id = V.hover;
    if (id?.startsWith('t:') && !T.has(id)) { const [x, z] = id.slice(2).split('.').map(Number), u = V.session.S.tokens.find((q) => q.x === x && q.z === z); if (u && T.has(`k:${u.id}`)) id = `k:${u.id}`; } // (the tile under a target token: the token)
    if (id?.startsWith('k:') && !T.has(id)) { const u = V.session.S.tokens.find((q) => `k:${q.id}` === id); if (u && T.has(`t:${u.x}.${u.z}`)) id = `t:${u.x}.${u.z}`; }
    this.over = id && T.has(id) ? id : null;
    if (this.over) this.show(this.over, T.get(this.over)); else this.preview.hide();
    this.preview.tick(dt, t); this.vx *= Math.exp(-6 * dt);
  }
  /** What the drag lights (into the view's `lit` and the tiles' colours): every target, the one under the card most, in what it would make. */
  lights(up, colors) {
    if (!this.on) return; const T = this.targets(this.card), S = this.view.session.S;
    up(`c:${this.card}`, 1);
    for (const [id, opts] of T) {
      const over = id === this.over; up(id, over ? 1 : 0.62);
      if (!over || !id.startsWith('t:') || opts[0].kind !== 'sum' || opts.length > 1) continue;
      const m = opts[0].cm.move, sum = S.tiles[m.at[1] * R.size + m.at[0]].s + m.v; if (sum >= R.twentyOne) colors.set(id, sum === R.twentyOne ? this.ours : this.red);
    }
  }
  tip() {
    if (!this.on) return null; const opts = this.over ? this.targets(this.card).get(this.over) : null;
    if (!opts) return { title: nameOf(this.card), lines: [rankOf(this.card) === 1 ? 'An ace: 1 or 11' : isCourt(this.card) ? 'A court card: a token on your back rank' : `Adds ${rankOf(this.card)} to a tile`, 'Drop it on a lit place'], moves: [] };
    return { title: nameOf(this.card), lines: [], moves: opts.map((o) => ({ label: o.cm.label, what: o.cm.what, preview: this.say(o) })) };
  }
}
