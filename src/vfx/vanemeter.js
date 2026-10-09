// ---------------------------------------------------------------------------------------
// THE DREAMVANE'S VANE: the weather read off the crook itself (the owner, 2026-10-06; docs/plans/OVERLAY.md). The mood where the Courier
// stands turns the needle on the crook's head to its petal (the feelings in their shown order round the rose), wears its colour (an
// agate: the head the first feeling, the tail the second), and its streamers stream out longer the stronger it is, and hang slack in
// calm. Reading the sky (the dowse raised) swings the needle through the coming blocks of the forecast, one after another in their
// colours, and back. A weathervane on a weather tool: the reading is a thing turning on the thing, never a gauge.
//
// Seven petals since Gall and Fury (docs/plans/GALL-AND-FURY.md), each its feeling's colour AND its own shape (`PETAL_SHAPE`, its damage
// type's motif in miniature), so the rose reads without colour; the needle's angles are the petals' own (i / n of a turn), calm between
// the last and the first.
//
// Prior art: the weathervane and the wind sock (the strength in a streamer's length), the barometer's needle swinging toward Stormy or
// Fair, and Zelda's Wind Waker baton (the wind's direction shown on the thing you hold).
//
//   game.vaneMeter = new VaneMeter(game)   .update(rawDt, model (DreamvaneModel), { dowse })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DISPLAY_ORDER, COLOR } from '../progress/weather.js';

const _h = new THREE.Color(), _t = new THREE.Color(), CALM = new THREE.Color(0x9a8a70);
/** Each feeling's petal shape (never colour alone): Impact's square, Ego's hexagon, Influence's flame, Fury's spark, Gall's drip, the
 *  long rain's needle, Delirium's bubble. */
export const PETAL_SHAPE = { mirth: 'cube', wonder: 'hex', desire: 'cone', fury: 'star', gall: 'drip', grief: 'needle', dread: 'ring' };
const PETALS = DISPLAY_ORDER.map((a) => ({ hex: COLOR[a], shape: PETAL_SHAPE[a] || 'cone' }));

export class VaneMeter {
  constructor(game) { this.game = game; this.angle = 0; this.av = 0; this.str = 0; this.t = 0; this.sweep = -1; this.blocks = []; }

  /** Where the needle points for a feeling (its petal), and the calm's own place (between the first petal and the last). */
  angleOf(aspect) { const n = DISPLAY_ORDER.length, i = DISPLAY_ORDER.indexOf(aspect); return i < 0 ? -Math.PI / n : (i / n) * Math.PI * 2; }

  update(raw, model, { dowse = false } = {}) {
    if (!model?.setVane) return;
    const W = this.game.weather, P = this.game.player; if (!W || !P) return;
    this.t += raw;
    let w = W.here(P.pos);
    // reading the sky: the needle through the forecast's blocks, 0.7 real s each, then back to now
    if (dowse && this.sweep < 0) { this.blocks = W.forecast?.() || []; this.sweep = 0; }
    if (!dowse) this.sweep = -1;
    if (this.sweep >= 0) { this.sweep += raw; const k = Math.floor(this.sweep / 0.7); if (k < this.blocks.length) w = this.blocks[k]; else if (k > this.blocks.length + 2) this.sweep = 0; }
    const target = w.aspect ? this.angleOf(w.aspect) : this.angleOf(null);
    // a spring toward it, the short way round (it swings past and settles: a needle, not a pointer)
    let d = target - this.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.av += (d * 40 - this.av * 6) * raw; this.angle += this.av * raw;
    this.str += ((w.aspect ? w.strength : 0) - this.str) * (1 - Math.exp(-raw * 2));
    _h.setHex(w.aspect ? COLOR[w.aspect] : CALM.getHex()); _t.setHex(w.second ? COLOR[w.second] : (w.aspect ? COLOR[w.aspect] : CALM.getHex()));
    model.setVane(this.angle, _h, _t, this.str, this.t, model.petals?.length ? null : PETALS); // (laid once, and again on a model that has none: a new model gets its rose)
  }
}
