// ---------------------------------------------------------------------------------------
// THE ARC (docs/plans/TOUCH-REBUILD.md 3.1, 3.1.1, 3.4, 7; South's rulings 2026-11-01 and 02): touch play's right thumb as one grid
// with one gutter. Each slot is a kind of verb (A primary, B evade, C vertical, D secondary, E defend, F the meter, G crouch), and the
// context only renames it. Dovina's data says which input action stands in which cell (progress/toucharc.js, `game.touchArc`). This
// module places, faces, presses and folds the slots; the tiles' look is Calissa's (tile.js), the press the touch driver's (each slot
// reports its binding's touch control through touchTiles, the same path as the cluster's tiles: drag-aim and SPECIAL's swipe hold).
//   PLACEMENT  from cells: arcRect(slot, safe), 48 px cells, 8 px gutters, the safe area's edges 16 px off, A 2 x 2. An empty cell stays
//              empty: a slot with no verb now is not drawn and nothing moves up into it.
//   FACES      read as the cluster read them: USE named by its thing, FIRE / AIM in the tool's own words (actioncontext.js ACTION_TILES),
//              DASH worn as BLINK once Blink stands on the ground, ART with its cooldown on the rim.
//   PICK       the tool in hand's picks (its chambers, forms, the brush's MOP or PAINT, the lens's FLASH, the rod's LURE and CRANK) and its
//              third verb (SHELL, LOCK, PING, REPROGRAM, SURVEY): a tap is the next one, a hold (CURSOR.long) the radial (radial.js). The
//              Crucibelle's five notes open as a radial that stays open while played.
//   BELT       a tap DRAW or STOW; a hold the radial of SWAP, the sub's lend, the Solar Skiff and the worn art.
//   THE FOLD   (section 7) the column F, PICK, BELT. FOLDED (the default) shows its first as a stack: a tap is its press (F's art; with
//              no art, the stack's face is PICK and a tap opens), a pull down off it cascades the rest out. It folds back after a choice
//              or ARC_FOLD_TIME.idle real seconds untouched. SHOWN keeps it open; HIDDEN draws no arc at all (the top bar's fold tile
//              brings it back). Each cascade and refold says `touch.fold { state, tiles, by }` (Wanda's clack).
//   COLLAPSED  the top bar's fold tile: the whole arc folded to one stack in A's cell, a tap opening it again (kept: T.touch.collapsed).
// Built for the contexts South plays first (TOUCH-REBUILD.md 5's order): on foot, a tool drawn, and sealed in a mech. Elsewhere (the
// Arena, the Solar Skiff, the crossing, the helm, carrying, pushing) `arcContext` is null and the cluster and strip stand as before, until each moves.
//
// Prior art: Brawlhalla's and Brawl Stars' fixed slots renamed by context; a keyboard's one gutter; the Jacob's ladder (the tablitas);
// Breath of the Wild's Pro HUD for HIDDEN; the strip's pick tiles and radial (strip.js) that PICK and BELT replace.
//
//   new TouchArc(game)   .update(now, on)   .relayout()   .ctx   .fold ('folded' | 'open')   .collapse(on)   .owns() -> bool   ARC_PRESS
//   arcContext(game) -> 'mech' | 'foot' | 'tool' | null
// ---------------------------------------------------------------------------------------
import { T, saveTuning } from '../../core/config.js';
import { ACTIONS } from '../../core/bindings.js';
import { ARC_FOLD_TIME, arcOf, arcRect, foldOf } from '../../progress/toucharc.js';
import { TouchTile, TILE } from './tile.js';
import { touchTiles } from './presses.js';
import { placeOf, windowOpen } from './areas.js';
import { openRadial } from './radial.js';
import { specialsOf } from '../../progress/mechs/specials.js';
import { mechFace, MECH_BELT } from '../mechs/mechfaces.js';

/** A mech's parts' specials as PICK's items (the arms' first: a tap is it), each its move's name, dim while it rests. */
function mechPicks(g) {
  const P = g.hangar?.pilot, L = specialsOf(P?.stats); if (!P) return [];
  return ['arms', 'head', 'legs', 'core'].filter((k) => L[k]).map((k) => ({ id: `mech.${k}`, glyph: null, word: L[k].label.toUpperCase().slice(0, 8), dim: (P.specials?.ready(k) ?? 1) < 1 }));
}
import { useLabel } from './cluster.js';
import { inHandCtx, toolCluster, stripOf, beltPairOf, artTile, ACTION_TILES } from './actioncontext.js';
import { CURSOR } from '../../core/touchcursor.js';

/** The numbers: a pull down this far off the stack (CSS px) cascades it; a tap pressed and let go lasts `tap` real ms. */
export const ARC_PRESS = { pull: 24, tap: 90 };

const CONTROL = new Map(ACTIONS.map((a) => [a.id, a.touch])); // (an input action's touch control id: what a slot reports)
const techs = (g) => g.techs || g.player?.techs;
const learned = (g, id) => { const t = techs(g)?.get?.(id); return !!t && (t.usable ? t.usable() : !!t.enabled); };

/** Sealed in the hangar's frame, its seal's beat done and the mount's shot over (world/hangar/mechpilot.js reads the keys then). */
const mechSealed = (g) => { const H = g?.hangar, C = g?.cradles; return !!H?.cradle && C?.sealed === H.cradle && C.phase === 'on' && !g.mechMount?.playing; };
// (the frame's faces, MECHS.md 4.9: the arms by their weapons, the boost, the jump, the barrier pressed, the back unit; BELT the cable or
//  stepping out. Their glyphs read from the frame worn: Calissa's ui/mechs/mechfaces.js)

/** Which of the arc's contexts the moment is, or null (the cluster's then). */
export function arcContext(g) {
  if (mechSealed(g)) return 'mech'; // (sealed in a frame and its mount played out: the frame's own slots, MECHS.md 4.9)
  const L = g?.actions?.live?.(); if (!L || !L.has('foot') || L.has('arena')) return null;
  if (g.duel?.active || g.duel?.pending || g.realm?.active || g.god?.controlling || g.rail?.stage?.active || g.opensea?.sailing) return null;
  const S = techs(g)?.get?.('skiff'); if (S?.active) return null;
  if (techs(g)?.active?.id === 'push' || techs(g)?.get?.('carry')?.engaged) return null; // (PUSH and THROW / PUT DOWN: the cluster's own faces still)
  return inHandCtx(g) ? 'tool' : 'foot';
}


export class TouchArc {
  constructor(game) {
    this.game = game; this.tiles = new Map(); this.ctx = null; this.fold = 'folded'; this.touched = 0; this.key = ''; this.shown = new Set();
    this.down = new Map(); this.picks = []; this.belt = []; this.closeRadial = null; this.holdT = 0;
  }

  get setting() { return T.touch?.controls || 'folded'; }
  get collapsed() { return !!T.touch?.collapsed; }
  /** The top bar's fold tile: the whole arc to one stack in A's cell, or out again. Kept with the settings. */
  collapse(on) { if (!T.touch) T.touch = {}; T.touch.collapsed = !!on; saveTuning(); this.key = ''; this.say(on ? 'folded' : 'open', on ? ['A'] : [...this.shown]); }
  /** Whether the arc holds the moment (the cluster and strip stand down). */
  owns() { return !!this.ctx; }

  tile(slot) {
    let t = this.tiles.get(slot);
    if (!t) {
      t = new TouchTile(`arc.${slot}`, { size: TILE.size, glyph: null, word: null, fit: false, onPress: (_, down, inside) => this.press(slot, down, inside) });
      t.el.dataset.slot = slot;
      t.el.addEventListener('pointerdown', (e) => { this.pullFrom = { slot, y: e.clientY }; });
      t.el.addEventListener('pointermove', (e) => { const P = this.pullFrom; if (P?.slot === slot && e.clientY - P.y > ARC_PRESS.pull) { this.pullFrom = null; this.pulled = slot; this.open(); } });
      this.tiles.set(slot, t);
    }
    return t;
  }

  /** A binding pressed and let go, as a key tapped. */
  tap(control) { if (!control) return; touchTiles.report(this.game, control, true); setTimeout(() => touchTiles.report(this.game, control, false), ARC_PRESS.tap); }
  pickItem(it) {
    this.touched = performance.now() / 1000;
    if (it.id === 'skiff') { const B = this.game.touchUI?.topBar; B?.hold('skiff', true); setTimeout(() => B?.hold('skiff', false), ARC_PRESS.tap); }
    else this.tap(it.id);
    if (!it.pad) this.afterChoice();
  }
  afterChoice() { if (this.setting === 'folded' && this.fold === 'open') setTimeout(() => this.close(), 160); }

  /** A slot's press: a plain slot holds its control while the finger does; PICK, BELT and the stack have their own. */
  press(slot, down, inside) {
    const g = this.game; this.touched = performance.now() / 1000;
    if (this.collapsed) { if (!down && inside) this.collapse(false); return; }
    if (down && this.tiles.get(slot)?.el.dataset.fold === 'flipping') return; // (a press lands only on a tile that has landed: TOUCH-REBUILD.md 7)
    const stack = this.fold === 'folded' && this.setting === 'folded' && slot === this.foldFace && (this.foldSlots?.length || 0) > 1;
    if (slot === 'PICK' || slot === 'BELT' || (stack && slot !== 'F')) return this.heldPress(slot, down, inside, stack);
    if (stack) { // (F as the stack: its art on the lift, so a pull down opens the fold without casting it)
      if (down) return;
      const pulled = this.pulled === slot; this.pulled = null;
      if (inside && !pulled) this.tap(this.control.F);
      return;
    }
    const c = down ? this.control[slot] : this.down.get(slot);
    if (!c) return;
    if (down) this.down.set(slot, c); else this.down.delete(slot);
    touchTiles.report(g, c, down);
  }
  /** PICK and BELT (and the stack wearing PICK's face): a tap the next, a hold the radial. */
  heldPress(slot, down, inside, stack) {
    if (down) { clearTimeout(this.holdT); this.holdT = setTimeout(() => { this.holdT = 0; this.radial(slot); }, CURSOR.long); return; }
    if (!this.holdT) return; // (held: the radial is open, the lift picks nothing)
    clearTimeout(this.holdT); this.holdT = 0;
    if (!inside || this.pulled === slot) { this.pulled = null; return; }
    if (stack) return this.open(); // (no art: the stack's tap opens it)
    const items = slot === 'PICK' ? this.picks : this.belt;
    if (slot === 'PICK' && items.every((p) => p.pad)) return this.radial(slot); // (the Crucibelle's notes: played from the radial)
    const first = slot === 'PICK' ? items[0] : this.beltTap;
    if (!first) return;
    if (first.cycle) this.pickItem({ id: first.cycle[(first.at + 1) % first.cycle.length] }); else this.pickItem(first);
  }
  radial(slot) {
    this.closeRadial?.();
    const items = slot === 'PICK' ? this.picks.flatMap((p) => p.radial || [p]) : this.belt, t = this.tiles.get(slot);
    const sticky = slot === 'PICK' && items.every((p) => p.pad);
    this.closeRadial = openRadial(t?.el, items, { onPick: (it) => this.pickItem(it), sticky, size: TILE.small, from: Math.PI * 0.9, to: Math.PI * 1.35 }); // (left to up-left: straight up from PICK is F's cell, and the arc is to the right)
  }

  open() { if (this.fold === 'open') return; this.fold = 'open'; this.touched = this.flipAt = performance.now() / 1000; this.key = ''; this.say('open', this.foldSlots); }
  close() { if (this.fold === 'folded') return; this.fold = 'folded'; this.closeRadial?.(); this.closeRadial = null; this.key = ''; this.say('folded', this.foldSlots); }
  say(state, tiles) { this.game.events?.emit?.('touch.fold', { state, tiles: [...(tiles || [])], by: 'courier' }); }

  /** What each slot shows and reports now. */
  read(ctx) {
    const g = this.game, use = useLabel(g), tool = ctx === 'tool' ? inHandCtx(g) : null, art = artTile(g);
    const tc = tool ? toolCluster(g, tool) : null, blinks = g.actions?.resolve?.('touch', 'dash')?.id === 'blink.ground';
    const third = tool && ACTION_TILES[tool]?.third && tc?.[2] && tc[2].id !== 'jump' ? tc[2] : null;
    this.picks = ctx === 'tool' ? [...stripOf(g).filter((e) => e.id !== 'art'), third].filter(Boolean) : ctx === 'mech' ? mechPicks(g) : [];
    const pair = beltPairOf(g), drawE = pair.find((e) => e.id === 'tool');
    this.belt = [...pair.filter((e) => e.id !== 'tool'), art].filter(Boolean); this.beltTap = drawE || this.belt.find((e) => e.id === 'skiff') || null;
    if (ctx === 'mech') { this.belt = MECH_BELT; this.beltTap = MECH_BELT[0]; }
    const has = (id) => {
      if (ctx === 'mech') return true; // (every slot of the frame's is always there: mechpilot.js reads them all)
      if (id === 'use') return ctx === 'foot' || !!use; // (on foot A is never empty: USE with a thing in reach, else the kick, Dovina's ruling 2026-11-02)
      if (id === 'parry') return ctx === 'tool' || learned(g, 'kick');
      if (id === 'art') return !!art;
      if (id === 'draw') return !!this.beltTap;
      return true;
    };
    const P = placeOf(g), safe = { right: P.view.w - (P.safe?.r || 0), bottom: P.view.h - (P.safe?.b || 0) };
    let slots = arcOf(ctx, has, safe).filter((s) => s.slot !== 'PICK' || this.picks.length);
    const kicks = ctx === 'foot' && !use; // (nothing to use: A is the kick, V's press, and E (the same press, the parry) stands down so no two tiles are one thing)
    if (kicks) slots = slots.filter((s) => s.slot !== 'E').map((s) => (s.slot === 'A' ? { ...s, action: 'parry' } : s));
    const face = {
      A: ctx === 'tool' ? { glyph: tc?.[0]?.glyph, word: tc?.[0]?.word, corner: tc?.[0]?.corner } : kicks ? { glyph: 'kick', word: 'KICK' } : { label: use }, // (the kick's glyph: ui/icons/touchart.js)
      B: blinks ? { glyph: 'blink', word: 'BLINK' } : { glyph: 'dash', word: null },
      C: { glyph: 'jump', word: null }, D: tc ? { glyph: tc[1]?.glyph, word: tc[1]?.word } : null, E: { glyph: 'parry', word: 'PARRY' },
      F: art ? { glyph: art.glyph, word: String(art.word || '').length <= 6 ? art.word : null, charge: art.charge, dim: art.dim } : null, // (a long art's name would fall under the least type in one cell: its glyph alone)
      G: { glyph: 'crouch', word: 'CROUCH' },
      PICK: this.picks[0] ? { glyph: this.picks[0].glyph ?? 'more', word: this.picks[0].word ?? null, corner: this.picks[0].corner ?? null, tint: this.picks[0].tint ?? null } : null,
      BELT: this.beltTap ? { glyph: this.beltTap.glyph, word: this.beltTap.word, lit: !!this.beltTap.lit } : null,
    };
    if (ctx === 'mech') Object.assign(face, mechFace(g));
    this.control = Object.fromEntries(slots.map((s) => [s.slot, typeof s.action === 'string' ? CONTROL.get(s.action) : null]));
    return { slots, face };
  }

  update(now, on) {
    const g = this.game, setting = this.setting, ctx = on && !windowOpen(g) && !g.touch?.screenTaken?.() && setting !== 'hidden' ? arcContext(g) : null;
    if (ctx !== this.ctx) { this.ctx = ctx; this.key = ''; if (!ctx) this.close(); }
    if (!ctx) { this.hideAll(); return; }
    if (setting === 'folded' && this.fold === 'open' && !this.closeRadial && now - this.touched > ARC_FOLD_TIME.idle && !this.down.size) this.close();
    const { slots, face } = this.read(ctx);
    const folded = setting === 'folded' && this.fold === 'folded', foldSlots = foldOf(ctx).filter((s) => slots.some((x) => x.slot === s));
    this.foldSlots = foldSlots; this.foldFace = foldSlots[0] || null;
    // (the cascade: each tile under the face lands ARC_FOLD_TIME.flip after the one above it, and only a landed tile takes a press)
    const flipK = (slot) => { const i = foldSlots.indexOf(slot); return i <= 0 || folded || setting !== 'folded' ? 1 : Math.min(1, Math.max(0, (now - (this.flipAt || 0)) / ARC_FOLD_TIME.flip - (i - 1))); };
    let show = slots.filter((s) => (!folded || !foldSlots.includes(s.slot) || s.slot === this.foldFace) && flipK(s.slot) > 0);
    if (this.collapsed) show = [{ slot: 'A', rect: slots.find((s) => s.slot === 'A')?.rect || arcRect('A', { right: placeOf(g).view.w, bottom: placeOf(g).view.h }) }];
    const key = `${ctx}|${folded}|${this.collapsed}|${show.length}|${show.map((s) => `${s.slot}:${Math.round(s.rect.x)},${Math.round(s.rect.y)}`).join()}`;
    const want = new Set(show.map((s) => s.slot));
    if (key !== this.key) {
      this.key = key;
      for (const [slot, t] of this.tiles) if (!want.has(slot)) { this.letGo(slot); t.set({ hidden: true }); }
      for (const s of show) { const t = this.tile(s.slot); t.place(s.rect.x, s.rect.y, s.rect.w - TILE.foot, s.rect.w); }
      this.shown = want;
    }
    for (const s of show) {
      const t = this.tile(s.slot), f = this.collapsed ? { glyph: 'fold', word: null } : face[s.slot] || {};
      if (f.label) t.label(f.label.word, f.label.corner); else t.face({ glyph: f.glyph ?? null, word: f.word ?? null, corner: f.corner ?? null, tint: f.tint ?? null });
      const stack = this.collapsed || (folded && s.slot === this.foldFace && foldSlots.length > 1);
      t.el.classList.toggle('arc-stack', stack); // (the stepped rim of the folded column: Calissa's dress, ui/touch/arcdress.js)
      // (for Calissa's dress: data-slot is the slot (A..G, PICK, BELT); data-fold is the fold column's state on its tiles, 'folded' (the
      //  stack), 'flipping' (landing in the cascade) or 'open'; absent on the arc's other tiles)
      const fk = foldSlots.includes(s.slot) ? (stack ? 'folded' : flipK(s.slot) < 1 ? 'flipping' : 'open') : null;
      if (fk) t.el.dataset.fold = fk; else delete t.el.dataset.fold;
      t.set({ hidden: false, lit: t.state.pressed || !!f.lit, dim: !!f.dim, charge: f.charge ?? 0 });
      t.update(now);
    }
  }

  /** A slot taken away while held lets its control go, so no key is left down. */
  letGo(slot) { const c = this.down.get(slot); if (c) { this.down.delete(slot); touchTiles.report(this.game, c, false); } }
  hideAll() { if (!this.shown.size) return; for (const slot of this.shown) { this.letGo(slot); this.tiles.get(slot)?.set({ hidden: true }); } this.shown = new Set(); this.closeRadial?.(); this.closeRadial = null; this.key = ''; }
  relayout() { this.key = ''; }
}

