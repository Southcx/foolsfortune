// ---------------------------------------------------------------------------------------
// RAISING THE SPIRITS: what the god hand does for the Figments bound to you, in the garden (docs/plans/SPIRIT-GARDEN.md section 5; the
// numbers and rules are Dovina's: progress/spirits.js for stats, feeding, bond, alignment and forms, progress/realm.js for the drills and
// their fatigue). A bound Figment (creatures/bound.js) is given a spirit's sheet the first time it hops out (five stats, a feeling, its
// bond and side), kept with it in the save. The hand PETS it (a quick tap on it: toward Law, a little bond) or FLICKS it (the right
// button: toward Chaos); F at it opens its page: FEED it from the Pneuka Box (a Well's material raises its stat, a curio its bond, a
// cask leans its feeling), DRILL it at a drill yard (one stat up, tiring; rest takes it away, a game hour at a time), take it OUT with
// you (one at a time: it walks the world as an ally, creatures/spirits.js), or RELEASE it. At the thresholds it MATURES into a form, its
// strongest feeling on its side of the line: 5 x 3 a kind (the forms' looks are Calissa's: vfx/garden/forms.js). A spirit
// standing at a feature WORKS there (Palworld): the feature and the spirit say so (`work`); what work adds is Dovina's (progress/garden.js).
// Events (each with `by`): spirit.feed { item, stat, gain }, spirit.pet, spirit.flick, spirit.drill { stat, gain }, spirit.mature
// { feeling, side }, spirit.out, spirit.release, each carrying `spirit` (its name: the bus's own `name` is the event's).
//
// Prior art: Sonic Adventure's Chao (fed, petted, matured by what you gave it), Black & White's creature (the hand's pat and slap
// teaching it), Monster Rancher's drills and their fatigue, Jade Cocoon's spirits that walk beside you, Palworld's work at a station.
//
//   const R = new Raising(game, realm)   R.ready(entry)   R.pet(s)   R.flick(s)   R.feed(s, slot)   R.drill(s, id)   R.rest(gameHours)
//   R.page(s)   R.work(spirits, plots)   R.out (the entry out with you) | null   R.lookOf(s)   (s: the realm's spirit { e, mesh, hop })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { fresh, feed as feedSheet, formOf, ALIGN, STATS } from '../../progress/spirits.js';
import { DRILLS, FATIGUE, drillGain } from '../../progress/realm.js';
import { itemOf } from '../../pneuka/items.js';
import { dressForm } from '../../vfx/garden/forms.js';

const FEELINGS = Object.keys(STATS);
export const spiritName = (e) => e?.name || { slipjelly: 'slip jelly', clapperjar: 'clapperjar' }[e?.kind] || String(e?.kind || 'a spirit').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); // (its name, else its kind as said, never the code id: GARDEN-SWEEP #14)
const DRILL_NAME = { sprint: 'a sprint', scout: 'a scouting', haul: 'a haul', swim: 'a swim', sit: 'a sitting' }; // (a drill as said: Espada's to word)
const PET_BOND = 0.5; // (a pat's bond: two hundred to fill a heart from nothing, so food and gifts matter more than fuss)

export class Raising {
  constructor(game, realm) { this.game = game; this.realm = realm; }
  get out() { return (this.game.bound?.list || []).find((e) => e.out) || null; }

  /** A bound entry given its sheet, the first time it is raised (its feeling from its kind and when it was caught: the same every load). */
  ready(e) {
    if (e.sp) return e.sp;
    const h = [...`${e.kind}${e.at || 0}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    e.sp = { ...fresh(e.kind, e.cls || 0, FEELINGS[h % FEELINGS.length]), fatigue: 0 };
    this.game.save?.dirty('bound');
    return e.sp;
  }
  say(type, s, extra = {}) { this.game.events?.emit(type, { kind: s.e.kind, spirit: s.e.name || null, feeling: s.e.sp?.feeling, pitch: 1.4 - 0.15 * (s.e.cls || 0), ...extra, by: 'courier' }); }

  pet(s) { const S = this.ready(s.e); S.align = Math.max(-1, S.align + ALIGN.pet); S.bond = Math.min(100, S.bond + PET_BOND); s.hop.vel.addScaledVector(s.hop.up, 3); this.say('spirit.pet', s); this.mature(s); this.dirty(); }
  flick(s) { const S = this.ready(s.e); S.align = Math.min(1, S.align + ALIGN.flick); s.hop.vel.addScaledVector(s.hop.up, 5).addScaledVector(this.realm.cam.fwd, 4); s.hop.grounded = false; this.say('spirit.flick', s); this.dirty(); }

  /** Feed it what lies in a box slot: a material (its stat by tier), a curio (its bond), a cask (its feeling). */
  feed(s, slot) {
    const g = this.game, it = g.pneuka?.slots[slot]; if (!it) return false;
    const def = itemOf(it.id) || {}, S = this.ready(s.e), item = {};
    if (it.id.startsWith('mat.')) { item.kind = it.data?.kind || it.id.slice(4); item.tier = it.data?.tier ?? 0; }
    else if (def.kind === 'curio') { item.curio = true; item.tier = def.tier ?? 0; }
    else if (it.id.startsWith('cask.')) item.grade = it.id.slice(5);
    else return false;
    const got = feedSheet(S, item);
    if (!Object.keys(got).length) return false;
    g.pneuka.take(slot);
    const stat = Object.keys(got).find((k) => STATS[k]) || (got.bond ? 'bond' : got.feeling ? 'feeling' : null);
    this.say('spirit.feed', s, { item: it.id, stat, gain: typeof got[stat] === 'number' ? got[stat] : 0 });
    this.mature(s); this.dirty();
    return true;
  }

  /** A drill at a drill yard (one placed in the garden): one stat up by less the higher it is, the spirit tired by it. */
  drill(s, id) {
    const D = DRILLS[id], S = this.ready(s.e); if (!D) return 0;
    const gain = drillGain(S.stats[D.stat], S.fatigue, D.gain);
    S.stats[D.stat] = Math.min(999, S.stats[D.stat] + gain);
    S.fatigue = Math.min(100, S.fatigue + FATIGUE.perDrill);
    this.say('spirit.drill', s, { stat: D.stat, gain });
    if (gain) this.mature(s);
    this.dirty();
    return gain;
  }
  /** Rest, a game hour at a time: every spirit's fatigue falls. */
  rest(hours) { for (const e of this.game.bound?.list || []) if (e.sp?.fatigue > 0) e.sp.fatigue = Math.max(0, e.sp.fatigue - FATIGUE.perHour * hours); }

  /** At its thresholds it matures, once: its form is its strongest feeling and its side (Calissa's 15 a kind to come). */
  mature(s) {
    const S = s.e.sp; if (!S || S.form) return;
    const f = formOf(S); if (!f) return;
    S.form = f; this.lookOf(s);
    this.say('spirit.mature', s, { feeling: f.feeling, side: f.side });
  }
  /** Its look once it has a form: Calissa's (vfx/garden/forms.js: its feeling's element and colour, a halo for Law, horns for Chaos). */
  lookOf(s) {
    const f = s.e.sp?.form; if (!f || s.formed) return;
    if (!s.mat) { s.mat = s.mesh.material.clone(); s.mesh.material = s.mat; }
    s.formed = dressForm(s.mesh, { feeling: f.feeling, side: f.side, size: 0.42 });
  }

  /** Who works where: a spirit standing within 3 m of a placed feature (or a bed or a pavilion) works it, as long as it stays. */
  work(spirits, plots) {
    for (const s of spirits) {
      if (!s.hop.grounded) continue;
      const p = plots.near(s.hop.pos, 3), job = p?.placed?.feature || this.realm.place.features.find((f) => (f.kind === 'bed' || f.kind === 'slot') && f.pos.distanceTo(s.hop.pos) < 3)?.kind || null;
      if (job !== s.e.work) { s.e.work = job; this.dirty(); }
    }
  }

  /** Its page (F at it): its sheet, and what the hand can do for it. */
  page(s) {
    const g = this.game, menu = g.indexMenu || g.course?.menu, S = this.ready(s.e), R = this.realm; if (!menu?.showPage) return;
    const open = () => menu.showPage('spirit', (im, el) => {
      const rows = el('div', 'rooms'), btn = (t, sub, run) => { const d = el('div', 'room', `<span class="n">❀</span><span><b>${t}</b><s>${sub}</s></span>`); if (run) d.onclick = () => { run(); open(); }; rows.appendChild(d); };
      const stats = Object.keys(STATS).map((f) => `${f} ${S.stats[f] ?? 0}`).join(' · '); // (in the order every page shows them: GARDEN-SWEEP #14)
      btn(`${spiritName(s.e)}${S.form ? `, ${S.form.feeling} ${S.form.side}` : ''}`, `${stats} · bond ${Math.round(S.bond)} · ${S.align < -ALIGN.third ? 'law' : S.align > ALIGN.third ? 'chaos' : 'neutral'} · tired ${Math.round(S.fatigue)}`, null);
      // feeding: what in the box it would take
      (g.pneuka?.slots || []).forEach((it, k) => {
        if (!it) return; const def = itemOf(it.id) || {};
        if (it.id.startsWith('mat.') || def.kind === 'curio' || it.id.startsWith('cask.')) btn(`Feed: ${def.name || it.id}`, it.id.startsWith('mat.') ? `raises ${Object.entries({ mechanism: 'mirth', arcane: 'wonder', edge: 'desire', provision: 'grief', eldritch: 'dread', roe: 'grief' }).find(([k2]) => it.id === `mat.${k2}` || it.data?.kind === k2)?.[1] || 'a stat'}` : def.kind === 'curio' ? 'raises its bond' : 'leans its feeling', () => this.feed(s, k));
      });
      if (R.plots?.plots.some((p) => p.placed?.feature === 'drillYard')) for (const [id, D] of Object.entries(DRILLS)) btn(`Drill: ${DRILL_NAME[id] || id}`, `${D.stat}${S.fatigue >= FATIGUE.fail ? ' (too tired)' : ''}`, () => this.drill(s, id));
      btn(s.e.out ? 'Stay in the garden' : 'Come out with me', s.e.out ? 'it waits here' : 'one at a time: it walks the world beside you', () => this.setOut(s.e, !s.e.out));
      btn('Release it', 'it goes, for good', () => { R.release(s); menu.close(); });
      im.appendChild(el('div', 'grp', 'YOUR SPIRIT')); im.appendChild(rows);
    }, { title: spiritName(s.e).toUpperCase(), sub: 'click to choose · F closes' });
    open();
  }
  setOut(e, on) {
    for (const x of this.game.bound?.list || []) x.out = false;
    e.out = !!on; this.dirty();
    if (on) this.game.events?.emit('spirit.out', { kind: e.kind, spirit: e.name || null, by: 'courier' });
  }
  dirty() { this.game.save?.dirty('bound'); }
}
