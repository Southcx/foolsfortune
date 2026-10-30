// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS ON THE CRUCIBELLE'S BELL (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and numbers Dovina's,
// progress/toolpairs.js SPECIAL_PLAY):
//   5  Rite           Crucibelle main, Veritome sub: every toll reads each creature it reaches (the toll's own `reach` and cone), `reads`
//                     a creature toward knowing its kind (`pair.read`, the ledger's `creature.<kind>.read`: progress/familiarity.js)
//   14 Healing Song   Soul Brush main, Crucibelle sub: paint laid within `window` of the bell's beat mends `mend` of a crack for each
//                     `area` square metres so laid
//
// Prior art: Final Fantasy's Scan and Libra (a spell that reads a foe), the bard's healing song (Zelda's Song of Healing), Hi-Fi Rush's
// beat (a stroke on the beat counts).
//
//   bellSpecials(PS) -> part { toll(e), update(raw) }; each act said with its place (pair.special, pair.hit, pair.mark:
//   tools/pairspecials.js) for its look (vfx/pairspeciallooks.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TOLL } from '../crucibelle/crucibelle.js';

const _a = new THREE.Vector3(), _f = new THREE.Vector3();

export function bellSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  let area = 0, laid = 0;
  return {
    /** The toll rung (crucibelle.toll): every creature it reached, read. */
    toll() {
      const R = P().rite; if (!PS.live(R.n)) return;
      const Pl = g.player, yaw = Pl.bodyYaw ?? Pl.yaw, f = _f.set(Math.sin(yaw), 0, Math.cos(yaw));
      let n = 0;
      for (const c of g.creatures?.near?.(Pl.pos, R.reach) || []) {
        if (!c.alive || c.ally) continue;
        const d = _a.set(c.pos.x - Pl.pos.x, 0, c.pos.z - Pl.pos.z); if (d.length() > 0.3 && d.normalize().angleTo(f) > TOLL.cone) continue;
        for (let i = 0; i < R.reads; i++) g.events?.emit('pair.read', { kind: c.kind, by: 'courier' });
        PS.marked(R.n, c.kind, { target: c }); n++;
      }
      if (n) PS.said(R.n, { n });
    },
    /** Paint being laid on the beat (the brush's load grows as it lays: tools/soulbrush/load.js): mended by the area so laid. */
    update() {
      const S = P().healingSong; if (!PS.live(S.n)) { laid = 0; return; }
      const L = g.techs?.get?.('soulbrush')?.load, now = L?.paintArea ?? 0, grew = now - area; area = now;
      const B = g.techs?.get?.('crucibelle');
      if (!(grew > 0) || !B || B.offBeat(B.now(), B.grid()) >= S.window) return;
      laid += grew;
      const k = (laid * S.mend) / S.area; // (a crack's share for the area laid on the beat so far)
      if (k >= 0.01 && g.vesselDamage?.mendBy?.(k, 'song')) { // (the hoop across the paint laid, the gold up the Courier's cracks)
        laid = 0; const at = L?.lastAt?.clone();
        PS.said(S.n, { at, feeling: L?.paintAspect || undefined }); PS.hit(S.n);
      }
    },
  };
}
