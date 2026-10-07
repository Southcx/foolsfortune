// ---------------------------------------------------------------------------------------
// THE PARRIES: V is the parry, and the tool in the hands decides what it is (the owner, 2026-10-06; docs/plans/PARRY.md, the table the
// owner approved). Every tool's parry has one shape so it is learned once: a WINDOW of the same length from the press, in which each
// frame asks parry.js's `answer` with the tool's way (`how`) and reach; held after, a tool may do what it does held (the Dreamvane
// spins, turning what reaches it, for Lachryma a real second). No parry moves the Courier: the core movement is the gold standard.
//
// Unarmed V is the kick (courier/moves/kick.js) and the Sondelass answers its own (the cutlass's deflect and guard; a rod or a hook
// snaps to the blade for it: tools/sondelass/sondelass.js), so neither is in the table.
//
// Prior art: Sekiro's one deflect for everything (what changes is what happens next), and each tool's own: Bloodborne's gun parry,
// the bat, Kirby's inhale, Fatal Frame's last-instant shot, a staff spin, Hi-Fi Rush's parry on the beat.
//
//   game.parries = new Parries(game)   .update(raw)   PARRIES (the table)   WINDOW
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { answer, guard } from './parry.js';
import { sfx } from '../audio/sfx.js';

export const WINDOW = 0.25; // (real seconds from the press: the kick's and the cutlass's)
const brushOf = (g) => g.techs?.get('soulbrush');

/** Each tool's parry: how it answers, how far it reaches, and how far ahead of the chest its reach is centred (metres). */
export const PARRIES = {
  psygun: { how: 'stagger', reach: 4.5, ahead: 4 }, // (a point-blank shot: it reaches along the look)
  soulbrush: { how: (g) => (brushOf(g)?.load?.mode === 'mop' ? 'soak' : 'return'), reach: 2.2, ahead: 0.8, paint: (g) => brushOf(g)?.load?.aspect },
  veritome: { how: 'shutter', reach: 3.5, ahead: 2.5 }, // (only a blow winding up: the last-instant photograph)
  dreamvane: { how: 'turn', reach: 2.2, ahead: 0.4, spin: 2 }, // (held after the window: spinning, 2 Lachryma a real second)
  crucibelle: { how: 'shatter', reach: 3, ahead: 0, onBeat: 4.5 }, // (in the window on the song's beat, a wider ring)
  lockheart: { how: 'gulp', reach: 2.4, ahead: 0.8 },
};

const _at = new THREE.Vector3(), _f = new THREE.Vector3();

export class Parries {
  constructor(game) { this.game = game; this.t = -1; this.tool = null; this.done = false; this.spinning = false; }

  /** Where the tool's reach is centred: the chest, `ahead` metres along the look. */
  at(spec) { const P = this.game.player; return _at.set(P.pos.x, P.pos.y + 1.1, P.pos.z).addScaledVector(P.lookDir(_f), spec.ahead); }

  update(raw) {
    const g = this.game, P = g.player, tool = g.belt?.inHand, spec = tool && PARRIES[tool.id];
    if (!spec || tool.drawT < 0.6 || g.god?.active || P.dead) { this.t = -1; this.spin(false); return; }
    if (P.peekLatch('KeyV')) {
      P.latch('KeyV');
      this.t = 0; this.tool = tool.id; this.done = false;
      g.events?.emit('parry.try', { tool: tool.id, by: 'courier' }); // (the pose is Calissa's: one clip a tool)
      if (tool.id === 'crucibelle') g.techs?.get('crucibelle')?.ring?.(this.at(spec).clone(), 0xffd76a, 10, this.reach(spec)); // (the toll's ring, seen)
    }
    if (this.t >= 0 && this.t < WINDOW && !this.done && this.tool === tool.id) {
      const how = typeof spec.how === 'function' ? spec.how(g) : spec.how;
      this.done = !!answer(g, { tool: tool.id, how, at: this.at(spec), radius: this.reach(spec), paint: spec.paint?.(g) || null });
    }
    if (this.t >= 0) this.t += raw;
    // held after the window: the Dreamvane spins
    const held = spec.spin && this.t >= WINDOW && g.input?.isDown('KeyV');
    this.spin(held && g.lachryma?.spend(spec.spin * raw, 'twirl'));
    if (this.spinning) guard(g, { at: this.at(spec), radius: spec.reach, tool: tool.id });
  }

  /** The reach just now: the Crucibelle's widens on the song's beat. */
  reach(spec) { return spec.onBeat && this.game.player.techs?.get('crucibelle')?.onTheBeat ? spec.onBeat : spec.reach; }

  spin(on) {
    on = !!on; if (on === this.spinning) return;
    this.spinning = on;
    if (on) sfx.whoosh?.(); // (a placeholder: Wanda's)
    this.game.events?.emit('dreamvane.twirl', { on, by: 'courier' });
  }
}
