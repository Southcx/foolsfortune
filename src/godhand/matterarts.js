// ---------------------------------------------------------------------------------------
// THE MATTER'S VERBS (docs/plans/GODHAND.md section 3): the three God Arts that move the island's matter (godhand/matter.js through
// godhand/islandmatter.js), run by GodArts (godhand/arts.js) when one of them is selected.
//   SCOOP   hold LMB on matter: the hand takes it up (Lachryma first, then sand, then clay), to what it can carry; hold LMB again with
//           something held: it pours out where the hand points, and runs, piles and slumps by its own rules. Where the hand finds no matter
//           it takes the authored ground's (sand in the Dunes and the Wells, clay elsewhere), and that is made from nothing: Lachryma pays.
//   SHAPE   hold LMB and drag up or down: the ground under the hand rises or sinks, the matter taken from the ring round it (or made, and
//           paid for). With Shift held, it levels toward the height where the stroke began (terraces).
//   CARVE   drag a line: a channel is cut along it into the matter, its spoil heaped along the banks.
//   SCULPT  drag a line: a creation of voxel clay is raised along it (godhand/creations.js): an arch, a bridge when long; with Shift a
//           ramp; a short stroke a pillar. It is built from the matter the hand carries first, then from Lachryma; it crumbles back to
//           clay over about a game day.
// Each act is said by an event with `by` (god.scoop, god.pour, god.shape, god.carve: the domains' sources read them).
//
// Prior art: From Dust (the god carries a ball of matter under the hand and lets it fall); Populous (raise and lower); the Spirit
// Garden's clay brush (godhand's sister: world/garden/clay.js, the stroke that levels to where it began).
//
//   const M = new MatterArts(arts)   M.begin(id) -> bool   M.hold(dt)   M.end()   M.held   M.update(dt) (the carried ball, every frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { GOD_POWERS, rampOf } from '../progress/godpowers.js';

/** The verbs' numbers. `carry` the most the hand holds (m³, where Scoop opens; the ramp takes it to 400 at 99: RAMP.scoop); `takeRate` and
 *  `pourRate` m³ a real second; `r` the brush's radius (m); `shapeRate` metres a real second at a full drag; `carve` the channel's width
 *  and depth (m). Made matter costs `GOD_POWERS[id].made` Lachryma a cubic metre. */
export const VERBS = { carry: 20, takeRate: 8, pourRate: 6, r: 1.6, shapeRate: 1.4, levelK: 0.12, carve: { w: 1.4, depth: 1.2, maxLen: 18 },
  sculpt: { maxLen: 16, pillar: 1.5, w: 2, t: 0.6, arch: [1.5, 5], archK: 0.3, ramp: 4, rampK: 0.4 } };
export const MATTER_ARTS = new Set(['scoop', 'shape', 'carve', 'sculpt']);

const UP = new THREE.Vector3(0, 1, 0);

export class MatterArts {
  constructor(arts) {
    this.arts = arts; this.god = arts.god; this.game = arts.game;
    this.held = { water: 0, sand: 0, clay: 0, feeling: null };
    this.L = null;
    const g = this.game;
    this.ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 2), new THREE.MeshStandardMaterial({ color: 0x9a5a3a, roughness: 0.6, transparent: true, opacity: 0.9 }));
    this.ball.visible = false;
    g.scene.add(this.ball);
  }

  get carried() { return this.held.water + this.held.sand + this.held.clay; }
  get cap() { return rampOf('scoop', 'carry', this.game) ?? VERBS.carry; }
  /** Lachryma a cubic metre of matter made from nothing, for a verb (GODHAND.md 11: free at 99). */
  madeCost(id) { return rampOf(id, 'made', this.game) ?? GOD_POWERS[id]?.made ?? 0.5; }
  field() { return this.game.matter?.ensure(this.god.jar.pos); }
  /** The authored ground's own matter at a height: the Dunes' and the Wells' are sand, the rest clay. */
  groundKind(y) { const id = this.game.cartography?.layerOf?.(y)?.id; return id === 'dunes' || id === 'well' ? 'sand' : 'clay'; }

  begin(id) {
    const K = this.god.cursor;
    if (!K.ok || !this.game.matter) return false;
    const F = this.field();
    if (!F.contains(K.point.x, K.point.z)) { this.game.log.say('warn', 'Too far from your Pneuka Jar.', { key: 'matter.far', throttle: 2 }); return false; }
    this.L = { id, t: 0, a: K.point.clone(), my: this.game.input.my, y0: F.groundAt(K.point.x, K.point.z), pouring: id === 'scoop' && this.carried > 0.05, moved: 0, made: 0 };
    return true;
  }

  hold(dt) {
    const L = this.L, g = this.game, K = this.god.cursor, input = g.input, F = this.field();
    if (!L || !F) return;
    L.t += dt;
    const p = K.point;
    if (L.id === 'scoop') {
      if (L.pouring) {
        const total = this.carried; if (total <= 1e-3) return;
        const v = Math.min(total, VERBS.pourRate * dt), H = this.held;
        for (const kind of ['water', 'sand', 'clay']) {
          const part = v * (H[kind] / total); if (part <= 0) continue;
          F.pour(p.x, p.z, VERBS.r, part, { kind, feeling: kind === 'water' ? H.feeling : null });
          H[kind] -= part;
        }
        L.moved += v;
      } else {
        const room = this.cap - this.carried; if (room <= 1e-3) return;
        const got = F.take(p.x, p.z, VERBS.r, Math.min(room, VERBS.takeRate * dt));
        const n = got.water + got.sand + got.clay;
        if (n > 1e-4) {
          if (got.water > 0 && (this.held.water < 0.01 || got.feeling === this.held.feeling)) this.held.feeling = got.feeling;
          this.held.water += got.water; this.held.sand += got.sand; this.held.clay += got.clay; L.moved += n;
        } else {
          // no matter here: the authored ground's own, made from nothing (and paid for)
          const v = Math.min(room, VERBS.takeRate * dt * 0.5);
          if (!this.arts.drainOk(v * this.madeCost('scoop') / dt, dt)) return;
          this.held[this.groundKind(p.y)] += v; L.moved += v; L.made += v;
        }
      }
    } else if (L.id === 'shape') {
      if (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) {
        const r = F.smooth(p.x, p.z, (rampOf('shape', 'r', g) ?? VERBS.r) * 1.4, L.y0, VERBS.levelK);
        if (r.made > 0 && !this.arts.drainOk(r.made * this.madeCost('shape') / Math.max(dt, 1e-3), dt)) return;
        L.moved += r.moved; L.made += r.made;
      } else {
        const drag = THREE.MathUtils.clamp((L.my - input.my) / 120, -1, 1); // (up raises, down lowers)
        if (Math.abs(drag) < 0.08) return;
        const r = F.raise(p.x, p.z, rampOf('shape', 'r', g) ?? VERBS.r, drag * (rampOf('shape', 'rate', g) ?? VERBS.shapeRate) * dt);
        if (r.made > 0 && !this.arts.drainOk(r.made * this.madeCost('shape') / Math.max(dt, 1e-3), dt)) return;
        L.moved += r.moved; L.made += r.made;
      }
    } else if (L.id === 'carve' || L.id === 'sculpt') {
      const b = p.clone(); const d = b.clone().sub(L.a).setY(0), max = rampOf(L.id, 'len', g) ?? VERBS[L.id].maxLen;
      if (d.length() > max) b.copy(L.a).addScaledVector(d.normalize(), max);
      L.b = b;
      this.arts.showBlade(L.a, b, 0.4, true);
    }
  }

  end() {
    const L = this.L, g = this.game, F = this.game.matter?.field;
    this.L = null;
    if (!L || !F) return;
    if (L.id === 'carve' && L.b && L.a.distanceTo(L.b) > 0.8) {
      const r = F.carve(L.a.x, L.a.z, L.b.x, L.b.z, rampOf('carve', 'w', g) ?? VERBS.carve.w, rampOf('carve', 'depth', g) ?? VERBS.carve.depth);
      L.moved = r.moved;
      sfx.thump();
    }
    if (L.id === 'sculpt') { this.sculpt(L); return; }
    if (L.moved <= 1e-3) return;
    const ev = L.id === 'scoop' ? (L.pouring ? 'god.pour' : 'god.scoop') : `god.${L.id}`;
    g.events?.emit(ev, { moved: +L.moved.toFixed(2), made: +L.made.toFixed(2), by: 'courier' });
  }

  /** Raise the stroke's creation: a pillar, an arch (a bridge when long), or with Shift a ramp. Paid from the carried matter first, then
   *  Lachryma for the rest (an estimate of the volume, before it is stamped). */
  sculpt(L) {
    const g = this.game, S = VERBS.sculpt, a = L.a, b = L.b || a, len = Math.hypot(b.x - a.x, b.z - a.z);
    if (!g.creations) return;
    const shift = g.input.isDown('ShiftLeft') || g.input.isDown('ShiftRight');
    const shape = len < S.pillar ? 'pillar' : shift ? 'ramp' : 'arch', k = rampOf('sculpt', 'scale', g) ?? 1; // (bigger with Manifestation: GODHAND.md 11)
    const opts = shape === 'pillar' ? { r: 0.6 * k, h: 3 * k } : shape === 'ramp' ? { w: S.w * k, rise: Math.min(S.ramp * k, len * S.rampK) }
      : { w: S.w * k, t: S.t * k, h: THREE.MathUtils.clamp(len * S.archK, S.arch[0], S.arch[1] * k) };
    const est = shape === 'pillar' ? Math.PI * opts.r * opts.r * (opts.h + 0.5) : shape === 'ramp' ? opts.w * len * (opts.rise / 2 + 0.5) : opts.w * opts.t * len * 1.2;
    const fromHeld = Math.min(est, this.carried), made = est - fromHeld;
    if (made > 0 && !g.lachryma.spend(made * this.madeCost('sculpt'), 'god')) { g.log.say('warn', 'Not enough Lachryma, or matter in hand, to raise that.', { key: 'sculpt.pay', throttle: 2 }); return; }
    if (fromHeld > 0) { const H = this.held, k = fromHeld / this.carried; H.water -= H.water * k; H.sand -= H.sand * k; H.clay -= H.clay * k; }
    const r = g.creations.raise(shape, a, b, opts);
    sfx.thump();
    g.events?.emit('god.sculpt', { shape, volume: +r.volume.toFixed(2), moved: +fromHeld.toFixed(2), made: +made.toFixed(2), by: 'courier' });
  }

  /** The ball of held matter under the hand, sized by its volume and coloured by what it is. */
  update() {
    const v = this.carried, B = this.ball;
    B.visible = !!this.god.active && v > 0.05;
    if (!B.visible) return;
    const H = this.held, s = Math.cbrt(v) * 0.55;
    B.scale.setScalar(s);
    B.material.color.setHex(H.water >= H.sand && H.water >= H.clay ? 0x9fd8e0 : H.sand >= H.clay ? 0xd8b878 : 0x9a5a3a);
    B.position.copy(this.god.cursor.point).addScaledVector(UP, T.god.hoverH + s);
  }

  clear() { this.held = { water: 0, sand: 0, clay: 0, feeling: null }; this.L = null; this.ball.visible = false; }
}
