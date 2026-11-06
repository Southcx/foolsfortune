// ---------------------------------------------------------------------------------------
// THE BOARD VIEW (plain name; South, 2026-11-06: "take the orientation of Hearthstone or MTG: arena as a base", "cosmic-themed, abstract,
// eldritch and avant-garde", "I don't want you guys to anchor to the current artstyle"; docs/plans/ENTROPY-TACTICS.md 7; Dovina's handoff
// docs/handoffs/calissa/2026-11-06-from-dovina-entropy-room.md): Entropy Tactics played on its own board while you are seated, in place of
// the seat's text page (world/bazaar/views.js, hidden while this is up). Looks and clicks only: the rules are Dovina's (progress/casino/
// entropy/), what each moment means is the coach's (progress/casino/coach/entropy.js, through `session.coach()`), and every click is the
// same `session.move` the page's button would make.
//   The camera: your own, from behind your seat, high and tipped down (CAMERA's pitch and field of view), its distance and aim fitted so the
//     board, both Arcana and both dice stand above your hand at any aspect; eased in on enter, handed back exactly as found on leave.
//   The pieces (pieces.js, the one look; version 2, ENTROPY-TACTICS.md 8): each tile's owner and sum from S.tiles (tiles.js own, sum; a
//     21 turns it, flip; a bust shudders it), court tokens by suit and rank on look.tiles.top(x, z) every frame, advancing along their
//     column, clashing where they meet, a wand's strike flying at their Arcana, a cup flying home to its deck, the rest frayed into motes
//     when downed; each seat's deck and discard as stacks by its Arcana, its fed count under its die; the Grand Bomb sliding when
//     pushed (a shudder and a flash), its thirty ticks burning down with the counter; the Hungry Die by its sides, yours at the near right
//     and theirs at the far left, thrown tumbling beside the bomb when the roll comes up and settled with its number; each Arcana a slab at
//     its back edge (yours behind row 6, theirs beyond row 0), flashed when struck; your hand fanned on the overlay's scene (render/
//     overlayscene.js: drawn after the post pass, so the tilt-shift never blurs it), theirs face down at the far edge.
//   The choices: a piece any choice names is lit (a tile through look.tiles.light, a token, card, the bomb or an Arcana by its rim) and
//     lifts under the cursor with a tip; a card is played (click it), then placed (a lit tile; an ace's 1 or 11 as two plates; the card
//     again puts it back), the rest carved card by card (keep, feed, discard as plates on the card); a piece naming several choices offers
//     them as plates; the choices that are no piece stand on the bar (boardplates.js: done, fatigue or reshuffle, the bomb's). Touch: a tap a click,
//     a long press the tip. The bots' turns play out on the board as the state changes (diffed each tick and from the table's log).
// It runs from the room's tick and its tickModal (the seat's page pauses the world: world/entropy/entropyroom.js), through EntropyLook.
//
// Prior art: Hearthstone's and MTG Arena's boards (your side, tipped away; your hand fanned low; the other's held cards face down far
// away), Into the Breach's shown threats and moves, Inscryption's table seen from the seat, the house's table view (vfx/bazaartable.js:
// the page hidden by a class, the camera kept while the page pauses the world, the canvas raycast, a tap and a long press).
//
//   new EntropyBoardView(game, look)   .enter(session)   .leave()   .tick(dt, t)   .on
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOARD, CAMERA, tileAt } from '../../world/entropy/entropyroom.js';
import { CLASSES, HEALTH } from '../../progress/casino/entropy/classes.js';
import { sidesOf, speedOf, strengthOf, ENTROPY_RULES } from '../../progress/casino/entropy/rules.js';
import { nameOf, SUITS } from '../../progress/casino/entropy/cards.js';
import { ENTROPY_ROOM } from '../../world/entropy/entropyroom.js';
import { LOOK, eldritch, Kit, numberSprite, makeToken, makeBomb, makeDie, makeArcana, makePile, cardTexture, backTexture, Sparks } from './pieces.js';
import { BoardPlates } from './boardplates.js';

/** The numbers: the camera's ease (per real s) and the screen band the board is fitted into (NDC: below `lo` is the hand's), a token's
 *  glide and hop (real s, m), the lift under the cursor (m), a spawn's grow, the die's throw, hold and way back (real s), a tap and a long
 *  press, how long a coach is trusted; where the extras stand (cells, fractional, past the board's edge); the hand (its height a share
 *  of the screen's, CSS px at least and most, the bar's room, the cards' step and fan). */
export const BOARD_VIEW = {
  ease: 1.5, band: { lo: -0.46, hi: 0.92, x: 0.94 }, glide: 0.42, hop: 0.5, lift: 0.22, spawn: 0.5, throw: 0.95, hold: 1.4, back: 0.6, slide: 0.6,
  longPress: 0.42, still: 10, coachFor: 0.5,
  at: { arcana: [{ x: 1.3, z: 6.95, y: 1.2 }, { x: 4.7, z: -0.95, y: 1.5 }], die: [{ x: 7.1, z: 6.4 }, { x: -1.1, z: -0.4 }], held: { x: 2.0, z: -0.95 }, throw: [{ x: 0.75, z: 0.55 }, { x: -0.75, z: -0.55 }],
    piles: [{ deck: { x: 0.25, z: 7.0 }, disc: { x: -0.5, z: 7.0 } }, { deck: { x: 5.85, z: -1.0 }, disc: { x: 6.6, z: -1.0 } }] },
  fly: 0.7, // (real s: a lance flying at their Arcana, a cup going home, a card riffled)
  hand: { h: 0.16, min: 60, max: 130, bar: 46, step: 0.74, fan: 0.06 },
  scale: { token: 1.45, die: 2.1, arcana: [1.15, 1.6] },
  suit: ['Cup', 'Sword', 'Pentacle', 'Wand'], does: ['At the far edge it mends your Arcana and goes home into your deck', 'It fights what it meets; at the far edge it pushes the bomb', 'Every tile it crosses turns its owner\'s; it holds their back rank', 'At the far edge it strikes their Arcana'],
  rank: ['', 'Page', 'Knight', 'Queen', 'King', 'King+'],
  how: { bomb: ['The Grand Bomb went off on their tile.', 'The Grand Bomb went off on your tile.'], 'bomb-neutral': ['It went off on nobody\'s tile: the higher health took it.', 'It went off on nobody\'s tile: the higher health took it.'],
    'bomb-off': ['You pushed the Grand Bomb off their edge.', 'The Grand Bomb was pushed off your edge.'], strike: ['Your tokens struck their Arcana down.', 'Their tokens struck your Arcana down.'],
    fatigue: ['Their Arcana fell to fatigue.', 'Your Arcana fell to fatigue.'], reshuffle: ['Their Arcana fell to a reshuffle.', 'Your Arcana fell to a reshuffle.'], draw: ['Nobody\'s tile, equal health: a draw.', 'Nobody\'s tile, equal health: a draw.'] },
};
const N = BOARD.size, V = BOARD_VIEW, _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _c = new THREE.Color(), _q = new THREE.Quaternion(), WHITE = new THREE.Color(1, 1, 1), BONE = new THREE.Color(LOOK.bone);
const ease3 = (u) => 1 - (1 - u) ** 3, backOut = (u) => 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;
const isActor = (m) => m.pieceIds.length > 1 && !m.pieceIds[0].startsWith('c:'); // (version 2 has none: a place names its card first)
/** A cell's place, fractional and past the board's edge allowed, `y` m over the tiles' plane. */
const cellAt = (fx, fz, y = 0) => tileAt(0, 0).add(_v2.set(fx * (BOARD.tile + BOARD.gap), y, fz * (BOARD.tile + BOARD.gap)));

export class EntropyBoardView {
  constructor(game, look) {
    this.game = game; this.look = look; this.on = false; this.ray = new THREE.Raycaster(); this.hue = new THREE.Color(); this.lit = new Map();
    const at = (e) => { this.ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; this.mouse = { x: e.clientX, y: e.clientY }; };
    this.onMove = (e) => { if (this.on && (e.pointerType !== 'touch' || this.press)) at(e); };
    this.onDown = (e) => {
      if (!this.on) return; at(e);
      if (e.pointerType === 'touch') { this.press = { id: e.pointerId, t: performance.now(), x: e.clientX, y: e.clientY }; return; }
      if (e.button === 2) { this.sel = null; this.plates?.choose(null); } else if (e.button === 0) this.click();
    };
    this.onUp = (e) => {
      const P = this.press; if (!P || e.pointerId !== P.id) return; this.press = null;
      if (e.type === 'pointerup' && performance.now() - P.t < V.longPress * 1000 && Math.hypot(e.clientX - P.x, e.clientY - P.y) < V.still) this.click();
      this.ndc = null;
    };
  }

  enter(session) {
    if (this.on) this.leave();
    const g = this.game, kit = (this.kit = new Kit()), root = (this.root = new THREE.Group());
    this.session = session; this.on = true; root.name = 'entropy-board'; root.userData.zone = 'entropy'; g.scene.add(root);
    this.S = null; this.tokens = new Map(); this.cards = new Map(); this.sel = null; this.hover = null; this.coach = null; this.coachKey = null; this.lit = new Map(); this.ndc = null;
    this.bomb = makeBomb(kit); this.bomb.core.userData.pid = 'bomb'; root.add(this.bomb.group);
    this.dice = [0, 1].map((seat) => { const p = makeDie(kit); p.spinner.userData.pid = `die:${seat}`; root.add(p.group); p.fedNum = numberSprite(kit, 0.32); p.group.add(p.fedNum.sprite); const rest = cellAt(V.at.die[seat].x, V.at.die[seat].z, 0.9).clone(); return { p, seat, state: 'rest', u: 0, rest, pos: rest.clone(), settle: new THREE.Quaternion() }; });
    this.arcana = [0, 1].map((seat) => { const p = makeArcana(kit, seat), A = V.at.arcana[seat]; p.mesh.userData.pid = `arcana:${seat}`; root.add(p.mesh); return { p, seat, flash: 0, lift: 0, home: cellAt(A.x, A.z, A.y).clone() }; });
    const backMat = kit.shared('mat.back', () => new THREE.MeshBasicMaterial({ map: backTexture(kit), toneMapped: false, side: THREE.DoubleSide })), backGeo = kit.shared('geo.back', () => new THREE.PlaneGeometry(0.42, 0.6));
    this.held = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(backGeo, backMat); m.visible = false; root.add(m); return m; });
    this.heldAt = cellAt(V.at.held.x, V.at.held.z, 0.9).clone();
    this.sparks = new Sparks(kit); root.add(this.sparks.points); this.flyers = []; this.downWhy = new Map();
    this.piles = [0, 1].map((seat) => { const A = V.at.piles[seat], deck = makePile(kit), disc = makePile(kit); deck.group.position.copy(cellAt(A.deck.x, A.deck.z, 0.05)); disc.group.position.copy(cellAt(A.disc.x, A.disc.z, 0.05)); root.add(deck.group, disc.group); return { deck, disc }; });
    const ER = ENTROPY_ROOM, sx = ER.x + ER.seat.x, sz = ER.z + ER.seat.z; this.stone = [];
    g.entropyRoom?.room?.traverse?.((o) => { if (o.isMesh && o.visible && Math.abs(o.position.x - sx) < 0.4 && Math.abs(o.position.z - sz) < 0.4 && o.position.y < ER.y + 2) { o.visible = false; this.stone.push(o); } }); // (the seat stone sits in the seated frame's foot: hidden while seated)
    this.hand = new THREE.Group(); this.cardGeo = kit.own(new THREE.PlaneGeometry(1, 1)); this.rimMat = kit.own(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.9 }));
    g.overlayScene?.add(this.hand, { anchor: 'bl', hud: false, update: (dt, s) => { s.x = s.view.w / 2; } });
    const cam = g.camera; this.from = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov }; this.k = 0; this.aspect = 0;
    this.plates = new BoardPlates({ play: (cm) => this.play(cm), again: () => this.session?.again(), close: () => this.session?.close() }); this.plates.mount();
    session.menu?.root?.classList.add('etboard'); g.ui?.want?.('entropyBoard', true);
    const el = (this.canvas = g.renderer?.domElement);
    el?.addEventListener('pointermove', this.onMove); el?.addEventListener('pointerdown', this.onDown);
    for (const ev of ['pointerup', 'pointercancel']) el?.addEventListener(ev, this.onUp);
  }
  leave() {
    if (!this.on) return;
    const g = this.game, el = this.canvas, cam = g.camera;
    el?.removeEventListener('pointermove', this.onMove); el?.removeEventListener('pointerdown', this.onDown);
    for (const ev of ['pointerup', 'pointercancel']) el?.removeEventListener(ev, this.onUp);
    this.plates?.unmount(); this.session?.menu?.root?.classList.remove('etboard'); document.getElementById('indexmenu')?.classList.remove('etboard'); g.ui?.want?.('entropyBoard', false);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) this.look.tiles?.light?.(x, z, 0, this.hue);
    g.scene.remove(this.root); g.overlayScene?.remove(this.hand); this.kit.dispose(); for (const o of this.stone || []) o.visible = true; this.stone = null;
    cam.position.copy(this.from.p); cam.quaternion.copy(this.from.q); cam.fov = this.from.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    this.on = false; this.session = null; this.S = null; this.root = this.hand = this.kit = this.plates = this.canvas = null; this.tokens = this.cards = null; this.press = null; this.ndc = null;
  }

  tick(dt, t) {
    if (!this.on) return; const s = this.session, S = s?.S; if (!S) return;
    this.t = t; eldritch(t, this.hue);
    if (S !== this.S) this.reset(S);
    this.refreshCoach(dt); this.readLog(S); this.diff(S);
    this.pick(); this.lights();
    this.layTiles(S); this.layTokens(dt, t); this.layFlyers(dt); this.layPiles(S); this.layBomb(dt, t, S); this.layDice(dt, t, S); this.layArcana(dt, t, S); this.layHeld(t, S); this.layHand(dt, S);
    this.sparks.tick(dt); this.words(S); this.frame(dt);
  }
  /** A new game at the seat (again): the board cleared, the log read from its start. */
  reset(S) {
    for (const e of this.tokens.values()) this.root.remove(e.group);
    this.tokens.clear(); this.flyers.length = 0; this.downWhy.clear(); this.S = S; this.seen = 0; this.hpSeen = S.hp.slice(); this.bombAt = null; this.bombPos = null; this.dieKey = null; this.sel = null; this.coach = null; this.coachKey = null;
    for (const d of this.dice) { d.state = 'rest'; d.pos.copy(d.rest); }
    this.plates.result(null); this.plates.choose(null);
  }
  /** The coach, worked out again only when the game moves (bazaartable.js's rule). */
  refreshCoach(dt) {
    const s = this.session, S = s.S, T = s.T, R = T.game.result(S), P = R ? null : T.game.pending(S);
    const key = [S.log.length, P?.seat, P?.kind, P?.moves?.length, S.phase, R ? 1 : 0, s.done ? 1 : 0].join('|');
    this.coachAge = (this.coachAge || 0) + dt;
    if (key === this.coachKey && this.coach && this.coachAge < V.coachFor) return;
    const moved = key !== this.coachKey; this.coachKey = key; this.coachAge = 0; this.coach = s.coach?.() || null; this.P = P;
    if (moved) { this.plates.choose(null); if (this.sel && !this.coach?.moves?.some((m) => isActor(m) && m.pieceIds[0] === this.sel)) this.sel = null; }
  }

  // ------------------------------------------------------------- what changed
  /** The table's moments since the last look (rules.js and tokens.js log them): tiles turned and bust, tokens meeting, striking, claiming,
   *  the bomb pushed, shoved and gone off, cards fed and discarded, fatigue and a reshuffle. */
  readLog(S) {
    const L = S.log, B = this.bomb.group.position, tiles = this.look.tiles, top = (at) => tiles.top(at[0], at[1], new THREE.Vector3());
    if (!this.bombPos) { this.seen = L.length; return; }
    for (; this.seen < L.length; this.seen++) {
      const x = L[this.seen];
      if (x.turned != null) { tiles.flip(x.at[0], x.at[1], x.turned); this.sparks.burst(top(x.at), 50, LOOK.side(x.turned), { speed: 2.2, up: 1.2, radius: 0.6 }); }
      else if (x.bust != null) { tiles.bust(x.at[0], x.at[1]); const p = top(x.at); this.sparks.burst(p, 60, BONE, { speed: 3, up: 0.9, radius: 0.3 }); this.sparks.burst(p, 30, this.hue, { speed: 2, up: 1.4 }); }
      else if (x.add != null) this.sparks.burst(top(x.at), 8 + x.v, LOOK.side(x.add), { speed: 0.7, up: 0.8, radius: 0.4 });
      else if (x.claim != null) this.sparks.burst(top(x.at), 26, LOOK.side(x.claim), { speed: 1.4, up: 0.5, radius: 0.7 });
      else if (x.meet != null) { const a = this.tokens.get(x.meet), b = this.tokens.get(x.with); if (a && b) { _v.lerpVectors(a.pos, b.pos, 0.5).y += 0.8; this.sparks.burst(_v, 60, WHITE, { speed: 3.2, up: 0.4 }); this.sparks.burst(_v, 30, this.hue, { speed: 2 }); a.flash = b.flash = 1; } }
      else if (x.down != null) this.downWhy.set(x.down, x.why);
      else if (x.shove != null || x.push != null) { this.shake = 1; this.bombFlash = 1; this.sparks.burst(_v.copy(B).setY(B.y + 0.6), x.tiles === 0 ? 18 : 46, this.hue, { speed: 2.4, up: 0.3 }); }
      else if (x.boom !== undefined) { this.bombFlash = 2; this.shake = 1.5; this.sparks.burst(_v.copy(B).setY(B.y + 0.6), 160, WHITE, { speed: 5, up: 1, life: 1.6 }); this.sparks.burst(_v, 90, this.hue, { speed: 3, up: 1.2, life: 2 }); }
      else if (x.feed != null) { const d = this.dice[x.feed]; this.sparks.burst(d.pos, 14, this.hue, { speed: 0.8, up: 0.6 }); this.dice[x.feed].fedFlash = 1; }
      else if (x.discard != null) this.sparks.burst(this.piles[x.discard].disc.group.position, 8, BONE, { speed: 0.5, up: 0.5 });
      else if (x.fatigue != null) { this.arcana[x.fatigue].flash = 1; this.sparks.burst(this.arcana[x.fatigue].home, 40, 0xff5a3c, { speed: 1.6, up: 0.6, radius: 0.5 }); }
      else if (x.reshuffle != null) { const P = this.piles[x.reshuffle]; this.arcana[x.reshuffle].flash = 1; for (let i = 0; i < 6; i++) this.fly(P.disc.group.position, P.deck.group.position, BONE, 0.35 + i * 0.06, 0.6); }
      else if (x.count != null) this.bombFlash = 0.6;
    }
  }
  /** Something flying across the board as a trail of motes (a lance at their Arcana, a cup home, a card riffled); `end` when it lands. */
  fly(from, to, color, dur = V.fly, arc = 1.6, end = null) { this.flyers.push({ from: from.clone(), to: to.clone(), color: new THREE.Color(color), dur, arc, u: 0, end }); }
  layFlyers(dt) {
    this.flyers = this.flyers.filter((f) => {
      f.u = Math.min(1, f.u + dt / f.dur); _v.lerpVectors(f.from, f.to, ease3(f.u)); _v.y += Math.sin(Math.PI * f.u) * f.arc;
      this.sparks.burst(_v, 3, f.color, { speed: 0.25, up: 0.1, life: 0.5, gravity: 0 });
      if (f.u < 1) return true; f.end?.(); return false;
    });
  }
  diff(S) {
    const tiles = this.look.tiles, seen = new Set();
    for (const t of S.tokens) {
      seen.add(t.id); let e = this.tokens.get(t.id);
      if (!e) {
        const p = makeToken(this.kit, t.suit, t.owner, t.rank); p.group.userData.pid = `k:${t.id}`; this.root.add(p.group);
        e = { ...p, id: t.id, x: t.x, z: t.z, pos: tiles.top(t.x, t.z, new THREE.Vector3()), born: 0, flash: 0, lift: 0, glide: null };
        this.tokens.set(t.id, e); this.sparks.burst(e.pos, 36, LOOK.side(t.owner), { speed: 1.2, up: 1.4, height: 0.2 });
      } else if (t.x !== e.x || t.z !== e.z) e.glide = { from: e.pos.clone(), u: 0, dur: V.glide * Math.max(1, Math.abs(t.z - e.z) * 0.55) }; // (the advance: along its column)
      Object.assign(e, { x: t.x, z: t.z, t });
    }
    for (const [id, e] of this.tokens) if (!seen.has(id)) {
      const why = this.downWhy.get(id), from = _v2.copy(e.pos).setY(e.pos.y + 0.8).clone();
      if (why === 'struck') { const A = this.arcana[1 - e.owner]; this.fly(from, A.home, LOOK.side(e.owner), V.fly, 1.2, () => { A.flash = 1; this.sparks.burst(A.home, 50, WHITE, { speed: 2.5 }); }); }
      else if (why === 'home') { const P = this.piles[e.owner].deck; this.fly(from, P.group.position, LOOK.side(e.owner), V.fly * 1.3, 3, () => this.sparks.burst(P.group.position, 24, LOOK.side(e.owner), { speed: 1, up: 1 })); }
      else {
        this.sparks.burst(e.pos, 90, BONE, { speed: 1.1, up: 0.7, height: e.top, radius: 0.25, life: 1.5, gravity: 0.1 });
        this.sparks.burst(e.pos, 40, LOOK.side(e.owner), { speed: 1.6, up: 0.4, height: e.top, radius: 0.2, life: 1.2 });
      }
      this.downWhy.delete(id); this.root.remove(e.group); this.tokens.delete(id);
    }
    for (const q of [0, 1]) { if (S.hp[q] < this.hpSeen[q]) this.arcana[q].flash = 1; else if (S.hp[q] > this.hpSeen[q]) this.sparks.burst(this.arcana[q].home, 30, LOOK.side(q), { speed: 0.6, up: 1.2, radius: 0.5 }); this.hpSeen[q] = S.hp[q]; }
  }
  /** Each tile's owner and sum from the state (a turn's flip lands its own colour: tiles.js). */
  layTiles(S) { const tiles = this.look.tiles; for (let i = 0; i < N * N; i++) { const T = S.tiles?.[i]; if (!T) continue; const x = i % N, z = (i / N) | 0; tiles.own?.(x, z, T.o); tiles.sum?.(x, z, T.s); } }
  /** Each seat's deck (backs) and discard pile (its top card face up), their counts over them. */
  layPiles(S) { for (const q of [0, 1]) { const P = this.piles[q], d = S.disc[q] || []; P.deck.set(S.deck[q]?.length || 0, null); P.disc.set(d.length, d.length ? d[d.length - 1] : null); } }

  // ------------------------------------------------------------- the choices
  /** The choices a piece names now (with a token of yours chosen: only that token's that name it). */
  cands(id) {
    const ms = this.coach?.moves || [];
    if (this.sel && id !== this.sel) return ms.filter((m) => m.pieceIds[0] === this.sel && m.pieceIds.includes(id));
    return ms.filter((m) => m.pieceIds.includes(id) && !(isActor(m) && m.pieceIds[0] === id));
  }
  actorOf(id) { return (this.coach?.moves || []).filter((m) => isActor(m) && m.pieceIds[0] === id); }
  pick() {
    this.hover = null; if (!this.ndc || this.plates.busy) return;
    const OS = this.game.overlayScene;
    if (OS && this.cards.size) {
      OS.camera.updateMatrixWorld(); this.hand.updateMatrixWorld(true); this.ray.setFromCamera(this.ndc, OS.camera);
      const hit = this.ray.intersectObjects([...this.cards.values()].map((c) => c.mesh), false)[0]; if (hit) { this.hover = hit.object.userData.pid; return; }
    }
    const tiles = this.look.tiles, map = new Map(), objs = [...[...this.tokens.values()].map((e) => e.group), this.bomb.core, ...this.arcana.map((a) => a.p.mesh), ...this.dice.map((d) => d.p.spinner)];
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const m = tiles.tile(x, z); if (m) { map.set(m, `t:${x}.${z}`); objs.push(m); } }
    this.ray.setFromCamera(this.ndc, this.game.camera);
    for (const h of this.ray.intersectObjects(objs, true)) {
      let o = h.object, id = null; while (o && !id) { id = o.userData?.pid || map.get(o) || null; o = o.parent; }
      if (!id) continue;
      this.hover = id; return;
    }
  }
  click() {
    this.pick(); const id = this.hover; if (!this.coach || this.plates.ended) return;
    this.plates.choose(null);
    if (!id) { this.sel = null; return; }
    if (this.P?.kind === 'place' && id === `c:${this.P.card}`) { const b = this.coach.moves.find((m) => m.move.back); if (b) this.play(b); return; } // (the picked card clicked again: put back)
    if (this.sel) { if (id === this.sel) { this.sel = null; return; } const f = this.cands(id); if (f.length) return this.offer(f); this.sel = null; }
    if (this.actorOf(id).length) { this.sel = id; return; }
    this.offer(this.cands(id));
  }
  offer(list) { if (list.length === 1) this.play(list[0]); else if (list.length) this.plates.choose(list, this.mouse?.x ?? innerWidth / 2, this.mouse?.y ?? innerHeight / 2); }
  play(cm) {
    const s = this.session; if (!cm?.move || !s || s.done || this.P?.seat !== 0) return;
    this.sel = null; this.plates.choose(null); s.move(cm.move);
  }
  /** What is lit and how much (0..1): every piece a choice names (a token of yours, not its targets, until it is chosen or hovered). */
  lights() {
    const ms = this.coach?.moves || [], lit = (this.lit = new Map()), up = (id, k) => lit.set(id, Math.max(lit.get(id) || 0, k)), h = this.hover;
    if (this.sel) { up(this.sel, 1); for (const m of ms) if (m.pieceIds[0] === this.sel) for (const id of m.pieceIds.slice(1)) up(id, 0.6); }
    else for (const m of ms) { if (isActor(m)) up(m.pieceIds[0], 0.5); else for (const id of m.pieceIds) up(id, id.startsWith('t:') ? 0.8 : 0.5); }
    if (h && !this.sel) for (const m of ms) if (isActor(m) && m.pieceIds[0] === h) for (const id of m.pieceIds.slice(1)) up(id, 0.3);
    if (h && (lit.has(h) || h.startsWith('c:'))) { const c = this.cands(h); if (h.startsWith('c:') && c.length === 1) for (const id of c[0].pieceIds) up(id, 0.85); if (lit.has(h)) up(h, 1); }
    const tiles = this.look.tiles;
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) tiles.light(x, z, lit.get(`t:${x}.${z}`) || 0, this.hue);
  }

  // ------------------------------------------------------------- the pieces laid
  layTokens(dt, t) {
    const tiles = this.look.tiles, k = 1 - Math.exp(-12 * dt);
    for (const e of this.tokens.values()) {
      const T = tiles.top(e.x, e.z, _v), pid = `k:${e.id}`, lit = this.lit.get(pid) || 0;
      if (e.glide) { const G = e.glide; G.u = Math.min(1, G.u + dt / (G.dur || V.glide)); e.pos.lerpVectors(G.from, T, ease3(G.u)); e.pos.y += Math.sin(Math.PI * G.u) * V.hop; if (G.u >= 1) e.glide = null; } else e.pos.copy(T);
      e.born = Math.min(1, e.born + dt / V.spawn); e.flash = Math.max(0, e.flash - dt * 2.5);
      e.lift += ((this.hover === pid || this.sel === pid ? V.lift : 0) - e.lift) * k;
      e.group.position.copy(e.pos); e.group.position.y += e.lift; e.group.scale.setScalar(Math.max(0.001, backOut(e.born)) * V.scale.token);
      e.spin.forEach(([m, axis], i) => { m.rotation[axis] += dt * (0.6 + i * 0.7); });
      e.body.emissive.set(LOOK.side(e.owner)).multiplyScalar(0.22).add(_c.copy(this.hue).multiplyScalar(lit * 0.55)).lerp(WHITE, e.flash);
      e.ring.material.opacity = 0.45 + 0.55 * lit;
    }
  }
  layBomb(dt, t, S) {
    const B = this.bomb, T = this.look.tiles.top(S.bomb.x, S.bomb.z, _v), at = `${S.bomb.x}.${S.bomb.z}`;
    if (!this.bombPos) { this.bombPos = T.clone(); this.bombAt = at; }
    if (at !== this.bombAt) { this.bombAt = at; this.bombGlide = { from: this.bombPos.clone(), u: 0 }; }
    const G = this.bombGlide; if (G) { G.u = Math.min(1, G.u + dt / V.slide); this.bombPos.lerpVectors(G.from, T, ease3(G.u)); if (G.u >= 1) this.bombGlide = null; } else this.bombPos.copy(T);
    this.shake = Math.max(0, (this.shake || 0) - dt * 2); this.bombFlash = Math.max(0, (this.bombFlash || 0) - dt * 1.6);
    const sh = this.shake * 0.09, lift = this.hover === 'bomb' ? V.lift * 0.6 : 0;
    B.group.position.copy(this.bombPos).add(_v2.set((Math.random() - 0.5) * sh, lift, (Math.random() - 0.5) * sh));
    B.core.rotation.y += dt * 0.2;
    B.corona.material.color.copy(this.hue).multiplyScalar(0.75 + 0.25 * Math.sin(t * 1.7)).lerp(WHITE, Math.min(1, this.bombFlash * 0.6));
    B.corona.scale.setScalar(2.5 + 0.14 * Math.sin(t * 0.9) + this.bombFlash * 0.7 + (this.lit.get('bomb') || 0) * 0.35);
    B.setCounter(S.counter, this.hue);
  }
  layDice(dt, t, S) {
    if (S.phase === 'bomb' && S.ctx) {
      const key = `${S.round}|${S.cur}|${S.ctx.roll}|${S.ctx.rerolled}|${S.ctx.lit}`;
      if (key !== this.dieKey) { this.dieKey = key; const d = this.dice[S.cur], off = V.at.throw[S.cur]; Object.assign(d, { state: 'throw', u: 0, from: d.pos.clone(), roll: S.ctx.roll, key, land: _v2.set(off.x * (BOARD.tile + BOARD.gap), 0.45, off.z * (BOARD.tile + BOARD.gap)).clone(), axis: new THREE.Vector3(Math.random() - 0.5, 0.4, Math.random() - 0.5).normalize(), spins: 2.5 + Math.random() * 2 }); d.settle.setFromAxisAngle(_v.set(0, 1, 0), Math.random() * 6.28); }
    }
    for (const d of this.dice) {
      const P = d.p; P.setSides(sidesOf(S.fed[d.seat])); P.edges.color.copy(this.hue);
      if (d.state === 'throw') {
        d.u = Math.min(1, d.u + dt / V.throw); const land = _v.copy(this.bombPos || d.rest).add(d.land);
        d.pos.lerpVectors(d.from, land, ease3(d.u)); d.pos.y += Math.sin(Math.PI * d.u) * 1.8 * (1 - d.u * 0.4);
        P.spinner.quaternion.copy(d.settle).multiply(_q.setFromAxisAngle(d.axis, d.spins * Math.PI * 2 * (1 - d.u) ** 2));
        P.num.sprite.visible = d.u > 0.85; P.num.set(d.roll, LOOK.ink); P.num.sprite.scale.set(2.6, 1.3, 1);
        if (d.u >= 1) { d.state = 'hold'; d.held = 0; this.sparks.burst(d.pos, 14, this.hue, { speed: 0.9, up: 0.3 }); }
      } else if (d.state === 'hold') {
        d.held += dt; d.pos.copy(this.bombPos || d.rest).add(d.land); P.num.sprite.visible = false; // (held: its number is the plates' crisp one, face on over it)
        const live = S.phase === 'bomb' && S.cur === d.seat && this.dieKey === d.key;
        if (d.held > V.hold && !live) Object.assign(d, { state: 'back', u: 0, from: d.pos.clone() });
      } else if (d.state === 'back') {
        d.u = Math.min(1, d.u + dt / V.back); d.pos.lerpVectors(d.from, d.rest, ease3(d.u)); P.num.sprite.visible = false; if (d.u >= 1) d.state = 'rest';
      } else {
        d.pos.copy(d.rest); d.pos.y += Math.sin(t * 0.8 + d.seat * 2) * 0.08; P.spinner.rotation.y += dt * 0.45; P.spinner.rotation.x = Math.sin(t * 0.3 + d.seat) * 0.4;
        P.num.sprite.visible = true; P.num.set(`d${sidesOf(S.fed[d.seat])}`, LOOK.inkDim); P.num.sprite.scale.set(1.2, 0.6, 1);
      }
      P.fedNum.sprite.position.y = -0.2 - 0.3 * V.scale.die; P.fedNum.set(S.fed[d.seat], `#${this.hue.getHexString()}`); P.fedNum.sprite.visible = d.state === 'rest';
      P.group.position.copy(d.pos); P.spinner.scale.setScalar(V.scale.die); P.num.sprite.position.y = 0.45 * V.scale.die + (d.state === 'rest' ? 0.35 : 0.9);
    }
  }
  layArcana(dt, t, S) {
    const k = 1 - Math.exp(-10 * dt), to = this.camTo?.p || this.game.camera.position;
    for (const a of this.arcana) {
      const pid = `arcana:${a.seat}`, lit = this.lit.get(pid) || 0; a.flash = Math.max(0, a.flash - dt * 1.8);
      a.lift += ((this.hover === pid ? V.lift : 0) - a.lift) * k;
      a.p.mesh.position.copy(a.home); a.p.mesh.position.y += a.lift + Math.sin(t * 0.6 + a.seat * 3) * 0.05; a.p.mesh.lookAt(to); a.p.mesh.scale.setScalar(V.scale.arcana[a.seat]);
      a.p.side.emissive.copy(BONE).multiplyScalar(0.12).lerp(this.hue, lit * 0.6).lerp(WHITE, a.flash);
      a.p.draw({ label: CLASSES[S.cls[a.seat]]?.label || '', hp: S.hp[a.seat], max: HEALTH, flash: a.flash, lit, suit: CLASSES[S.cls[a.seat]]?.suit ?? null });
    }
  }
  layHeld(t, S) {
    const n = Math.min(8, (S.hand[1]?.length || 0) + (S.kept?.[1]?.length || 0)), to = this.camTo?.p || this.game.camera.position;
    this.held.forEach((m, i) => { m.visible = i < n; if (!m.visible) return; m.position.copy(this.heldAt); m.position.x += (i - (n - 1) / 2) * 0.3; m.position.y += Math.sin(t * 0.7 + i) * 0.04; m.lookAt(to); m.rotateZ((i - (n - 1) / 2) * -0.08); });
  }
  /** Your hand, fanned at the screen's foot on the overlay's scene (CSS px, y up from the bottom edge). */
  layHand(dt, S) {
    if (!this.game.overlayScene) return;
    const H = V.hand, kept = S.kept?.[0] || [], hand = [...(S.hand[0] || []), ...kept], nh = hand.length - kept.length, h = innerHeight, ch = Math.max(H.min, Math.min(H.max, h * H.h)), cw = ch * 0.7, bar = H.bar + (this.game.hudLayout?.safe?.b || 0), mid = (hand.length - 1) / 2, k = 1 - Math.exp(-12 * dt), keep = new Set();
    hand.forEach((c, i) => {
      keep.add(c); let e = this.cards.get(c);
      if (!e) {
        const mat = this.kit.shared(`cardmat.${c}`, () => new THREE.MeshBasicMaterial({ map: cardTexture(this.kit, c), toneMapped: false }));
        e = { mesh: new THREE.Mesh(this.cardGeo, mat), rim: new THREE.Mesh(this.cardGeo, this.rimMat), x: innerWidth * 0.6, y: -ch, r: 0, lift: 0 };
        e.mesh.userData.pid = `c:${c}`; this.hand.add(e.rim, e.mesh); this.cards.set(c, e);
      }
      const pid = `c:${c}`, lit = this.lit.get(pid) || 0, isKept = i >= nh, tx = (i - mid) * cw * H.step + (isKept ? cw * 0.35 : 0), ty = bar + ch * 0.5 + 6 - (i - mid) ** 2 * ch * 0.014, tr = -(i - mid) * H.fan;
      e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; e.r += (tr - e.r) * k; e.lift += ((this.hover === pid ? ch * 0.2 : lit >= 0.85 ? ch * 0.1 : lit ? ch * 0.04 : 0) - e.lift) * k;
      e.mesh.position.set(e.x, e.y + e.lift - (isKept ? ch * 0.12 : 0), i * 4 + 2); e.mesh.rotation.z = e.r; e.mesh.scale.set(cw, ch, 1); e.mesh.material.color.setScalar(isKept ? 0.5 : 1); // (a kept card set aside, dimmed: held for next turn)
      e.rim.visible = lit > 0; e.rim.position.set(e.x, e.y + e.lift, i * 4); e.rim.rotation.z = e.r; e.rim.scale.set(cw + (lit >= 0.85 ? 8 : 4), ch + (lit >= 0.85 ? 8 : 4), 1);
    });
    this.rimMat.color.copy(this.hue);
    for (const [c, e] of this.cards) if (!keep.has(c)) { this.hand.remove(e.mesh, e.rim); this.cards.delete(c); }
  }

  // ------------------------------------------------------------- the words
  words(S) {
    const s = this.session, T = s.T, R = T.game.result(S), P = this.P, C = this.coach, mine = P?.seat === 0;
    this.plates.hue(`#${this.hue.getHexString()}`);
    this.plates.turn(R ? '' : mine ? `${C?.turn?.say || ''}  ·  bank ${S.bank[0]}  ·  d${sidesOf(S.fed[0])}` : `${T.names[P?.seat] || 'They'} is playing`, mine || !!R);
    this.plates.bar(mine ? (C?.moves || []).filter((m) => !m.pieceIds.length || m.pieceIds.every((id) => id === 'bomb')) : [], `${this.coachKey}|${mine}`);
    this.plates.result(R && s.done ? { won: R.winner === 0, title: R.winner === 0 ? 'You win' : `${T.names[R.winner]} wins`, how: (V.how[R.how] || ['', ''])[R.winner === 0 ? 0 : 1], practice: !!s.practice } : null);
    this.plates.tip(this.tipFor(S), this.mouse?.x ?? 0, this.mouse?.y ?? 0);
    const d = this.dice.find((x) => x.state === 'hold'); if (d) { _v.copy(d.pos).project(this.game.camera); this.plates.roll(d.roll, (_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight, LOOK.sideCss(d.seat)); } else this.plates.roll(null);
  }
  tipFor(S) {
    const id = this.hover; if (!id || (this.press && performance.now() - this.press.t < V.longPress * 1000)) return null;
    const moves = this.cands(id).map((m) => ({ label: m.label, what: m.what, preview: m.preview })), whose = (o) => (o === 0 ? 'yours' : o === 1 ? 'theirs' : 'nobody\'s');
    if (id.startsWith('c:')) {
      const c = +id.slice(2);
      if (this.P?.kind === 'place' && this.P.card === c) return { title: nameOf(c), lines: ['Chosen: now a lit tile', 'Click it again to put it back'], moves: [] };
      return { title: nameOf(c), lines: moves.length ? [] : [(S.kept?.[0] || []).includes(c) ? 'Kept for next turn' : 'Not playable now'], moves };
    }
    if (id.startsWith('k:')) {
      const tk = S.tokens.find((x) => `k:${x.id}` === id); if (!tk) return null;
      return { title: `${tk.owner === 0 ? 'Your' : 'Their'} ${V.rank[tk.rank] || ''} of ${SUITS[tk.suit]}`, lines: [`Strength ${strengthOf(S, tk)} · advances ${speedOf(S, tk, ENTROPY_RULES)} a turn`, V.does[tk.suit]], moves };
    }
    if (id === 'bomb') { const T = S.tiles[S.bomb.z * N + S.bomb.x]; return { title: 'The Grand Bomb', lines: [`Counter ${S.counter}: at 0 whoever owns its tile loses (now ${whose(T.o)})`], moves }; }
    if (id.startsWith('arcana:')) { const q = +id.slice(7), Cl = CLASSES[S.cls[q]]; return { title: Cl?.label, lines: [`${S.hp[q]} of ${HEALTH} health · deck ${S.deck[q].length} · discard ${S.disc[q].length} · fed ${S.fed[q]}`, Cl?.passive || ''], moves }; }
    if (id.startsWith('die:')) { const q = +id.slice(4); return { title: `${q ? 'Their' : 'Your'} Hungry Die: d${sidesOf(S.fed[q])}`, lines: [`${S.fed[q]} cards fed (gone for good) · bank ${S.bank[q]}`, 'Feed 4, 9, 15, 22, 30 for a bigger die'], moves }; }
    if (id.startsWith('t:')) { const [x, z] = id.slice(2).split('.').map(Number), T = S.tiles[z * N + x]; return { title: `Tile ${x + 1}, ${z + 1}: ${whose(T.o)}, ${T.s} of 21`, lines: [], moves }; }
    return null;
  }

  // ------------------------------------------------------------- the camera
  /** The seat's shot, fitted: CAMERA's pitch and field of view, the aim and distance moved until the board and its extras fill the band. */
  fit() {
    const cam = (this.fitCam ||= new THREE.PerspectiveCamera()), B = V.band; cam.fov = CAMERA.fov; cam.aspect = innerWidth / Math.max(1, innerHeight); cam.near = 0.1; cam.far = 500; cam.updateProjectionMatrix();
    const y0 = 0, pts = [cellAt(-0.6, -0.6, y0), cellAt(6.6, -0.6, y0), cellAt(-0.6, 6.6, y0), cellAt(6.6, 6.6, y0)].map((p) => p.clone());
    for (const a of this.arcana) { const k = V.scale.arcana[a.seat]; pts.push(a.home.clone().setY(a.home.y + 1.0 * k), a.home.clone().setY(a.home.y - 1.0 * k)); }
    for (const d of this.dice) pts.push(d.rest.clone().setY(d.rest.y + 1.3), d.rest.clone().setY(d.rest.y - 0.6));
    const dir = new THREE.Vector3(0, Math.sin(CAMERA.pitch), -Math.cos(CAMERA.pitch)), T = cellAt(3, 3, y0).clone(); let D = 20;
    for (let i = 0; i < 48; i++) {
      cam.position.copy(T).addScaledVector(dir, -D); cam.lookAt(T); cam.updateMatrixWorld();
      let lo = 1e9, hi = -1e9, wide = 0; for (const p of pts) { _v.copy(p).project(cam); lo = Math.min(lo, _v.y); hi = Math.max(hi, _v.y); wide = Math.max(wide, Math.abs(_v.x)); }
      const off = (lo + hi) / 2 - (B.lo + B.hi) / 2, s = Math.max((hi - lo) / (B.hi - B.lo), wide / B.x);
      T.z -= off * D * 0.35; D *= s ** 0.5;
    }
    this.camTo = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: CAMERA.fov };
  }
  frame(dt) {
    const asp = innerWidth / Math.max(1, innerHeight); if (Math.abs(asp - this.aspect) > 1e-3) { this.aspect = asp; this.fit(); }
    const cam = this.game.camera, F = this.from, To = this.camTo;
    this.k = Math.min(1, this.k + dt * V.ease * (1 - this.k * 0.85)); const e = this.k * this.k * (3 - 2 * this.k);
    cam.position.lerpVectors(F.p, To.p, e); cam.quaternion.slerpQuaternions(F.q, To.q, e);
    const fov = F.fov + (To.fov - F.fov) * e; if (Math.abs(cam.fov - fov) > 1e-4) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
  }
}
