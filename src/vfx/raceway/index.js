// ---------------------------------------------------------------------------------------
// THE RACEWAY'S LIVING DRESSING (the owner, 2026-10-24: "more environment features ... build, build, build"): the park made a race
// day, looks only (no collider, no rule, nothing of the layout changed: world/raceway/ is read, never written).
//   - the spectators (spectators.js): clapperjars on the banks at the starts and the big jumps' landings, cheering as you pass or land a trick
//   - the banners (banners.js): feather banners in the seat colours along the start straights and by the gates, flying in the course wind
//   - the Raceway lanterns (lanterns.js): lit along the track at dusk and through the night, a few of them real lamps from the budget
//   - the race's fireworks (fireworks.js): over the start arch on a race won
// Laid from the park's data (raceway.tracks: their lines, gates and frames; GAPS; the hub) the first frame the Raceway is active, and
// kept (the ground is lent and given back, raceway.onRelease; this dressing is small and stays, as the kit does). Everything stands in
// one group in the Raceway's zone (render/zones.js), hidden with it, and moves only while the camera is near.
//
// Prior art: each part's header; the house's way of dressing the park after it is laid (vfx/racewayprops.js).
//
//   game.racewayDress = new RacewayDress(game)   (main.js)   .update(dt)   .prewarm() -> undo (the boot's compile: one of each draw, parked)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RacewaySpectators } from './spectators.js';
import { RacewayBanners } from './banners.js';
import { RacewayLanterns, Poles } from './lanterns.js';
import { RaceFireworks } from './fireworks.js';
import { lightAt } from '../../progress/weather.js';

export class RacewayDress {
  constructor(game) {
    this.game = game; this.readT = 0; this.light = 1;
    this.group = new THREE.Group(); this.group.name = 'raceway-dress'; this.group.userData.zone = 'raceway';
    game.scene.add(this.group);
    this.poles = new Poles(this.group);
    this.spectators = new RacewaySpectators(game, this.group);
    this.banners = new RacewayBanners(game, this.group, this.poles);
    this.lanterns = new RacewayLanterns(game, this.group, this.poles);
    this.fireworks = new RaceFireworks(game);
  }

  /** The materials drawn once for the boot's compile: a cube of each, parked 50 m down (the programs are the clay chips', but each
   *  material is its own and must be linked before play). */
  prewarm() {
    const mats = [...this.spectators.mats, this.spectators.lidMat, this.spectators.eyeMat, this.spectators.armMat, ...this.banners.mats, ...this.lanterns.mats, this.lanterns.capMat, this.poles.mat];
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1), park = mats.map((m) => { const o = new THREE.InstancedMesh(geo, m, 1); o.setMatrixAt(0, new THREE.Matrix4()); o.position.set(0, -50, 0); o.userData.zoneFree = true; o.frustumCulled = false; this.game.scene.add(o); return o; });
    return () => { for (const o of park) this.game.scene.remove(o); geo.dispose(); };
  }

  update(dt) {
    const R = this.game.raceway;
    this.fireworks.update(dt, R);
    if (!R?.active) { this.group.visible = false; return; }
    this.group.visible = true;
    if ((this.readT -= dt) <= 0) { this.readT = 0.5; this.light = lightAt(); }
    const first = !this.spectators.built;
    this.spectators.update(dt, R); this.banners.update(dt, R); this.lanterns.update(dt, R, { light: this.light });
    if (first) this.poles.finish();
  }
}
