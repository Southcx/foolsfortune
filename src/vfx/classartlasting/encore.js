// ---------------------------------------------------------------------------------------
// ENCORE'S ECHO: the Lovers' art (Petra's runtime, courier/classarts/lasting.js `echo`: the last tool move struck again from where it was
// made, 1 s later, saying `art.fire { art: 'echo', at }` where it strikes) drawn as the move remembered: an afterimage of the Courier
// striking, a ghost of light in the move's tool's suit (progress/spreads.js TOOL_SUIT), written through with the running hand
// (Spellscription's grammar) and eroding as it goes, and the move's arc swept again in front of it (the library's `art.echo.arc`).
// While Encore is the worn action, each tool move's pose is kept a beat after it begins (STRIKE: its blow, as near as a look needs) as a
// print (vfx/classartlasting/ghost.js), so the echo can show the strike itself and not the Courier as they stand when it plays.
//
// Prior art: the PlayStation 2's frame feedback and Devil May Cry's afterimages (a still of the pose, additive, fading), Bayonetta's
// Witch Time echoes, the Lovers' twin figures (the one who acts and the one who answers), the house's tool trails coloured by suit.
//
//   const E = new EncoreEcho(game)   E.update(dt, run, shown)   E.use(run)  (art.use)   E.fire(e, shown)  (art.fire echo)   E.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TOOL_SUIT } from '../../progress/spreads.js';
import { shapeMat } from './kit.js';
import { posePrint, ghostGeometries, ghostMesh, disposeGhost } from './ghost.js';

/** The echo's numbers: when a move's pose is kept after it begins (real s), how long its ghost lasts (real s) and how strong it stands. */
export const ECHO = { strike: 0.14, life: 0.8, k: 0.9 };
/** A move's tool by its moveset's id (tools/moveset.js: the cutlass is the Sondelass's form, the club the Soul Brush's). */
const TOOL_OF = { cutlass: 'sondelass', club: 'soulbrush' };
export const toolSuitOf = (tool) => TOOL_SUIT[TOOL_OF[tool] ?? tool] ?? 'swords';
const toV3 = (a) => (Array.isArray(a) ? new THREE.Vector3(a[0], a[1], a[2]) : a?.isVector3 ? a.clone() : null);

export class EncoreEcho {
  constructor(game) { this.game = game; this.t = 0; this.rec = null; this.due = null; this.kept = null; this.latched = null; this.ghosts = []; }
  /** While Encore is worn: each new move's pose kept STRIKE real s after it begins. */
  update(dt, run, shown) {
    this.t += dt;
    const worn = this.game.classArts?.worn?.action === 'echo', m = run?.lastMove ?? null;
    if (m !== this.rec) { this.rec = m; this.due = worn && m ? { rec: m, at: this.t + ECHO.strike } : null; }
    if (this.due && this.t >= this.due.at) { const print = posePrint(this.game.character); if (print) this.kept = { rec: this.due.rec, print }; this.due = null; }
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const G = this.ghosts[i]; G.age += dt; const u = Math.min(1, G.age / ECHO.life);
      G.S.u.uK.value = ECHO.k * (1 - u * u); G.S.u.uErode.value = 0.05 + 0.9 * u * u; G.group.visible = shown;
      G.group.scale.setScalar(1 + 0.05 * u);
      if (u >= 1) { disposeGhost(G.group); G.S.mat.dispose(); this.ghosts.splice(i, 1); }
    }
  }
  /** Encore pressed: the record it plays again, and its kept pose if it is the same move's. */
  use(run) { const m = run?.lastMove; this.latched = m ? { rec: m, print: this.kept?.rec === m ? this.kept.print : null } : null; }
  /** The echo strikes: its arc swept again where the move was made, and the afterimage of the strike there. */
  fire(e, shown) {
    const L = this.latched; this.latched = null; if (!shown) return;
    const rec = L?.rec, at = toV3(e?.at) ?? toV3(rec?.at); if (!at) return;
    const yaw = rec?.yaw ?? this.game.player?.bodyYaw ?? 0, suit = toolSuitOf(rec?.tool), dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    this.game.vfx?.play?.('art.echo.arc', { pos: at.clone(), dir, normal: new THREE.Vector3(0, 1, 0), suit, domain: 'spellscription', scale: Math.max(0.8, (rec?.reach ?? 1.5) / 1.5), floor: at.y });
    if (!L?.print) return;
    const origin = toV3(rec.at) ?? at, S = shapeMat({ main: 'script', mainK: 0.55, tile: [4, 3], scroll: [0, 0.5], mask: 'streaks', maskK: 0.5, maskTile: [8, 1], maskScroll: [0, 1.2],
      ramp: 'suit', rim: 1.1, rimPow: 2, core: 0.25, glow: 2.1, add: 1, back: 0.25 }, { suit });
    const group = ghostMesh(ghostGeometries(L.print, origin), S.mat); group.position.copy(origin);
    this.game.scene.add(group); this.ghosts.push({ group, S, age: 0 });
  }
  dispose() { for (const G of this.ghosts) { disposeGhost(G.group); G.S.mat.dispose(); } this.ghosts = []; }
}
