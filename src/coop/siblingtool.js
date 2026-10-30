// ---------------------------------------------------------------------------------------
// A SIBLING'S TOOL IN HAND (docs/plans/COOP.md C6: "each carries one tool of its own, its craft in the hand"): Dovina the Lockheart,
// Petra the Sondelass's cutlass, Calissa the Veritome, Wanda the Crucibelle, Espada the Dreamvane. The tool is the Courier's own model,
// a second one, held in the sibling's right hand the way the Courier holds a drawn tool: its frame put on the hand by the grip measured
// from the torch idle's closed hand (tools/grip.js, one socket shared by every one-handed tool), placed after the rig is posed each
// frame. At rest its parts are drawn as one mesh a material (render/restbake.js: the model's parts never move against each other here),
// so a sibling's tool is a handful of draws. The Lockheart's coffin is built by its tool, not a model of its own: until it is, Dovina
// carries it empty-handed and says so in the code, not the game (the look is Calissa's: the grips, a hand closed round each haft).
//
// Prior art: the house's own (heldtool.js's draw, the rest bake), Kingdom Hearts' party each with its own weapon, Dragon's Dogma's pawns'.
//
//   const T = new SiblingTool(sibling)   T.update(dt)   (coop/sibling.js, after the rig is posed)   T.dispose()   TOOL_OF[siblingId]
// ---------------------------------------------------------------------------------------
import { SondelassModel } from '../tools/sondelass/model.js';
import { VeritomeModel } from '../tools/veritome/model.js';
import { CrucibelleModel } from '../tools/crucibelle/model.js';
import { DreamvaneModel } from '../tools/dreamvane/model.js';
import { measureGrip } from '../tools/grip.js';
import { RestBake } from '../render/restbake.js';

/** Each sibling's tool (COOP.md C6's table). */
export const TOOL_OF = { dovina: 'lockheart', petra: 'sondelass', calissa: 'veritome', wanda: 'crucibelle', espada: 'dreamvane' };
/** The models a sibling can hold, each set as the tool shows in a hand (the cutlass: its sections in, the blade out, no hook). */
const MAKE = {
  sondelass: () => { const m = new SondelassModel(); m.setExtension(0); m.setBlade(1); m.setHook(false); return m; },
  veritome: () => new VeritomeModel(),
  crucibelle: () => new CrucibelleModel(),
  dreamvane: () => new DreamvaneModel(),
};

export class SiblingTool {
  constructor(sibling) {
    this.sib = sibling; this.id = TOOL_OF[sibling.id] || null; this.grip = null;
    const make = MAKE[this.id]; if (!make) return; // (the Lockheart: its tool builds its coffin; no model of its own yet)
    try { this.grip = measureGrip(sibling.rig, 'torchIdle'); } catch { return; } // (measured now, on the rig not yet posed: measuring resets a pose, and a posed frame would show it)
    this.model = make();
    const G = (this.group = this.model.group);
    G.name = `SiblingTool-${sibling.id}`; G.matrixAutoUpdate = false; G.userData.zoneFree = true; // (it goes where its sibling goes: shown with the rig, never placed in a zone of its own)
    G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    sibling.game.scene.add(G);
    this.rest = new RestBake(G);
  }

  /** After the rig is posed: the tool's frame put on the right hand by the grip, its parts baked while they hold still. */
  update(dt) {
    const G = this.group, R = this.sib.rig; if (!G || !this.grip || !R?.arm?.R?.hand) return;
    const shown = R.root.visible !== false && !this.sib.game.siblingShatter?.holds?.(this.sib); // (as the rig is drawn: its zone's and its owner's say, and never while it lies in pieces)
    G.visible = shown; if (!shown) return;
    const hand = R.arm.R.hand; hand.updateWorldMatrix(true, false);
    G.matrix.multiplyMatrices(hand.matrixWorld, this.grip.R); G.matrixWorldNeedsUpdate = true;
    this.rest.update(dt, true, this.id);
  }

  dispose() { if (!this.group) return; this.rest.dispose(); this.group.removeFromParent(); this.group.traverse((o) => o.geometry?.dispose?.()); this.group = null; }
}
