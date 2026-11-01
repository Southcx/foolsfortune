// ---------------------------------------------------------------------------------------
// TWO DOMAIN RUNGS' WORLD MARKS (Dovina, 2026-11-01: the first relations' looks, DOMAINS.md 17; the rules and the library's effects hers,
// courier/domainarts/run.js `game.domainArtsRun`): what a rung knows about a creature, drawn on the creature. World marks: no words.
//   the Watch's count   over a Figment whose head is down (`run.shown`), a ring of twelve ticks that go out one by one as its head's
//                       time down runs out (`c.vigil.left`, real s), the last three in ember: when the ring is dark it looks up. Hitman's
//                       instinct and the stealth games' alert meters, read as a clock you can move by
//   Shatter's shell     a creature whose stun is past Shatter's line (`run.near`, its `inRange(c)`) wears its glaze shell already
//                       crazed: guan's crackle (the crackle break's own bubble, vfx/caster/bubble.js) round its body, the net opened and
//                       breathing, so the body itself says "one heavy blow breaks this" (Sekiro's deathblow glint, Smash's KO-percent
//                       smoke). The break itself is the crackle break's (vfx/crackbreak.js)
// Both read the runtime's own sets, so they show exactly when its rules say, and go when they let go.
//
// Prior art: Hitman's instinct, Metal Gear Solid's alert countdown, Sekiro's deathblow mark; the house's stun stars (vfx/glyphs.js) for a
// mark that sits over a head, and the crackle break's bubble (one program, already warmed at boot).
//
//   game.domainArtMarks = new DomainArtMarks(game)   (boot/rooms.js)   .update(raw) (boot/frame.js)   DOMAIN_ART_MARKS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Bubble } from './caster/bubble.js';

export const DOMAIN_ART_MARKS = {
  watch: { ticks: 12, r: 0.3, up: 1.75, len: 0.12, w: 0.05, col: 0x9fd8ff, ember: 0xff8a3a, dark: 0x1a2430, max: 6 },
  shatter: { pattern: 'crackle', tint: 0x6e5c48, rim: 0xffd36a, film: 0.3, k: 0.95, crack: 0.75, breathe: 0.18, rate: 5, max: 3 },
};
const W = DOMAIN_ART_MARKS.watch, S = DOMAIN_ART_MARKS.shatter;
const _v = new THREE.Vector3();

export class DomainArtMarks {
  constructor(game) {
    this.game = game; this.t = 0;
    this.watch = new Map(); // (creature -> { group, ticks, total })
    this.shells = new Map(); // (creature -> Bubble)
    this.freeShells = []; this.freeWatch = [];
    this.mats = { lit: new THREE.MeshBasicMaterial({ color: W.col, depthTest: false, transparent: true }), ember: new THREE.MeshBasicMaterial({ color: W.ember, depthTest: false, transparent: true }),
      dark: new THREE.MeshBasicMaterial({ color: W.dark, depthTest: false, transparent: true, opacity: 0.5 }) };
    this.tickGeo = new THREE.PlaneGeometry(W.w, W.len);
  }

  watchMark() {
    const old = this.freeWatch.pop(); if (old) { old.group.visible = true; return old; }
    const group = new THREE.Group(); group.name = 'domain.watch'; group.renderOrder = 30;
    const ticks = [];
    for (let i = 0; i < W.ticks; i++) {
      const a = Math.PI / 2 - (i / W.ticks) * Math.PI * 2, m = new THREE.Mesh(this.tickGeo, this.mats.lit);
      m.position.set(Math.cos(a) * W.r, Math.sin(a) * W.r, 0); m.rotation.z = a - Math.PI / 2; m.renderOrder = 30; m.frustumCulled = false;
      group.add(m); ticks.push(m);
    }
    this.game.scene?.add(group);
    return { group, ticks, total: 0 };
  }

  update(raw = 1 / 60) {
    const g = this.game, run = g.domainArtsRun; this.t += raw;
    // the Watch: a ring of ticks counting its head's time down
    const shown = run?.shown;
    for (const [c, M] of this.watch) if (!shown?.has(c) || !c.alive) { M.group.visible = false; this.freeWatch.push(M); this.watch.delete(c); }
    if (shown) {
      let n = 0;
      for (const c of shown.keys()) {
        if (n++ >= W.max || !c?.alive || !c.pos) continue;
        let M = this.watch.get(c); if (!M) { M = this.watchMark(); M.total = 0; this.watch.set(c, M); }
        const left = Math.max(0, c.vigil?.left ?? 0); M.total = Math.max(M.total, left); // (its longest seen: the ring's full)
        const on = M.total > 0 ? Math.ceil((left / M.total) * W.ticks) : 0;
        M.ticks.forEach((m, i) => { m.material = i >= on ? this.mats.dark : on <= 3 ? this.mats.ember : this.mats.lit; });
        M.group.position.set(c.pos.x, c.pos.y + (c.height ?? W.up) + 0.25, c.pos.z);
        if (g.camera) M.group.quaternion.copy(g.camera.quaternion); // (faced to the view)
      }
    }
    // Shatter: the glaze shell crazed round a body one heavy blow would break
    const near = run?.near;
    for (const [c, B] of this.shells) if (!near?.has(c) || !c.alive) { B.object.visible = false; this.freeShells.push(B); this.shells.delete(c); }
    if (near) {
      let n = 0;
      for (const c of near.keys()) {
        if (n++ >= S.max || !c?.alive || !c.pos) continue;
        let B = this.shells.get(c);
        if (!B) {
          B = this.freeShells.pop() || new Bubble({ shape: 'sphere', radius: 1, cell: 0.6, pattern: S.pattern, tint: S.tint, rim: S.rim, film: S.film, k: 0 });
          if (!B.object.parent) g.scene?.add(B.object);
          B.object.visible = true; this.shells.set(c, B);
        }
        const h = c.height ?? 1, r = Math.max((c.radius ?? 0.5) * 1.5, h * 0.62), breathe = 1 + S.breathe * 0.5 * (1 + Math.sin(this.t * S.rate));
        B.set({ pos: _v.set(c.pos.x, c.pos.y + h * 0.5, c.pos.z), radius: r * 0.92, k: S.k * breathe, crack: S.crack * breathe });
        B.update(raw);
      }
    }
  }

  dispose() {
    for (const M of [...this.watch.values(), ...this.freeWatch]) M.group.removeFromParent();
    for (const B of [...this.shells.values(), ...this.freeShells]) { B.object.removeFromParent(); B.dispose?.(); }
    this.tickGeo.dispose(); for (const m of Object.values(this.mats)) m.dispose();
  }
}
