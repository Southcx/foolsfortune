// ---------------------------------------------------------------------------------------
// THE CLASS ARTS' LOOKS: Petra's class arts in play (courier/classarts/body.js; Dovina's rules, progress/classarts.js) drawn on the body
// and the ground round it. Placeholders made real a wave at a time; wave 1, the Fool and the four Knights:
//   art.use (any action)        a ring thrown out along the ground from the feet in the film
//   art.fire (a reaction)       a tighter ring in gold (Steadfast's in the ward's pale; Gallant's parry, Momentum's blow, Edge, Steadfast's ward,
//                               Running on Empty)
//   art.end                     the held look let go (Bulwark's brace, Running on Empty)
//   held marks on the body      Bulwark braced: a shell of hard light round them, its rim breathing; Momentum armed: an ember band
//                               turning at the hips; Steadfast armed: a gold ring set in the ground at the feet; Running on Empty: the
//                               ring in the film round the feet, slow
// Onrush and Riposte Rush keep the blink's afterimage (they run its body); Water Walk's wake is Petra's (courier/classarts/waterwalk.js).
// Looks only: every mark reads the runtime's own state each frame, never keeps one; no words (world marks: CLAUDE.md, Feedback).
//
// Prior art: Final Fantasy Tactics' ability flash (a ring and a glow at the caster for a reaction's trigger), Dark Souls' buff
// glows (a weapon's band of light while the next blow is armed), Monster Hunter's Mantle and guard shells (a body wrapped while braced).
//
//   game.classArtLooks = new ClassArtLooks(game)   (boot/pneuka.js, beside the blob shadow)   .update(dt) each frame (boot/frame.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const ART_LOOK = {
  film: 0x9ad8ff, gold: 0xffd36a, ember: 0xff7a2a, ward: 0x7fb8e8,
  ring: { out: 2.6, life: 0.5 },   // a thrown ring's reach (m) and life (real s)
  shell: { r: 0.62, h: 1.9 },      // Bulwark's shell round the body (m)
};

// (normal blending: an additive mark vanished on the Dunes' bright sand, the phone's shot)
const ringMat = (hex, opacity) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });

export class ClassArtLooks {
  constructor(game) {
    this.game = game; this.flashes = []; this.t = 0;
    const root = (this.root = new THREE.Group()); root.name = 'classArtLooks';
    const ringGeo = new THREE.RingGeometry(0.86, 1, 48).rotateX(-Math.PI / 2);
    this.ringGeo = ringGeo;
    this.steady = new THREE.Mesh(ringGeo, ringMat(ART_LOOK.gold, 0.8)); this.steady.scale.setScalar(0.55);
    this.empty = new THREE.Mesh(ringGeo, ringMat(ART_LOOK.film, 0.55)); this.empty.scale.setScalar(0.8);
    this.band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 6, 40).rotateX(Math.PI / 2), ringMat(ART_LOOK.ember, 0.9)); this.band.position.y = 0.95;
    const S = ART_LOOK.shell;
    this.shell = new THREE.Mesh(new THREE.CylinderGeometry(S.r, S.r * 1.08, S.h, 24, 1, true), ringMat(ART_LOOK.ward, 0.3)); this.shell.position.y = S.h / 2;
    for (const y of [0.04, S.h - 0.04]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(S.r * (y < 1 ? 1.08 : 1), 0.03, 6, 40).rotateX(Math.PI / 2), ringMat(ART_LOOK.gold, 0.9)); rim.position.y = y - S.h / 2; this.shell.add(rim); }
    this.marks = [this.steady, this.empty, this.band, this.shell];
    for (const m of this.marks) { m.visible = false; m.renderOrder = 3; root.add(m); }
    game.scene?.add(root);
    const E = game.events;
    E?.on?.('art.use', (e) => { if (e.by === 'courier') this.throwRing(ART_LOOK.film, ART_LOOK.ring.out); });
    E?.on?.('art.fire', (e) => { if (e.by === 'courier') this.throwRing(e.art === 'steadfast' ? ART_LOOK.ward : ART_LOOK.gold, ART_LOOK.ring.out * 0.6); });
    E?.on?.('vessel.ward', () => this.throwRing(ART_LOOK.ward, 1.2, 1.0));
  }

  /** A ring thrown out along the ground from the feet (or at `y` up the body), fading over its life. */
  throwRing(hex, out, y = 0.03) {
    const m = new THREE.Mesh(this.ringGeo, ringMat(hex, 0.9)); m.renderOrder = 3; this.root.add(m);
    this.flashes.push({ m, out, age: 0, y });
  }

  update(dt) {
    dt = Math.min(0.1, dt || 0); this.t += dt;
    const g = this.game, P = g.player, run = g.classArtsRun;
    const shown = !!P && !g.god?.controlling && !g.realm?.active && !g.duel?.active;
    if (!shown) { for (const m of this.marks) m.visible = false; } else {
      this.root.position.copy(P.renderPos);
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
      this.shell.visible = !!run && run.now < run.braceUntil;
      if (this.shell.visible) { this.shell.material.opacity = 0.22 + 0.12 * pulse; this.shell.rotation.y += dt * 0.6; }
      this.band.visible = !!run?.momentum; if (this.band.visible) { this.band.rotation.y += dt * 4; this.band.material.opacity = 0.6 + 0.35 * pulse; }
      this.steady.visible = !!run?.steady; if (this.steady.visible) this.steady.material.opacity = 0.5 + 0.35 * pulse;
      this.empty.visible = !!run && run.freeUntil >= 0 && run.now < run.freeUntil; if (this.empty.visible) this.empty.rotation.y += dt * 0.8;
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]; f.age += dt; const k = f.age / ART_LOOK.ring.life;
      if (k >= 1 || !shown) { this.root.remove(f.m); f.m.material.dispose(); this.flashes.splice(i, 1); continue; }
      const e = 1 - (1 - k) * (1 - k);
      f.m.scale.setScalar(0.2 + f.out * e); f.m.position.y = f.y; f.m.material.opacity = 0.9 * (1 - k);
    }
  }
}
