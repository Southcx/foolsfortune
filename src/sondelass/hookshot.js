// ---------------------------------------------------------------------------------------
// THE HOOK: the Sondelass's grapnel. Fired along the camera's aim; it flies at speed, and what it bites decides what happens:
// solid ground draws the Courier to it (moves/zip.js), something loose (a pot, a crate, a clapperjar) is yanked toward her, and
// nothing is retracted. The line is drawn from the tip to the grapnel. It costs a little Lachryma to throw.
//
// Prior art: Zelda's Hookshot (a fast straight-flying hook, a target that decides the outcome, being pulled in at a constant
// speed) and Just Cause / Batman's grapple (the pull ends in a hop, the line can be cut by jumping). Kept small on purpose:
// there is no swing, because the rod already asks for the line's physics to be the interesting one.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../physics.js';
import { sfx } from '../audio.js';
import { PALETTE } from '../config.js';

const RANGE = 38, SPEED = 85, COST = 2;
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3();

export class Hookshot {
  constructor(tool) {
    this.tool = tool;
    this.flying = false;
    this.aimBlend = 0;
    this.aimDir = new THREE.Vector3(0, 0, 1);
    this.cool = 0;
    const g = tool.game;
    this.grap = tool.model.hook.clone(true);
    this.grap.visible = false;
    g.scene.add(this.grap);
    this.lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: PALETTE.cream }));
    this.line.frustumCulled = false; this.line.visible = false;
    g.scene.add(this.line);
    this.pos = new THREE.Vector3(); this.target = new THREE.Vector3(); this.result = null;
  }
  get game() { return this.tool.game; }
  get busy() { return this.flying; }
  get aiming() { return this.aimBlend > 0.05 || this.flying; }
  cancel() { this.flying = false; this.grap.visible = false; this.line.visible = false; this.aimBlend = 0; }

  update(dt, inp) {
    const P = this.tool.P, g = this.game;
    this.cool -= dt;
    P.lookDir(_d);
    // RMB: hold the arm out on the aim
    const aim = inp.isDown('Mouse2') || this.flying;
    this.aimBlend = THREE.MathUtils.damp(this.aimBlend, aim ? 1 : 0, 14, dt);
    this.aimDir.copy(_d);
    if (aim) P.bodyYaw = P.yaw;
    if (inp.wasPressed('Mouse0') && !this.flying && this.cool <= 0 && P.techs.active?.id !== 'zip') this.fire();
  }

  fire() {
    const g = this.game, P = this.tool.P;
    if (!g.lachryma.spend(COST, 'hook')) return;
    this.tool.model.group.updateMatrixWorld(true);
    this.tool.tip(this.pos);
    const cam = g.camera;
    cam.getWorldPosition(_o);
    P.lookDir(_d);
    const hit = g.physics.raycast(_o, _d, RANGE, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    this.result = null;
    if (hit) {
      const ent = hit.entity;
      const body = hit.collider.parent();
      const loose = ent && (ent.type === 'breakable' || ent.type === 'clapper') && ent.type !== 'slice';
      const prop = !ent && body?.isDynamic();
      this.result = { point: hit.point.clone(), normal: hit.normal.clone(), ent, kind: loose || prop ? 'pull' : 'anchor', body };
      this.target.copy(hit.point);
    } else this.target.copy(_o).addScaledVector(_d, RANGE);
    this.flying = true; this.phase = 'out';
    this.grap.visible = true; this.line.visible = true;
    sfx.hookFire();
    g.events?.emit('hook.fire', { hit: !!hit, kind: this.result?.kind || 'miss' });
  }

  tickFlight(dt) {
    if (!this.flying) return;
    const g = this.game, P = this.tool.P;
    this.tool.model.group.updateMatrixWorld(true);
    this.tool.tip(_t);
    if (this.phase === 'out') {
      _d.copy(this.target).sub(this.pos);
      const d = _d.length(), step = SPEED * dt;
      if (d <= step) {
        this.pos.copy(this.target);
        this.arrive();
      } else this.pos.addScaledVector(_d.multiplyScalar(1 / d), step);
    } else if (this.phase === 'back') {
      _d.copy(_t).sub(this.pos);
      const d = _d.length(), step = SPEED * 1.4 * dt;
      if (d <= step + 0.3) { this.flying = false; this.grap.visible = false; this.line.visible = false; this.cool = 0.2; return; }
      this.pos.addScaledVector(_d.multiplyScalar(1 / d), step);
    } else if (this.phase === 'zip') {
      if (P.techs.active?.id !== 'zip') { this.phase = 'back'; }
    }
    this.grap.position.copy(this.pos);
    _d.copy(this.pos).sub(_t);
    if (_d.lengthSq() > 1e-6) this.grap.quaternion.setFromUnitVectors(_o.set(1, 0, 0), _d.normalize());
    this.grap.updateMatrixWorld(true);
    const p = this.lineGeo.attributes.position;
    p.setXYZ(0, _t.x, _t.y, _t.z); p.setXYZ(1, this.pos.x, this.pos.y, this.pos.z);
    p.needsUpdate = true;
  }

  arrive() {
    const g = this.game, r = this.result, P = this.tool.P;
    if (!r) { this.phase = 'back'; return; }
    sfx.hookLatch();
    g.fx.impact(r.point, r.normal, { sparks: 8, dust: 6 });
    if (r.kind === 'anchor') {
      this.phase = 'zip';
      g.player.techs.get('zip').go(r.point.clone().addScaledVector(r.normal, 0.35), r.normal);
    } else {
      // yanked to the Courier
      const to = _d.copy(P.pos).setY(P.pos.y + 1.1).sub(r.point);
      const dist = to.length();
      to.normalize();
      if (r.ent?.type === 'clapper') {
        r.ent.kv?.addScaledVector(to, 9);
        r.ent.state = 'stunned'; r.ent.timer = 1.2;
      } else if (r.body?.isDynamic()) {
        const m = r.body.mass?.() ?? 1;
        r.body.setLinvel({ x: to.x * 14, y: to.y * 14 + 3, z: to.z * 14 }, true);
        r.body.wakeUp?.();
        void m;
      }
      g.events?.emit('hook.pull', { what: r.ent?.type || 'prop', dist });
      this.phase = 'back';
    }
  }
}
