// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S VIEW (docs/plans/WELL-BOARD.md 10; South, 2026-11-14: Mario Party's and Dokapon Kingdom's board in 3D space,
// "taken to a psychedelic esoteric extreme", "the Pneuka Jar as the player's boardgame piece"): the board drawn in a scene of its
// own in place of the world while its page is open (boot/frame.js draws it while `.active`, as it does the reading view's scene),
// through the game's own glow and grade. A DRAFT LOOK, a free hand's; it draws the rules' state and plays the rules' log, and
// decides nothing.
//
//   THE VOID     the sky dome (boardkit.js): the eye above, the Well's spiral below
//   THE RINGS    a wheel a floor (boardring.js), stacked down the shaft; the floor below is seen through the one you stand on
//   THE PIECES   a Pneuka Jar a seat (yours in your vessel's glazes, a rival's in its sibling's look, named over its head). YOURS:
//   THE PIECE    your Pneuka Jar: the owner's model cloned and fired in your vessel's glazes (vfx/pneukajar/dress.js, as a guest's
//                Jar is), hopping pad to pad with a squash on each landing; a turned stand-in until the owner's model has loaded
//   THE DICE     your six in a tray before the camera, each its solid in its suit's ink; a click picks one (its reach rings the
//                pads), a second click on it throws it: it tumbles out over the Jar and its face is said big, then counts down a hop
//   THE TURN     the rules' log played as a queue of beats, every seat's: the throw, each step, the landing, haul, cubes, a crack,
//                a mend, the fate die, an item, a power, a drawn Arcana (its card held up), a duel, a battle's blows, the way out.
//                A rival's beats run faster, and a click on the board hurries them. The page waits while it plays (`busy`).
//
// Prior art: Mario Party (the dice block's number over the head, the hop a space, the camera riding the piece), Dokapon Kingdom
// (the spinner's reach lit on the board), Super Mario Galaxy (a small body on a small world in a big sky), the reading view's
// scene (render/readingscene.js: a scene in place of the world, through game.post).
//
//   new WellBoardView(game, session)   .open()   (session.cast: [{ label, color, look }], a seat each)   .close()   .active   .busy   .play(logEntries)   .sync()   .render()   (boot/frame.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { BOARD, MOUTH } from '../../progress/wellboard/layout.js';
import { keysAt } from '../../progress/wellboard/rules.js';
import { ITEMS, ARCANA, STANCES, POWERS } from '../../progress/wellboard/items.js';
import { JarMaterials } from '../pneukajar/dress.js';
import { DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { BoardRing, RING, ringY } from './boardring.js';
import { skyMaterial, toy, dieGeometry, DIE_COLOUR, PAD, textSprite, cardSprite, haloTex, tick } from './boardkit.js';

const CAM = { r: 25, h: 14, fov: 44, toJar: 0.55, ease: 3.2, under: 1.6 }; // (under: aimed below the wheel, so the board sits in the upper frame and the dice tray below it)
const TRAY = { z: -11, y: -3.25, gap: 1.45, s: 0.44, pick: 0.64 }; // (along the bottom: the game's HUD steps out while the board is up)
const BEAT = { hop: 0.2, plunge: 1.1, throw: 0.85, hold: 0.45, land: 0.22, haul: 0.4, crack: 0.45, slide: 0.55, fate: 0.9, out: 1.2, word: 0.55, card: 1.5, duel: 0.8 };
const JAR = { s: 2.3, rival: 1.9, off: 0.8 }; // (the owner's Jar is small beside a pad: a piece should fill its space, as Mario Party's do)
const RIVAL_RATE = 1.9, RUSH = 6; // (a rival's beats play faster; a click on the board hurries them)
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
const ease = (k) => k * k * (3 - 2 * k), depthOf = (id) => (id === MOUTH ? 0 : +id.split('.')[0]), hex = (n) => '#' + new THREE.Color(n).getHexString();
const NOT_A_SEAT = { stray: 1, round: 1 };

export class WellBoardView {
  constructor(game, session) {
    this.game = game; this.B = session; this.active = false; this.rings = new Map(); this.q = []; this.now = null; this.t = 0; this.last = 0;
    this.yaw = -Math.PI / 2; this.camY = 0; this.shake = 0; this.built = false; this.pieces = []; this.focus = null; this.rush = false;
  }
  get busy() { return this.active && (this.q.length > 0 || !!this.now); }

  build() {
    if (this.built) return; this.built = true;
    const S = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(CAM.fov, innerWidth / innerHeight, 0.1, 900);
    S.add(new THREE.HemisphereLight(0xcdb8ff, 0x2a1040, 0.75)); const key = new THREE.DirectionalLight(0xfff0d8, 1.0); key.position.set(4, 10, 5); S.add(key); // (the Jars' own materials are lit; the toy shading lights itself)
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 32), skyMaterial()); S.add(this.sky);
    this.number = textSprite(); S.add(this.number.sprite);
    this.card = cardSprite(); S.add(this.card.sprite);
    this.dice = BOARD.dice.map((sides, i) => {
      const mesh = new THREE.Mesh(dieGeometry(sides), toy({ color: DIE_COLOUR[sides], film: 0.2, flat: true })); mesh.userData.sides = sides; S.add(mesh);
      const label = textSprite(); label.set(`d${sides}`, '#fff1d6'); label.sprite.scale.set(0.9, 0.45, 1); label.sprite.visible = true; S.add(label.sprite); mesh.userData.label = label.sprite;
      return { sides, i, mesh, spent: false, s: TRAY.s, fly: null, spin: new THREE.Vector3(0.6 + i * 0.13, 0.9 - i * 0.07, 0.3) };
    });
    this.motes = [...Array(64)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); s.visible = false; S.add(s); return { s, v: new THREE.Vector3(), life: 0, dur: 1 }; });
    this.onDown = (e) => this.pointer(e);
  }

  /** A seat's piece: the owner's Pneuka Jar in that seat's look (yours: your vessel's glazes), or a turned stand-in in the seat's
   *  colour while the owner's model has not loaded. A rival wears its name over its head. */
  makePiece(seat, who) {
    const g = this.game, V = g.god?.jar || g.realm?.god?.jar, src = V?.group?.children?.[0], P = { seat, at: MOUTH, qAt: null, gone: false, leaving: false, squash: 0, squashV: 0, s: seat ? JAR.rival : JAR.s, off: new THREE.Vector3() };
    P.group = new THREE.Group(); P.group.name = `WellBoardPiece:${seat}`; this.scene.add(P.group);
    P.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: who.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); P.glow.scale.set(3.4, 3.4, 1); P.glow.position.y = 0.9; P.group.add(P.glow);
    try {
      if (src && V.jarMat && V.jarBody) {
        const model = cloneSkinned(src), body = V.jarBody.geometry; let core = g.pneukaJarLook?.core?.geometry || null;
        if (!core) V.group.traverse((o) => { if (o.isSkinnedMesh && o.material === V.coreMat) core = o.geometry; });
        const drop = []; model.traverse((o) => { if (o.isSprite || (o.isMesh && o.geometry !== body && o.geometry !== core)) drop.push(o); });
        for (const o of drop) o.parent?.remove(o); // (only the clay and its gems: the god hand's halo and cracks stay the god hand's)
        P.mats = new JarMaterials(V.jarMat.map); const M = P.mats.m;
        model.traverse((o) => { if (o.isMesh) { o.material = o.geometry === core ? M.stones : [M.body, M.trim, M.mask]; o.frustumCulled = false; } if (o.isSkinnedMesh) o.skeleton.pose(); }); // (its bind pose: a clone is taken mid-clip)
        P.mats.dress(who.look || g.vessel?.look || DEFAULT_LOOK, !seat && g.vessel?.glazeOf ? (id) => g.vessel.glazeOf(id) : undefined);
        model.scale.setScalar(1); model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.visible = true; P.jar = model; P.owner = true;
      }
    } catch (e) { P.jar = null; }
    if (!P.jar) { // (the stand-in: a jar turned on a lathe, in the toy shading)
      const pts = [[0, 0], [0.34, 0], [0.42, 0.08], [0.5, 0.4], [0.44, 0.74], [0.24, 0.95], [0.22, 1.05], [0.3, 1.12], [0.0, 1.12]].map(([x, y]) => new THREE.Vector2(x, y));
      P.jar = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), toy({ color: seat ? who.color : 0xc8552e, film: 0.15 }));
    }
    P.hold = new THREE.Group(); P.hold.add(P.jar); P.hold.scale.setScalar(P.s); P.group.add(P.hold);
    // (a rival's name, staggered by seat: four Jars on one pad are four names, not one smear)
    if (seat) { P.tag = textSprite(); P.tag.set(who.label.toUpperCase(), hex(who.color)); P.tag.sprite.scale.set(2.0, 1.0, 1); P.tag.sprite.position.y = 3.3 + seat * 0.62; P.tag.sprite.visible = true; P.group.add(P.tag.sprite); }
    return P;
  }

  open() {
    this.build();
    for (const R of this.rings.values()) R.dispose(); this.rings.clear();
    for (const P of this.pieces) { this.scene.remove(P.group); P.mats?.dispose?.(); }
    const cast = this.B.cast, n = cast.length;
    this.pieces = cast.map((who, seat) => { const P = this.makePiece(seat, who); if (n > 1) { const a = seat * (Math.PI / 2) + Math.PI / 4; P.off.set(Math.cos(a) * JAR.off, 0, Math.sin(a) * JAR.off); } return P; });
    this.jar = this.pieces[0].jar; this.jar.userData.owner = !!this.pieces[0].owner; this.focus = this.pieces[0];
    this.q.length = 0; this.now = null; this.rush = false; this.number.sprite.visible = false; this.card.sprite.visible = false;
    this.active = true; this.last = performance.now(); this.sync(true);
    const at = this.focus.group.position; this.yaw = Math.atan2(at.z, at.x); this.camY = at.y;
    this.game.ui?.want?.('wellboard', true); // (the HUD steps out: the board is the whole screen, and its page says the turn)
    removeEventListener('pointerdown', this.onDown, true); addEventListener('pointerdown', this.onDown, true);
  }
  close() { if (!this.active) return; this.active = false; this.game.ui?.want?.('wellboard', false); removeEventListener('pointerdown', this.onDown, true); }

  ring(depth) {
    const S = this.B.S, F = S.floors[depth]; if (!F) return null;
    let R = this.rings.get(depth);
    if (!R) { R = new BoardRing(F, depth, { need: BOARD.need, mouth: depth === 0 ? S.mouth : null }); this.rings.set(depth, R); this.scene.add(R.group); R.sync(S, keysAt(S, depth, 0)); }
    return R;
  }
  where(id, out = new THREE.Vector3()) { return this.ring(depthOf(id))?.at(id, out) || out.set(0, 0, 0); }
  stand(P, id, out = new THREE.Vector3()) { return this.where(id, out).add(P.off); }

  /** The rules' state worn at once: every laid floor a ring, the pads' states, the dice spent, each Jar where its seat stands. */
  sync(place = false) {
    const S = this.B.S; if (!S || !this.built) return;
    for (const F of S.floors) this.ring(F.depth)?.sync(S, keysAt(S, F.depth, 0));
    const me = S.seats[0]; for (const d of this.dice) d.spent = me.spent.includes(d.sides);
    if (place) for (const P of this.pieces) { const s = S.seats[P.seat]; if (s.out != null && !P.leaving) { P.gone = true; P.group.visible = false; } else if (!P.gone && !P.leaving) { this.stand(P, s.at, P.group.position); P.at = s.at; P.group.visible = true; } }
    this.reach();
  }
  /** The picked die's reach (or the waiting decision's landings) ringed on the pads. */
  reach() {
    const B = this.B, R = B.readout?.(), P = R?.pending, map = {};
    if (R && !this.busy && !B.done && P?.yours) {
      const pick = P.kind === 'throw' ? R.dice.find((d) => d.sides === B.hover && !d.spent) : null;
      const src = pick ? pick.reach : P.kind === 'reroll' ? P.reach.filter((f) => f.face === P.face) : P.kind === 'fork' || P.kind === 'face' ? P.moves.map((m) => ({ lands: m.lands })) : [];
      for (const f of src) for (const l of f.lands) map[l.id] = Math.min(1, (map[l.id] || 0) + 1 / Math.max(1, src.length));
    }
    for (const R2 of this.rings.values()) R2.reach(map);
  }

  // ------------------------------------------------------------------ the turn, played
  /** The rules' log since the last look, as beats, every seat's (each entry's first key is its kind, its value the seat). */
  play(entries) {
    if (!this.active) return;
    for (const x of entries) {
      const kind = Object.keys(x)[0], p = NOT_A_SEAT[kind] ? null : x[kind], P = p != null ? this.pieces[p] : null, mine = p === 0;
      const push = (dur, o = {}) => this.q.push({ dur, rate: mine || p == null ? 1 : RIVAL_RATE, P, ...o });
      const word = (text, colour, n = 10, dur = BEAT.word) => push(dur, { start: () => { this.say(text, colour); this.burst(P.group.position, new THREE.Color(colour).getHex(), n, 4, 3); this.sync(); }, end: () => { this.number.sprite.visible = false; } });
      if (kind === 'stray') { push(0.35, { start: () => this.sync() }); continue; }
      if (!P || P.gone) continue;
      if (kind === 'throw') {
        const d = mine ? this.dice.find((y) => y.sides === x.sides) : null;
        if (d) { push(BEAT.throw, { start: () => this.throwStart(d), tick: (k) => { d.fly.k = k; }, end: () => this.throwEnd(d, x.face) }); push(BEAT.hold); }
        else push(BEAT.hold, { start: () => { this.say(String(x.face), hex(DIE_COLOUR[x.sides])); this.burst(_a.copy(P.group.position).setY(P.group.position.y + 3.4), DIE_COLOUR[x.sides], 8, 4); } });
      } else if (kind === 'step') { const cross = depthOf(x.at) !== depthOf(P.qAt ?? P.at); P.qAt = x.at; push(cross ? BEAT.plunge : BEAT.hop, { start: (b) => this.hopStart(P, b, x.at, cross), tick: (k, b) => this.hopTick(P, b, k), end: (b) => this.hopEnd(P, b, x.left) }); }
      else if (kind === 'shift') { P.qAt = x.to; push(BEAT.slide, { start: (b) => this.hopStart(P, b, x.to, false, 3.2), tick: (k, b) => { this.hopTick(P, b, k); P.hold.rotation.y += 0.5; }, end: (b) => this.hopEnd(P, b, null) }); }
      else if (kind === 'swap') { const Q = this.pieces[x.with], a = P.qAt ?? P.at, b2 = Q.qAt ?? Q.at; P.qAt = b2; Q.qAt = a; push(BEAT.slide, { start: (b) => { this.hopStart(P, b, b2, false, 4); b.other = {}; this.hopStart(Q, b.other, a, false, 4); }, tick: (k, b) => { this.hopTick(P, b, k); this.hopTick(Q, b.other, k); }, end: (b) => { this.hopEnd(P, b, null); this.hopEnd(Q, b.other, null); } }); }
      else if (kind === 'land') push(BEAT.land, { start: () => { this.number.sprite.visible = false; this.burst(P.group.position, PAD[x.kind]?.color ?? 0xffffff, 8, 3); } });
      else if (kind === 'haul' && x.tier != null) word('HAUL', '#ffd36a', 16, BEAT.haul);
      else if (kind === 'cubes') word(`${x.n > 0 ? '+' : ''}${x.n}`, x.n > 0 ? '#7de3ff' : '#ff6b5e', 8, BEAT.haul);
      else if (kind === 'crack') push(BEAT.crack, { start: () => { if (mine) this.shake = 0.6; this.say('CRACK', '#ff4a4a'); this.burst(P.group.position, 0xff2a2a, 18, 6); }, end: () => { this.number.sprite.visible = false; } });
      else if (kind === 'warded') word('WARDED', '#c9a7ff', 16);
      else if (kind === 'mend' || kind === 'back') push(BEAT.haul, { start: () => { this.burst(P.group.position, 0x1fd6b4, 14, 3, 4); this.sync(); } });
      else if (kind === 'recast') { if (mine) push(0.3, { start: () => { for (const d of this.dice) d.spent = false; this.burst(this.trayAt(2.5, _a), 0xffffff, 14, 4); } }); }
      else if (kind === 'fate') push(BEAT.fate, { start: () => { this.say(String(x.face).padStart(2, '0'), x.saved ? '#7dffb0' : '#ff4a4a'); this.burst(P.group.position, x.saved ? 0x7dffb0 : 0xff2a2a, 10, 4); }, end: () => { this.number.sprite.visible = false; } });
      else if (kind === 'item') word(ITEMS[x.got].label.toUpperCase(), '#ffa53f');
      else if (kind === 'use') word(ITEMS[x.item].label.toUpperCase(), '#ffa53f');
      else if (kind === 'power') word(POWERS[x.cast].label.toUpperCase(), '#c9a7ff', 22, 0.8);
      else if (kind === 'push') word(`PUSH ${x.face}`, '#c9a7ff');
      else if (kind === 'transmute' || kind === 'key' || kind === 'snare' || kind === 'strayDown' || kind === 'failed' || kind === 'foe') push(0.2, { start: () => { this.sync(); this.burst(P.group.position, 0xffd36a, 12, 4, 3); } });
      else if (kind === 'snared') word('SNARED', '#ff4a4a', 14);
      else if (kind === 'skip') word('MISSES A TURN', '#b9a8d8');
      else if (kind === 'asleep') word('ASLEEP', '#b9a8d8');
      else if (kind === 'arcana') { const card = ARCANA.find((c) => c.id === x.card); push(BEAT.card, { start: () => { this.card.set(card); this.card.sprite.visible = true; this.burst(P.group.position, 0xffd36a, 20, 5, 5); }, tick: (k) => { const s = Math.min(1, k * 5) * (k > 0.88 ? (1 - k) / 0.12 : 1); this.card.sprite.scale.set(3.4 * s, 5.44 * s, 1); this.card.sprite.position.copy(P.group.position).y += 6.2; }, end: () => { this.card.sprite.visible = false; } }); }
      else if (kind === 'duel') {
        const Q = this.pieces[x.vs], W = x.win == null ? null : this.pieces[x.win];
        push(BEAT.duel, { start: (b) => { b.a = P.group.position.clone(); b.b = Q.group.position.clone(); this.say(`${STANCES[x.sa].label.toUpperCase()} · ${STANCES[x.sb].label.toUpperCase()}`, '#ffffff'); }, tick: (k, b) => { const j = Math.sin(Math.PI * k) * 0.45; P.group.position.lerpVectors(b.a, b.b, j); Q.group.position.lerpVectors(b.b, b.a, j); }, end: (b) => { P.group.position.copy(b.a); Q.group.position.copy(b.b); this.shake = 0.35; this.burst(_a.lerpVectors(b.a, b.b, 0.5), 0xffffff, 20, 7); } });
        push(BEAT.word, { start: () => { this.say(W ? (W.seat === 0 ? 'YOU WIN' : `${this.B.cast[W.seat].label.toUpperCase()} WINS`) : 'A DRAW', W ? hex(this.B.cast[W.seat].color) : '#b9a8d8'); if (W) this.burst(W.group.position, this.B.cast[W.seat].color, 18, 5, 4); }, end: () => { this.number.sprite.visible = false; } });
      } else if (kind === 'bout') {
        if (x.open) word(x.open === 'foe' ? 'THE FOE' : x.open === 'stray' ? 'A STRAY' : 'A FIGHT', '#ff6a3c', 14, 0.6);
        else if (x.hit != null && mine) push(0.3, { start: () => { this.say(`${x.hit}`, '#ffe14a'); this.burst(_a.copy(P.group.position).setY(P.group.position.y + 2.5), 0xffe14a, 10, 6); P.squashV = 5; } });
        else if (x.blow != null && mine) push(0.4, { start: () => { if (x.blow > 0) { this.shake = 0.4; this.say(`-${x.blow}`, '#ff4a4a'); this.burst(P.group.position, 0xff2a2a, 12, 5); } else this.say(x.stopped ? 'STOPPED' : 'GUARDED', '#7dffb0'); }, end: () => { this.number.sprite.visible = false; } });
        else if (x.end) word(x.end === 'won' ? (x.flawless ? 'FLAWLESS' : 'WON') : 'LOST', x.end === 'won' ? '#7dffb0' : '#ff4a4a', 20, 0.7);
      } else if (kind === 'out' || kind === 'fall') {
        const how = kind === 'fall' ? 'fall' : x.how; if (P.leaving) continue; P.leaving = true;
        push(BEAT.out, { start: (b) => { b.from = P.group.position.clone(); this.burst(P.group.position, how === 'fall' ? 0xff2a2a : 0xffd36a, 30, 7, how === 'fall' ? 0 : 6); }, tick: (k, b) => { P.group.position.y = b.from.y + (how === 'fall' ? -1 : 1) * ease(k) * 16; P.hold.rotation.y += 0.4; }, end: () => { P.gone = true; P.group.visible = false; } });
      }
    }
    this.reach();
  }
  say(text, colour) { this.number.set(text, colour); this.number.sprite.visible = true; }
  throwStart(d) { d.spent = true; d.fly = { from: this.trayAt(d.i, new THREE.Vector3()), k: 0 }; this.number.sprite.visible = false; }
  throwEnd(d, face) { const at = this.pieces[0].group.position; d.fly = null; this.say(String(face), hex(DIE_COLOUR[d.sides])); this.burst(_a.copy(at).setY(at.y + 3.4), DIE_COLOUR[d.sides], 14, 5); }
  hopStart(P, b, to, cross, high = 1.5) { b.from = P.group.position.clone(); b.to = this.stand(P, to); b.high = cross ? 3 : high; P.at = to; const dx = b.to.x - b.from.x, dz = b.to.z - b.from.z; if (dx * dx + dz * dz > 0.01) P.hold.rotation.y = Math.atan2(dx, dz); this.sync(); }
  hopTick(P, b, k) { const e = ease(k); P.group.position.lerpVectors(b.from, b.to, e); P.group.position.y += Math.sin(Math.PI * k) * b.high; }
  hopEnd(P, b, left) { P.group.position.copy(b.to); P.squashV = -7; this.burst(b.to, 0xfff1d6, 5, 2); if (left != null) { if (left > 0) this.say(String(left), '#ffffff'); else this.number.sprite.visible = false; } }

  burst(at, colour, n = 10, speed = 4, up = 1.5) {
    let made = 0;
    for (const m of this.motes) { if (m.life > 0 || made >= n) continue; made++;
      m.s.position.copy(at); m.s.position.y += 0.4; m.v.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.6 + up, (Math.random() - 0.5) * speed);
      m.life = m.dur = 0.5 + Math.random() * 0.5; m.s.material.color.setHex(colour); m.s.visible = true; m.size = 0.5 + Math.random() * 0.6; }
  }
  /** A tray slot's place in the world, before the camera. */
  trayAt(i, out) { return this.camera.localToWorld(out.set((i - 2.5) * TRAY.gap, TRAY.y, TRAY.z)); }

  /** A click in the view: while beats play, they are hurried; on your throw, a die picked, and thrown on its second click. */
  pointer(e) {
    if (!this.active || e.target?.closest?.('.im') || this.B.done) return;
    if (this.busy) { this.rush = true; return; }
    const P = this.B.pending(); if (P?.kind !== 'throw' || P.seat !== 0) return;
    _ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); this.frame(); this.camera.updateMatrixWorld(); _ray.setFromCamera(_ndc, this.camera);
    const hit = _ray.intersectObjects(this.dice.filter((d) => !d.spent).map((d) => d.mesh), false)[0]; if (!hit) return;
    const sides = hit.object.userData.sides; e.preventDefault(); e.stopPropagation();
    if (this.B.hover === sides) this.B.take({ id: 'throw', sides }); else { this.B.hover = sides; this.B.render(); }
  }

  /** The camera's frame: the page set aside at the right, so the view's middle is moved left of it (the cooking stage's way). */
  frame() {
    const W = innerWidth, H = innerHeight, im = document.querySelector('#indexmenu.open[data-aside] .im'), pw = im ? im.getBoundingClientRect().width + 24 : 0;
    this.camera.aspect = W / H; if (pw && pw < W * 0.6) this.camera.setViewOffset(W, H, pw / 2, 0, W, H); else this.camera.clearViewOffset(); this.camera.updateProjectionMatrix();
  }

  update(dt) {
    const t = (this.t += dt); tick(t);
    // the queue
    let left = dt;
    while (left > 0 && (this.now || this.q.length)) {
      if (!this.now) { const b = (this.now = this.q.shift()); b.t = 0; if (b.P && !b.P.gone) this.focus = b.P; b.start?.(b); }
      const b = this.now, rate = b.rate * (this.rush ? RUSH : 1), use = Math.min(left * rate, b.dur - b.t); b.t += use; left -= use / rate; b.tick?.(b.dur > 0 ? Math.min(1, b.t / b.dur) : 1, b);
      if (b.t >= b.dur - 1e-6) { b.end?.(b); this.now = null; if (!this.q.length) { this.rush = false; for (const P of this.pieces) P.qAt = null; if (!this.pieces[0].gone) this.focus = this.pieces[0]; this.sync(true); this.B.render(); } } else break;
    }
    // the pieces: a squash on landing, a breath at rest
    for (const P of this.pieces) {
      if (P.gone) continue;
      P.squashV += (-P.squash * 90 - P.squashV * 9) * dt; P.squash += P.squashV * dt;
      const sq = THREE.MathUtils.clamp(P.squash, -0.45, 0.45); P.hold.scale.set(P.s * (1 - sq * 0.6), P.s * (1 + sq), P.s * (1 - sq * 0.6));
      P.glow.material.opacity = (P === this.focus ? 0.3 : 0.14) + 0.08 * Math.sin(t * 2.2 + P.seat);
      P.hold.position.y = this.busy ? 0 : Math.abs(Math.sin(t * 2.4 + P.seat * 0.9)) * 0.12;
    }
    const p = this.focus.group.position;
    this.number.sprite.position.copy(p).y += 5.4 + Math.sin(t * 6) * 0.08;
    // the camera rides the piece whose beat it is round the wheel
    const want = Math.atan2(p.z, p.x); let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    const k = Math.min(1, dt * CAM.ease); this.yaw += d * k * 0.8; this.camY += (ringY(depthOf(this.focus.at ?? MOUTH)) - this.camY) * k;
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const sh = this.shake * this.shake, C = this.camera;
    C.position.set(Math.cos(this.yaw) * CAM.r + (Math.random() - 0.5) * sh, this.camY + CAM.h + (Math.random() - 0.5) * sh, Math.sin(this.yaw) * CAM.r);
    C.lookAt(_v.set(p.x * CAM.toJar, this.camY - CAM.under + (p.y - this.camY) * 0.3, p.z * CAM.toJar)); C.updateMatrixWorld();
    this.sky.position.copy(C.position); this.sky.material.uniforms.uDepth.value = -this.camY / RING.drop;
    // the rings, the dice, the motes
    for (const R of this.rings.values()) R.update(t, dt);
    const P0 = this.B.pending(), pick = P0?.kind === 'throw' && P0.seat === 0 && !this.busy ? this.B.hover : null;
    for (const D of this.dice) {
      const m = D.mesh, home = this.trayAt(D.i, _a), on = pick === D.sides && !D.spent, want2 = D.spent && !D.fly ? TRAY.s * 0.55 : on ? TRAY.pick : TRAY.s;
      D.s += (want2 - D.s) * Math.min(1, dt * 12);
      if (D.fly) { const k2 = D.fly.k, over = _b.copy(this.pieces[0].group.position); over.y += 4.4; m.position.lerpVectors(D.fly.from, over, ease(k2)); m.position.y += Math.sin(Math.PI * k2) * 3; m.rotation.x += dt * 17; m.rotation.z += dt * 13; m.scale.setScalar(TRAY.s + k2 * 0.5); }
      else { m.position.copy(home); if (on) m.position.addScaledVector(_b.set(0, 1, 0).applyQuaternion(C.quaternion), 0.35 + Math.sin(t * 5) * 0.06); const w = on ? 2.4 : D.spent ? 0.15 : 0.7; m.rotation.x += D.spin.x * w * dt; m.rotation.y += D.spin.y * w * dt; m.scale.setScalar(D.s); }
      const u = m.material.uniforms; u.uDim.value += ((D.spent && !D.fly ? 0.9 : 0) - u.uDim.value) * Math.min(1, dt * 8); u.uGlow.value = on ? 0.7 : 0; u.uFilm.value = on ? 0.7 : 0.2;
      const lb = m.userData.label; lb.position.copy(home).addScaledVector(_b.set(0, 1, 0).applyQuaternion(C.quaternion), 0.78); lb.material.opacity = D.spent ? 0.3 : 1;
    }
    for (const m of this.motes) { if (m.life <= 0) continue; m.life -= dt; if (m.life <= 0) { m.s.visible = false; continue; } m.v.y -= 6 * dt; m.s.position.addScaledVector(m.v, dt); const k3 = m.life / m.dur; m.s.material.opacity = k3; m.s.scale.setScalar(m.size * (0.4 + k3)); }
  }

  render() {
    const B = this.B, menu = B.menu;
    if (!menu?.open || menu.page?.name !== 'well.board' || !B.S) { this.close(); return false; }
    const now = performance.now(), dt = this.fixedDt ?? Math.min(0.05, (now - this.last) / 1000); this.last = now; // (`fixedDt`: a shot script's own clock)
    this.frame(); this.update(dt);
    this.game.post.render(this.scene, this.camera);
    return true;
  }
}
