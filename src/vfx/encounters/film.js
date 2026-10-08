// ---------------------------------------------------------------------------------------
// THE ENCOUNTER FILM: an encounter at sea played as a short cinematic before its choice (docs/plans/PASSAGE.md section 13; the owner:
// "cinematic encounters at sea like a Rest site hybridized with an Event node"). The trip (world/emocean/triprun.js) asks it to play
// as an encounter's leg begins, and offers the choice when it says it is done; the tableau (vfx/encounters/tableaux.js) is laid on the crude
// in the rail's frame, alongside the ship or ahead of it on the water, and its sequence (vfx/encounters/sequences.js, 'sea.<id>') is
// played by game.cine over it. The choice made (the stage's `encounter.chosen`), or the leg left, the camera is given back to the rail
// and the tableau is put away. While it plays the sea is laid down (a rest: mostly calm; the Glass flat).
// A passage's tableaux are built and their programs compiled as it casts off (`prepare`, under the seam's cover), so nothing compiles mid-run.
//
// Prior art: FTL's events and Sunless Sea's storylets (a picture, then the choice), Wind Waker's sea encounters, and this game's own
// sequences (cine/sequence.js: a camera authored against anchors, played wherever they stand).
//
//   game.encounterFilm = new EncounterFilm(game)   .prepare(ids, { hull })   .play(id, { feel, hull, onDone }) -> bool   .update(raw)
//   .stop()   .live -> { id, t } | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { buildTableau } from './tableaux.js';
import { SEA_FILM } from './sequences.js';

const _v = new THREE.Vector3(), _d = new THREE.Vector3();

export class EncounterFilm {
  constructor(game) { this.game = game; this.tableaux = new Map(); this.live = null; }

  get stage() { return this.game.emocean; }

  /** A tableau for an encounter (and the hull it is met in: the Glass's double is your own), built once and kept. */
  tableau(id, { hull = 'sloop', feel = null } = {}) {
    const key = id === 'mirrorSea' ? `${id}:${hull}` : id;
    if (!this.tableaux.has(key)) {
      const s = buildTableau(id, { env: this.game.sky?.env || null, hull, feel }); if (!s) return null;
      s.holder = new THREE.Group(); s.holder.add(s.group); s.holder.visible = false; s.holder.userData.zoneFree = true;
      this.game.scene?.add(s.holder); this.tableaux.set(key, s);
    }
    return this.tableaux.get(key);
  }

  /** The passage's encounters built and compiled now (cast-off: the seam covers it). */
  prepare(ids = [], { hull = 'sloop' } = {}) {
    const r = this.game.renderer, cam = this.game.camera;
    for (const id of ids) {
      const s = this.tableau(id, { hull }); if (!s || s.compiled) continue;
      s.holder.visible = true; s.tick(0, { camera: cam, k: 0 });
      try { r?.compile?.(s.holder, cam, this.game.scene); } catch { /* (a renderer without compile: it compiles on first draw) */ }
      s.holder.visible = false; s.compiled = true;
    }
  }

  /** Play an encounter's film; `onDone` when its last shot is held (the choice may come). False if it cannot be filmed. */
  play(id, { feel = null, hull = 'sloop', onDone = null } = {}) {
    const g = this.game, E = this.stage, cine = g.cine, name = `sea.${id}`;
    if (!E?.rail || !cine?.sequences?.[name]) return false;
    this.stop();
    const s = this.tableau(id, { hull, feel }); if (!s) return false;
    const R = E.rail; R.dirWorld(_d.set(0, 0, 1), _d);
    const yaw = Math.atan2(_d.x, _d.z);
    s.local = new THREE.Vector3(s.at[0], 0, s.at[1]); s.holder.quaternion.copy(R.q); R.toWorld(s.local, s.holder.position);
    s.holder.visible = true;
    const ship = () => E.ship?.sloop?.group.position || R.Q, subject = () => s.subject.getWorldPosition(_v);
    this.live = { id, s, t: 0, done: false, onDone };
    this.live.h = cine.play(name, { anchors: { ship, tableau: () => s.holder.position, subject }, yaw, on: { done: () => this.finish() } });
    g.events?.emit('passage.film', { encounter: id, by: 'environment' });
    return true;
  }

  finish() { const L = this.live; if (!L || L.done) return; L.done = true; L.onDone?.(); }

  /** Once a frame (after the stage, before the cinema): the tableau carried in the rail's frame, ticked; ended when the choice is made. */
  update(raw) {
    const L = this.live; if (!L) return;
    const E = this.stage, st = E?.stage;
    if (!st?.active || (L.done && (!st.encounter || st.encounter.chosen))) { this.stop(); return; }
    L.t += raw; const s = L.s, k = Math.min(1, L.t / SEA_FILM.dur), R = E.rail;
    if (s.motion === 'alongside') { s.local.z += s.vz * (1 - k) * raw; s.holder.quaternion.copy(R.q); R.toWorld(s.local, s.holder.position); }
    const sea = E.sea, bob = sea?.heightAt ? sea.heightAt(s.holder.position.x, s.holder.position.z) : 0;
    s.tick(L.t, { camera: this.game.camera, k, bob });
    if (sea?.set) sea.set({ calm: Math.max(sea.k?.calm ?? 0, (s.calm ?? 0.7) * Math.min(1, L.t * 1.5)) }); // (laid down for the film: the stage sets its own again next frame)
    if (L.t > SEA_FILM.dur + 0.5 && !L.done) this.finish(); // (a sequence that never called its cue)
  }

  stop() {
    const L = this.live; if (!L) return;
    L.h?.stop?.(); L.s.holder.visible = false; this.live = null;
    if (!L.done) L.onDone?.();
  }
}
