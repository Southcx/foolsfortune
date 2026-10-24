// ---------------------------------------------------------------------------------------
// THE HERDS ON THE WATER (docs/plans/OPEN-SEA.md 13, the world side): the game day's herds (progress/opensea/migrations.js `herdsOf`) laid
// in their squares as Calissa's herds (`game.makeEgregoreHerd`: milling, scattering or displaying by disposition; else her placeholder
// bodies one by one, `game.makeEgregore`, bobbing), round the square's
// middle. A dock posts the board (`sea.herds`, once a game day): each herd by its bearing from the dock, in squares. A plate
// taken while you are in a herd's square (the Veritome's shutter ashore, or E at the helm with the Veritome worn) and one of its bodies is in the frame (near enough and inside the view's cone) is that herd met:
// `sea.herd { id, square, cubes }`, its fee owed and paid with the reports at the next dock (`sea.dock`), one payment a herd a game day.
// The bodies go and the next game day's come at the day's turn; nothing is lost by missing one.
//
// Prior art: Pokemon Snap's professor (paid for the picture), Pokemon GO's nests (the same herds for everyone that game day), Monster
// Hunter's posted investigations, Red Dead Redemption 2's legendary animals told by rumour.
//
//   new SeaHerds(room)   .update(dt)   .helmPlate()   .list (the game day's herds, each { id, square, cls, n, bodies })   .dump() / .load(d) (the room's save)
//   events (each with `by`): sea.herds { day, n, herds: [{ id, squares, way }] }, sea.herd { id, square, cubes }, sea.herd.paid { cubes, n }, sea.plate {} (a plate from the helm)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { herdsOf, herdFee } from '../../progress/opensea/migrations.js';
import { squareCentre, SEA } from './seaprops.js';
import { today } from '../../core/calendar.js';
import { seeded } from '../../core/rng.js';

/** spread: metres round the square's middle a herd's bodies lie; reach: metres a body may be from the camera and still be in the plate;
 *  cone: the cosine of the half-angle off the view's centre a body must be inside; bob: metres and real s of the bodies' rise on the swell. */
export const HERD_LOOK = { spread: 70, reach: 180, cone: 0.85, bob: [0.6, 3.2] };

const _v = new THREE.Vector3(), _f = new THREE.Vector3();

export class SeaHerds {
  constructor(room) {
    this.room = room; this.game = room.game; this.day = -1; this.list = []; this.group = new THREE.Group(); this.group.name = 'seaHerds';
    this.state = { day: -1, posted: false, met: [], owed: 0, owedN: 0 };
    this.game.scene?.add(this.group);
    const ev = this.game.events;
    ev?.on?.('photo.take', () => { if (this.room.active) this.plate(); });
    ev?.on?.('sea.dock', (e) => { if ((e.by ?? 'courier') === 'courier') this.docked(); });
  }

  dump() { return { ...this.state }; }
  load(d) { this.state = { day: -1, posted: false, met: [], owed: 0, owedN: 0, ...(d || {}) }; }

  /** The game day's herds laid (once a game day): yesterday's bodies cleared, a herd's met state carried in the save. */
  lay(day) {
    this.day = day;
    for (const H of this.list) { if (H.herd) { this.group.remove(H.herd.group); H.herd.dispose?.(); continue; } for (const b of H.bodies) { this.group.remove(b.group); b.group.traverse?.((o) => o.geometry?.dispose?.()); } }
    if (this.state.day !== day) this.state = { ...this.state, day, posted: false, met: [] }; // (what was owed is still owed: it pays at the next dock)
    const R = this.room, r = seeded((R.seed * 31 + day * 977) >>> 0);
    this.list = herdsOf(R.grid, day, R.seed).map((h) => {
      const sq = R.grid.squares.find((s) => s.id === h.square), c = squareCentre(sq.col, sq.row), bodies = [];
      // (Calissa's herd, where it is built: its bodies mill, scatter or display by the species' disposition, vfx/opensea/egregoreherd.js)
      const herd = this.game.makeEgregoreHerd?.({ species: h.id, n: h.n, at: c.clone().setY(SEA.y), seed: (R.seed * 31 + day * 977 + sq.col * 13 + sq.row) >>> 0 });
      if (herd) { this.group.add(herd.group); return { ...h, herd, bodies: herd.members.map((m) => ({ group: m.body.group })) }; }
      for (let i = 0; i < h.n; i++) {
        const B = this.game.makeEgregore?.(h.id); if (!B) break;
        const a = r() * Math.PI * 2, d = HERD_LOOK.spread * Math.sqrt(r());
        B.group.position.set(c.x + Math.cos(a) * d, SEA.y, c.z + Math.sin(a) * d); B.group.rotation.y = r() * Math.PI * 2;
        this.group.add(B.group); bodies.push({ group: B.group, phase: r() * Math.PI * 2 });
      }
      return { ...h, bodies };
    });
  }

  /** A dock: the board posted (once a game day), and what the herds met since the last dock paid. */
  docked() {
    const g = this.game, S = this.state;
    if (!S.posted) { S.posted = true; g.events?.emit('sea.herds', { day: this.day, n: this.list.length, herds: this.list.map((H) => this.bearing(H)), by: 'courier' }); }
    if (S.owed > 0) { g.cubes?.earn(S.owed, 'herd'); g.events?.emit('sea.herd.paid', { cubes: S.owed, n: S.owedN, by: 'courier' }); S.owed = 0; S.owedN = 0; }
    this.room.dirty();
  }

  /** Where a herd lies from where the ship stands: the species, how many squares, and the way (rows grow south, columns east). */
  bearing(H) {
    const [c0, r0] = String(this.room.voyage.at).split(',').map(Number), [c1, r1] = H.square.split(',').map(Number);
    const dc = c1 - c0, dr = r1 - r0, way = `${dr < 0 ? 'north' : dr > 0 ? 'south' : ''}${dc && dr ? '-' : ''}${dc > 0 ? 'east' : dc < 0 ? 'west' : ''}`;
    return { id: H.id, squares: Math.max(Math.abs(dc), Math.abs(dr)), way: way || 'here' };
  }

  /** A plate from the helm (E while sailing): the Courier's hands are on the wheel, so the worn Veritome takes it over the bow, the
   *  view as the camera has it; refused if no Veritome is worn (main or sub). */
  helmPlate() {
    const g = this.game, B = g.belt;
    if (B && B.main !== 'veritome' && B.sub !== 'veritome') return g.log?.say?.('warn', 'Wear the Veritome to take a plate from the helm.', { key: 'sea.plate', throttle: 4 });
    g.events?.emit('sea.plate', { by: 'courier' }); this.plate();
  }

  /** A plate taken at sea: each herd not yet met this game day whose square you are in and whose body is in the frame is met. */
  plate() {
    const g = this.game, cam = g.camera, R = this.room, S = this.state; if (!cam) return;
    const at = R.squareAt?.(R.sailing ? R.helm.pos : g.player.pos); if (!at) return;
    cam.getWorldDirection(_f);
    for (const H of this.list) {
      if (H.square !== at.id || S.met.includes(H.square + ':' + H.id)) continue;
      const seen = H.bodies.some((b) => { if (b.group.visible === false) return false; b.group.getWorldPosition(_v).sub(cam.position); const d = _v.length(); return d < HERD_LOOK.reach && _v.dot(_f) / Math.max(d, 1e-3) > HERD_LOOK.cone; });
      if (!seen) continue;
      const cubes = herdFee(H.cls);
      S.met.push(H.square + ':' + H.id); S.owed += cubes; S.owedN++;
      g.events?.emit('sea.herd', { id: H.id, square: H.square, cubes, by: 'courier' }); R.dirty();
    }
  }

  update(dt) {
    const day = today(); if (day !== this.day) this.lay(day);
    const t = performance.now() / 1000, [amp, per] = HERD_LOOK.bob;
    this.group.visible = this.room.active;
    if (!this.group.visible) return;
    const ship = this.room.sailing ? this.room.helm?.pos : null;
    for (const H of this.list) {
      if (H.herd) { H.herd.update(dt, { ship }); continue; }
      for (const b of H.bodies) b.group.position.y = SEA.y + Math.sin(t * Math.PI * 2 / per + b.phase) * amp;
    }
  }
}

