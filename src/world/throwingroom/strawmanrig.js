// ---------------------------------------------------------------------------------------
// STRAWMAN'S RIG, THE ROOM'S SIDE: the console beside the sparring circle where Strawman is tuned (docs/plans/DUNEMAW-SYSTEMS.md 5; GAPS G25,
// G80, G81, G293), and `/strawman`. The rules, presets and scripted runs are Dovina's (progress/combat/strawmanrig.js); this puts a rig on
// the creature and runs a script's blows at it:
//   the console   a lectern in the combat wing by the circle (F): a page of rows, one a setting (click to step it round its options) and a
//                 row of presets above them; the settings that differ from the preset are marked. It goes with the Workshop (the room's).
//   the rig       applied to Strawman as fields creatures.strike already reads or the three hooks it was given: poise and stunFor (stun.js),
//                 `affinityOver` (constitution.js), `buildMult` (creatures.build), `friend` / `ally` (friendly fire's tolerance), `guardArc`
//                 (room.js's guard), the mental state held each frame (`mind`), the behaviour (setMode / the circle's string). Nothing here is
//                 the game's tuning: the tuned warning is not raised
//   a run         the preset and a fixed sequence of blows (SCRIPTS), struck through `creatures.strike` as the Courier's, the bout's line naming
//                 the setting when it ends; `/strawman run <preset> <script>`, `/strawman <preset>`, `/strawman` alone says the last bout
//
//   const R = new StrawmanRig(game, room)   R.apply(rig)   R.preset(id)   R.set(key, value, sub?)   R.step(key, sub?)   R.run(script)   R.update(dt, raw)
//   R.rig   R.label   R.page(im, el)   events: strawman.rig { label, preset }, strawman.run { script, preset, blows, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { RIG, OPTIONS, PRESETS, SCRIPTS, rigOf, labelOf, diffOf } from '../../progress/combat/strawmanrig.js';
import { STATES } from '../../progress/combat/mind.js';
import { susceptibility } from '../../progress/combat/temperament.js';
import { TYPES } from '../../progress/combat/types.js';
import { STRAWMAN_STRINGS } from '../../vfx/strawmanmoves.js';
import { TR } from './layout.js';

const PAGE = { title: "STRAWMAN'S RIG", sub: 'the test, not the game: presets and settings · F closes', aside: 'left' };
const AT = new THREE.Vector3(14.4, 0, -8.2), REACH = 1.8;
const STATUS_TYPES = ['ego', 'influence', 'illusion', 'delirium'];
const NAME = { o: 'Openness', c: 'Order', e: 'Boldness', a: 'Gentleness', n: 'Skittishness', mind: 'Mental state', affinity: 'Affinity', poise: 'Poise', stunFor: 'Stun lasts', friendly: 'Friendly-fire tolerance', guard: 'Guard arc', behaviour: 'Behaviour' };
const show = (k, v) => (k === 'friendly' ? (v ? 'on' : 'off') : k === 'guard' ? `${v} deg` : k === 'stunFor' ? `${v} s` : k === 'affinity' ? TYPES[v]?.name || v : String(v));
const _d = new THREE.Vector3();

export class StrawmanRig {
  constructor(game, room) {
    this.game = game; this.room = room; this.S = room.strawman;
    this.rig = rigOf('plain'); this.label = ''; this.script = null; this.t = 0; this.next = 0; this.struck = 0; this.behaviour = 'still';
    this.build();
    game.interact?.add('throwingRoom.rig', (P) => {
      const d = Math.hypot(P.pos.x - AT.x, P.pos.z - AT.z);
      return d < REACH && Math.abs(P.pos.y - TR.strawman.y) < 1.2 ? { pos: new THREE.Vector3(AT.x, 1.45, AT.z), d } : null;
    });
    this.apply(this.rig, true); // (the command is added at boot/chatcommands.js: the chat line is made after the rooms)
  }

  /** The lectern: a plain box, the combat wing's, named for Calissa (strawmanRigConsole). */
  build() {
    const g = this.game, grp = new THREE.Group(); grp.name = 'strawmanRigConsole';
    const wood = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.85 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.05, 0.3), wood); post.position.y = 0.525; grp.add(post);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), wood); top.position.y = 1.08; top.rotation.x = -0.35; grp.add(top);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.36), new THREE.MeshBasicMaterial({ color: PALETTE.glow })); face.position.set(0, 1.13, 0.02); face.rotation.x = -Math.PI / 2 - 0.35; grp.add(face);
    grp.position.copy(AT); grp.rotation.y = Math.PI / 2; g.scene.add(grp); this.console = grp;
    this.col = g.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 0.55, 0.3).setTranslation(AT.x, 0.55, AT.z).setCollisionGroups(GROUPS.static));
  }

  // ---------------------------------------------------------------- applying a rig to Strawman
  apply(rig, quiet = false) {
    const S = this.S, g = this.game; this.rig = rig; this.label = labelOf(rig);
    S.rig = rig; S.rigLabel = this.label;
    S.grain = { ...rig.grain };
    S.poise = rig.poise / susceptibility(rig.grain, 'impact'); S.stunFor = rig.stunFor;
    S.affinityOver = rig.affinity;
    S.buildMult = Object.fromEntries(STATUS_TYPES.map((t) => [t, rig.build[t] * susceptibility(rig.grain, t)]));
    S.friend = rig.friendly; S.ally = rig.friendly; S.guardArc = rig.guard;
    const held = rig.mind === 'free' ? null : STATES.findIndex((s) => s.id === rig.mind) - 2;
    S.mindHold = held; S.mindRest = held ?? 0; if (held != null) S.mind = held;
    const str = S.strings;
    if (rig.behaviour !== this.behaviour) { // (only a change of behaviour touches the stance and the circle's string)
      this.behaviour = rig.behaviour;
      if (rig.behaviour === 'still' || rig.behaviour === 'guard') { S.setMode(rig.behaviour); str?.pick(null); }
      else if (STRAWMAN_STRINGS[rig.behaviour]) { S.setMode('still'); str?.pick(rig.behaviour); }
    }
    if (!quiet) g.events?.emit('strawman.rig', { label: this.label, preset: rig.preset, by: 'courier' });
  }
  preset(id) { if (PRESETS[id]) this.apply(rigOf(id)); }
  /** One setting set (a grain dial by `sub`, a status's build-up by `sub`). */
  set(key, value, sub = null) {
    const r = { ...this.rig, grain: { ...this.rig.grain }, build: { ...this.rig.build } };
    if (key === 'grain') r.grain[sub] = value; else if (key === 'build') r.build[sub] = value; else r[key] = value;
    this.apply(r);
  }
  /** A setting stepped to the next of its options. */
  step(key, sub = null) {
    const opts = key === 'behaviour' ? ['still', 'guard', ...Object.keys(STRAWMAN_STRINGS)] : OPTIONS[key]; if (!opts) return;
    const cur = key === 'grain' ? this.rig.grain[sub] : key === 'build' ? this.rig.build[sub] : this.rig[key], i = opts.indexOf(cur);
    this.set(key, opts[(i + 1) % opts.length], sub);
  }

  // ---------------------------------------------------------------- a scripted run
  /** The preset (if given) and a script's blows, struck at the sparring circle's Strawman from where the Courier stands. */
  run(script, preset = null) {
    const D = SCRIPTS[script]; if (!D) return false;
    if (preset && PRESETS[preset]) this.preset(preset);
    this.script = D; this.t = 0; this.next = 0; this.struck = 0;
    this.game.events?.emit('strawman.run', { script, preset: this.rig.preset, blows: D.blows.length, by: 'courier' });
    return true;
  }
  update(dt, raw = dt) {
    const S = this.S, g = this.game;
    const P = g.player, it = g.interact?.cur;
    if (it?.id === 'throwingRoom.rig' && P?.peekLatch?.('KeyF')) { P.latch('KeyF'); g.course?.menu?.showPage?.("Strawman's rig", (im, el) => this.page(im, el), PAGE); }
    if (S.mindHold != null) S.mind = S.mindHold; // (held: the test's condition, not a creature's drift)
    const R = this.script; if (!R) return;
    this.t += raw;
    while (this.next < R.blows.length && R.blows[this.next].at <= this.t) {
      const b = R.blows[this.next++];
      _d.set(S.pos.x - P.pos.x, 0, S.pos.z - P.pos.z).normalize();
      g.creatures.strike(S, S.center(new THREE.Vector3()), _d.clone(), b.power, 'shot', 'courier', null, b.type);
      this.struck++;
    }
    if (this.next >= R.blows.length) this.script = null;
  }

  // ---------------------------------------------------------------- `/strawman`
  command(a = []) {
    const g = this.game, [w, p, q] = a;
    if (!w) { const b = this.S.last; g.events?.emit('strawman.ask', { label: this.label, preset: this.rig.preset, bout: b ? { blows: b.blows, seconds: b.seconds, damage: b.damage, perSecond: b.perSecond } : null, by: 'courier' }); return; }
    if (w === 'run') { if (!this.run(q || 'light', p)) g.log?.say('warn', `No script ${q}. The scripts: ${Object.keys(SCRIPTS).join(', ')}.`, { key: 'strawman.cmd', throttle: 1 }); return; }
    if (PRESETS[w]) { this.preset(w); return; }
    g.log?.say('warn', `No preset ${w}. The presets: ${Object.keys(PRESETS).join(', ')}.`, { key: 'strawman.cmd', throttle: 1 }); // (a refusal at the point of use)
  }

  // ---------------------------------------------------------------- the console's page
  /** The console's page: the presets, then each setting a row that steps round its options when clicked. */
  page(im, el) {
    const g = this.game, menu = g.course?.menu, again = () => menu?.showPage?.("Strawman's rig", (i2, e2) => this.page(i2, e2), PAGE), off = new Set(diffOf(this.rig));
    im.appendChild(el('div', 'grp', `PRESET · ${this.label || 'Strawman as it stands'}`));
    const pg = el('div', 'rooms');
    for (const [id, P] of Object.entries(PRESETS)) {
      const r = el('div', 'room', `<span class="n">${id === this.rig.preset ? '●' : '○'}</span><span><b>${P.label}</b><s>${P.line}</s></span>`);
      r.onclick = () => { this.preset(id); again(); }; pg.appendChild(r);
    }
    im.appendChild(pg);
    const rows = (title, list) => {
      im.appendChild(el('div', 'grp', title));
      const grid = el('div', 'rooms');
      for (const [name, key, sub, val, mark] of list) {
        const r = el('div', 'room', `<span class="n">${mark ? '◆' : '◇'}</span><span><b>${name}</b><s>${val}</s></span>`);
        r.onclick = () => { this.step(key, sub); again(); }; grid.appendChild(r);
      }
      im.appendChild(grid);
    };
    rows('GRAIN · the five dials', Object.keys(RIG.grain).map((k) => [NAME[k], 'grain', k, this.rig.grain[k], off.has('grain')]));
    rows('THE BODY', ['mind', 'affinity', 'poise', 'stunFor', 'friendly', 'guard', 'behaviour'].map((k) => [NAME[k], k, null, show(k, this.rig[k]), off.has(k)]));
    rows('STATUS BUILD-UP · x the usual', STATUS_TYPES.map((t) => [TYPES[t].name, 'build', t, `x${this.rig.build[t]}`, off.has('build')]));
    im.appendChild(el('div', 'grp', 'A SCRIPTED RUN · the preset and a fixed set of blows'));
    const sg = el('div', 'rooms');
    for (const [id, D] of Object.entries(SCRIPTS)) {
      const r = el('div', 'room', `<span class="n">▶</span><span><b>${D.label}</b><s>${D.line}</s></span>`);
      r.onclick = () => { menu?.close(); this.run(id); }; sg.appendChild(r);
    }
    im.appendChild(sg);
  }
}
