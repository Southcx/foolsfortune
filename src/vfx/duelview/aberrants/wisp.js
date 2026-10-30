// ---------------------------------------------------------------------------------------
// THE ABERRANT LANTERN WISP AS AN ELITE (docs/plans/ABERRANTS.md 3; South, 2026-10-28: "from the style of the Zone of Influence to the
// special attacks and cut-ins used, to a bespoke death cinematic"): the Wisp's own layers of the duel's look.
//   ITS GROUND     the fens at night on its side of the domains' clash (domains.js `setStyle(1, dark)`): black water under fog, reeds
//                  against the sky, its lantern the one warm light on it and in the water; the dark closing in as the fuel goes
//   ITS LANTERN    the secret (Dovina's `snuff`, secrets.js) drawn on the body only: the lantern's light dimming and guttering with the
//                  fuel taken (`state.secret.k`: lanternwisplook.js `dim` and `gutter`), no gauge (ABERRANTS.md 4); once the secret is
//                  known (`game.foeSeen.found('snuff')`) the fuel left as a plain count over the lantern in the System's type
//   KINDLE         its own foe skill: a flame flung from the lantern to each of your Dread gems, each flaring and burnt down to an ember
//   ITS DEATHS     the Line's: the lantern cracking, its glass flying, the flame scattered (the Figment's scatter, figmentscatter.js);
//                  the secret's: the lantern guttering out, the flame drawn down into it, the fog swallowing the light, a held beat in
//                  the dark (the cut-in's veil), then the light back. Petra's session times them (`view.death(how)`).
// Programs: the bursts', the words', the clash's and the cut-in's: nothing new.
// Prior art: the will-o'-the-wisp of the fens (a light that leads you astray: you beat one by putting it out), Amnesia's lantern oil
// guttering, Hollow Knight's and Dark Souls' boss deaths (an ending of its own), Monster Hunter's capture beside the kill.
//
//   const E = new WispElite(view)   E.open(state, foe)   E.update(dt)   E.kindle(beats, e) -> phase   E.death(how) -> { dur, drainAt, step, end }   E.close()
//   (drainAt: real s into it when its body is gone and an aberrant's data drain may begin, its tail still playing: aberrantdrain.js)
//   WISP_ELITE (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../../ui/theme.js';
import { secretOf, SECRETS } from '../../../progress/duel/secrets.js';
import { cellLocal, sm, clamp01, lerp } from '../layout.js';

/** dimMin: the lantern's light at the last of its fuel; ease: how fast the drawn state follows the kernel's (/s); kindle: the cast's
 *  flight and its stagger (real s); the deaths' beats (real s from their start; drain: when its body is gone and an aberrant's data
 *  drain may begin). */
export const WISP_ELITE = { dimMin: 0.12, ease: 2, kindle: { fly: 0.45, per: 0.08, burn: 0.3 },
  line: { crack: 0.25, scatter: 0.5, dur: 1.6, drain: 1.3 }, secret: { gutter: 1.0, draw: 0.7, snuff: 1.3, dark: 0.6, hold: 0.8, back: 0.4, drain: 2.2 } };
const AMBER = 0xffb060, GLASS = 0xf4e6c8, EMBER = 0xff6a2a, DREAD = 0x4fa86a, INK = '#17111f';
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** The fuel left as a plain count, the System's type, white on an ink keyline. */
function countTexture(n) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  x.font = `bold 46px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.lineWidth = 9; x.strokeStyle = INK; x.strokeText(String(n), 64, 34); x.fillStyle = '#ffe2b0'; x.fillText(String(n), 64, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class WispElite {
  /** The cut-in's motif behind this aberrant's bands (cutin.js: 3 briars and lanterns). */
  static MOTIF = 3;
  constructor(view) {
    this.view = view; this.on = false; this.dark = 0; this.counts = new Map(); this.shown = -1;
    this.count = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.16), new THREE.MeshBasicMaterial({ name: 'duel-word', map: null, transparent: true, depthWrite: false, toneMapped: false })); // (the words' own program, juice.js)
    this.count.visible = false; this.count.renderOrder = 9; view.frame.add(this.count);
  }

  /** Whether a duel is the aberrant Wisp's (its ruleset's secret is the lantern's). */
  static fits(state, foe) { return state?.style === 'pve' && (state.rs?.secret === 'snuff' || foe?.kind === 'wisp'); }

  open(state, foe) { this.on = WispElite.fits(state, foe); this.foe = foe; this.dark = 0; this.view.clash.setStyle(this.on ? 1 : 0, 0); }

  close() {
    const L = this.foe?.look; if (L) { L.dim = 1; L.gutter = 0; }
    if (this.foe?.model && this.foe.alive !== false) this.foe.model.visible = true;
    this.on = false; this.foe = null; this.count.visible = false; this.view.clash.setStyle(0, 0);
  }

  /** Where the lantern is, in the board's frame (its bone, else over the body). */
  lanternAt(out) { const f = this.foe; if (f?.lantern) return this.view.frame.worldToLocal(f.lantern.getWorldPosition(out)); return this.view.foeCast.head(out); }

  update(dt) {
    if (!this.on || this.dying) return;
    const V = this.view, S = secretOf(V.state), k = S?.k ?? 0, L = this.foe?.look;
    this.dark += (k - this.dark) * Math.min(1, dt * WISP_ELITE.ease);
    V.clash.setStyle(1, this.dark);
    if (L) { L.dim = lerp(1, WISP_ELITE.dimMin, this.dark); L.gutter = this.dark; }
    const found = !!V.game.foeSeen?.found?.('snuff') && S && S.fuel != null && V.state?.secret;
    this.count.visible = !!found;
    if (found) { const n = Math.max(0, Math.round((SECRETS[S.id]?.fuel ?? 24) - (S.fuel || 0)));
      if (n !== this.shown) { let t = this.counts.get(n); if (!t) { t = countTexture(n); this.counts.set(n, t); } this.count.material.map = t; this.count.material.needsUpdate = true; this.shown = n; }
      this.lanternAt(this.count.position); this.count.position.y += 0.32; this.count.position.z += 0.08; }
  }

  /** Kindle: a flame flung from the lantern to each Dread gem it takes, the gem flaring and burnt down to an ember (its piece swapped). */
  kindle(T, e) {
    const V = this.view, P = V.pieces, K = WISP_ELITE.kindle, from = this.lanternAt(new THREE.Vector3()), cells = e.cells || [], done = new Set();
    cells.forEach((c, i) => V.foeCast.fling(from, cellLocal(c.at[0], c.at[1], V.board3, new THREE.Vector3()), EMBER, { delay: i * K.per, life: K.fly, size: 0.03, arc: 0.6 }));
    const burn = (c) => { const v = P.byId(c.from); if (v) P.remove(v); if (!P.byId(c.id)) P.add('ember', { id: c.id, count: V.state?.rs?.embers?.count ?? 3, side: 0 }, c.at[0], c.at[1]);
      cellLocal(c.at[0], c.at[1], V.board3, _a); V.bursts.burst(_a, EMBER, 8, { speed: 0.8, life: 0.45, fall: -1.5, size: 0.022 }); V.bursts.burst(_a, DREAD, 4, { speed: 0.4, life: 0.4, fall: 0, size: 0.02 }); };
    return { events: [e], dur: K.fly + cells.length * K.per + K.burn, step: (u, age) => { cells.forEach((c, i) => { const v = P.byId(c.from), at = i * K.per + K.fly;
      if (v && age > at - 0.12) v.flash = Math.min(1, (age - at + 0.12) / 0.12);
      if (age >= at && !done.has(i)) { done.add(i); burn(c); } }); },
      end: () => cells.forEach((c, i) => { if (!done.has(i)) burn(c); }) };
  }

  /** One of its two deaths as a timeline the session plays (Petra's): 'line' or 'secret'. */
  death(how) {
    const V = this.view, g = V.game, f = this.foe, at = this.lanternAt(new THREE.Vector3()), L = f?.look; this.dying = true; this.count.visible = false;
    if (how === 'line') { const D = WISP_ELITE.line; let cracked = false, scattered = false;
      return { dur: D.dur, drainAt: D.drain, step: (age) => {
        if (!cracked && age >= D.crack) { cracked = true; V.bursts.burst(at, GLASS, 16, { speed: 1.6, life: 0.6, fall: 4, size: 0.025 }); V.bursts.burst(at, AMBER, 10, { speed: 1.0, life: 0.5, fall: 0, size: 0.03 }); V.stage?.jolt?.(0.8); g.glitch?.pulse?.({ split: 0.1, tear: 0.06, dur: 0.2 }); if (L) { L.dim = 1.6; L.gutter = 1; } }
        if (!scattered && age >= D.scatter) { scattered = true; if (f && g.figmentScatter) g.figmentScatter.play(f, { hide: true }); else if (f?.model) f.model.visible = false; } },
        end: () => { this.dying = false; } };
    }
    const D = WISP_ELITE.secret, dim0 = L?.dim ?? 1, flames = []; let snuffed = false;
    f?.model?.traverse?.((o) => { if (o.isMesh && /Flame/i.test(o.material?.name || '')) flames.push({ o, s: o.scale.clone() }); });
    const tEnd = D.snuff + D.dark + D.hold + D.back;
    return { dur: tEnd, drainAt: D.drain, step: (age) => {
      const gu = clamp01(age / D.gutter); if (L) { L.dim = lerp(dim0, 0.02, gu); L.gutter = 1; }
      const dr = clamp01((age - (D.snuff - D.draw)) / D.draw); for (const q of flames) q.o.scale.copy(q.s).multiplyScalar(Math.max(0.001, 1 - sm(dr)));
      if (!snuffed && age >= D.snuff) { snuffed = true; g.vfx?.play?.('wisp.snuff', { pos: f?.lantern ? f.lantern.getWorldPosition(new THREE.Vector3()) : at.clone() }); if (f?.model) f.model.visible = false; }
      V.clash.setStyle(1, Math.min(1.4, this.dark + sm(clamp01((age - D.snuff + 0.3) / D.dark)) * 1.2));
      const veil = age < D.snuff + D.dark + D.hold ? sm(clamp01((age - D.snuff + 0.2) / D.dark)) : 1 - sm(clamp01((age - D.snuff - D.dark - D.hold) / D.back));
      V.cutIn?.veil?.(veil * 0.92); },
      end: () => { for (const q of flames) q.o.scale.copy(q.s); V.cutIn?.veil?.(0); this.dying = false; } };
  }
}
