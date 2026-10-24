// ---------------------------------------------------------------------------------------
// THE DUNES' LIVING DRESSING (the owner, 2026-10-24: "more environment features ... build, build, build"): the open sand made to live
// by the hour and the weather, looks only (no collider, no rule, nothing of the layout changed: world/dunes/ is read, never written).
//   - the dust devils (dustdevils.js): on a hot afternoon and in Desire's wind, spun by the gusts
//   - the Dunes' mirage (mirage.js): the far flats' strip of inverted sky at noon
//   - the geodes (geodes.js): Lachrymite geodes split open round the crystals, glowing in the feeling in the air at night
//   - the fulgurites (fulgurites.js): glass of fused sand where Fury's lightning fell, glinting
// Each part reads the same few numbers, worked out here twice a real second (no per-frame allocation): the hour's light (lightAt) and
// game hour, the weather's drawn amounts (game.weatherLook.eff: what the sky shows here, eased), and whether the camera is on the
// Dunes' open sand. Everything stands in one group in the Dunes' zone (render/zones.js), hidden with it.
// WIND RIPPLES THAT DRIFT: not done here. The sand's ripples are in the Dunes' own shader (world/dunes/dunes.js buildTerrain, its
// normal_fragment_maps patch): making them creep downwind is one term in that line (the phase `along * 2.2` less a slow uTime, which the
// shader already has), Petra's and Dovina's file, so it is asked of them, not edited from here (a second material patch from vfx/ would be
// two owners of one shader).
//
// Prior art: each part's header; the house's way of hanging a family of looks off one reader (vfx/weatherfx/index.js).
//
//   game.dunesDress = new DunesDress(game)   (main.js, once the crystals are laid)   .update(dt)   .prewarm() -> undo (the boot's compile)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DustDevils } from './dustdevils.js';
import { DunesMirage } from './mirage.js';
import { Geodes } from './geodes.js';
import { Fulgurites } from './fulgurites.js';
import { lightAt, clockAt, COLOR } from '../../progress/weather.js';

const ASPECTS = ['mirth', 'wonder', 'desire', 'grief', 'dread', 'gall', 'fury'];
/** What puts the dry heat out (the rain, the hail, the pall, the miasma): their summed amount, each at this share. */
const WET = { mirth: 0.8, grief: 1, fury: 1, dread: 0.9, gall: 0.6, wonder: 0.2, desire: 0 };
/** When: the hot afternoon (game hours, eased in and out over `ease`), noon's light for the mirage (lightAt), the feeling a geode
 *  takes (its amount at least `feel`), Lachrymite's own violet when fair. */
const WHEN = { afternoon: [13, 18.5], ease: 1, noon: [0.86, 0.97], feel: 0.15, violet: 0x7a52d8 };
const smooth = THREE.MathUtils.smoothstep;

export class DunesDress {
  constructor(game) {
    this.game = game; this.t = 0; this.readT = 0;
    this.group = new THREE.Group(); this.group.name = 'dunes-dress'; this.group.userData.zone = 'dunes';
    game.scene.add(this.group);
    this.devils = new DustDevils(game, this.group);
    this.mirage = new DunesMirage(game, this.group);
    this.geodes = new Geodes(game, this.group);
    this.fulgurites = new Fulgurites(game, this.group);
    this.s = { light: 1, hour: 12, want: 0, desire: 0, fury: 0, mirage: 0, night: 0, colour: new THREE.Color(WHEN.violet), sky: new THREE.Color(0xcfe6ea) };
  }

  prewarm() { const u = [this.devils.prewarm(), this.mirage.prewarm(), this.geodes.prewarm(), this.fulgurites.prewarm()]; return () => u.forEach((f) => f()); }

  /** The hour and the weather, read twice a real second. */
  read() {
    const s = this.s, eff = this.game.weatherLook?.eff || {}, c = clockAt();
    s.light = lightAt(); s.hour = c.hour + c.minute / 60;
    let wet = 0, best = null, bk = WHEN.feel;
    for (const a of ASPECTS) { const k = eff[a] || 0; wet += k * WET[a]; if (k > bk) { bk = k; best = a; } }
    wet = Math.min(1, wet); s.desire = eff.desire || 0; s.fury = eff.fury || 0;
    const H = WHEN.afternoon, aft = smooth(s.hour, H[0], H[0] + WHEN.ease) * (1 - smooth(s.hour, H[1] - WHEN.ease, H[1]));
    s.want = Math.max(aft * (1 - wet) * smooth(s.light, 0.4, 0.7), s.desire);
    s.mirage = smooth(s.light, WHEN.noon[0], WHEN.noon[1]) * (1 - wet);
    s.night = 1 - smooth(s.light, 0.14, 0.5);
    s.colour.set(best ? COLOR[best] : WHEN.violet);
  }

  update(dt) {
    const g = this.game, D = g.dunes;
    if (!D || D.mix < 0.01) { if (this.group.visible) { this.group.visible = false; this.devils.clear(); } return; }
    this.group.visible = true;
    this.t += dt;
    if ((this.readT -= dt) <= 0) { this.readT = 0.5; this.read(); }
    const s = this.s, sand = !!D.active && !g.well?.active;
    this.devils.update(dt, { want: s.want, desire: s.desire, light: s.light, sand });
    this.mirage.update(dt, { k: sand ? s.mirage : 0, sky: s.sky, haze: g.scene.fog?.color });
    this.geodes.update(dt, { night: s.night, colour: s.colour });
    this.fulgurites.update(dt, { day: 1 - s.night, fury: s.fury, here: sand });
  }
}
