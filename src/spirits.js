// ---------------------------------------------------------------------------------------
// SPIRITS: what is called up out of smoke and Lachryma to stand with the Courier for a while: the Crucibelle's SUMMON song, a
// Lockheart's luck. A spirit is a slip jelly made of smoke (jelly/slipjelly.js, `spawn(home, { spirit })`): the same body, the same mind
// (jelly/mind.js), with a place of its own in the ecology (ai/ecology.js: `spirit`, which takes her for kin and the wild jellies for
// rivals, as they take it), so everything it does it does by the parts every creature has: it follows her, it fights what is against
// her, and a song's RALLY (status `haste`, `empower`) makes it quicker and harder. Her own blows pass through it (creatures.js: `ally`).
// It lasts its time and goes back into smoke, or is struck down; it never forms again.
//
// Prior art: Patapon's army that the song commands, the summons of Final Fantasy made small and many, and the familiars of Hollow
// Knight's Grimmchild and Weaversong (allies with their own little minds, on a timer or a charm).
//
//   game.spirits.summon(pos, { life, power, from }) -> creature | null      game.spirits.list (the living)      game.spirits.max
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const MAX_SPIRITS = 4;

export class Spirits {
  constructor(game) { this.game = game; this.max = MAX_SPIRITS; }
  get list() { return (this.game.jellies?.list || []).filter((c) => c.spirit && c.alive); }
  /** A spirit out of the smoke at `pos` (the oldest goes, if there are already as many as there may be). */
  summon(pos, { life = 30, power = 1, from = 'crucibelle', by = 'courier' } = {}) {
    const g = this.game, J = g.jellies;
    if (!J) return null;
    const now = this.list;
    if (now.length >= this.max) now.sort((a, b) => a.spirit.life - b.spirit.life)[0] && J.vanish(now[0], 'environment', 'faded');
    const home = pos.clone();
    const y = J.ground({ pos: home, groundY: home.y, col: null }, home.x, home.z);
    if (y != null) home.y = y;
    const c = J.spawn(home, { spirit: { life, max: life, power, from } });
    c.deform.kick(6, null, 0.3);
    if (g.fx?.alpha?.emit) for (let i = 0; i < 22; i++) g.fx.alpha.emit({ pos: home.clone().setY(home.y + 0.3), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 2), life: 1 + Math.random(), size: 0.2, sizeEnd: 0.8, color: new THREE.Color(0x8f7fc0), alpha: 0.45, drag: 1.5, gravity: -0.5 });
    g.events?.emit('spirit.summon', { from, by, power: +power.toFixed(2), life: Math.round(life) });
    return c;
  }
  /** Every spirit, lifted by a rally: quicker and harder for a while. */
  rally(secs, k = 1, by = 'courier') { for (const c of this.list) { this.game.creatures.apply(c, 'haste', secs, k, by); this.game.creatures.apply(c, 'empower', secs, k, by); } }
}
