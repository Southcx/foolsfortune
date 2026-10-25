// ---------------------------------------------------------------------------------------
// WHAT AN AREA'S BUILD PUT IN THE WORLD (docs/plans/AREAS.md A1; render/areas.js stage 2, Petra's): a room that builds on entry and is
// torn down after takes away exactly what its build added, no more. The world is marked before the build (the scene's children, the
// physics' bodies and colliders by handle); after it, what is new is the build's own. The teardown takes those out of the scene and the
// physics, and disposes their geometry, and the materials and textures nothing left in the scene still uses (the sky's maps, and any
// marked `userData.shared`, never).
// A look another division lays over the room after its build is not in the set: it comes and goes by its own build and teardown.
//
// Prior art: an arena allocator's mark and release (everything allocated after the mark freed at once); Unity's additive scene unload.
//
//   const mark = markWorld(game)   ... build ...   const owned = ownedSince(game, mark, { skip: [objects], skipBodies: [bodies] })
//   takeAway(game, owned)   (safe on a body or collider already gone)
// ---------------------------------------------------------------------------------------

/** The world as it stands: what a build after it will be measured against. */
export function markWorld(game) {
  const W = game.physics.world, cols = new Set(), bodies = new Set();
  W.forEachCollider((c) => cols.add(c.handle)); W.forEachRigidBody((b) => bodies.add(b.handle));
  return { objs: new Set(game.scene.children), cols, bodies };
}

/** What is new since the mark: the scene's objects, the bodies, and the colliders not on those bodies (taken with them). */
export function ownedSince(game, mark, { skip = [], skipBodies = [] } = {}) {
  const W = game.physics.world, bodies = [], cols = [];
  W.forEachRigidBody((b) => { if (!mark.bodies.has(b.handle) && !skipBodies.includes(b)) bodies.push(b); });
  W.forEachCollider((c) => { const pb = c.parent(); if (!mark.cols.has(c.handle) && !skipBodies.includes(pb) && !bodies.includes(pb)) cols.push(c); });
  return { objs: game.scene.children.filter((o) => !mark.objs.has(o) && !skip.includes(o)), bodies, cols };
}

/** Out of the scene and the physics, and disposed where nothing left still uses it. */
export function takeAway(game, owned) {
  if (!owned) return;
  const W = game.physics.world;
  for (const o of owned.objs) game.scene.remove(o);
  const keep = new Set([game.scene.environment, game.scene.background, game.sky?.env].filter(Boolean)); // (the sky's maps, lent to many)
  game.scene.traverse((o) => { if (o.geometry) keep.add(o.geometry); for (const m of [].concat(o.material || [])) { keep.add(m); for (const v of Object.values(m)) if (v?.isTexture) keep.add(v); } });
  const gone = new Set();
  for (const o of owned.objs) o.traverse((x) => {
    if (x.geometry && !keep.has(x.geometry)) gone.add(x.geometry);
    for (const m of [].concat(x.material || [])) if (!keep.has(m) && !m.userData?.shared) { gone.add(m); for (const v of Object.values(m)) if (v?.isTexture && !keep.has(v) && !v.userData?.shared) gone.add(v); }
  });
  for (const r of gone) r.dispose();
  for (const c of owned.cols) if (W.getCollider(c.handle)) W.removeCollider(c, false);
  for (const b of owned.bodies) if (W.getRigidBody(b.handle)) W.removeRigidBody(b);
}
