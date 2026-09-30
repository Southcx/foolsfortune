// ---------------------------------------------------------------------------------------
// TAGS: what a thing in the world IS, for everything that acts on things. A pot, a crate, a sliced half, a ruined column in the
// dunes: each carries a few words that say how the physics and the tools may treat it, and the tools ask the words, not the kind of
// entity. So a new thing is made cuttable, liftable or hookable by tagging it, and a new tool decides what it acts on by asking,
// without either knowing about the other.
//
//   sliceable   a blade cuts it (the Cleave shell, the cutlass's blade mode): it comes apart along the plane
//   breakable   a shot, a blow or a fall shatters it
//   liftable    it can be picked up and carried (size and weight still decide: moves/carry.js)
//   pushable    it can be shoved and dragged
//   static      it does not move until something takes it apart (a ruin, a pillar)
//
// Every kind of entity has its defaults (a pot is breakable, sliceable and liftable); an entity's own tags add to them; `untag`
// takes one away. Things that stand still somewhere in the world and have no other list to be found in (the dunes' ruined columns)
// are REGISTERED, so a tool that sweeps a volume can find them.
//
// Prior art: Unity's tags and layers and Source's prop flags (prop_static vs prop_physics, "sliceable" in later games' material
// flags), and Breath of the Wild's chemistry engine, where what a thing is made of, not what it is, decides what acts on it.
//
//   tag(ent, 'sliceable', 'static')    untag(ent, 'liftable')    hasTag(ent, 'sliceable')    register(ent) / unregister(ent)    registered('sliceable')
// ---------------------------------------------------------------------------------------
const DEFAULTS = {
  breakable: ['breakable', 'sliceable', 'liftable', 'pushable'],
  slice: ['sliceable', 'pushable'],
  shard: ['sliceable', 'pushable'],
  clapper: ['sliceable'],
  prop: ['pushable'],
};

export function tag(ent, ...names) {
  if (!ent) return ent;
  ent.tags ||= new Set();
  for (const n of names) ent.tags.add(n);
  ent.untags?.forEach((n) => names.includes(n) && ent.untags.delete(n));
  return ent;
}

export function untag(ent, ...names) {
  if (!ent) return ent;
  ent.untags ||= new Set();
  for (const n of names) { ent.untags.add(n); ent.tags?.delete(n); }
  return ent;
}

export function hasTag(ent, name) {
  if (!ent) return false;
  if (ent.untags?.has(name)) return false;
  if (ent.tags?.has(name)) return true;
  if (name === 'sliceable' && ent.sliceable) return true; // (the flag the level's props carried before there were tags)
  return DEFAULTS[ent.type]?.includes(name) ?? false;
}

const REG = new Set();
export function register(ent) { REG.add(ent); return ent; }
export function unregister(ent) { REG.delete(ent); }
/** The registered things with a tag (a fresh array: it is safe to change the registry while walking it). */
export function registered(name) { const out = []; for (const e of REG) if (hasTag(e, name)) out.push(e); return out; }
