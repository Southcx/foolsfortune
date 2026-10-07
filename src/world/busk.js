// ---------------------------------------------------------------------------------------
// THE BUSKER'S MATS: where the rhythm mode is played in the world (docs/plans/SYSTEMS.md, D5: busking; docs/plans/BUILD.md, Round 1). A mat
// is laid on each pier where folk pass: Old Grog's pier at the Weir, and Margarite's dock. F on a mat with the Crucibelle worn begins the
// rhythm mode (music/rhythm/rhythm.js: the next track, at the steady level), and the tips are the rhythm mode's own pay
// (progress/econ/economy.js, on rhythm.score). Without the Crucibelle the log says so. A song is begun in its own place and ends there: walk
// off the mat's pier (six metres) and the song stops, as every trial's interface goes away when you leave its room (CLAUDE.md).
//
// Its look is Calissa's (vfx/buskermat.js): the mat warms while a song plays, and the tips land in its pot.
//
// Prior art: the busker's pitch of every town square (a mat and an upturned hat), the Bard's songs for coin in Final Fantasy XIV's
// performance mode, and Patapon's and Rhythm Heaven's playing for someone.
//
//   game.busk = new Busk(game)   .update()   .near(P) -> { pos, d, ref } | null   (the interact chevron's id: 'busk')
//   events: busk.start { mat, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OX, OY, OZ } from '../tools/sondelass/angling/weir.js';
import { POND } from './dunes/dunes.js';
import { BuskerMat } from '../vfx/buskermat.js';

/** The mats: where each lies (null while its place is not built). */
export const MATS = [
  { id: 'weir', name: "Old Grog's pier", at: () => ({ pos: new THREE.Vector3(OX, OY + 0.01, OZ + POND.z - POND.rz + 1.5), yaw: 0 }) }, // (out on the Weir's pier, past its foot: angling/weir.js)
  { id: 'margarite', name: "Margarite's dock", at: (g) => g.margarite?.spot('busk') ?? null }, // (world/emocean/margarite.js)
];
const REACH = 1.6, LEAVE = 6;

export class Busk {
  constructor(game) {
    this.game = game; this.built = new Map(); this.playing = null;
    game.interact?.add('busk', (P) => (this.game.rhythm?.active || game.dialogue?.open ? null : this.near(P)));
    for (const m of MATS) this.lay(m); // (now, before the warm-up: laid on first sight, the mat's programs compiled in play)
    // (a finished song's tips land in the pot: one cube a fifth of the accuracy, as the crowd throws them)
    game.events?.on('rhythm.score', (e) => { const b = this.playing && this.built.get(this.playing); if (b) b.look.tip((b.tips += 1 + Math.round((e.accuracy ?? 0.5) * 4))); });
  }

  /** A mat laid where it lies (Calissa's: a rag rug on the planks and a tip pot thrown like the Pneuka Jar), once its place is built. */
  lay(m) {
    if (this.built.has(m.id)) return this.built.get(m.id);
    const at = m.at(this.game); if (!at) return null;
    const look = new BuskerMat({ env: this.game.sky?.env }); look.group.name = `busk-${m.id}`; look.group.position.copy(at.pos); look.group.rotation.y = at.yaw;
    this.game.scene.add(look.group);
    const out = { ...m, pos: at.pos.clone(), look, tips: 0 };
    this.built.set(m.id, out);
    return out;
  }

  /** The mat in reach, for the chevron. */
  near(P) {
    for (const m of MATS) {
      const b = this.lay(m); if (!b) continue;
      const d = Math.hypot(b.pos.x - P.pos.x, b.pos.z - P.pos.z);
      if (d < REACH && Math.abs(b.pos.y - P.pos.y) < 1.5) return { pos: b.pos.clone().setY(b.pos.y + 1.2), d, ref: b.id };
    }
    return null;
  }

  /** Once a frame: F on a mat begins a song; off the pier, the song stops. */
  update() {
    const g = this.game, P = g.player, it = g.interact?.cur, R = g.rhythm;
    for (const b of this.built.values()) { b.look.set({ playing: this.playing === b.id && !!R?.active }); b.look.update(g.rawDt ?? 1 / 60); }
    if (this.playing && R?.active) {
      const b = this.built.get(this.playing);
      if (b && Math.hypot(b.pos.x - P.pos.x, b.pos.z - P.pos.z) > LEAVE) { R.end(false); this.playing = null; }
    } else this.playing = null;
    if (it?.id !== 'busk' || !P.peekLatch?.('KeyF') || g.god?.controlling) return;
    P.latch('KeyF');
    if (!g.belt?.isWorn('crucibelle')) { g.log?.say('warn', 'Wear the Crucibelle to busk.', { key: 'busk.nobell', throttle: 2 }); return; }
    if (R?.begin(null, 'steady')) { this.playing = it.ref; g.events?.emit('busk.start', { mat: it.ref, by: 'courier' }); }
  }
}
