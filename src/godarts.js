import * as THREE from 'three';
import { mindLineMaterial } from './vfx/labradorite.js';
import { T, PALETTE } from './config.js';
import { RAPIER, GROUPS } from './physics.js';
import { addOutline } from './outline.js';
import { sfx } from './audio.js';
import { planeFrom } from './slicing.js';

// ---------------------------------------------------------------------------------------
// GOD ARTS. What the hand can do. They are nothing to do with the psygun's shells: shells are
// prepackaged one-shot rounds that cost nothing but the shell; a god art is a power of the hand
// itself, and it runs on Lachryma. And each works only inside the ZONE OF INFLUENCE: the ground
// you have explored (cartography.js). For now that is all there is to it: explored or not.
//
//   1 TELEKINESIS               hold LMB: lift anything loose and throw it. Costs Lachryma
//                                 while held, by weight.
//   2 SUNDER                    LMB drag: draw a blade across the ground; everything it passes
//                                 through in the air above is cut in two along that plane.
//   3 SWELL                     LMB on a pot or crate, drag up / down: grow or shrink it (its
//                                 weight follows its size).
//   4 WRING                     LMB on a pot, drag sideways: twist it about its axis; drag up:
//                                 scallop its walls. The clay stays the clay.
//   5 MANIFEST                  LMB drag: raise a wall of clay from the floor (hold for height).
//                                 It stands for a while, then crumbles. Things standing where it
//                                 rises are lifted with it.
//
// Right mouse opens the radial wheel; 1-5 pick directly. Each art's numbers are in T.arts, and
// the variants the System teaches change them (system.artCfg).
// ---------------------------------------------------------------------------------------
export const ARTS = [
  { id: 'telekinesis', key: '1', name: 'TELEKINESIS', glyph: '⤒', needs: 1, blurb: 'lift and throw', color: '#ffe0c0' },
  { id: 'sunder', key: '2', name: 'SUNDER', glyph: '╱', needs: 1, blurb: 'draw a blade', color: '#ffd696' },
  { id: 'swell', key: '3', name: 'SWELL', glyph: '⤢', needs: 1, blurb: 'grow or shrink', color: '#ffb27a' },
  { id: 'wring', key: '4', name: 'WRING', glyph: '↺', needs: 1, blurb: 'twist the clay', color: '#ff9a6a' },
  { id: 'manifest', key: '5', name: 'MANIFEST', glyph: '▲', needs: 1, blurb: 'raise clay', color: '#ffc65c' },
];
export const ART_BY_ID = Object.fromEntries(ARTS.map((a) => [a.id, a]));

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;

const CSS = `
#godarts { position: absolute; left: 50%; bottom: calc(20px + var(--cine, 0vh)); transform: translateX(-50%); display: none; gap: 8px; }
#godarts .slot { width: 84px; height: 62px; box-sizing: border-box; border: 1px solid var(--jmid); background: linear-gradient(180deg, rgba(var(--jtop), .72), rgba(var(--jbot), .86)); border-radius: 5px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.4); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; opacity: .78; text-shadow: 1px 1px 0 rgba(8,3,1,.8); }
#godarts .slot i { font-style: normal; font-size: 22px; line-height: 1; }
#godarts .slot span { font: 600 10px var(--f-title); letter-spacing: .1em; margin-top: 4px; }
#godarts .slot b { position: absolute; top: 2px; left: 6px; font: 12px var(--f-sys); color: var(--accent); font-weight: normal; }
#godarts .slot u { position: absolute; top: 3px; right: 6px; font-size: 9px; text-decoration: none; letter-spacing: 1px; color: rgba(255,178,122,.55); }
#godarts .slot.sel { opacity: 1; border-color: var(--jhi); background: linear-gradient(180deg, rgba(var(--jsel), .75), rgba(var(--jbot), .9)); transform: translateY(-5px); }
#godarts .slot.no { opacity: .35; }
#godarts .slot.out { border-color: #ff5a3a; }
#godtip { position: fixed; z-index: 5; pointer-events: none; display: none; padding: 4px 9px; font: 12px/1.4 var(--f-ui); letter-spacing: .08em; background: rgba(28,13,8,.86); border: 1px solid rgba(255,178,122,.5); border-radius: 3px; color: #fbe3cf; transform: translate(18px, 14px); white-space: nowrap; }
#godtip.bad { border-color: #ff5a3a; color: #ffb9a8; }
#godwheel { position: fixed; z-index: 6; pointer-events: none; display: none; width: 340px; height: 340px; margin: -170px 0 0 -170px; }
#godwheel svg { width: 100%; height: 100%; overflow: visible; }
#godwheel .w { fill: rgba(28,13,8,.82); stroke: rgba(255,178,122,.45); stroke-width: 1.5; }
#godwheel .w.sel { fill: rgba(196,106,69,.7); stroke: #ffe0c0; }
#godwheel .w.lock { fill: rgba(28,13,8,.6); }
#godwheel text { fill: #fbe3cf; font: 600 12px var(--f-title); letter-spacing: .1em; text-anchor: middle; }
#godwheel text.g { font-size: 26px; }
#godwheel text.s { font-size: 9px; opacity: .7; }
#godwheel .hub { fill: rgba(28,13,8,.9); stroke: rgba(255,178,122,.6); stroke-width: 1.5; }
`;

export class GodArts {
  constructor(god) {
    this.god = god;
    this.game = god.game;
    this.sel = 0;
    this.live = null; // the art in use right now: { id, ... }
    this.manifests = [];
    this.wheelOpen = false;
    this.tipMsg = '';
    this.buildUi();
    this.buildFx();
  }

  get art() { return ARTS[this.sel]; }
  cfg(id) { return this.game.system?.artCfg ? this.game.system.artCfg(id) : T.arts[id]; }
  owns(id) { return this.game.system?.has(id) ?? true; }

  select(i) {
    if (i < 0 || i >= ARTS.length || i === this.sel) return;
    this.cancel();
    this.sel = i;
    sfx.click();
    this.game.events?.emit('god.select', { id: ARTS[i].id });
  }

  // ------------------------------------------------------------------ ui
  buildUi() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const bar = document.createElement('div');
    bar.id = 'godarts';
    bar.innerHTML = ARTS.map((a, i) => `<div class="slot" data-i="${i}"><b>${a.key}</b><i>${a.glyph}</i><span>${a.name}</span></div>`).join('');
    document.getElementById('hud').appendChild(bar);
    this.bar = bar;
    this.slots = [...bar.querySelectorAll('.slot')];
    this.tip = document.createElement('div');
    this.tip.id = 'godtip';
    document.body.appendChild(this.tip);
    this.wheel = document.createElement('div');
    this.wheel.id = 'godwheel';
    document.body.appendChild(this.wheel);
    this.buildWheel();
  }

  buildWheel() {
    const R0 = 46, R1 = 150, n = ARTS.length, gap = 0.03;
    const pt = (r, a) => [Math.sin(a) * r, -Math.cos(a) * r];
    let svg = '<svg viewBox="-170 -170 340 340">';
    ARTS.forEach((a, i) => {
      const a0 = (i / n) * Math.PI * 2 + gap, a1 = ((i + 1) / n) * Math.PI * 2 - gap;
      const [x0, y0] = pt(R0, a0), [x1, y1] = pt(R1, a0), [x2, y2] = pt(R1, a1), [x3, y3] = pt(R0, a1);
      svg += `<path class="w" data-i="${i}" d="M${x0},${y0} L${x1},${y1} A${R1},${R1} 0 0 1 ${x2},${y2} L${x3},${y3} A${R0},${R0} 0 0 0 ${x0},${y0} Z"/>`;
      const [tx, ty] = pt((R0 + R1) / 2, (a0 + a1) / 2);
      svg += `<text class="g" x="${tx}" y="${ty + 2}">${a.glyph}</text><text x="${tx}" y="${ty + 20}">${a.name}</text>`;
    });
    svg += '<circle class="hub" r="42"/><text id="gw-name" y="-2"></text><text class="s" id="gw-sub" y="12"></text></svg>';
    this.wheel.innerHTML = svg;
    this.wheelPaths = [...this.wheel.querySelectorAll('path.w')];
    this.wName = this.wheel.querySelector('#gw-name');
    this.wSub = this.wheel.querySelector('#gw-sub');
  }

  openWheel(x, y) {
    this.cancel();
    this.wheelOpen = true;
    this.wheelAt = { x, y };
    this.wheelPick = -1;
    this.wheel.style.left = `${x}px`; this.wheel.style.top = `${y}px`;
    this.wheel.style.display = 'block';
    sfx.lockOn?.(1);
    this.updateWheel(x, y);
  }

  updateWheel(mx, my) {
    const dx = mx - this.wheelAt.x, dy = my - this.wheelAt.y, d = Math.hypot(dx, dy);
    let pick = -1;
    if (d > 26) { const a = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2); pick = Math.floor(a / (Math.PI * 2 / ARTS.length)); }
    if (pick !== this.wheelPick) { this.wheelPick = pick; if (pick >= 0) sfx.click(); }
    const show = pick >= 0 ? pick : this.sel, A = ARTS[show];
    this.wheelPaths.forEach((p, i) => { p.classList.toggle('sel', i === show); p.classList.toggle('lock', !this.owns(ARTS[i].id)); });
    this.wName.textContent = A.name;
    this.wSub.textContent = this.owns(A.id) ? A.blurb : 'not yet learned';
  }

  closeWheel(commit) {
    if (!this.wheelOpen) return;
    this.wheelOpen = false;
    this.wheel.style.display = 'none';
    if (commit && this.wheelPick >= 0) this.select(this.wheelPick);
  }

  showBar(on) { this.bar.style.display = on ? 'flex' : 'none'; }

  /** Per frame: the bar (which art, what the cursor's ground allows) and the tooltip at the cursor. */
  updateUi(dt) {
    const g = this.game, K = this.god.cursor, input = g.input;
    const tierHere = K.tier ?? 0;
    this.slots.forEach((s, i) => {
      const a = ARTS[i];
      s.classList.toggle('sel', i === this.sel);
      s.classList.toggle('no', !this.owns(a.id) || tierHere < a.needs);
      s.classList.toggle('out', this.lack === a.id);
    });
    const a = this.art;
    let msg = '', bad = false;
    if (!this.owns(a.id)) { msg = `${a.name}: not yet learned (B)`; bad = true; }
    else if (this.live) msg = this.live.tip || '';
    else if (K.far) { msg = 'OUT OF REACH'; bad = true; }
    // (no prompts about what the hand does or does not "understand": the ground outside your zone of influence just does not answer, and the ring shows it)
    this.tip.style.display = this.wheelOpen || !input.enabled ? 'none' : 'block';
    this.tip.textContent = msg;
    this.tip.classList.toggle('bad', bad);
    this.tip.style.left = `${input.mx}px`; this.tip.style.top = `${input.my}px`;
  }

  // ------------------------------------------------------------------ fx
  buildFx() {
    const g = this.game;
    const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.blade = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(0xffd696, 0.32));
    this.blade.renderOrder = 8; this.blade.visible = false; this.blade.frustumCulled = false;
    this.bladeLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(0xfff1dc, 0.9));
    this.bladeLine.renderOrder = 9; this.bladeLine.visible = false; this.bladeLine.frustumCulled = false;
    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffc65c, 0.16));
    this.ghost.renderOrder = 8; this.ghost.visible = false;
    this.ghostEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), mindLineMaterial({ depthTest: true, bright: 1.2 })); // (the Mind's wireframe: vfx/labradorite.js)
    this.ghost.add(this.ghostEdges);
    g.scene.add(this.blade, this.bladeLine, this.ghost);
    this.clay = new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.85, flatShading: true });
    this.clayBand = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.9, flatShading: true });
  }

  hideFx() { this.blade.visible = this.bladeLine.visible = this.ghost.visible = false; }

  // ------------------------------------------------------------------ what an art may act on
  swellable(h) { return !!h && !!h.ent && ((h.ent.type === 'breakable' && h.ent.alive && !h.ent.def.hang && !h.ent.def.target) || (h.ent.type === 'prop' && h.ent.half)); }
  wringable(h) { return !!h && !!h.ent && h.ent.type === 'breakable' && h.ent.alive && !h.ent.def.hang && !h.ent.def.target; }

  /** May this art start at the cursor? Sets the reason if not. */
  gate(a, point) {
    const g = this.game;
    this.lack = null;
    if (!this.owns(a.id)) { g.log.say('warn', `You have not learned ${a.name}.`, { key: 'unlearned', throttle: 2 }); return false; }
    return g.cartography.tierAt(point.x, point.y, point.z).tier >= a.needs; // (the zone of influence is the ground you have explored)
  }

  pay(base, tag = 'god') {
    const L = this.game.lachryma;
    if (L.spend(base, tag)) { this.lack = null; return true; }
    this.lack = this.art.id;
    sfx.dryFire();
    return false;
  }

  drainOk(perSec, dt) {
    const L = this.game.lachryma, want = perSec * dt;
    const got = L.drain(want, 'god');
    if (got < want * 0.5) { this.lack = this.art.id; return false; }
    this.lack = null;
    return true;
  }

  // ------------------------------------------------------------------ the hand's use of an art
  /** Every frame the hand is up (not while the wheel is open). Telekinesis is the god's own grab. */
  update(dt) {
    const g = this.game, input = g.input, K = this.god.cursor, a = this.art;
    if (this.wheelOpen) return;
    // (telekinesis lives in godmode.js: begin/release grab, and its drain)
    if (a.id === 'telekinesis') return;
    if (!this.live) {
      if (input.wasPressed('Mouse0') && K.ok && this.gate(a, K.point)) this.begin(a);
    } else {
      if (!input.isDown('Mouse0')) this.end();
      else this.hold(dt);
    }
    // the previews follow the live art
    if (!this.live) this.hideFx();
  }

  cancel() {
    if (this.live) {
      const L = this.live, e = L.ent;
      // (a reshaping already under way stays as it was)
      if (e && (e.type === 'prop' || e.alive)) { if (L.id === 'swell') e.godScale = L.f; else if (L.id === 'wring') { e.godTwist = L.tw; e.godLobe = L.lo; } }
      this.live = null;
    }
    this.hideFx();
  }

  begin(a) {
    const g = this.game, K = this.god.cursor, input = g.input;
    const L = { id: a.id, t: 0, mx: input.mx, my: input.my, a: K.point.clone(), tip: '' };
    if (a.id === 'sunder') {
      L.b = K.point.clone();
    } else if (a.id === 'swell' || a.id === 'wring') {
      const h = this.god.hover;
      if (a.id === 'swell' ? !this.swellable(h) : !this.wringable(h)) return;
      if (!this.pay(this.cfg(a.id).cost)) return;
      const e = h.ent;
      L.ent = e; L.f0 = e.godScale || 1; L.tw0 = e.godTwist || 0; L.lo0 = e.godLobe || 0;
      L.f = L.f0; L.tw = L.tw0; L.lo = L.lo0; L.applied = 0;
      L.snapshot = { f: L.f0, tw: L.tw0, lo: L.lo0 };
      if (e.type === 'prop') { L.base = e.godBase || (e.godBase = { half: [...e.half], size: e.size }); }
      sfx.grab();
    } else if (a.id === 'manifest') {
      L.b = K.point.clone(); L.h = 0.8;
      L.gy = K.point.y;
    }
    this.live = L;
  }

  hold(dt) {
    const g = this.game, K = this.god.cursor, input = g.input, L = this.live, C = this.cfg(L.id);
    L.t += dt;
    if (L.id === 'sunder') {
      const b = K.point.clone(); b.y = L.a.y;
      const d = b.clone().sub(L.a);
      if (d.length() > C.maxLen) b.copy(L.a).addScaledVector(d.normalize(), C.maxLen);
      const tier = g.cartography.tierAt(b.x, b.y, b.z).tier;
      L.ok = tier >= ART_BY_ID.sunder.needs && K.ok;
      if (L.ok) L.b.copy(b);
      L.tip = L.ok ? `${L.a.distanceTo(L.b).toFixed(1)} m · release to cut` : 'the blade must stay in known ground';
      this.showBlade(L.a, L.b, C.height, L.ok);
    } else if (L.id === 'swell') {
      const f = clamp(L.f0 * Math.exp((L.my - input.my) * 0.006), C.min, C.max);
      L.tip = `×${f.toFixed(2)}`;
      if (Math.abs(f - L.f) > 0.004 && this.drainOk(C.drain * 0.5 + C.drain * Math.abs(Math.log(f / L.f)) * 6, dt) && (L.applied -= dt) <= 0) {
        L.f = f; L.applied = 0.05;
        this.applyShape(L);
      }
    } else if (L.id === 'wring') {
      const tw = clamp(L.tw0 + (input.mx - L.mx) * 0.012, -C.twist, C.twist);
      const lo = clamp(L.lo0 + (L.my - input.my) * 0.0016, 0, C.lobe);
      L.tip = `twist ${(tw * 57.3).toFixed(0)}° · scallop ${(lo * 100).toFixed(0)}%`;
      if ((Math.abs(tw - L.tw) > 0.01 || Math.abs(lo - L.lo) > 0.004) && this.drainOk(C.drain, dt) && (L.applied -= dt) <= 0) {
        L.tw = tw; L.lo = lo; L.applied = 0.05;
        this.applyShape(L);
      }
    } else if (L.id === 'manifest') {
      const b = K.point.clone(); b.y = L.a.y;
      const d = b.clone().sub(L.a), len = d.length();
      if (len > C.maxLen) b.copy(L.a).addScaledVector(d.normalize(), C.maxLen);
      const tier = g.cartography.tierAt(b.x, b.y, b.z).tier;
      L.ok = tier >= ART_BY_ID.manifest.needs && K.ok;
      if (L.ok) L.b.copy(b);
      L.h = Math.min(C.maxH, 0.8 + L.t * 2.2);
      const len2 = Math.max(1.2, L.a.distanceTo(L.b));
      L.cost = C.cost + len2 * L.h * C.perVol;
      L.tip = `${len2.toFixed(1)} × ${L.h.toFixed(1)} m · ${Math.round(L.cost)} Lachryma`;
      this.showGhost(L, C, L.ok);
    }
  }

  end() {
    const L = this.live, g = this.game, C = this.cfg(L.id);
    this.live = null;
    this.hideFx();
    if (L.id === 'sunder') {
      if (L.a.distanceTo(L.b) < 0.8) return;
      if (!this.pay(C.cost)) return;
      this.doSunder(L, C);
    } else if (L.id === 'swell' || L.id === 'wring') {
      const e = L.ent;
      if (e && (e.type === 'prop' || e.alive)) {
        if (L.id === 'swell') e.godScale = L.f; else { e.godTwist = L.tw; e.godLobe = L.lo; }
        g.events?.emit(`god.${L.id}`, {});
        sfx.grab();
      }
    } else if (L.id === 'manifest') {
      const len = Math.max(1.2, L.a.distanceTo(L.b));
      if (!this.pay(L.cost)) return;
      this.doManifest(L, C, len);
    }
  }

  // ---- Swell and Wring: reform the thing under the hand ----
  applyShape(L) {
    const g = this.game, e = L.ent;
    if (!e) return;
    if (e.type === 'breakable') {
      if (!e.alive) return;
      const hp = e.body.translation(); // (grow about the base)
      g.breakables.reshape(e, { scale: L.f, twist: L.tw, lobe: L.lo });
      g.fx.add.emit({ pos: new THREE.Vector3(hp.x, hp.y + e.size * 0.5, hp.z), vel: new THREE.Vector3(0, 0.5, 0), life: 0.3, size: 0.05, sizeEnd: 0.01, color: new THREE.Color(PALETTE.hot), drag: 2 });
    } else if (e.type === 'prop' && e.body.isValid()) {
      const B = L.base, f = L.f;
      const col = e.body.collider(0);
      col.setHalfExtents({ x: B.half[0] * f, y: B.half[1] * f, z: B.half[2] * f });
      e.mesh.scale.setScalar(f);
      e.half = [B.half[0] * f, B.half[1] * f, B.half[2] * f];
      e.size = B.size * f;
      const t = e.body.translation();
      e.body.setTranslation({ x: t.x, y: t.y + Math.max(0, B.half[1] * (f - (L.prevF || L.f0))), z: t.z }, true);
      L.prevF = f;
      e.body.wakeUp();
    }
    sfx.grab();
  }

  // ---- Sunder ----
  showBlade(a, b, height, ok) {
    const len = Math.max(0.05, a.distanceTo(b));
    const dir = _v.copy(b).sub(a).normalize();
    const yaw = Math.atan2(-dir.z, dir.x);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    this.blade.visible = this.bladeLine.visible = true;
    this.blade.position.set(mid.x, a.y + height / 2, mid.z);
    this.blade.rotation.set(0, yaw, 0);
    this.blade.scale.set(len, height, 1);
    this.bladeLine.position.set(mid.x, a.y + 0.05, mid.z);
    this.bladeLine.quaternion.setFromAxisAngle(UP, yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
    this.bladeLine.scale.set(len, 0.09, 1);
    const col = ok ? 0xffd696 : 0xff5a3a;
    this.blade.material.color.setHex(col);
  }

  doSunder(L, C) {
    const g = this.game, B = g.breakables;
    const a = L.a, b = L.b, len = a.distanceTo(b);
    const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
    const n = new THREE.Vector3().crossVectors(dir, UP).normalize();
    const plane = planeFrom(n, a);
    const cands = [...B.items, ...B.slices, ...B.debris];
    let cuts = 0;
    for (const e of cands) {
      if (!B.isSliceable(e) || !e.body?.isValid?.()) continue;
      const t = e.body.translation();
      _v2.set(t.x - a.x, 0, t.z - a.z);
      const along = _v2.dot(dir), perp = Math.abs(_v2.dot(n));
      const half = (e.size || 0.5) * 0.5 + 0.2;
      if (along < -half || along > len + half || perp > half) continue;
      if (t.y < a.y - 0.6 || t.y > a.y + C.height + 0.6) continue;
      const pieces = B.slice(e, plane, dir);
      if (pieces?.length) cuts++;
    }
    for (const c of g.clappers.list) {
      if (!c.alive) continue;
      _v2.set(c.pos.x - a.x, 0, c.pos.z - a.z);
      const along = _v2.dot(dir);
      if (along < -0.3 || along > len + 0.3 || Math.abs(_v2.dot(n)) > 0.45) continue;
      if (c.pos.y < a.y - 0.5 || c.pos.y > a.y + C.height) continue;
      g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), dir, 1.2, 'sliced'); cuts++;
    }
    if (cuts > 1) this.pay(Math.min(C.perCut * (cuts - 1), 12), 'god'); // (a longer cut costs more)
    g.fx.slash(a.clone().setY(a.y + 0.9), b.clone().setY(a.y + 0.9), UP);
    g.fx.slash(a.clone().setY(a.y + 1.8), b.clone().setY(a.y + 1.8), UP);
    sfx.slice();
    g.events?.emit('god.sunder', { cuts });
  }

  // ---- Manifest ----
  showGhost(L, C, ok) {
    const len = Math.max(1.2, L.a.distanceTo(L.b));
    const dir = _v.copy(L.b).sub(L.a).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0); else dir.normalize();
    const mid = L.a.clone().addScaledVector(dir, len / 2 - (L.a.distanceTo(L.b) < 1.2 ? 0 : 0));
    this.ghost.visible = true;
    this.ghost.position.set(mid.x, L.a.y + L.h / 2, mid.z);
    this.ghost.rotation.set(0, Math.atan2(-dir.z, dir.x), 0);
    this.ghost.scale.set(len, L.h, C.width);
    this.ghost.material.color.setHex(ok ? 0xffc65c : 0xff5a3a);
  }

  doManifest(L, C, len) {
    const g = this.game;
    while (this.manifests.length >= C.max) this.crumble(this.manifests[0]);
    const dir = _v.copy(L.b).sub(L.a).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0); else dir.normalize();
    const mid = L.a.clone().addScaledVector(dir, len / 2);
    const yaw = Math.atan2(-dir.z, dir.x);
    const h = L.h, w = C.width;
    // the ground under the middle of it
    const hit = g.physics.raycast({ x: mid.x, y: L.a.y + 1.5, z: mid.z }, DOWN, 4, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    const gy = hit ? hit.point.y : L.a.y;
    const q = new THREE.Quaternion().setFromAxisAngle(UP, yaw);
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(mid.x, gy - h / 2 - 0.05, mid.z).setRotation(q));
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(len / 2, h / 2, w / 2).setFriction(0.9).setCollisionGroups(GROUPS.static), body);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), this.clay);
    const band = new THREE.Mesh(new THREE.BoxGeometry(len * 1.02, Math.min(0.25, h * 0.14), w * 1.03), this.clayBand);
    band.position.y = h * 0.32;
    mesh.add(band);
    mesh.castShadow = mesh.receiveShadow = true;
    addOutline(mesh);
    mesh.position.set(mid.x, gy - h / 2 - 0.05, mid.z);
    mesh.quaternion.copy(q);
    g.scene.add(mesh);
    const m = { body, col, mesh, t: 0, rise: 0.55, life: C.life, h, gy, mid, len, w, yaw };
    this.manifests.push(m);
    g.fx.impact?.(new THREE.Vector3(mid.x, gy, mid.z), UP, { sparks: 6, dust: 18 });
    sfx.thump();
    g.events?.emit('god.manifest', { len, h });
  }

  crumble(m) {
    const g = this.game;
    const i = this.manifests.indexOf(m);
    if (i < 0) return;
    this.manifests.splice(i, 1);
    const at = new THREE.Vector3(m.mid.x, m.gy + m.h * 0.5, m.mid.z);
    g.fx.explosion?.(at, Math.min(2.4, m.len * 0.3));
    g.fx.impact?.(at, UP, { sparks: 10, dust: 30 });
    sfx.shatter?.(1.2, 4);
    g.physics.world.removeRigidBody(m.body);
    g.scene.remove(m.mesh);
    m.mesh.geometry.dispose();
  }

  fixed(dt) {
    for (let i = this.manifests.length - 1; i >= 0; i--) {
      const m = this.manifests[i];
      m.t += dt;
      const u = Math.min(1, m.t / m.rise), e = 1 - Math.pow(1 - u, 3);
      const y = m.gy - m.h / 2 - 0.05 + (m.h + 0.05) * e;
      m.body.setNextKinematicTranslation({ x: m.mid.x, y, z: m.mid.z });
      m.mesh.position.y = y;
      if (m.t > m.life - 1.2) { const s = Math.sin(m.t * 40) * 0.03; m.mesh.position.x = m.mid.x + s; }
      if (m.t > m.life) this.crumble(m);
    }
  }

  clear() {
    for (const m of [...this.manifests]) this.crumble(m);
    this.cancel();
  }
}
