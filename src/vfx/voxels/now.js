// ---------------------------------------------------------------------------------------
// THE VOXEL BATCH, AS FOUND: the one handle a look asks for the crossing's voxel batch by (vfx/voxels/index.js sets it at install), so a
// look made without the game (a rail foe's body, a boss part) can throw itself apart without reaching for a global or the test harness.
//
//   setVoxels(batch)   voxelsNow() -> the VoxelBatch | null
// ---------------------------------------------------------------------------------------
let batch = null;
export const setVoxels = (b) => { batch = b || null; };
export const voxelsNow = () => batch;
