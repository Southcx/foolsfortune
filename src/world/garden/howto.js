// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S HOW-TO, PLAYED (South, 2026-10-30: "The Spirit garden is a notorious culprit of lacking any form of
// tutorialization"; Dovina's steps and words in progress/gardenhowto.js GARDEN_HOWTO, GIFT; docs/plans/SEEDS-SLABS-SCANS.md 6): the
// seven steps one at a time in a System window in the Clay dress at the top of the view (clear of the log, bottom-left, and the instruments, right), the garden camera eased to each step's spot
// (`show`: the Pneuka Jar, the shed, the open sky of the ring, the lotus to the Athanor, the plate shrine, the carving bench) as a
// station's view (gardencam.js enterPress, named 'howto'), and let go at the end. It plays once the realm is named on the first entry
// until it has been finished or skipped once (the ledger's `garden.howto`, by tracking/gardengrowth.js), and again on /howto in the
// garden. The first entry also gives the clay's starter (GIFT: one spirit slab, `from: 'gift'`, by the environment, counting nothing),
// once, kept in the realm's own save (`gift`), so the plate shrine and the bench have something to teach with.
// Keys while it stands: Enter or → the next step, ← the one before; SKIP is its button (Esc is the pause menu's); on touch its buttons. It never takes the frame: the Jar
// still hops under it.
// Events: garden.howto { done: bool, by: 'courier' } (done false: skipped), slab.make { kind, stars, from: 'gift', by: 'environment' }.
// The ring round each spot is Calissa's to draw (asked); the camera's framing carries it until then.
//
// Prior art: Raku's tables' how-to (world/bazaar/session.js showHowto: a step a page, NEXT and SKIP), Animal Crossing's first day (one
// thing shown at a time, the camera taken to it), and every coach-mark tour's spotlight.
//
//   realm.howto = new GardenHowto(realm)   .open()   .step(+1 | -1)   .close(done)   .gift()   .update(dt)   .showing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GARDEN_HOWTO, GIFT, gardenHowtoSeen } from '../../progress/gardenhowto.js';
import { deviceText } from '../../progress/devicewords.js';
import { brineFrame } from '../../ui/brineframe.js';
import { clayDress } from '../../ui/goalswindow.js';
import { FONT } from '../../ui/theme.js';

/** Each spot's view (gardencam.js's station numbers: lens in degrees, metres back, pitch down in degrees, real seconds in and out; `lift`:
 *  metres the look is raised over the spot, so the thing stands below the window at the top of the view). */
const VIEW = {
  near: { lift: 1.4, fov: 50, dist: 7, pitch: 38, north: 0, in: 0.9, out: 0.6, zoom: 1 },
  mid: { lift: 2.6, fov: 50, dist: 13, pitch: 34, north: 0, in: 1.0, out: 0.6, zoom: 1 },
  far: { lift: 0, fov: 50, dist: 26, pitch: 30, north: 0, in: 1.1, out: 0.6, zoom: 1 },
};
const SPOT_VIEW = { jar: 'near', hand: 'near', shed: 'mid', ring: 'far', lotus: 'near', shrine: 'near', bench: 'near' };

const CSS = `
.gh{position:fixed;left:50%;top:calc(16*var(--d));z-index:6;width:min(calc(260*var(--d)),92vw);transform:translateX(-50%);opacity:0;transition:opacity .3s}
.gh.on{opacity:1}
.hud-touch .gh{left:57%;width:min(360px,48vw)} /* (a phone: clear of the top bar and the log's ticker on the left, the Sight and the art bar on the right) */
${clayDress('.gh.clay')}
.gh-n{font-family:${FONT.title};font-size:calc(8*var(--d));letter-spacing:.16em;opacity:.7}
.gh-say{font-size:calc(10*var(--d));line-height:1.3;margin:calc(3*var(--d)) 0 calc(4*var(--d))}
.gh-acts{display:flex;gap:calc(4*var(--d));justify-content:flex-end}
.gh-acts button{font:inherit;font-family:${FONT.title};font-size:calc(9*var(--d));letter-spacing:.12em;padding:calc(2*var(--d)) calc(6*var(--d));min-height:32px;
  background:rgba(30,12,6,.55);color:inherit;border:var(--d) solid rgba(255,226,196,.35);cursor:pointer}
.gh-acts button.go{border-color:#ffd36a;color:#ffd36a}
`;
let styled = false;
const style = () => { if (styled || typeof document === 'undefined') return; styled = true; const s = document.createElement('style'); s.setAttribute('data-gardenhowto', ''); s.textContent = CSS; document.head.appendChild(s); };

export class GardenHowto {
  constructor(realm) { this.R = realm; this.game = realm.game; this.i = -1; this.root = null; this.gifted = false; }
  get showing() { return this.i >= 0; }

  /** The clay's starter, once a save: one spirit slab in the Pneuka Box (by the environment: counted by nothing). */
  gift() {
    const g = this.game, box = g.pneuka; if (this.gifted || !box) return false;
    if (box.add('slab', 'gift', 0, { kind: GIFT.kind, stars: GIFT.stars, seed: 1009, from: 'gift' }) < 0) return false; // (a full box: tried again next entry)
    this.gifted = true; g.save?.dirty?.('realm');
    g.events?.emit('slab.make', { kind: GIFT.kind, stars: GIFT.stars, from: 'gift', by: 'environment' });
    return true;
  }

  /** Once a frame in the garden: due once named on the first entry, while nothing else holds the view. */
  update() {
    const R = this.R, g = this.game;
    if (!this.showing && !this.asked && R.name && !R.namingDue && !g.indexMenu?.open && !g.seam?.busy && !R.press?.viewing && !R.bench?.viewing && !gardenHowtoSeen(g)) { this.asked = true; this.open(); }
    if (!this.showing) return;
    if (R.press?.viewing || R.bench?.viewing) { this.close(false, true); return; } // (a station taken under it: put away, not counted)
    const I = g.input; if (g.log?.typing) return;
    if (I?.wasPressed?.('Enter') || I?.wasPressed?.('ArrowRight')) this.step(1);
    else if (I?.wasPressed?.('ArrowLeft')) this.step(-1);
  }

  open() {
    if (!this.R.active) return false;
    style(); this.i = 0; this.draw(); return true;
  }

  step(d) {
    const n = GARDEN_HOWTO.steps.length, i = this.i + d;
    if (i >= n) { this.close(true); return; }
    this.i = Math.max(0, i); this.draw();
  }

  /** Put away: `done` finished (false: skipped); `quiet` put away by the garden itself, nothing said. */
  close(done, quiet = false) {
    if (!this.showing) return;
    this.i = -1; this.root?.classList.remove('on');
    if (this.R.camera?.pv?.name === 'howto') this.R.camera.leavePress();
    if (!quiet) this.game.events?.emit('garden.howto', { done: !!done, by: 'courier' });
  }

  /** Where a step's spot is: { O, U, N } for the camera's station view. */
  spot(show) {
    const R = this.R, S = R.site, J = R.jarBody, at = (pos, planet) => { const U = pos.clone().sub(planet.c).normalize(), N = (R.camera?.fwd?.clone() || new THREE.Vector3(0, 0, 1)).projectOnPlane(U); if (N.lengthSq() < 1e-4) N.set(1, 0, 0).projectOnPlane(U); return { O: pos.clone(), U, N: N.normalize() }; };
    switch (show) {
      case 'shed': { const f = S.features.find((x) => x.kind === 'shed'); return f ? at(f.pos, f.planet) : null; }
      case 'shrine': { const f = S.features.find((x) => x.kind === 'hokora'); return f ? at(f.pos, f.planet) : null; }
      case 'bench': { const B = R.bench?.spot; return B ? { O: B.pos.clone(), U: B.up.clone(), N: B.N.clone() } : null; }
      case 'lotus': { const L = S.lotuses.find((l) => l.planet.id === 'dantian' && l.toPlanet.id === 'athanor'); return L ? at(L.pos, L.planet) : null; }
      case 'ring': { const D = S.by.dantian, U = J ? J.pos.clone().sub(D.c).normalize() : new THREE.Vector3(0, 1, 0); return { O: D.c.clone().addScaledVector(U, D.r + 14), U, N: (R.camera?.fwd?.clone() || new THREE.Vector3(0, 0, 1)).projectOnPlane(U).normalize() }; }
      default: return J ? at(J.pos, J.planet || S.by.dantian) : null; // (jar, hand: the Pneuka Jar where it stands)
    }
  }

  draw() {
    const g = this.game, st = GARDEN_HOWTO.steps[this.i], device = g.input?.device || 'keyboard';
    if (!this.root) {
      const root = (this.root = document.createElement('div')); root.className = 'gh clay';
      const F = brineFrame(root, { tab: GARDEN_HOWTO.title.toUpperCase() });
      this.n = F.body.appendChild(Object.assign(document.createElement('div'), { className: 'gh-n' }));
      this.say = F.body.appendChild(Object.assign(document.createElement('div'), { className: 'gh-say' }));
      const acts = F.body.appendChild(Object.assign(document.createElement('div'), { className: 'gh-acts' }));
      const btn = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; if (cls) b.className = cls; b.onclick = (e) => { e.stopPropagation(); fn(); }; acts.appendChild(b); return b; };
      btn('SKIP', '', () => this.close(false)); this.back = btn('BACK', '', () => this.step(-1)); this.next = btn('NEXT', 'go', () => this.step(1));
      for (const ev of ['pointerdown', 'mousedown', 'touchstart']) root.addEventListener(ev, (e) => e.stopPropagation()); // (a press on the window is never the hand's)
      document.body.appendChild(root); this.frame = F;
    }
    const n = GARDEN_HOWTO.steps.length, words = (device === 'touch' && st.touch) || st.say;
    this.n.textContent = `STEP ${this.i + 1} OF ${n}`;
    this.say.textContent = deviceText(words, device);
    this.back.style.visibility = this.i > 0 ? 'visible' : 'hidden'; this.next.textContent = this.i === n - 1 ? 'DONE' : 'NEXT';
    this.frame.layout?.(); requestAnimationFrame(() => this.root?.classList.add('on'));
    const s = this.spot(st.show), V = VIEW[SPOT_VIEW[st.show] || 'near']; if (s) { s.O.addScaledVector(s.U, V.lift); this.R.camera?.enterPress?.(s, V, 'howto'); }
  }
}
