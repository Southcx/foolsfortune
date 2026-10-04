import * as THREE from 'three';
import { RAPIER } from '../../core/physics.js';
import { T, PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';

// ---------------------------------------------------------------------------
// The caster shells: three more rounds for the psygun (and for the god hand, which drops them
// where the cursor is). Named for what they do to the world, in the spirit of the Caster gun's
// odd shells and a certain lombax's gadgets:
//   GROOVE  a mirror-ball orb that opens where it lands: everything with a pulse (clapperjars)
//           dances for a few seconds, forgetting whatever it was doing, and the pots and crates
//           near it hop to the beat
//   ANCHOR  pins one thing where it is, in mid-air if that's where it was: it turns solid and
//           stays put (a crate becomes a step, a thrown ball hangs there, a critter is stuck)
//   HATCH   a pot cracks open and a clapperjar climbs out; a clapperjar hit by it turns friendly
//           (a kintsugi helper: it mends cracked pots, and the god hand's vessel)
// ---------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const BPM_T = 60 / 128; // a beat, in seconds

export class Casters {
  constructor(shells) {
    this.shells = shells;
    this.game = shells.game;
    this.grooves = [];
    this.anchors = [];
    this.geoBall = new THREE.IcosahedronGeometry(0.3, 1);
    this.geoRing = new THREE.TorusGeometry(0.5, 0.025, 4, 28);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  }

  // ---- what a shell can be aimed at ----
  /** The first dynamic thing along a ray (or within `assist` metres of where it lands): { body, ent, clapper, ball, point }. */
  pick(origin, dir, range = 60, assist = 1.3, filter = null) {
    const g = this.game;
    const hit = g.physics.raycast(origin, dir, range, g.player.collider, undefined, (c) => !c.isSensor());
    const point = hit ? hit.point : origin.clone().addScaledVector(dir, range);
    const body = hit?.collider.parent();
    if (hit && body?.isDynamic()) {
      const r = this.describe(body, hit.entity, point);
      if (r && (!filter || filter(r))) return r;
    }
    if (hit?.entity?.type === 'clapper' && (!filter || filter({ clapper: hit.entity }))) return { clapper: hit.entity, point };
    return this.near(point, assist, filter);
  }

  describe(body, ent, point) {
    const g = this.game;
    if (!body.isValid()) return null;
    for (const b of g.projectiles || []) if (b.body === body) return { body, ball: b, point };
    if (ent && (ent.type === 'player' || ent.type === 'rope' || ent.def?.hang)) return null;
    if (g.physics.links.has(body.handle)) return null;
    return { body, ent, point };
  }

  /** The nearest dynamic thing to a point. */
  near(point, radius, filter = null) {
    const g = this.game;
    let best = null, bd = radius;
    for (const c of g.clappers?.list || []) {
      if (!c.alive) continue;
      const d = _v.set(c.pos.x, c.pos.y + 0.3, c.pos.z).distanceTo(point);
      if (d < bd && (!filter || filter({ clapper: c }))) { bd = d; best = { clapper: c, point }; }
    }
    g.physics.world.forEachRigidBody((b) => {
      if (!b.isDynamic() || g.physics.links.has(b.handle)) return;
      const t = b.translation();
      const d = _v.set(t.x, t.y, t.z).distanceTo(point);
      if (d >= bd) return;
      const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
      const r = this.describe(b, ent, point);
      if (r && (!filter || filter(r))) { bd = d; best = r; }
    });
    return best;
  }

  // ---- GROOVE ----------------------------------------------------------------------
  groove({ ray, muzzle }) {
    const S = T.shells.groove;
    this.shells.launch('groove', muzzle, ray.dir, S.speed, S.lift);
    sfx.thump();
  }

  openGroove(pos) {
    const g = this.game, S = T.shells.groove;
    while (this.grooves.length >= 2) this.closeGroove(this.grooves[0]);
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xdff4ff, flatShading: true, roughness: 0.12, metalness: 0.4, emissive: 0x6a3cff, emissiveIntensity: 0.9 });
    const ball = new THREE.Mesh(this.geoBall, mat);
    addOutline(ball);
    group.add(ball);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: 0xff70d0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    halo.scale.setScalar(2.6);
    group.add(halo);
    // a floor ring of colour (the dance floor)
    const ring = new THREE.Mesh(new THREE.RingGeometry(S.radius * 0.94, S.radius, 48), new THREE.MeshBasicMaterial({ color: 0xff70d0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    const down = g.physics.raycast(pos.clone().addScaledVector(UP, 0.4), new THREE.Vector3(0, -1, 0), 6, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    ring.position.set(pos.x, (down ? down.point.y : pos.y - 1.2) + 0.05, pos.z);
    g.scene.add(ring);
    group.position.copy(pos);
    g.scene.add(group);
    const gr = { pos: pos.clone(), group, ball, mat, halo, ring, t: 0, beat: -1, dur: S.duration, hue: Math.random() };
    this.grooves.push(gr);
    sfx.thump();
    g.events?.emit('groove.open', {});
  }

  closeGroove(gr) {
    this.game.scene.remove(gr.group);
    this.game.scene.remove(gr.ring);
    gr.ring.geometry.dispose(); gr.ring.material.dispose();
    gr.mat.dispose();
    this.grooves.splice(this.grooves.indexOf(gr), 1);
  }

  stepGrooves(dt) {
    const g = this.game, S = T.shells.groove;
    for (let i = this.grooves.length - 1; i >= 0; i--) {
      const gr = this.grooves[i];
      gr.t += dt;
      if (gr.t > gr.dur) { this.closeGroove(gr); continue; }
      const beat = Math.floor(gr.t / BPM_T);
      const fade = Math.min(1, (gr.dur - gr.t) / 0.8);
      // a mirror ball: it spins, bobs, and flashes a new colour on the beat
      gr.ball.rotation.y += dt * 2.4;
      gr.group.position.y = gr.pos.y + Math.sin(gr.t * 3) * 0.08;
      const pulse = 1 - ((gr.t / BPM_T) % 1);
      gr.ball.scale.setScalar((1 + pulse * 0.25) * fade);
      gr.halo.material.opacity = (0.35 + pulse * 0.4) * fade;
      gr.ring.material.opacity = (0.25 + pulse * 0.4) * fade;
      if (beat !== gr.beat) {
        gr.beat = beat;
        gr.hue = (gr.hue + 0.13) % 1;
        const col = new THREE.Color().setHSL(gr.hue, 0.95, 0.6);
        gr.mat.emissive.copy(col);
        gr.halo.material.color.copy(col);
        gr.ring.material.color.copy(col);
        this.onBeat(gr, beat, col);
      }
      // sparkles thrown off the ball
      if (Math.random() < dt * 40) {
        const a = Math.random() * Math.PI * 2;
        g.fx.add.emit({ pos: gr.pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3)), vel: new THREE.Vector3(Math.cos(a) * 2, 1 + Math.random() * 2, Math.sin(a) * 2), life: 0.7, size: 0.05, sizeEnd: 0.01, color: new THREE.Color().setHSL(Math.random(), 0.9, 0.65), drag: 1.5, gravity: 2 });
      }
    }
  }

  onBeat(gr, beat, col) {
    const g = this.game, S = T.shells.groove;
    sfx.beat(beat);
    // the clapperjars dance
    for (const c of g.clappers?.list || []) {
      if (!c.alive || c.held || c.pinned) continue;
      if (c.pos.distanceTo(gr.pos) > S.radius * 1.6) continue;
      if (c.state !== 'dance') { c.state = 'dance'; c.twirl = 0; }
      c.timer = 0.9; // (kept dancing for as long as the ball plays)
      c.clapT = 0.3; c.clapRate = 10;
      if (c.grounded && beat % 2 === 0) { c.vy = 3.1; c.grounded = false; c.squashV += 3; }
      c.heading += 0.9;
      g.fx.add.emit({ pos: c.pos.clone().setY(c.pos.y + 0.9), vel: new THREE.Vector3(0, 1.5, 0), life: 0.5, size: 0.08, sizeEnd: 0.02, color: col, drag: 1 });
    }
    // the pots and crates hop
    if (beat % 2 === 0) {
      g.physics.world.forEachRigidBody((b) => {
        if (!b.isDynamic() || g.physics.links.has(b.handle)) return;
        const t = b.translation();
        if (_v.set(t.x - gr.pos.x, 0, t.z - gr.pos.z).length() > S.radius || Math.abs(t.y - gr.pos.y) > 3.5) return;
        const v = b.linvel();
        if (Math.abs(v.y) > 1.2) return;
        const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
        if (ent && (ent.type === 'player' || ent.def?.hang)) return;
        g.physics.kick(b, { x: 0, y: b.mass() * S.hop, z: 0 });
      });
    }
  }

  // ---- ANCHOR ----------------------------------------------------------------------
  anchor({ ray, muzzle }) {
    const g = this.game;
    const t = this.pick(ray.origin, ray.dir, T.weapon.range, 1.4);
    const end = t ? t.point : ray.origin.clone().addScaledVector(ray.dir, T.weapon.range);
    g.fx.tracer(muzzle, end);
    if (!t || !this.pin(t)) { g.log.say('warn', 'There is nothing there to anchor.', { key: 'cast', throttle: 2 }); sfx.fizzle(); }
  }

  /** Pin a picked thing where it is. */
  pin(t, dur = T.shells.anchor.duration) {
    const g = this.game;
    const rec = { t: 0, dur, group: new THREE.Group(), target: t };
    if (t.clapper) {
      const c = t.clapper;
      if (c.pinned) { c.pinT = dur; return true; }
      c.pinned = true; c.pinT = dur;
      c.state = 'stunned'; c.stunT = dur; c.speed = 0;
      rec.get = () => _v.set(c.pos.x, c.pos.y + 0.4, c.pos.z);
      rec.size = 0.5;
    } else {
      const body = t.body;
      if (!body?.isValid() || !body.isDynamic()) return false;
      rec.body = body;
      rec.vel = body.linvel();
      body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
      if (t.ball) t.ball.pinned = true;
      rec.get = () => { const p = body.translation(); return _v.set(p.x, p.y, p.z); };
      rec.size = Math.max(0.35, (t.ent?.size ?? 0.5) * 0.7);
    }
    for (let i = 0; i < 2; i++) {
      const r = new THREE.Mesh(this.geoRing, this.ringMat);
      r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      rec.group.add(r);
    }
    rec.rings = rec.group.children.slice();
    g.scene.add(rec.group);
    this.anchors.push(rec);
    sfx.anchor();
    g.events?.emit('shell.anchor', { clapper: !!t.clapper });
    return true;
  }

  releasePin(rec) {
    const g = this.game;
    if (rec.target.clapper) { rec.target.clapper.pinned = false; if (rec.target.clapper.state === 'stunned') rec.target.clapper.stunT = 0.2; }
    else if (rec.body?.isValid()) {
      rec.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
      rec.body.setLinvel({ x: rec.vel.x * 0.3, y: rec.vel.y * 0.3, z: rec.vel.z * 0.3 }, true);
      rec.body.wakeUp();
      if (rec.target.ball) rec.target.ball.pinned = false;
    }
    g.scene.remove(rec.group);
    this.anchors.splice(this.anchors.indexOf(rec), 1);
  }

  stepAnchors(dt) {
    for (let i = this.anchors.length - 1; i >= 0; i--) {
      const rec = this.anchors[i];
      rec.t += dt;
      const c = rec.target.clapper;
      const alive = c ? c.alive : rec.body?.isValid();
      if (c && c.pinT !== undefined) rec.dur = Math.max(rec.dur, rec.t + c.pinT); // (re-pinned: longer)
      if (!alive || rec.t > rec.dur) { this.releasePin(rec); continue; }
      rec.group.position.copy(rec.get());
      const k = rec.size * (1 + 0.06 * Math.sin(rec.t * 12)) * (rec.dur - rec.t < 1 ? 0.5 + 0.5 * Math.sin(rec.t * 30) : 1);
      rec.rings.forEach((r, j) => { r.rotation.x += dt * (1.5 + j); r.rotation.y += dt * (2.5 - j); r.scale.setScalar(k * (1 + j * 0.3)); });
    }
  }

  // ---- HATCH -----------------------------------------------------------------------
  hatch({ ray, muzzle }) {
    const g = this.game;
    const t = this.pick(ray.origin, ray.dir, T.weapon.range, 1.0, (r) => r.clapper || r.ent?.type === 'breakable');
    const end = t ? t.point : ray.origin.clone().addScaledVector(ray.dir, T.weapon.range);
    g.fx.tracer(muzzle, end);
    if (!t || !this.hatchAt(t)) { g.log.say('warn', 'There is nothing there to hatch.', { key: 'cast', throttle: 2 }); sfx.fizzle(); }
  }

  /** A pot cracks and a clapperjar hatches; a clapperjar is turned. */
  hatchAt(t) {
    const g = this.game;
    if (t.clapper) {
      this.befriend(t.clapper);
      return true;
    }
    const ent = t.ent;
    if (ent?.type !== 'breakable' || !ent.alive || ent.def?.target) return false;
    const p = ent.body.translation();
    const at = new THREE.Vector3(p.x, p.y, p.z);
    g.breakables.damage(ent, ent.maxHp * 4, at.clone().setY(at.y + 0.3), UP.clone(), 1.0);
    const fi = Math.max(0, g.clappers.floors.findIndex((f) => Math.abs(at.y - f.y) < 0.9));
    const c = g.clappers.spawn(new THREE.Vector3(at.x, g.clappers.floors[fi]?.y ?? at.y, at.z), true, fi);
    if (c) this.befriend(c, true);
    g.fx.explosion?.(at, 0.6);
    sfx.hatch();
    g.events?.emit('shell.hatch', {});
    return true;
  }

  befriend(c, born = false) {
    const g = this.game;
    c.ally = true; c.raider = false;
    if (c.state === 'raid') { c.state = 'idle'; c.timer = 0.3; }
    c.mat.color.set(0xf3d9a4);
    c.mat.emissive.set(0xc27414);
    c.mat.emissiveIntensity = 0.35;
    sfx.hatch();
    // (at most a handful of helpers: the oldest go home)
    const allies = g.clappers.list.filter((x) => x.alive && x.ally);
    while (allies.length > T.shells.hatch.maxAllies) g.clappers.hit(allies.shift(), allies[0]?.pos || c.pos, UP, 1, 'shot');
    g.events?.emit('shell.befriend', { born });
  }

  update(dt) {
    this.stepGrooves(dt);
    this.stepAnchors(dt);
  }

  clear() {
    for (const gr of [...this.grooves]) this.closeGroove(gr);
    for (const a of [...this.anchors]) this.releasePin(a);
  }
}
