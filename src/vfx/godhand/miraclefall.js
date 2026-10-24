// ---------------------------------------------------------------------------------------
// A MIRACLE'S FALL (godhand/miracles.js; GODHAND.md sections 4 and 5): a feeling's weather falling over the circle the hand called it
// down on, at its heavy look (vfx/weather.js `LOOK[aspect].heavy`, `heavyOf`; FEELINGS-AWAKENING.md section 3). Nothing of the weather
// is copied: each column is a set of the weather's own falling pieces (`makeRain`, `makeMotes`: the same programs, nothing compiled),
// fed each frame by `fallsOf(aspect, k)` as the awakening's flood is (vfx/awakeninglook.js), but standing over the miracle's centre
// with the miracle's radius as its column (`uBox`), so it falls on its circle and thins out past its rim; its own small overhead map
// (vfx/overhead.js) cast over the circle, so the hail lands, the miasma lies in its hollows, and nothing falls through a roof.
//   A MIRACLE   the column at k 0.9 (a totem's held one at 0.7), in over 0.6 real s and out over the last 1.2, on its circle in the
//               feeling's colour (vfx/godhand/marks.js 'miracle'). Storm's bolts are the caster shells' lightning (vfx/caster/lightning.js,
//               warmed at boot) from 30 m up to where each lands, held a third of a second.
//   AN EPIC     grander: the column at the heavy look in full and denser, a second ring outside the first in the epic's domain colour
//               (its seven nodes the feelings'), and, where the hand is in the open and no awakening is flooding, the sky itself takes
//               the feeling while it lasts (`weatherLook.surge`, the awakening's own lever).
// Four columns at most stand at once (the newest miracles have them); what falls is held clear of the middle of no one's screen (the
// hand looks down on it: the pieces' own fades are enough).
//
// Prior art: Black & White's miracles (the weather over one place, its edge visible from above), Populous's and From Dust's local
// rain, Okami's brush gods (a weather that floods one place in its god's colour), and the house's awakening flood, whose way of
// borrowing the weather this is.
//
//   const F = new MiracleFall(game)   F.update(dt, camera, miracles)   (attaches to each live miracle `m`: m.fall)   F.bolt(at, colour)
//   F.circle(m, domainColour) -> the miracle's ring (miracles.js m.ring)   F.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Overhead } from '../overhead.js';
import { LOOK, COLOR, fallsOf, makeRain, makeMotes, rainTo, motesTo, mistTo } from '../weather.js';
import { Lightning } from '../caster/lightning.js';
import { circleMark, disposeTree } from './marks.js';

export const FALL = {
  columns: 4, rain: 3600, motes: 2800, lenses: 420, // (the pools: one set a column)
  k: { miracle: 0.9, totem: 0.7, epic: 1 }, density: { miracle: 3, epic: 4 }, // (how heavy; how much denser than the sky's own column for its volume)
  rise: 0.6, ebb: 1.2, // (real seconds in and out)
  bolt: { hold: 0.33, up: 30 }, // (Storm's bolt: real seconds held; how high it falls from)
};
const smooth = THREE.MathUtils.smoothstep;
const SKY_VOL = 52 * 52 * 30; // (the sky's own column round the eye: vfx/weather.js R 26, H 30)

export class MiracleFall {
  constructor(game) { this.game = game; this.free = []; this.used = new Set(); this.made = 0; this.bolts = []; this.t = 0; this.surging = null; }

  /** The miracle's ring: its feeling's circle, and an epic's outer ring in its domain's colour. */
  circle(m, domainColour) {
    const at = new THREE.Vector3(m.x, m.y, m.z), ring = circleMark(this.game, at, m.r, COLOR[m.feeling] ?? 0xffffff, { style: 'miracle', opacity: 0.6 });
    if (m.kind === 'epic' && domainColour != null) { const o = circleMark(this.game, at, m.r * 1.12, domainColour, { opacity: 0.7 }); o.position.sub(ring.position); ring.add(o); }
    ring.userData.dispose = () => disposeTree(ring);
    return ring;
  }

  /** A column of falling pieces (pooled: the weather's pieces are big buffers). */
  take() {
    if (this.free.length) return this.free.pop();
    if (this.made >= FALL.columns) return null;
    this.made++;
    const group = new THREE.Group(); group.name = 'miracle-fall'; group.userData.zoneFree = true;
    const C = { group, over: null, rain: null, motes: null, mist: null };
    C.over = new Overhead(this.game, { n: 24, cell: 1, from: 40 });
    C.rain = makeRain(FALL.rain, C.over.u); C.motes = makeMotes(FALL.motes, C.over.u); C.mist = makeMotes(FALL.lenses, C.over.u);
    C.mist.u.uMode.value = 3; C.mist.u.uNoise.value = 1.2;
    group.add(C.rain.obj, C.motes.obj, C.mist.obj);
    this.game.scene.add(group);
    return C;
  }
  give(C) { C.group.visible = false; this.free.push(C); }

  /** Each frame: a column for each live miracle that has none (the newest first), fed by its weather. */
  update(dt, camera, live = []) {
    this.t += dt;
    for (let i = live.length - 1; i >= 0; i--) { const m = live[i]; if (m.fall === undefined) m.fall = this.attach(m); }
    for (const C of this.used) if (!live.includes(C.m)) { C.m.fall = null; C.m = null; this.used.delete(C); this.give(C); }
    let epic = null;
    for (const m of live) { if (m.fall) this.feed(m, m.fall, camera); if (m.kind === 'epic' && (!epic || m.t < epic.t)) epic = m; }
    this.surge(epic);
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const B = this.bolts[i]; B.t += dt;
      B.z.set({ k: Math.max(0, 1 - B.t / FALL.bolt.hold) * (B.t < 0.05 ? 1.4 : 1) }); B.z.update(dt);
      if (B.t >= FALL.bolt.hold) { B.z.dispose(); this.bolts.splice(i, 1); }
    }
  }
  columns() { return [...this.free, ...this.used]; }

  attach(m) {
    const C = this.take(); if (!C) return null;
    C.m = m; this.used.add(C);
    const r = m.r, H = THREE.MathUtils.clamp(r * 1.2, 10, 30);
    const cell = Math.max(1, (2 * r) / 22);
    if (C.over.cell !== cell) { C.over.cell = cell; C.over.u.uOccK.value.x = cell; C.over.data.fill(1e9); } // (the map's cells sized to the circle: the old cells forgotten)
    C.centre = new THREE.Vector3(m.x, m.y + H * 0.45, m.z);
    C.over.fill(new THREE.Vector3(m.x, m.y, m.z)); // (the ground under the whole circle at once)
    C.box = [r, H, H * 0.45 + 1.5];
    for (const P of [C.rain, C.motes, C.mist]) { P.u.uBox.value.fromArray(C.box); P.u.uClear.value.set(0, 0); }
    C.mist.u.uBox.value.x = r * 1.05;
    C.vol = (2 * r) * (2 * r) * H;
    C.group.visible = true;
    return C;
  }

  feed(m, C, camera) {
    const g = this.game, a = m.feeling, L = LOOK[a]; if (!L) return;
    const env = Math.min(smooth(m.t, 0, FALL.rise), 1 - smooth(m.t, m.dur - FALL.ebb, m.dur));
    const k = (m.kind === 'epic' ? FALL.k.epic : m.totem ? FALL.k.totem : FALL.k.miracle) * env;
    const sky = g.weather?.sky?.(), light = sky?.light ?? 0.6, dayK = smooth(light, 0.3, 0.6), wind = g.dunes?.wind?.dir || null;
    const f = fallsOf(a, Math.max(0.001, k), dayK, wind), share = THREE.MathUtils.clamp((C.vol / SKY_VOL) * (m.kind === 'epic' ? FALL.density.epic : FALL.density.miracle), 0.15, 1);
    const open = g.weather?.here?.(C.centre)?.exposure === 'open', lit = open ? 0.25 + 0.75 * smooth(light, 0.1, 0.6) : 0.85;
    const R = f.rain, M = f.motes, I = f.mist, col = _col;
    if (R) { R.n *= share; R.lowK = 1; R.alpha *= env; rainTo(C.rain, R, col.copy(R.colour || L.colour).multiplyScalar((L.tone ?? 1) * (R.lit ? lit : 1))); }
    if (M) { M.n *= share; M.lowK = 1; M.alpha *= env; motesTo(C.motes, M, col.copy(M.colour || L.colour).multiplyScalar((M.raw ? 1 : L.tone ?? 1) * (M.lit ? lit : 1))); }
    if (I) { I.n *= Math.max(share, 0.4); I.alpha *= env; mistTo(C.mist, I, col.copy(I.colour).multiplyScalar(lit), wind); }
    C.rain.obj.visible = !!R && R.alpha > 0.005; C.motes.obj.visible = !!M && M.alpha > 0.005; C.mist.obj.visible = !!I && I.alpha > 0.005;
    C.over.update(C.centre, 12); // (kept fresh as the matter under it moves)
    const px = camera ? 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) : 480;
    for (const P of [C.rain, C.motes, C.mist]) { P.u.uT.value = this.t; P.u.uCam.value.copy(C.centre); if (P.u.uPx) P.u.uPx.value = px; }
  }

  /** An epic's sky: the newest epic's feeling raised over the whole sky while it lasts, where the hand is in the open. */
  surge(m) {
    const g = this.game, W = g.weatherLook; if (!W) return;
    if (g.awakeningLook?.on) { this.surging = null; return; } // (an awakening's flood has the lever)
    if (!m) { if (this.surging) { W.surge(null); this.surging = null; } return; }
    const env = Math.min(smooth(m.t, 0, 1.5), 1 - smooth(m.t, m.dur - 2, m.dur));
    W.surge(m.feeling, env); this.surging = m;
  }

  /** Storm's bolt: lightning from high over where it lands, held a beat. */
  bolt(at, colour = 0xfff0d8) {
    const from = new THREE.Vector3(at.x + (Math.random() - 0.5) * 6, at.y + FALL.bolt.up, at.z + (Math.random() - 0.5) * 6);
    const z = new Lightning({ from, to: at, levels: 6, jag: 0.22, branches: 4, width: 0.22, minPx: 1.4, glow: 5, tint: colour, core: 0xffffff, rate: 18 });
    this.game.scene.add(z.object);
    this.bolts.push({ z, t: 0 });
  }

  dispose() {
    if (this.surging) this.game.weatherLook?.surge(null);
    for (const B of this.bolts) B.z.dispose();
    for (const C of this.columns()) { C.over.dispose(); C.group.parent?.remove(C.group); for (const P of [C.rain, C.motes, C.mist]) { P.obj.geometry.dispose(); P.obj.material.dispose(); } }
  }
}
const _col = new THREE.Color();
