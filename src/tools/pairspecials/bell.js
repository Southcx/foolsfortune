// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS ON THE CRUCIBELLE'S BELL (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8):
//   5  Rite           Crucibelle main, Veritome sub: the lent Flash readies the bell; the next toll reads every creature it reaches, each
//                     read counted toward knowing its kind as a down is (`pair.read`, the ledger's `creature.<kind>.read`: familiarity)
//   14 Healing Song   Soul Brush main, Crucibelle sub: paint laid while the bell's beat falls mends the vessel's cracks, once a beat
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Final Fantasy's Scan and Libra (a spell that reads a foe), the bard's healing song (Zelda's Song of Healing, Final Fantasy
// IX's Eiko), Hi-Fi Rush's beat (a stroke on the beat counts double).
//
//   bellSpecials(PS) -> part { lend(tool), toll(e), update(raw) }   BELL_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TOLL } from '../crucibelle/crucibelle.js';

/** The placeholders, each against a number the game already has. */
export const BELL_PLAY = {
  // Rite: the next toll within 6 real s (the Mark's own aim, less a beat); its reach the toll's own (TOLL range and cone)
  rite: { n: 5, life: 6 },
  // Healing Song: 0.04 of a region's crack mended a beat (the clay's own mending at about 0.02 a real s, MEND_RATE: twice it, on the beat)
  song: { n: 14, mend: 0.04 },
};
const _a = new THREE.Vector3(), _f = new THREE.Vector3();

export function bellSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let rite = null, lastBeat = -1, area = 0;
  return {
    lend(tool) { if (tool === 'veritome' && PS.live(P().rite.n)) rite = { until: PS.now + P().rite.life }; },
    /** The toll rung (crucibelle.toll): a readied one reads what it reached. */
    toll() {
      if (!rite || PS.now > rite.until || !PS.live(P().rite.n)) { rite = null; return; }
      rite = null;
      const Pl = g.player, yaw = Pl.bodyYaw ?? Pl.yaw, f = _f.set(Math.sin(yaw), 0, Math.cos(yaw));
      const kinds = [];
      for (const c of g.creatures?.near?.(Pl.pos, TOLL.range) || []) {
        if (!c.alive || c.ally) continue;
        const d = _a.set(c.pos.x - Pl.pos.x, 0, c.pos.z - Pl.pos.z); if (d.length() > 0.3 && d.normalize().angleTo(f) > TOLL.cone) continue;
        g.events?.emit('pair.read', { kind: c.kind, by: 'courier' }); kinds.push(c.kind);
      }
      PS.said(P().rite.n, { n: kinds.length });
    },
    /** Paint being laid on the beat: a crack mended, once a beat (the brush's load grows as it lays: tools/soulbrush/load.js). */
    update() {
      if (!PS.live(P().song.n)) return;
      const L = g.techs?.get?.('soulbrush')?.load, laying = !!L && L.paintArea > area + 1e-4; area = L?.paintArea ?? 0;
      const B = g.techs?.get?.('crucibelle'); if (!laying || !B?.onTheBeat) return;
      const G = B.grid(), beat = Math.floor((B.now() - G.t0) / G.spb);
      if (beat === lastBeat) return;
      lastBeat = beat;
      if (g.vesselDamage?.mendBy?.(P().song.mend, 'song')) PS.said(P().song.n);
    },
  };
}
