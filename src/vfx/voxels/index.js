// ---------------------------------------------------------------------------------------
// THE CROSSING'S VOXELS, INSTALLED: the voxel batch (vfx/voxels/voxelbatch.js: every cube of debris, one draw) and the swarm's look
// (vfx/voxels/swarmlook.js: the voxel boid swarm, one draw) made once and offered as services, `game.voxels` and `game.swarmLook`, for
// Petra's runtime to throw bodies apart and fly the flock into (a boss part comes off through `game.voxels.burst`: vfx/bossparts.js).
// The crossing's look (vfx/crossinglook.js) owns them: it makes them with itself, builds them with the sea, parks them for the warm-up
// and steps the batch once a frame.
//
// Prior art: the crossing look's other parts (vfx/refitsweep.js, vfx/railfoemarks.js: made in its constructor, built and parked with it).
//
//   const X = installVoxels(game, scene?)   (sets game.voxels and game.swarmLook; builds at once when given the scene)
//   game.swarmLooks [two SwarmLooks: a second swarm in flight at once draws in the second]
//   X.build(scene)   X.parked() -> [objects]   X.update(rawDt)   X.batch   X.swarm
// ---------------------------------------------------------------------------------------
import { VoxelBatch } from './voxelbatch.js';
import { SwarmLook } from './swarmlook.js';
import { setVoxels } from './now.js';
import { railFoeBody, RAIL_FOE_ROLES } from '../railfoes.js';
import { voxelize } from './voxelize.js';

/** Every rail foe's body baked to its voxels at boot (about 48 ms for the 17), so a role's first death is no hitch (its key: railfoes.js down). */
function prebake() {
  for (const role of RAIL_FOE_ROLES) { try { const b = railFoeBody(role); b.object.updateWorldMatrix(true, true); voxelize(b.object, { key: `railfoe.${role}` }); b.dispose?.(); } catch (e) { console.warn('voxels: prebake', role, e); } }
}

export function installVoxels(game, scene = null) {
  const batch = new VoxelBatch(game), swarm = new SwarmLook(game, { batch }), swarm2 = new SwarmLook(game, { batch });
  game.voxels = batch; game.swarmLook = swarm; game.swarmLooks = [swarm, swarm2]; setVoxels(batch); // (two swarms in flight at once: the second its own draw)
  const X = {
    batch, swarm, built: false,
    build(sc) { if (X.built) return X; batch.build(sc); swarm.build(sc); swarm2.build(sc); X.built = true; prebake(); return X; },
    parked: () => (X.built ? [...batch.parked(), ...swarm.parked(), ...swarm2.parked()] : []),
    update: (raw) => batch.update(raw),
  };
  if (scene) X.build(scene);
  return X;
}
