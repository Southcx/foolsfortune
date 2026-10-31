// ---------------------------------------------------------------------------------------
// THE SCRIPT'S WORDS: rules written on the stage as blocks that read words (docs/plans/STRAWMANS-WELL.md 3.11; Baba Is You). A word is a
// block of WORD.size m that stands on the boards, falls when nothing holds it up, and is pushed by walking into it (the row before it
// with it, if nothing stops the row's front); three in a line, left to right or top to bottom, read NOUN IS PROPERTY and make a rule while
// they stand (NOUN IS NOT PROPERTY too). The stage (script.js) says what a rule does; here is only what the words are and which rules
// stand. A word in a rule glows. The words are plain English placeholders: SAY is the one table of what each block reads, so Espada can
// swap in neuralese (the plan's ostraca, each glossed once found) without touching a rule.
//
// Prior art: Baba Is You (Hempuli, 2019: the nouns, IS, the properties, NOT, a rule read either way); Sokoban's push; the stage's own
// crates (machine.js), as kinematic blocks of the room's own so a rule's words never tumble.
//
//   const W = new Words(well, S)   W.add(word, x, y) (lane metres, its foot)   W.pre(dt)   W.read() -> { has(rule), tiles, here }   W.render()
//   W.reset()   W.clear()   WORD   SAY   KIND   rule names: '<noun>.<prop>', '<noun>.!<prop>' (lower case)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../../core/physics.js';
import { FONT } from '../../../ui/theme.js';
import { AT } from '../layout.js';

/** A word's block: its size (m), how fast it is pushed (m/s), its fall (m/s²), the gap a line still reads across (m). */
export const WORD = { size: 0.96, push: 2.2, gravity: 20, slack: 0.3 };
/** What each word's block reads (placeholders, Espada's to put in neuralese). */
export const SAY = { WALL: 'WALL', DOOR: 'DOOR', YOU: 'YOU', GOAL: 'GOAL', IS: 'IS', NOT: 'NOT', SOLID: 'SOLID', OPEN: 'OPEN', FLOAT: 'FLOAT', HERE: 'HERE' };
export const KIND = { WALL: 'noun', DOOR: 'noun', YOU: 'noun', GOAL: 'noun', IS: 'is', NOT: 'not', SOLID: 'prop', OPEN: 'prop', FLOAT: 'prop', HERE: 'prop' };
const TINT = { noun: ['#d0508a', '#2a0f1c'], is: ['#f2efe6', '#1e1a16'], not: ['#d8443a', '#1e0a08'], prop: ['#e0a030', '#2a1a04'] };
const DOWN = new THREE.Vector3(0, -1, 0), SIDE = new THREE.Vector3(), _o = new THREE.Vector3();
const R_COURIER = 0.3;

function wordTexture(word) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d'), [ink, bg] = TINT[KIND[word]], text = SAY[word] ?? word;
  x.fillStyle = bg; x.fillRect(0, 0, 128, 128); x.strokeStyle = ink; x.lineWidth = 6; x.strokeRect(6, 6, 116, 116);
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold ${text.length > 4 ? 30 : 38}px ${FONT.sys}`; x.fillText(text, 64, 66);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Words {
  constructor(well, S) { this.well = well; this.game = well.game; this.S = S; this.list = []; }

  add(word, x, y) {
    const g = this.game, h = WORD.size / 2, at = new THREE.Vector3(AT.x + x, AT.y + y + h, this.S.lane.z);
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(at.x, at.y, at.z));
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(h, h, h).setFriction(0.9).setCollisionGroups(GROUPS.static), body);
    const tex = wordTexture(word), [ink] = TINT[KIND[word]];
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(ink).multiplyScalar(0.55), roughness: 0.9 });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(WORD.size, WORD.size, WORD.size), [side, side, side, side, face, side]);
    mesh.castShadow = mesh.receiveShadow = true; mesh.position.copy(at); this.S.add(mesh);
    const T = { word, kind: KIND[word], body, col, mesh, tex, face, side, pos: at.clone(), home: at.clone(), vy: 0, lit: 0 };
    this.list.push(T); return T;
  }
  /** Every word back where it began. */
  reset() { for (const T of this.list) { T.pos.copy(T.home); T.vy = 0; T.body.setTranslation({ x: T.pos.x, y: T.pos.y, z: T.pos.z }, true); } }

  keep(k, self) { const P = this.game.player; return !k.isSensor() && k.handle !== self.col.handle && k.handle !== P?.collider?.handle && !k.parent()?.isDynamic(); }
  isWord(k) { return this.list.some((T) => T.col.handle === k.handle); }

  /** Beside the fixed step: a push by the Courier walking into a word (its row with it), then each word's fall. */
  pre(dt) {
    const g = this.game, P = g.player, R = this.well.frame.realInput, h = WORD.size / 2;
    const a = R ? R.axis('moveX') : 0, d = Math.abs(a) > 0.2 ? Math.sign(a) : 0;
    if (d && P.grounded && !this.well.frame.tech) {
      const fx = P.pos.x + d * R_COURIER;
      const first = this.list.find((T) => Math.abs(T.pos.x - d * h - fx) < 0.12 && T.pos.y - h < P.pos.y + 1.5 && T.pos.y + h > P.pos.y + 0.2 && T.vy === 0);
      if (first) {
        const row = [first];
        for (let more = true; more;) {
          const last = row[row.length - 1];
          const next = this.list.find((T) => !row.includes(T) && Math.abs(T.pos.x - (last.pos.x + d * WORD.size)) < 0.14 && Math.abs(T.pos.y - last.pos.y) < 0.2);
          if (next) row.push(next); else more = false;
        }
        const lead = row[row.length - 1], step = WORD.push * dt;
        let free = true;
        for (const dy of [-0.32, 0.32]) {
          _o.set(lead.pos.x + d * (h - 0.01), lead.pos.y + dy, lead.pos.z); SIDE.set(d, 0, 0);
          if (g.physics.raycast(_o, SIDE, step + 0.03, lead.col, undefined, (k) => this.keep(k, lead))) free = false;
        }
        if (free) for (const T of row) T.pos.x += d * step;
      }
    }
    // the fall: held up by anything under either half of its foot (the boards, another word)
    for (const T of this.list) {
      let top = null;
      for (const dx of [-0.38, 0.38]) {
        _o.set(T.pos.x + dx, T.pos.y - h + 0.06, T.pos.z);
        const hit = g.physics.raycast(_o, DOWN, 0.08 + Math.max(0, -T.vy * dt) + 0.02, T.col, undefined, (k) => this.keep(k, T));
        if (hit && (top == null || hit.point.y > top)) top = hit.point.y;
      }
      if (top != null && T.vy <= 0 && T.pos.y - h <= top + 0.02) { T.pos.y = top + h; T.vy = 0; }
      else { T.vy -= WORD.gravity * dt; T.pos.y += T.vy * dt; if (top != null && T.pos.y - h < top) { T.pos.y = top + h; T.vy = 0; } }
      if (T.pos.y < AT.y - 12) { T.pos.copy(T.home); T.vy = 0; } // (a word lost off the stage comes home)
      T.body.setNextKinematicTranslation({ x: T.pos.x, y: T.pos.y, z: T.pos.z });
    }
  }

  /** The rules that stand: each line of NOUN IS (NOT) PROPERTY, read left to right or top to bottom. */
  read() {
    const L = this.list, out = new Set(), tiles = new Set(), lines = [];
    const right = (t) => L.find((u) => Math.abs(u.pos.y - t.pos.y) < 0.25 && u.pos.x - t.pos.x > WORD.size - 0.15 && u.pos.x - t.pos.x < WORD.size + WORD.slack);
    const below = (t) => L.find((u) => Math.abs(u.pos.x - t.pos.x) < 0.3 && t.pos.y - u.pos.y > WORD.size - 0.15 && t.pos.y - u.pos.y < WORD.size + WORD.slack);
    for (const n of L) {
      if (n.kind !== 'noun') continue;
      for (const next of [right, below]) {
        const a = next(n); if (a?.kind !== 'is') continue;
        let b = next(a), not = null; if (b?.kind === 'not') { not = b; b = next(b); }
        if (b?.kind !== 'prop') continue;
        const rule = `${n.word.toLowerCase()}.${not ? '!' : ''}${b.word.toLowerCase()}`;
        out.add(rule); lines.push({ rule, last: b }); for (const t of [n, a, not, b]) if (t) tiles.add(t);
      }
    }
    for (const T of L) T.lit = tiles.has(T) ? 1 : 0;
    return { has: (r) => out.has(r), rules: out, lines };
  }
  /** Each frame: the blocks where their bodies are, a word in a rule glowing. */
  render(dt) {
    for (const T of this.list) {
      T.mesh.position.copy(T.pos);
      T.face.emissiveIntensity += (T.lit * 0.55 - T.face.emissiveIntensity) * Math.min(1, dt * 8);
    }
  }

  clear() {
    const w = this.game.physics?.world;
    for (const T of this.list) {
      try { w?.removeRigidBody(T.body); } catch { /* (gone already) */ }
      T.mesh.removeFromParent(); T.mesh.geometry.dispose(); T.face.dispose(); T.side.dispose(); T.tex.dispose();
    }
    this.list = [];
  }
}
