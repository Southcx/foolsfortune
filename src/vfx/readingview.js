// ---------------------------------------------------------------------------------------
// THE READING VIEW (docs/plans/SPREADS.md 5.1.1; the owner, 2026-10-23: "the character model orbited by cards against a dark background,
// similar to the title screen ... that screen is a moneyshot in and of itself"). The Pneuka Box flipped: the Courier hangs in the
// title's dark (Petra's scene and camera put them there), and this is everything round them:
//   THE ORBIT     the laid Major Arcana in the spread's own geometry, seen from the front: the Celtic Cross's cross at the Courier's
//                 heart, hung just behind the body like a halo so the Courier is seen before it (the Present over the Fool, the
//                 Challenge across them, the Crown over the head, the Foundation below the feet, the Recent past and the Near future
//                 either side) and its staff as a column beside them; the Horseshoe an arc round them; three cards in a row behind
//                 their shoulders; one card at the heart. Each card is the house deck's own face (the bazaar's
//                 atlas, vfx/bazaarfaces.js), hung in its place and turning a little, its face to the front; a reversed card upside
//                 down, a crossed one a quarter turned. Its edge glows in its suit's colour (a planet's, the film). An empty place is a
//                 faint frame of light, its suit unknown.
//   THE CLOTH     the 8 x 7 grid as a floor of the dark under their feet, seen from above (so the underside: the face is its mirror,
//                 SPREADS.md 5.1): a velvet ground, gold thread between the cells, each lit cell glowing in its suits' colours by their
//                 strength, a wild cell in the film's slow schiller, a dark cell (contrary suits met) cracked open with its light gone
//                 out, a hidden cell left unlit. The Fool's cell holds a small gold mark.
//   THE HAND      (off, READING_VIEW.hand.show: the hand is the window's bar under the reading) the bound Majors not laid, fanned low before the Courier.
//   THE CLASS     the card your spread reads you as (the laid spread's class, a court or a Major, CLASSES.md; the Fool before any), hung large and faint
//                 far behind the halo like a window of stained glass, its edge in its suit's colour; when the class changes it turns
//                 over edge-on and comes round as the new card, with a flare along its edge (Golden Sun's class change, a card flipped)
//   THE FALL      a few house cards drifting far behind and the motes rising, as on the title (title/scene.js), so the dark has depth.
// A world mark of the System's: no words (a position's name is the window's, by `anchors`).
//
// Prior art: the house's own title (title/scene.js: "they hang in the fall, cards turning round them"); Persona's Velvet Room (a
// reading in a room outside the world); Kingdom Hearts' Dive to the Heart (a figure in the dark over a stained-glass floor); the Golden
// Dawn's diagram of the Celtic Cross (the cross and the staff); the elemental colours of the suits as the Rider-Waite deck paints them
// (Wands' fire, Cups' water, Swords' air, Pentacles' earth and gold).
//
//   const V = new ReadingView(game)   V.group (Petra's scene adds it, its origin at the Courier's feet, +z the front)
//   V.draw({ spread, laid: { [position]: { card, reversed, suit } }, cells, hand: [card], held })
//       spread: 'one' | 'three' | 'horseshoe' | 'celtic'; cells: progress/spreads.js light()'s 56 (the face's order: drawn mirrored, the
//       underside seen from above); suit: suitOf(card, reversed) ('wands' .. 'pentacles' | 'wild'); held: a card of the hand lifted
//   V.update(dt)   V.enter() / V.leave() (the cards fly in from the fall and back)   V.pick(raycaster) -> { kind: 'place' | 'hand', id }
//   V.anchors(camera, w, h) -> [{ id, x, y }] (each place's screen point, for the window's labels)   READING_VIEW (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bazaarAtlas, cardIndex } from './bazaarfaces.js';
import { backCell } from './cardbackset.js';

export const READING_VIEW = {
  card: { w: 0.42, h: 0.68 },   // (m: a card hung in the orbit, the house deck's 64 x 104 frame)
  heart: 1.05,                  // (m over the feet: the Courier's heart, where the cross is laid)
  front: -0.42,                 // (m: the orbit's plane, behind them like a halo, so the Courier stands before the cross and is seen)
  sway: 0.18,                   // (rad: how far a card turns in place, and back)
  cloth: { cell: 0.34, below: 0.62, glow: 1.6 }, // (m a cell; m under the feet; the lit cells' emissive)
  hand: { show: false, r: 1.8, spread: 0.7, y: 0.05, z: 1.35, tilt: -0.55, lift: 0.2, scale: 0.85 }, // (the fan: its radius, its arc, its place, its lean back, its size)
  fall: 14, motes: 160,
  follow: 0.65,                 // (how much of the camera's orbit the reading turns with: the cross read from any side, the cloth fixed under it for the parallax)
  klass: { scale: 3.4, y: 1.25, z: -1.6, opacity: 0.16, tint: 0.55, turn: 0.9 }, // (the class's card: its size, its height, how far behind the halo, how faint; real s it takes to turn over)
  flyIn: 0.6,                   // (real s the cards take from the fall to their places)
};
const V = READING_VIEW;

/** The suits' colours (the Rider-Waite deck's elements: Wands fire, Cups water, Swords air, Pentacles earth and its gold). */
export const SUIT_LOOK = { wands: 0xff6a2a, cups: 0x3fa8d8, swords: 0xcfd8ff, pentacles: 0xe0b040 };
const SUIT_CSS = Object.fromEntries(Object.entries(SUIT_LOOK).map(([k, v]) => [k, `#${v.toString(16).padStart(6, '0')}`]));

/** The Majors by their number (Rider-Waite: Strength VIII, Justice XI), as the house deck's atlas lays them (0..21). */
const MAJORS = ['fool', 'magician', 'priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'strength', 'hermit', 'wheel',
  'justice', 'hanged', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world'];
/** The house deck's suits in its atlas order (vfx/bazaarfaces.js cardIndex), and a court's number in it. */
const SUIT_ORDER = ['cups', 'swords', 'pentacles', 'wands'], COURT_R = { page: 11, knight: 12, queen: 13, king: 14 };
const ATLAS_CARD = { w: 128, h: 208, cols: 16, foot: 80, size: 2048, sizeH: 2304, footY: 2048 }; // (cards 80 and up are the atlas's foot, one row of 128: the Arcana's own back, then the set's; the back worn is `backCell('arcana')`: vfx/cardbackset.js)

const H = V.heart, F = V.front, cw = V.card.w, ch = V.card.h;
/** Each place in the orbit (x right, y up from the feet, z forward), its turn (rad, a crossed card's quarter), its depth order. */
export const ORBIT = {
  one: { present: [0, H, F] },
  three: { past: [-0.62, H + 0.1, F], present: [0, H + 0.1, F + 0.05], future: [0.62, H + 0.1, F] },
  horseshoe: (() => { // (an arc round them, open above: Past at its left end, Outcome at its right)
    const ids = ['past', 'present', 'hidden', 'obstacles', 'others', 'advice', 'outcome'], o = {};
    ids.forEach((id, i) => { const a = Math.PI * (1.15 - (1.3 * i) / (ids.length - 1)); o[id] = [Math.cos(a) * 1.05, H + 0.15 - Math.sin(a) * 0.95 + 0.35, F - 0.15 + 0.2 * Math.sin(a)]; });
    o.obstacles.turn = Math.PI / 2;
    return o;
  })(),
  celtic: {
    significator: [0, H, F - 0.04], present: [0, H, F], challenge: Object.assign([0, H, F + 0.04], { turn: Math.PI / 2 }),
    crownPosition: [0, H + ch + 0.12, F], foundation: [0, H - ch - 0.12, F], past: [-cw - 0.32, H, F], future: [cw + 0.32, H, F],
    self: [1.45, H - 0.95, F - 0.1], environment: [1.45, H - 0.2, F - 0.1], hopes: [1.45, H + 0.55, F - 0.1], outcome: [1.45, H + 1.3, F - 0.1],
  },
};

/** A place in the orbit turned by `turn` about the Courier's axis (the reading following the camera round). */
const turned = (x, y, z, turn, out) => out.set(x * Math.cos(turn) + z * Math.sin(turn), y, -x * Math.sin(turn) + z * Math.cos(turn));
const _p = new THREE.Vector3();
const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; return t; };
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

export class ReadingView {
  constructor(game) {
    this.game = game; this.t = 0; this.state = null; this.k = 1; this.dir = 0; this.film = 0;
    this.group = new THREE.Group(); this.group.name = 'readingView'; this.group.visible = false;
    this.cards = new Map(); this.handCards = []; this.frames = new Map(); this.pickables = [];
    this.buildMaterials(); this.buildCloth(); this.buildFall(); this.buildClass();
  }

  // ---------------------------------------------------------------- the parts
  buildMaterials() {
    const A = bazaarAtlas();
    this.atlas = tex(A.canvas);
    this.cardGeo = new THREE.PlaneGeometry(cw, ch);
    this.edgeGeo = new THREE.PlaneGeometry(cw + 0.05, ch + 0.05);
    this.frameMat = new THREE.MeshBasicMaterial({ color: 0xe8dcff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true });
    this.pickMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }); // (drawn never, picked always)
    this.frameGeo = (() => { // (a thin frame: four strips round an empty place)
      const s = new THREE.Shape(), w = cw / 2 + 0.02, h = ch / 2 + 0.02, i = 0.012;
      s.moveTo(-w, -h); s.lineTo(w, -h); s.lineTo(w, h); s.lineTo(-w, h); s.lineTo(-w, -h);
      const hole = new THREE.Path(); hole.moveTo(-w + i, -h + i); hole.lineTo(-w + i, h - i); hole.lineTo(w - i, h - i); hole.lineTo(w - i, -h + i); hole.lineTo(-w + i, -h + i);
      s.holes.push(hole); return new THREE.ShapeGeometry(s);
    })();
  }
  /** One card's geometry a cell of the house deck's atlas (cached: every card shares the one texture and the one material). */
  cellGeo(i) {
    this.geos ||= new Map();
    if (this.geos.has(i)) return this.geos.get(i);
    const g = this.cardGeo.clone(), uv = g.attributes.uv, S = ATLAS_CARD.size, SH = ATLAS_CARD.sizeH, foot = i >= ATLAS_CARD.foot;
    const px = foot ? (i - ATLAS_CARD.foot) * ATLAS_CARD.w : (i % ATLAS_CARD.cols) * ATLAS_CARD.w, py = foot ? ATLAS_CARD.footY : Math.floor(i / ATLAS_CARD.cols) * ATLAS_CARD.h;
    const u0 = px / S, v1 = 1 - py / SH;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) ? u0 + ATLAS_CARD.w / S : u0, uv.getY(k) ? v1 : v1 - ATLAS_CARD.h / SH);
    this.geos.set(i, g); return g;
  }
  /** A card: its face, its back, and the edge of light behind it in its suit's colour. */
  cardMesh(card) {
    const i = card === 'back' ? backCell('arcana') : Math.max(0, MAJORS.indexOf(card));
    this.faceMat ||= new THREE.MeshBasicMaterial({ map: this.atlas, side: THREE.FrontSide, toneMapped: false });
    const face = new THREE.Mesh(this.cellGeo(i), this.faceMat);
    const back = new THREE.Mesh(this.cellGeo(backCell('arcana')), this.faceMat);
    back.rotation.y = Math.PI; back.position.z = -0.002;
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, forceSinglePass: true });
    const edge = new THREE.Mesh(this.edgeGeo, edgeMat); edge.position.z = -0.004;
    const node = new THREE.Group(); node.add(edge, face, back);
    node.userData = { face, edge, edgeMat };
    return node;
  }
  /** A card gone: only its own edge material is its own. */
  drop(node) { this.group.remove(node); node.userData.edgeMat?.dispose(); }

  buildCloth() {
    const C = V.cloth, cv = (this.clothCanvas = document.createElement('canvas'));
    cv.width = 8 * 32; cv.height = 7 * 32; this.clothCtx = cv.getContext('2d');
    this.clothTex = tex(cv); this.clothTex.magFilter = THREE.LinearFilter;
    const geo = new THREE.PlaneGeometry(8 * C.cell, 7 * C.cell);
    this.clothMat = new THREE.MeshStandardMaterial({ map: this.clothTex, emissiveMap: this.clothTex, emissive: 0xffffff, emissiveIntensity: C.glow, roughness: 0.95, metalness: 0 });
    const m = (this.cloth = new THREE.Mesh(geo, this.clothMat));
    m.rotation.x = -Math.PI / 2; m.position.y = -C.below; m.position.z = 0.15;
    this.group.add(m);
  }

  buildFall() {
    const n = V.fall, back = this.cardMesh('back');
    this.fall = [];
    for (let i = 0; i < n; i++) {
      const c = back.clone(true); c.scale.setScalar(0.8);
      c.userData = { a: (i / n) * Math.PI * 2, r: 5 + (i % 4) * 2.2, y: -4 + ((i * 7.3) % 12), spin: 0.2 + (i % 5) * 0.12 };
      c.children[0].visible = false; // (no suit's edge on a falling card)
      this.group.add(c); this.fall.push(c);
    }
    const p = new Float32Array(V.motes * 3);
    for (let i = 0; i < V.motes; i++) p.set([Math.sin(i * 12.9) * 9, -6 + ((i * 3.7) % 14), -2 - Math.abs(Math.cos(i * 7.1)) * 10], i * 3);
    const g = (this.moteGeo = new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.group.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe9c8, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })));
  }


  // ---------------------------------------------------------------- the class
  buildClass() {
    const C = V.klass, g = this.cardGeo;
    this.classFace = new THREE.MeshBasicMaterial({ map: this.atlas, transparent: true, opacity: C.opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    this.classEdge = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, forceSinglePass: true });
    const n = (this.classNode = new THREE.Group());
    this.classCard = new THREE.Mesh(this.cellGeo(0), this.classFace);
    const edge = new THREE.Mesh(this.edgeGeo, this.classEdge); edge.position.z = -0.01;
    n.add(edge, this.classCard); n.scale.setScalar(C.scale); n.position.set(0, C.y, F + C.z);
    n.traverse((o) => { o.raycast = () => {}; });
    this.group.add(n);
    this.classId = 'arcana.fool'; this.classTurn = 1; this.classFlare = 0;
  }
  /** The atlas cell of a class: a court ('knight.wands'), a Major ('emperor'), or the Fool. */
  classCell(id) {
    if (!id) return 0;
    const [rank, suit] = id.split('.');
    if (rank === 'arcana') return Math.max(0, MAJORS.indexOf(suit)); // (a Major: 'arcana.emperor', the Fool 'arcana.fool')
    if (suit) return cardIndex({ r: COURT_R[rank] ?? 11, s: Math.max(0, SUIT_ORDER.indexOf(suit)) });
    return Math.max(0, MAJORS.indexOf(id));
  }
  updateClass(dt) {
    const K = this.game.laidSpread?.class ?? null, id = K?.id ?? 'arcana.fool', C = V.klass;
    if (id !== this.classId && this.classTurn >= 1) { this.classNext = id; this.classSuit = K?.suit ?? K?.lifts ?? null; this.classTurn = 0; } // (a Major has no suit: its tint the suit it lifts)
    if (this.classTurn < 1) {
      const was = this.classTurn; this.classTurn = Math.min(1, this.classTurn + dt / C.turn);
      if (was < 0.5 && this.classTurn >= 0.5) { this.classId = this.classNext; this.classCard.geometry = this.cellGeo(this.classCell(this.classId)); this.classFlare = 1; } // (edge-on: the new face)
    }
    const u = this.classTurn, ph = this.t * 0.25;
    const tn = this.turn || 0; this.classNode.position.copy(turned(0, C.y, F + C.z, tn, _p));
    this.classNode.rotation.set(Math.sin(ph * 1.3) * 0.03, (this.game.readingScene?.orbit?.yaw ?? 0) + (1 - smooth(u)) * Math.PI + Math.sin(ph) * 0.06, 0, 'YXZ');
    this.classFlare = Math.max(0, this.classFlare - dt * 1.4);
    this.classEdge.color.setHex(this.classSuit ? SUIT_LOOK[this.classSuit] : 0xffe6a8);
    this.classFace.color.setHex(this.classSuit ? SUIT_LOOK[this.classSuit] : 0xffe6a8).multiplyScalar(C.tint); // (the cream stained in its suit's colour: glass, not a wall)
    this.classEdge.opacity = (0.18 + 0.12 * Math.sin(this.t * 1.1) + 0.7 * this.classFlare) * smooth(this.k);
    this.classFace.opacity = C.opacity * smooth(this.k) * (0.6 + 0.4 * Math.abs(Math.cos(Math.PI * u)));
  }

  // ---------------------------------------------------------------- the state
  /** What is laid, lit and in the hand. Cheap to call each change; it builds a card the first time it is seen. */
  draw(state) {
    this.state = state;
    const places = ORBIT[state.spread] || {}, laid = state.laid || {};
    this.pickables.length = 0;
    // the places: a card, or an empty frame
    const seen = new Set();
    for (const [id, at] of Object.entries(places)) {
      const L = laid[id];
      const key = L ? `${id}:${L.card}` : null;
      if (L) {
        let node = this.cards.get(key);
        if (!node) { node = this.cardMesh(L.card); node.userData.place = id; node.userData.fly = 0; this.cards.set(key, node); this.group.add(node); }
        node.userData.at = at; node.userData.turn = (at.turn || 0) + (L.reversed ? Math.PI : 0); node.userData.suit = L.suit || null;
        node.visible = true; seen.add(key);
        node.userData.edgeMat.color.setHex(L.suit && L.suit !== 'wild' ? SUIT_LOOK[L.suit] : 0xffffff);
        node.userData.edgeMat.opacity = L.suit ? 0.9 : 0.25;
        node.userData.face.userData.pick = { kind: 'place', id }; this.pickables.push(node.userData.face);
      }
      let fr = this.frames.get(`${state.spread}:${id}`);
      if (!fr) { fr = new THREE.Mesh(this.frameGeo, this.frameMat); fr.position.set(...at); fr.rotation.z = at.turn || 0; fr.userData.at = at; this.frames.set(`${state.spread}:${id}`, fr); this.group.add(fr); const q = new THREE.Mesh(this.cardGeo, this.pickMat); q.userData.pick = { kind: 'place', id }; fr.add(q); fr.userData.quad = q; } // (the frame is hollow: an unseen card behind it takes the pick)
      fr.visible = !L; if (!L) this.pickables.push(fr.userData.quad);
    }
    for (const [k, fr] of this.frames) if (!k.startsWith(`${state.spread}:`)) fr.visible = false;
    for (const [k, node] of this.cards) if (!seen.has(k)) { this.drop(node); this.cards.delete(k); }
    this.drawHand(V.hand.show ? state.hand || [] : [], state.held); // (off: the hand is Dovina's bar under the reading, where the drag starts; a fan here hid the cloth)
    this.drawCloth(state.cells || []);
  }

  drawHand(hand, held) {
    for (const c of this.handCards) this.drop(c);
    this.handCards = [];
    const Hn = V.hand, n = hand.length;
    hand.forEach((card, i) => {
      const node = this.cardMesh(card), u = n > 1 ? i / (n - 1) - 0.5 : 0, a = u * Hn.spread * Math.min(1, n / 6);
      node.scale.setScalar(Hn.scale);
      node.position.set(Math.sin(a) * Hn.r, Hn.y - (1 - Math.cos(a)) * Hn.r + (card === held ? Hn.lift : 0), Hn.z - i * 0.004);
      node.rotation.set(Hn.tilt, 0, -a);
      node.userData.edgeMat.opacity = card === held ? 0.9 : 0.2; node.userData.edgeMat.color.setHex(0xffe6a8);
      node.userData.face.userData.pick = { kind: 'hand', id: card };
      this.pickables.push(node.userData.face);
      this.group.add(node); this.handCards.push(node);
    });
  }

  /** The cloth: the underside seen from above, so the face's cells drawn mirrored. */
  drawCloth(cells) {
    const g = this.clothCtx, s = 32, film = this.film;
    g.fillStyle = '#120a16'; g.fillRect(0, 0, 8 * s, 7 * s);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) {
      const cell = cells[r * 8 + (7 - c)], x = c * s, y = r * s; // (the face's column 7 - c: the cloth is the underside)
      // the velvet: a faint nap, darker at the edge
      const gr = g.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.7); gr.addColorStop(0, '#2a1830'); gr.addColorStop(1, '#140a18');
      g.fillStyle = gr; g.fillRect(x + 1, y + 1, s - 2, s - 2);
      if (!cell || cell.hidden) continue;
      if (cell.dark) { // (contrary suits met: the light gone out, the cloth cracked)
        g.strokeStyle = 'rgba(255,190,140,.55)'; g.lineWidth = 1.2; g.beginPath();
        g.moveTo(x + 5, y + 6); g.lineTo(x + 14, y + 15); g.lineTo(x + 11, y + 22); g.lineTo(x + 20, y + 27); g.moveTo(x + 14, y + 15); g.lineTo(x + 25, y + 11); g.stroke();
        continue;
      }
      let R = 0, G = 0, B = 0, sum = 0;
      for (const k of ['wands', 'cups', 'swords', 'pentacles']) {
        const v = cell[k] || 0; if (!v) continue; const col = SUIT_LOOK[k];
        R += ((col >> 16) & 255) * v; G += ((col >> 8) & 255) * v; B += (col & 255) * v; sum += v;
      }
      if (sum > 0) {
        const k = Math.min(1, 0.45 + 0.35 * sum);
        g.fillStyle = `rgba(${(R / sum) | 0},${(G / sum) | 0},${(B / sum) | 0},${k})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
        if (sum >= 2) { g.strokeStyle = 'rgba(255,248,230,.7)'; g.lineWidth = 1; g.strokeRect(x + 4.5, y + 4.5, s - 9, s - 9); } // (counted double)
      }
      if (cell.wild > 0) { // (a planet's: the film's schiller, walking slowly)
        const h = (film * 360 + (c + r) * 22) % 360, w = g.createLinearGradient(x, y, x + s, y + s);
        w.addColorStop(0, `hsla(${h},80%,62%,${0.25 + 0.35 * Math.min(1, cell.wild)})`); w.addColorStop(0.5, `hsla(${(h + 90) % 360},80%,68%,${0.15 + 0.3 * Math.min(1, cell.wild)})`);
        w.addColorStop(1, `hsla(${(h + 180) % 360},80%,62%,${0.25 + 0.35 * Math.min(1, cell.wild)})`);
        g.fillStyle = w; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      }
    }
    // the gold thread between the cells, and the Fool's mark (underside column 2, row 3)
    g.strokeStyle = 'rgba(212,165,60,.55)'; g.lineWidth = 1;
    for (let c = 0; c <= 8; c++) { g.beginPath(); g.moveTo(c * s + 0.5, 0); g.lineTo(c * s + 0.5, 7 * s); g.stroke(); }
    for (let r = 0; r <= 7; r++) { g.beginPath(); g.moveTo(0, r * s + 0.5); g.lineTo(8 * s, r * s + 0.5); g.stroke(); }
    g.fillStyle = 'rgba(255,211,106,.85)'; g.beginPath(); g.arc(2 * s + s / 2, 3 * s + s / 2, 2.5, 0, Math.PI * 2); g.fill();
    this.clothTex.needsUpdate = true;
    this.clothWild = cells.some((c) => c && c.wild > 0 && !c.dark && !c.hidden);
  }

  // ---------------------------------------------------------------- time
  enter() { this.game.ui?.want?.('readingView', true); this.group.visible = true; this.dir = 1; this.k = 0; for (const n of this.cards.values()) n.userData.fly = 0; }
  leave() { this.dir = -1; this.game.ui?.want?.('readingView', false); } // (the HUD and the overlay step out while the Box is turned over: hideui.js)

  update(dt) {
    if (!this.group.visible) return;
    this.t += dt;
    if (this.dir) { this.k = Math.max(0, Math.min(1, this.k + (this.dir * dt) / V.flyIn)); if (this.dir < 0 && this.k <= 0) { this.group.visible = false; this.dir = 0; } else if (this.k >= 1) this.dir = 0; }
    const ease = smooth(this.k), yaw = this.game.readingScene?.orbit?.yaw ?? 0, turn = (this.turn = yaw * V.follow);
    let i = 0;
    for (const node of this.cards.values()) {
      const U = node.userData, at = U.at; if (!at) continue;
      U.fly = Math.min(1, (U.fly ?? 1) + dt / V.flyIn);
      const e = smooth(Math.min(U.fly, ease)), ph = this.t * 0.6 + i * 1.7; i++;
      // from the fall (high above and behind) into its place, then hung there breathing
      node.position.copy(turned(at[0] * (0.4 + 0.6 * e), at[1] + (1 - e) * 4.5 + Math.sin(ph) * 0.02, at[2] - (1 - e) * 3, turn, _p));
      node.rotation.set(Math.sin(ph * 0.7) * 0.05, yaw + Math.sin(ph) * V.sway, (U.turn || 0) + (1 - e) * 2.4, 'YXZ'); // (its face to the camera wherever the arrows have it)
      U.edgeMat.opacity = (U.suit ? 0.55 + 0.35 * Math.sin(this.t * 2.2 + i) : 0.2) * e;
    }
    for (const c of this.fall) { // (the title's fall, far behind)
      const U = c.userData; U.y -= dt * 0.35; if (U.y < -6) U.y = 8; U.a += dt * 0.03;
      c.position.set(Math.cos(U.a) * U.r, U.y, -Math.abs(Math.sin(U.a)) * U.r - 3); c.rotation.x += dt * U.spin; c.rotation.y += dt * U.spin * 0.7;
    }
    const mp = this.moteGeo.attributes.position;
    for (let k = 0; k < mp.count; k++) { let y = mp.getY(k) + dt * (0.25 + (k % 5) * 0.08); if (y > 8) y = -6; mp.setY(k, y); }
    mp.needsUpdate = true;
    for (const fr of this.frames.values()) if (fr.visible) { const at = fr.userData.at; fr.position.copy(turned(at[0], at[1], at[2], turn, _p)); fr.rotation.set(0, yaw, at.turn || 0, 'YXZ'); }
    this.updateClass(dt);
    if (this.clothWild) { this.film += dt * 0.05; this.filmT = (this.filmT || 0) + dt; if (this.filmT > 0.1) { this.filmT = 0; this.drawCloth(this.state?.cells || []); } } // (the schiller at 10 Hz)
  }

  // ---------------------------------------------------------------- input
  /** What a ray from the camera touches: a place in the orbit, or a card of the hand. */
  pick(raycaster) {
    const hit = raycaster.intersectObjects(this.pickables, false)[0];
    return hit?.object.userData.pick ?? null;
  }
  /** Each place's screen point (CSS px), for the window's labels and its drop targets. */
  anchors(camera, w, h) {
    const out = [], v = new THREE.Vector3(), places = ORBIT[this.state?.spread] || {};
    this.group.updateMatrixWorld(true);
    for (const [id, at] of Object.entries(places)) {
      turned(at[0], at[1], at[2], this.turn || 0, v).applyMatrix4(this.group.matrixWorld).project(camera);
      out.push({ id, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h });
    }
    return out;
  }
}
