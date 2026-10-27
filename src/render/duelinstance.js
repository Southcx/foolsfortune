// ---------------------------------------------------------------------------------------
// THE DUEL'S INSTANCE (South, 2026-10-27: "puzzle duels need to take place within their own entirely separate instance, featuring only
// the actors actively engaged in the puzzle duel"). While a puzzle duel is open the frame draws its actors and nothing of the world: the
// tsuitate and its domains' clash (vfx/duelview.js `root`, the clash its backdrop), the Pneuka Jar at your spot and its pour (the god
// hand's jar, vfx/duelview/formdive.js), the foe's body and the aberrant's look on it (its shards; not its shadow, which lies on a
// ground that is not drawn), the lights, and anything added to the scene after the duel opened (a beat's effect). Everything else that
// stood in the scene when the duel opened is hidden for the draw and shown again after it, so a zone, an area or a module that sets its
// own `visible` each frame is never fought: the world is untouched, only not drawn. The rules already made the duel a pocket (the
// session's `pocket`: nothing outside enters); this makes it one to the eye.
//
// Prior art: Pokemon's battle scene and Final Fantasy's battle screen (the field left for an arena holding only the combatants), our own
// reading view's scene (render/readingscene.js: the world not drawn while the Box is turned over).
//
//   game.duelInstance = new DuelInstance(game)   .open(keep)   .close(until, then)   .active   .render(scene, camera)   (boot/frame.js)
//   keep: () => [Object3D]  what belongs to the duel (each object's top-level ancestor in the scene is kept whole)
//   close: the instance held until `until()` says the duel's last look is done (the tsuitate folded away), then `then()` (the foe put back)
// ---------------------------------------------------------------------------------------

export class DuelInstance {
  constructor(game) { this.game = game; this.active = false; this.before = null; this.keep = null; this.until = null; this.then = null; this.hidden = []; }

  /** The duel opened: what stands in the scene now is the world (hidden while drawn); `keep` names the duel's own. */
  open(keep) { if (this.active) this.end(); this.before = new Set(this.game.scene.children); this.keep = keep; this.active = true; }
  close(until = null, then = null) { this.until = until; this.then = then; if (!until) this.end(); }
  end() { const then = this.then; this.active = false; this.before = null; this.keep = null; this.until = null; this.then = null; then?.(); }

  /** The top-level ancestor of `o` in the scene (what is shown or hidden whole), or null when it is not in the scene. */
  top(o) { const S = this.game.scene; while (o && o.parent && o.parent !== S) o = o.parent; return o?.parent === S ? o : null; }

  /** Draw the duel alone: the world's top-level objects hidden for this draw, then shown as they were. */
  render(scene, camera) {
    const post = this.game.post, H = this.hidden; H.length = 0;
    if (this.until?.()) { this.end(); post.render(scene, camera); return; } // (the fold done: the world again from this frame)
    const keep = new Set(); for (const o of this.keep?.() || []) { const t = o && this.top(o); if (t) keep.add(t); }
    for (const o of scene.children) if (o.visible && !o.isLight && !keep.has(o) && this.before?.has(o)) { o.visible = false; H.push(o); }
    try { post.render(scene, camera); } finally { for (const o of H) o.visible = true; H.length = 0; }
  }
}
