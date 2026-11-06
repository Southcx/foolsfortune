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
//     21 turns it, flip; a bust shudders it), court tokens read by their parts (pieces.js makeToken: suit, owner, rank, speed, health) on
//     look.tiles.top(x, z) every frame, advancing along their column, clashing where they meet, a hurt ticking out a segment, a wand's
//     strike flying at their Arcana, a cup flying home to its deck, the rest frayed away when downed; each seat's deck and discard as
//     stacks by its Arcana, its fed count under its die; the Grand Bomb sliding when pushed (a shudder and a flash), its ring of ticks
//     burning down and its number the countdown's (countdown.js: on the bomb and on the screen's edge); the Hungry Die by its sides, yours
//     at the near right and theirs at the far left, thrown tumbling beside the bomb when the roll comes up and settled with its number;
//     each Arcana its living tarot card (portraits.js) at its back edge (yours behind row 6, theirs beyond row 0), turned to the camera,
//     its health on it, hit when it is hurt; your hand fanned on the overlay's scene (render/overlayscene.js: drawn after the post pass, so
//     the tilt-shift never blurs it), theirs face down at the far edge.
//   The choices: a card of your hand is DRAGGED to where it goes (drag.js: the places it may go lit, what it would do shown at the one under
//     it before you let go, preview.js; an ace's 1 or 11 as two plates at the tile; the Hungry Die and your discard pile are places too
//     when a move feeds or discards it), or clicked as before: a piece any choice names is lit (a tile through look.tiles.light, a token,
//     card, the bomb or an Arcana by its rim) and lifts under the cursor with a tip; a card is played (click it), then placed (a lit tile;
//     the card again puts it back), the rest carved card by card (keep, feed, discard as plates on the card); a piece naming several
//     choices offers them as plates; the choices that are no piece stand on the bar (boardplates.js: done, fatigue or reshuffle, the
//     bomb's), and the turn's line says whose turn and which step. Touch: a tap a click, a drag a drag, a long press the tip. The bots'
//     turns play out on the board as the state changes (diffed each tick and from the table's log).
// It runs from the room's tick and its tickModal (the seat's page pauses the world: world/entropy/entropyroom.js), through EntropyLook.
//
// Prior art: Hearthstone's and MTG Arena's boards (your side, tipped away; your hand fanned low; the other's held cards face down far
// away; a card dragged to its target), Slay the Spire's and Balatro's held cards, Into the Breach's shown threats and moves, Inscryption's table seen from the seat, the house's table view (vfx/bazaartable.js:
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
import { LOOK, eldritch, Kit, numberSprite, makeToken, makeBomb, makeDie, makePile, cardTexture, backTexture, Sparks } from './pieces.js';
import { BoardPlates } from './boardplates.js';
import { ArcanaPortrait } from './portraits.js';
import { BombCountdown } from './countdown.js';
import { CardDrag } from './drag.js';
import { SeatCorners, DieFeast } from './corners.js';

/** The numbers: the camera's ease (per real s) and the screen band the board is fitted into (NDC: below `lo` is the hand's), a token's
 *  glide and hop (real s, m), the lift under the cursor (m), a spawn's grow, the die's throw, hold and way back (real s), a tap and a long
 *  press, how long a coach is trusted; where the extras stand (cells, fractional, past the board's edge); the hand (its height a share
 *  of the screen's, CSS px at least and most, the bar's room, the cards' step and fan). */
export const BOARD_VIEW = {
  ease: 1.5, band: { lo: -0.46, hi: 0.92, x: 0.94 }, glide: 0.42, hop: 0.5, lift: 0.22, spawn: 0.5, throw: 0.95, hold: 1.4, back: 0.6, slide: 0.6,
  longPress: 0.42, still: 10, coachFor: 0.5,
  // (arcana: yours is the corner's now, corners.js: [0] only the strike's flight's end; theirs right of the far rows, clear of the turn line)
  at: { arcana: [{ x: -1.45, z: 5.7, y: 1.35 }, { x: 8.0, z: 1.6, y: 1.4 }], die: [{ x: 7.1, z: 6.4 }, { x: -1.1, z: -0.4 }], held: { x: 2.0, z: -0.95 }, throw: [{ x: 0.75, z: 0.55 }, { x: -0.75, z: -0.55 }],
    piles: [{ deck: { x: 0.25, z: 7.0 }, disc: { x: -0.5, z: 7.0 } }, { deck: { x: 5.85, z: -1.0 }, disc: { x: 6.6, z: -1.0 } }] },
  fly: 0.7, // (real s: a lance flying at their Arcana, a cup going home, a card riffled)
  hand: { h: 0.19, min: 72, max: 156, bar: 46, step: 0.74, fan: 0.06, picked: 0.3, held: 300 }, fray: 0.5, // (a downed token's fray, real s)
  scale: { token: 1.45, die: 2.1, arcana: [1.15, 1.6] },
  suit: ['Cup', 'Sword', 'Pentacle', 'Wand'], does: ['At the far edge it mends your Arcana and goes home into your deck', 'It fights what it meets; at the far edge it pushes the bomb', 'Every tile it crosses turns its owner\'s; it holds their back rank', 'At the far edge it strikes their Arcana'],
  rank: ['', 'Page', 'Knight', 'Queen', 'King', 'King+'], phase: { empty: 'Draw', play: 'Play', place: 'Play', carve: 'Carve', bomb: 'Bomb' },
  how: { bomb: ['The Grand Bomb went off on their tile.', 'The Grand Bomb went off on your tile.'], 'bomb-neutral': ['It went off on nobody\'s tile: the higher health took it.', 'It went off on nobody\'s tile: the higher health took it.'],
    'bomb-off': ['You pushed the Grand Bomb off their edge.', 'The Grand Bomb was pushed off your edge.'], strike: ['Your tokens struck their Arcana down.', 'Their tokens struck your Arcana down.'],
    fatigue: ['Their Arcana fell to fatigue.', 'Your Arcana fell to fatigue.'], reshuffle: ['Their Arcana fell to a reshuffle.', 'Your Arcana fell to a reshuffle.'], draw: ['Nobody\'s tile, equal health: a draw.', 'Nobody\'s tile, equal health: a draw.'],
    'bomb-ground': ['The bomb went off on nobody\'s tile; you held more ground.', 'The bomb went off on nobody\'s tile; they held more ground.'] },
  bolt: { life: 0.42, from: 9, steps: 9, jag: 0.55, color: 0xe8dcff }, // (the Tower's Lightning on a token: real s, m above, kinks, m sideways)
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
    // a press on a card may become a drag (drag.js); a press anywhere else is a click as it always was (a touch's on its lift)
    this.onMove = (e) => {
      if (!this.on || (e.pointerType === 'touch' && !this.press)) return; at(e); const P = this.press;
      if (P?.card != null && !this.drag.on && Math.hypot(e.clientX - P.x, e.clientY - P.y) > (P.touch ? V.still : 7) && this.drag.begin(P.card, e.clientX, e.clientY, P.touch)) P.dragged = true;
      this.drag.move(e.clientX, e.clientY);
    };
    this.onDown = (e) => {
      if (!this.on) return; at(e);
      if (e.button === 2) { this.drag.cancel(); this.sel = null; this.plates?.choose(null); return; }
      this.pick(); const card = this.hover?.startsWith('c:') && this.P?.seat === 0 && !this.plates.busy ? +this.hover.slice(2) : null;
      if (e.pointerType === 'touch' || card != null) { this.press = { id: e.pointerId, t: performance.now(), x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch', card }; this.canvas?.setPointerCapture?.(e.pointerId); return; }
      if (e.button === 0) this.click();
    };
    this.onUp = (e) => {
      const P = this.press; if (!P || e.pointerId !== P.id) return; this.press = null;
      if (P.dragged) { if (e.type === 'pointerup') this.drag.end(); else this.drag.cancel(); }
      else if (e.type === 'pointerup' && (!P.touch || (performance.now() - P.t < V.longPress * 1000 && Math.hypot(e.clientX - P.x, e.clientY - P.y) < V.still))) this.click();
      if (P.touch) this.ndc = null;
    };
    this.drag = new CardDrag(this);
  }

  enter(session) {
    if (this.on) this.leave();
    const g = this.game, kit = (this.kit = new Kit()), root = (this.root = new THREE.Group());
    this.session = session; this.on = true; root.name = 'entropy-board'; root.userData.zone = 'entropy'; g.scene.add(root);
    this.S = null; this.tokens = new Map(); this.cards = new Map(); this.sel = null; this.hover = null; this.coach = null; this.coachKey = null; this.lit = new Map(); this.ndc = null;
    this.bomb = makeBomb(kit); this.bomb.core.userData.pid = 'bomb'; root.add(this.bomb.group);
    this.count = new BombCountdown(g, this.look); this.count.attach(root); this.countSeen = null; this.drag.attach(kit, root);
    this.dice = [0, 1].map((seat) => { const p = makeDie(kit); p.spinner.userData.pid = `die:${seat}`; root.add(p.group); p.fedNum = numberSprite(kit, 0.32); p.group.add(p.fedNum.sprite); const rest = cellAt(V.at.die[seat].x, V.at.die[seat].z, 0.9).clone(); return { p, seat, state: 'rest', u: 0, rest, pos: rest.clone(), settle: new THREE.Quaternion() }; });
    this.arcana = [0, 1].map((seat) => { const A = V.at.arcana[seat]; return { p: null, cls: null, seat, flash: 0, lift: 0, home: cellAt(A.x, A.z, A.y).clone() }; }); // (its portrait made for its class: portraits.js, in layArcana)
    const backMat = kit.shared('mat.back', () => new THREE.MeshBasicMaterial({ map: backTexture(kit), toneMapped: false, side: THREE.DoubleSide })), backGeo = kit.shared('geo.back', () => new THREE.PlaneGeometry(0.42, 0.6));
    this.held = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(backGeo, backMat); m.visible = false; root.add(m); return m; });
    this.heldAt = cellAt(V.at.held.x, V.at.held.z, 0.9).clone();
    this.sparks = new Sparks(kit); root.add(this.sparks.points); this.flyers = []; this.downWhy = new Map();
    this.piles = [0, 1].map((seat) => { const A = V.at.piles[seat], deck = makePile(kit), disc = makePile(kit); disc.mesh.userData.pid = `disc:${seat}`; deck.group.position.copy(cellAt(A.deck.x, A.deck.z, 0.05)); disc.group.position.copy(cellAt(A.disc.x, A.disc.z, 0.05)); root.add(deck.group, disc.group); return { deck, disc }; });
    const ER = ENTROPY_ROOM, sx = ER.x + ER.seat.x, sz = ER.z + ER.seat.z; this.stone = [];
    g.entropyRoom?.room?.traverse?.((o) => { if (o.isMesh && o.visible && Math.abs(o.position.x - sx) < 0.4 && Math.abs(o.position.z - sz) < 0.4 && o.position.y < ER.y + 2) { o.visible = false; this.stone.push(o); } }); // (the seat stone sits in the seated frame's foot: hidden while seated)
    this.hand = new THREE.Group(); this.cardGeo = kit.own(new THREE.PlaneGeometry(1, 1)); this.rimMat = kit.own(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.9 }));
    g.overlayScene?.add(this.hand, { anchor: 'bl', hud: false, update: (dt, s) => { s.x = s.view.w / 2; } });
    this.corners = new SeatCorners(this); this.corners.attach(kit); // (your Arcana and your Hungry Die, big in the screen's corners)
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
    this.drag.detach(); this.count?.detach(); this.corners?.detach(); for (const a of this.arcana || []) a.p?.dispose(); this.count = null;
    for (const b of this.bolts || []) { b.line.geometry.dispose(); b.line.material.dispose(); } this.bolts = [];
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
    this.corners.hunger(this.drag.over === 'die:0' ? 1 : this.drag.on && this.drag.targets(this.drag.card).has('die:0') ? 0.35 : 0); this.corners.tick(dt, t, S);
    this.layBolts(dt); this.drag.tick(dt, t); this.sparks.tick(dt); this.words(S); this.frame(dt);
  }
  /** A new game at the seat (again): the board cleared, the log read from its start. */
  reset(S) {
    for (const e of this.tokens.values()) this.root.remove(e.group);
    for (const e of this.dying || []) this.root.remove(e.group);
    this.tokens.clear(); this.dying = []; this.drag.cancel(); this.flyers.length = 0; this.downWhy.clear(); this.S = S; this.seen = 0; this.hpSeen = S.hp.slice(); this.bombAt = null; this.bombPos = null; this.dieKey = null; this.sel = null; this.coach = null; this.coachKey = null;
    for (const d of this.dice) { d.state = 'rest'; d.pos.copy(d.rest); d.feast = new DieFeast(sidesOf(S.fed[d.seat]), S.fed[d.seat]); d.feast.onBurst = () => { this.sparks.burst(d.pos, 120, WHITE, { speed: 4, up: 1 }); this.sparks.burst(d.pos, 80, this.hue, { speed: 3, up: 1.2, life: 1.6 }); }; }
    this.plates.result(null); this.plates.choose(null);
  }
  /** The coach, worked out again only when the game moves (bazaartable.js's rule). */
  refreshCoach(dt) {
    const s = this.session, S = s.S, T = s.T, R = T.game.result(S), P = R ? null : T.game.pending(S);
    const key = [S.log.length, P?.seat, P?.kind, P?.moves?.length, S.phase, R ? 1 : 0, s.done ? 1 : 0].join('|');
    this.coachAge = (this.coachAge || 0) + dt;
    if (key === this.coachKey && this.coach && this.coachAge < V.coachFor) return;
    const moved = key !== this.coachKey; this.coachKey = key; this.coachAge = 0; this.coach = s.coach?.() || null; this.P = P;
    if (moved) { this.drag.cancel(); this.plates.choose(null); if (this.sel && !this.coach?.moves?.some((m) => isActor(m) && m.pieceIds[0] === this.sel)) this.sel = null; }
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
      else if (x.hurt != null) { const e = this.tokens.get(x.hurt); if (e) { e.flash = 1; if (x.bolt) this.strike(e.pos, e.top); this.sparks.burst(_v.copy(e.pos).setY(e.pos.y + 0.9), 20 + 8 * (x.mult || 1), x.mult === 2 ? 0xffd36a : 0xff5a4a, { speed: 2.2, up: 0.7 }); } } // (a card on a token: Dovina's { hurt, dmg, mult })
      else if (x.down != null) { this.downWhy.set(x.down, x.why); const e = this.tokens.get(x.down); if (e) this.fell = { pos: e.pos.clone(), card: e.t?.card, owner: e.owner }; } // (kept: the Tower feeds its fallen to its die)
      else if (x.shove != null || x.push != null) { this.shake = 1; this.bombFlash = 1; this.sparks.burst(_v.copy(B).setY(B.y + 0.6), x.tiles === 0 ? 18 : 46, this.hue, { speed: 2.4, up: 0.3 }); }
      else if (x.boom !== undefined) { this.bombFlash = 2; this.shake = 1.5; this.sparks.burst(_v.copy(B).setY(B.y + 0.6), 160, WHITE, { speed: 5, up: 1, life: 1.6 }); this.sparks.burst(_v, 90, this.hue, { speed: 3, up: 1.2, life: 2 }); }
      else if (x.feed != null) { // (the feast: yours in the corner, corners.js; theirs a card flown from their hand into their die, which gulps the same)
        const F = x.fell ? this.fell : null; this.fell = null; // (the Tower: its fallen token flies into its die)
        if (x.feed === 0) { if (F?.card != null) { _v.copy(F.pos).project(this.game.camera); this.corners.feast(F.card, { x: (_v.x * 0.5 + 0.5) * innerWidth, y: (_v.y * 0.5 + 0.5) * innerHeight }); } this.corners.feed(x); }
        else { const d = this.dice[1]; this.fly(F ? F.pos : this.heldAt, d.pos, LOOK.side(1), V.fly, 1.2, () => d.feast.gulp(x.fed, x.die)); }
      }
      else if (x.discard != null) this.sparks.burst(this.piles[x.discard].disc.group.position, 8, BONE, { speed: 0.5, up: 0.5 });
      else if (x.fatigue != null) { this.arcana[x.fatigue].flash = 1; this.sparks.burst(this.arcana[x.fatigue].home, 40, 0xff5a3c, { speed: 1.6, up: 0.6, radius: 0.5 }); }
      else if (x.reshuffle != null) { const P = this.piles[x.reshuffle]; this.arcana[x.reshuffle].flash = 1; for (let i = 0; i < 6; i++) this.fly(P.disc.group.position, P.deck.group.position, BONE, 0.35 + i * 0.06, 0.6); }
      else if (x.count != null) this.bombFlash = 0.6;
    }
  }
  /** The Tower's Lightning striking a token: a jagged white-violet line from the sky to it, flickering out, a flash and sparks. */
  strike(at, top = 1.5) {
    const B = V.bolt, pts = [], to = at.clone().setY(at.y + top * V.scale.token * 0.6);
    for (let i = 0; i <= B.steps; i++) { const u = i / B.steps, j = i === 0 || i === B.steps ? 0 : B.jag * (1 - u * 0.5); pts.push(new THREE.Vector3(to.x + (Math.random() - 0.5) * j * 2, to.y + B.from * (1 - u), to.z + (Math.random() - 0.5) * j * 2)); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: B.color, transparent: true, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending }));
    line.renderOrder = 45; this.root.add(line); (this.bolts ||= []).push({ line, life: B.life });
    this.sparks.burst(to, 50, B.color, { speed: 3, up: 0.6 }); this.sparks.burst(to, 30, WHITE, { speed: 1.5, up: 1.2 });
  }
  layBolts(dt) {
    this.bolts = (this.bolts || []).filter((b) => {
      b.life -= dt; const k = Math.max(0, b.life / V.bolt.life); b.line.material.opacity = k * (0.6 + 0.4 * (Math.random() < 0.5 ? 1 : 0)); // (a flicker)
      if (b.life > 0) return true; this.root.remove(b.line); b.line.geometry.dispose(); b.line.material.dispose(); return false;
    });
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
        const p = makeToken(this.kit, t.suit, t.owner, t.rank, speedOf(S, t, ENTROPY_RULES)); p.group.userData.pid = `k:${t.id}`; this.root.add(p.group);
        e = { ...p, id: t.id, x: t.x, z: t.z, pos: tiles.top(t.x, t.z, new THREE.Vector3()), born: 0, flash: 0, lift: 0, glide: null };
        this.tokens.set(t.id, e); this.sparks.burst(e.pos, 36, LOOK.side(t.owner), { speed: 1.2, up: 1.4, height: 0.2 });
      } else if (t.x !== e.x || t.z !== e.z) e.glide = { from: e.pos.clone(), u: 0, dur: V.glide * Math.max(1, Math.abs(t.z - e.z) * 0.55) }; // (the advance: along its column)
      if (t.hp != null && e.t?.hp != null && t.hp < e.t.hp) { e.flash = 1; this.sparks.burst(_v.copy(e.pos).setY(e.pos.y + 0.9), 30, 0xff5a4a, { speed: 1.8, up: 0.6 }); } // (a token hurt: its segments tick out, tokens.js health)
      e.health(t.hp, t.max); Object.assign(e, { x: t.x, z: t.z, t });
    }
    for (const [id, e] of this.tokens) if (!seen.has(id)) {
      const why = this.downWhy.get(id), from = _v2.copy(e.pos).setY(e.pos.y + 0.8).clone();
      if (why === 'struck') { const A = this.arcana[1 - e.owner]; this.fly(from, A.home, LOOK.side(e.owner), V.fly, 1.2, () => { A.flash = 1; this.sparks.burst(A.home, 50, WHITE, { speed: 2.5 }); }); }
      else if (why === 'home') { const P = this.piles[e.owner].deck; this.fly(from, P.group.position, LOOK.side(e.owner), V.fly * 1.3, 3, () => this.sparks.burst(P.group.position, 24, LOOK.side(e.owner), { speed: 1, up: 1 })); }
      else {
        this.sparks.burst(e.pos, 90, BONE, { speed: 1.1, up: 0.7, height: e.top, radius: 0.25, life: 1.5, gravity: 0.1 });
        this.sparks.burst(e.pos, 40, LOOK.side(e.owner), { speed: 1.6, up: 0.4, height: e.top, radius: 0.2, life: 1.2 });
      }
      this.downWhy.delete(id); this.tokens.delete(id); e.die = 0; e.away = why === 'struck' || why === 'home'; e.blunt = why === 'blunted'; this.dying.push(e); // (frayed away in layTokens)
    }
    for (const q of [0, 1]) { if (S.hp[q] < this.hpSeen[q]) { this.arcana[q].flash = 1; this.arcana[q].p?.hit(); } else if (S.hp[q] > this.hpSeen[q]) this.sparks.burst(this.arcana[q].home, 30, LOOK.side(q), { speed: 0.6, up: 1.2, radius: 0.5 }); this.hpSeen[q] = S.hp[q]; }
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
    if (OS) {
      OS.camera.updateMatrixWorld(); this.hand.updateMatrixWorld(true); this.corners.root?.updateMatrixWorld(true); this.ray.setFromCamera(this.ndc, OS.camera);
      const hit = this.ray.intersectObjects([...(this.drag.on ? [] : [...this.cards.values()].map((c) => c.mesh)), ...this.corners.pickables()], true)[0];
      if (hit) { let o = hit.object; while (o && !o.userData?.pid) o = o.parent; if (o) { this.hover = o.userData.pid; return; } }
    }
    const tiles = this.look.tiles, map = new Map(), objs = [...[...this.tokens.values()].map((e) => e.group), this.bomb.core, this.dice[1].p.spinner, this.piles[0].disc.mesh, ...this.arcana.filter((a) => a.p).map((a) => a.p.group)];
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
    this.sel = null; this.plates.choose(null); if (cm.run) cm.run(); else s.move(cm.move); // (a drop's two moves: drag.js)
  }
  /** What is lit and how much (0..1): every piece a choice names (a token of yours, not its targets, until it is chosen or hovered). */
  lights() {
    const ms = this.coach?.moves || [], lit = (this.lit = new Map()), up = (id, k) => lit.set(id, Math.max(lit.get(id) || 0, k)), h = this.hover, colors = new Map(), tiles = this.look.tiles;
    if (this.drag.on) { this.drag.lights(up, colors); for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const id = `t:${x}.${z}`; tiles.light(x, z, lit.get(id) || 0, colors.get(id) || this.hue); } return; }
    if (h?.startsWith('c:') && this.P?.seat === 0 && !this.press) for (const id of this.drag.targets(+h.slice(2)).keys()) up(id, 0.45); // (a card under the cursor: where it may be dropped, faintly)
    if (this.sel) { up(this.sel, 1); for (const m of ms) if (m.pieceIds[0] === this.sel) for (const id of m.pieceIds.slice(1)) up(id, 0.6); }
    else for (const m of ms) { if (isActor(m)) up(m.pieceIds[0], 0.5); else for (const id of m.pieceIds) up(id, id.startsWith('t:') ? 0.8 : 0.5); }
    if (h && !this.sel) for (const m of ms) if (isActor(m) && m.pieceIds[0] === h) for (const id of m.pieceIds.slice(1)) up(id, 0.3);
    if (h && (lit.has(h) || h.startsWith('c:'))) { const c = this.cands(h); if (h.startsWith('c:') && c.length === 1) for (const id of c[0].pieceIds) up(id, 0.85); if (lit.has(h)) up(h, 1); }
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
      e.ring.material.color.set(LOOK.side(e.owner)).lerp(this.hue, lit * 0.5).lerp(WHITE, e.flash * 0.6); e.tick(dt);
      const charged = !!(this.S?.ctx?.boost && e.owner === this.S.cur); // (a Charge's +3 on its owner's turn: the token burns gold)
      if (charged) e.body.emissive.lerp(_c.set(0xffc850), 0.35 + 0.25 * Math.sin(t * 8));
      e.glyph.position.y = e.top + 0.4 + Math.sin(t * 1.6 + e.id) * 0.05; e.glyph.scale.setScalar(0.5 + lit * 0.12 + (charged ? 0.1 : 0));
    }
    // a downed token frays: it shudders, thins and sinks (a struck lance or a cup going home just shrinks into its flight)
    this.dying = this.dying.filter((e) => {
      e.die += dt / V.fray; const u = Math.min(1, e.die), j = e.away ? 0 : 0.06 * (1 - u);
      e.group.position.set(e.pos.x + (Math.random() - 0.5) * j, e.pos.y - u * (e.away ? 0 : 0.4), e.pos.z + (Math.random() - 0.5) * j);
      e.group.scale.set(V.scale.token * (1 - u * (e.away ? 1 : 0.6)), V.scale.token * (1 - u), V.scale.token * (1 - u * (e.away ? 1 : 0.6))); e.body.emissive.copy(WHITE).multiplyScalar(e.blunt ? 0 : 1 - u);
      if (e.blunt) { e.body.color.setRGB(0.42, 0.4, 0.38).lerp(BONE, 1 - Math.min(1, u * 3)); if (Math.random() < 0.8) this.sparks.burst(_v.copy(e.pos).setY(e.pos.y + Math.random() * e.top), 3, 0x8a8478, { speed: 0.3, up: 0, life: 1.0, gravity: -2.5 }); } // (a wounded sword dulls and crumbles: no shove)
      if (!e.away && Math.random() < 0.5) this.sparks.burst(_v.copy(e.pos).setY(e.pos.y + Math.random() * e.top), 2, LOOK.side(e.owner), { speed: 0.4, up: 0.4, life: 0.8 });
      if (u < 1) return true; this.root.remove(e.group); return false;
    });
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
    if (S.counter !== this.countSeen) { this.count.set(S.counter, { max: ENTROPY_RULES.counter, delta: this.countSeen == null ? 0 : this.countSeen - S.counter }); this.countSeen = S.counter; }
    this.count.place(B.group.getWorldPosition(_v)); this.count.tick(dt, t);
  }
  layDice(dt, t, S) {
    if (S.phase === 'bomb' && S.ctx) {
      const key = `${S.round}|${S.cur}|${S.ctx.roll}|${S.ctx.rerolled}|${S.ctx.lit}`;
      if (key !== this.dieKey) { this.dieKey = key; const d = this.dice[S.cur], off = V.at.throw[S.cur]; Object.assign(d, { state: 'throw', u: 0, from: d.pos.clone(), roll: S.ctx.roll, key, land: _v2.set(off.x * (BOARD.tile + BOARD.gap), 0.45, off.z * (BOARD.tile + BOARD.gap)).clone(), axis: new THREE.Vector3(Math.random() - 0.5, 0.4, Math.random() - 0.5).normalize(), spins: 2.5 + Math.random() * 2 }); d.settle.setFromAxisAngle(_v.set(0, 1, 0), Math.random() * 6.28); }
    }
    { const c = this.corners.dieScreen(), cam = this.game.camera, o = cam.position; _v.set((c.x / innerWidth) * 2 - 1, -(c.y / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(o).normalize(); this.dice[0].rest.copy(o).addScaledVector(_v, 7); } // (yours rests in the corner: thrown from it and back into it)
    for (const d of this.dice) {
      const P = d.p, pose = d.feast.tick(dt); P.setSides(d.seat === 0 ? sidesOf(S.fed[0]) : d.feast.sides); P.edges.color.copy(this.hue).lerp(WHITE, Math.min(1, pose.crack + pose.glow * 0.5));
      P.group.visible = d.seat === 1 || d.state !== 'rest'; // (yours at rest is the corner's big one, corners.js)
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
        P.num.sprite.visible = true; P.num.set(`d${P.sides}`, pose.label > 0 ? LOOK.ink : LOOK.inkDim); P.num.sprite.scale.set(1.2, 0.6, 1);
      }
      P.fedNum.sprite.position.y = -0.2 - 0.3 * V.scale.die; P.fedNum.set(d.seat === 0 ? S.fed[0] : d.feast.fed, `#${this.hue.getHexString()}`); P.fedNum.sprite.visible = d.state === 'rest';
      const dl = this.lit.get(`die:${d.seat}`) || 0; if (dl) P.edges.color.lerp(WHITE, dl * 0.7);
      const sz = V.scale.die * pose.reform * (1 + dl * 0.18 + pose.bulge * 0.25);
      P.group.position.copy(d.pos); P.spinner.scale.set(sz * (1 + pose.squash * 0.25), sz * (1 - pose.squash * 0.32), sz * (1 + pose.squash * 0.25)); P.spinner.rotation.z = pose.wob * 0.35; // (their feast and growth, the corner's timeline: corners.js DieFeast) P.num.sprite.position.y = 0.45 * V.scale.die + (d.state === 'rest' ? 0.35 : 0.9);
    }
  }
  layArcana(dt, t, S) {
    const k = 1 - Math.exp(-10 * dt), to = this.camTo?.p || this.game.camera.position;
    for (const a of this.arcana.slice(1)) { // (yours stands in the corner: corners.js)
      const pid = `arcana:${a.seat}`, lit = this.lit.get(pid) || 0; a.flash = Math.max(0, a.flash - dt * 1.8);
      a.lift += ((this.hover === pid ? V.lift : 0) - a.lift) * k;
      if (a.cls !== S.cls[a.seat]) { a.p?.dispose(); a.cls = S.cls[a.seat]; a.p = new ArcanaPortrait(this.kit, a.cls, a.seat); a.p.group.userData.pid = pid; this.root.add(a.p.group); a.hp = null; }
      const G = a.p.group; G.position.copy(a.home); G.position.y += a.lift + Math.sin(t * 0.6 + a.seat * 3) * 0.05; G.lookAt(to); G.scale.setScalar(V.scale.arcana[a.seat]);
      if (a.hp !== S.hp[a.seat]) { a.hp = S.hp[a.seat]; a.p.set({ hp: a.hp, max: HEALTH }); }
      a.p.light?.(Math.max(lit, a.flash)); a.p.tick(dt, t);
    }
  }
  layHeld(t, S) {
    const n = Math.min(8, (S.hand[1]?.length || 0) + (S.kept?.[1]?.length || 0)), to = this.camTo?.p || this.game.camera.position;
    this.held.forEach((m, i) => { m.visible = i < n; if (!m.visible) return; m.position.copy(this.heldAt); m.position.x += (i - (n - 1) / 2) * 0.3; m.position.y += Math.sin(t * 0.7 + i) * 0.04; m.lookAt(to); m.rotateZ((i - (n - 1) / 2) * -0.08); });
  }
  /** Your hand, fanned at the screen's foot on the overlay's scene (CSS px, y up from the bottom edge). */
  layHand(dt, S) {
    if (!this.game.overlayScene) return;
    const H = V.hand, kept = S.kept?.[0] || [], hand = [...(S.hand[0] || []), ...kept], nh = hand.length - kept.length, h = innerHeight, ch = Math.max(H.min, Math.min(H.max, h * H.h)), cw = ch * 0.7, bar = H.bar + (this.game.hudLayout?.safe?.b || 0), mid = (hand.length - 1) / 2, k = 1 - Math.exp(-12 * dt), keep = new Set(); this.handCh = ch;
    hand.forEach((c, i) => {
      keep.add(c); let e = this.cards.get(c);
      if (!e) {
        const mat = this.kit.shared(`cardmat.${c}`, () => new THREE.MeshBasicMaterial({ map: cardTexture(this.kit, c), toneMapped: false }));
        e = { mesh: new THREE.Mesh(this.cardGeo, mat), rim: new THREE.Mesh(this.cardGeo, this.rimMat), x: innerWidth * 0.6, y: -ch, r: 0, lift: 0 };
        e.mesh.userData.pid = `c:${c}`; this.hand.add(e.rim, e.mesh); this.cards.set(c, e);
      }
      const pid = `c:${c}`, lit = this.lit.get(pid) || 0, isKept = i >= nh, picked = this.P?.kind === 'place' && this.P.card === c, held = this.drag.card === c;
      let tx = (i - mid) * cw * H.step + (isKept ? cw * 0.35 : 0), ty = bar + ch * 0.5 + 6 - (i - mid) ** 2 * ch * 0.014, tr = -(i - mid) * H.fan, ts = 1, z = i * 4;
      if (held) { const D = this.drag.held(ch); tx = D.x; ty = D.y; tr = D.tilt; ts = D.small; z = H.held; } // (in the hand of the cursor or the finger: drag.js)
      const lift = held ? 0 : picked ? ch * H.picked : this.hover === pid ? ch * 0.2 : lit >= 0.85 ? ch * 0.1 : lit ? ch * 0.04 : 0;
      if (e.spring > 0) { e.spring = Math.max(0, e.spring - dt * 1.4); e.vx = ((e.vx || 0) + (tx - e.x) * 180 * dt) * Math.exp(-11 * dt); e.vy = ((e.vy || 0) + (ty - e.y) * 180 * dt) * Math.exp(-11 * dt); e.x += e.vx * dt; e.y += e.vy * dt; } // (let go over nothing: it springs home)
      else { const kk = held ? 1 - Math.exp(-30 * dt) : k; e.x += (tx - e.x) * kk; e.y += (ty - e.y) * kk; e.vx = e.vy = 0; }
      e.r += (tr - e.r) * k; e.lift += (lift - e.lift) * k; e.s = (e.s ?? 1) + (ts - (e.s ?? 1)) * (1 - Math.exp(-16 * dt));
      e.mesh.position.set(e.x, e.y + e.lift - (isKept ? ch * 0.12 : 0), z + 2); e.mesh.rotation.z = e.r; e.mesh.scale.set(cw * e.s, ch * e.s, 1); e.mesh.material.color.setScalar(isKept && !held ? 0.5 : 1); // (a kept card set aside, dimmed: held for next turn)
      const rl = picked || held ? 1 : lit, pad = rl >= 0.85 ? 10 : 4; e.rim.visible = rl > 0; e.rim.position.set(e.x, e.y + e.lift - (isKept ? ch * 0.12 : 0), z); e.rim.rotation.z = e.r; e.rim.scale.set(cw * e.s + pad, ch * e.s + pad, 1);
    });
    this.rimMat.color.copy(this.hue);
    for (const [c, e] of this.cards) if (!keep.has(c)) { this.hand.remove(e.mesh, e.rim); this.cards.delete(c); }
  }

  // ------------------------------------------------------------- the words
  words(S) {
    const s = this.session, T = s.T, R = T.game.result(S), P = this.P, C = this.coach, mine = P?.seat === 0;
    this.plates.hue(`#${this.hue.getHexString()}`);
    const who = T.names[P?.seat] || 'They', name = who.charAt(0).toUpperCase() + who.slice(1);
    this.plates.turn(R ? '' : mine ? `${C?.turn?.say || ''}  ·  bank ${S.bank[0]}  ·  d${sidesOf(S.fed[0])}` : `${name} is playing: ${V.phase[S.phase] || ''}`, mine || !!R, { who: mine ? 'Your turn' : `${name}'s turn`, step: V.phase[S.phase] || '' });
    this.plates.bar(mine ? (C?.moves || []).filter((m) => !m.pieceIds.length || m.pieceIds.every((id) => id === 'bomb')) : [], `${this.coachKey}|${mine}`);
    this.plates.result(R && s.done ? { won: R.winner === 0, title: R.winner === 0 ? 'You win' : `${T.names[R.winner]} wins`, how: (V.how[R.how] || ['', ''])[R.winner === 0 ? 0 : 1], practice: !!s.practice } : null);
    if (this.drag.on) this.plates.tip(this.tipFor(S), innerWidth - 300, innerHeight * 0.62); else this.plates.tip(this.tipFor(S), this.mouse?.x ?? 0, this.mouse?.y ?? 0); // (while a card is dragged the tip stands aside: the board is the preview's)
    const d = this.dice.find((x) => x.state === 'hold'); if (d) { _v.copy(d.pos).project(this.game.camera); this.plates.roll(d.roll, (_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight, LOOK.sideCss(d.seat)); } else this.plates.roll(null);
  }
  tipFor(S) {
    if (this.drag.on) return this.drag.tip();
    const id = this.hover; if (!id || (this.press && performance.now() - this.press.t < V.longPress * 1000)) return null;
    const moves = this.cands(id).map((m) => ({ label: m.label, what: m.what, preview: m.preview })), whose = (o) => (o === 0 ? 'yours' : o === 1 ? 'theirs' : 'nobody\'s');
    if (id.startsWith('c:')) {
      const c = +id.slice(2);
      if (this.P?.kind === 'place' && this.P.card === c) return { title: nameOf(c), lines: ['Chosen: now a lit tile', 'Click it again to put it back'], moves: [] };
      const n = this.P?.seat === 0 ? this.drag.targets(c).size : 0;
      return { title: nameOf(c), lines: [...(n ? [`Drag it to a lit place (${n}), or click it`] : []), ...(moves.length || n ? [] : [(S.kept?.[0] || []).includes(c) ? 'Kept for next turn' : 'Not playable now'])], moves };
    }
    if (id.startsWith('k:')) {
      const tk = S.tokens.find((x) => `k:${x.id}` === id); if (!tk) return null;
      return { title: `${tk.owner === 0 ? 'Your' : 'Their'} ${V.rank[tk.rank] || ''} of ${SUITS[tk.suit]}`, lines: [`Power ${strengthOf(S, tk)}${S.ctx?.boost && tk.owner === S.cur ? ` (Charge +${S.ctx.boost})` : ''}: its health left${tk.hp != null ? `, ${tk.hp} of ${tk.max}` : ''} · advances ${speedOf(S, tk, ENTROPY_RULES)} a turn`, V.does[tk.suit]], moves };
    }
    if (id === 'bomb') { const T = S.tiles[S.bomb.z * N + S.bomb.x]; return { title: 'The Grand Bomb', lines: [`Counter ${S.counter}: at 0 whoever owns its tile loses (now ${whose(T.o)})`], moves }; }
    if (id.startsWith('arcana:')) { const q = +id.slice(7), Cl = CLASSES[S.cls[q]]; return { title: Cl?.label, lines: [`${S.hp[q]} of ${HEALTH} health · deck ${S.deck[q].length} · discard ${S.disc[q].length} · fed ${S.fed[q]}`, Cl?.passive || ''], moves }; }
    if (id === 'disc:0') return { title: 'Your discard pile', lines: [`${S.disc[0].length} cards: a reshuffle brings them back`], moves };
    if (id.startsWith('die:')) { const q = +id.slice(4); return { title: `${q ? 'Their' : 'Your'} Hungry Die: d${sidesOf(S.fed[q])}`, lines: [`${S.fed[q]} cards fed (gone for good) · bank ${S.bank[q]}`, 'Feed 4, 9, 15, 22, 30 for a bigger die'], moves }; }
    if (id.startsWith('t:')) { const [x, z] = id.slice(2).split('.').map(Number), T = S.tiles[z * N + x]; return { title: `Tile ${x + 1}, ${z + 1}: ${whose(T.o)}, ${T.s} of 21`, lines: [], moves }; }
    return null;
  }

  // ------------------------------------------------------------- the camera
  /** The seat's shot, fitted: CAMERA's pitch and field of view, the aim and distance moved until the board and its extras fill the band. */
  fit() {
    const cam = (this.fitCam ||= new THREE.PerspectiveCamera()), B = V.band; cam.fov = CAMERA.fov; cam.aspect = innerWidth / Math.max(1, innerHeight); cam.near = 0.1; cam.far = 500; cam.updateProjectionMatrix();
    const y0 = 0, pts = [cellAt(-0.6, -0.6, y0), cellAt(6.6, -0.6, y0), cellAt(-0.6, 6.6, y0), cellAt(6.6, 6.6, y0)].map((p) => p.clone());
    for (const a of this.arcana.slice(1)) { const k = V.scale.arcana[a.seat]; pts.push(a.home.clone().setY(a.home.y + 1.0 * k), a.home.clone().setY(a.home.y - 1.0 * k)); }
    for (const d of this.dice.slice(1)) pts.push(d.rest.clone().setY(d.rest.y + 1.3), d.rest.clone().setY(d.rest.y - 0.6));
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
