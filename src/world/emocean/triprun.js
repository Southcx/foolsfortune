// ---------------------------------------------------------------------------------------
// THE TRIP AS SAILED: a drafted passage played as the rollercoaster (docs/plans/RAIL-OVERHAUL.md 2 and 6, PASSAGE.md 14; Petra's half
// of the split). The stage (stage.js) hands a crossing here when it sails a passage drafted at the sea chart; the crossing of old (the
// script's acts) still sails a direct hop. Here:
//   THE LAYOUT     the cue's (music/legs.js tripLayout, Wanda's): a launch, then a leg a waypoint (a turn of four bars between), each in
//                  its phases (open, build, peak, release; a calm none at its peak), an encounter six bars held, then the arrival.
//   THE LEGS       Dovina's runtime: the leg runner plays a waypoint's schedule (progress/rail/legs.js) into the waves and the pattern
//                  player, which fires the shot field (her files); at the peak the leg's director (the shoal, the Wreckers, Old Nobody)
//                  is started by the stage. The view is the phase's, the camera swinging at a phase's first bar.
//   THE PRESSURES  the hull carries leg to leg (trip.js arrive); a calm's campfire (heave to: caulk the hull or reckon the sea) and an
//                  encounter's choice are offered as their release begins, the cue holding while you choose (stage.campfire,
//                  stage.encounter: Wanda's hold); the tank burned waypoint by waypoint (stage.fuel, shown). Adrift is not yet sailed
//                  (the current would redraw the cue mid-trip: a later round).
//
// Prior art: Slay the Spire's act (the map drafted, then each room in turn, the campfire's choice), FTL's jumps, Star Fox 64's stages on
// the beat, Rez's areas.
//
//   const R = new TripRun(stage)   R.boot(scene)   R.begin(sailing) -> { bars, legs } | null   R.update(dt, bar)   R.viewAt(bar)
//   R.swings   R.stop()   R.parked()   R.show(on)
// ---------------------------------------------------------------------------------------
import { tripLayout } from '../../music/legs.js';
import { schedule } from '../../progress/rail/legs.js';
import { start, arrive, havenChoices, choose } from '../../progress/rail/trip.js';
import { ENCOUNTERS, pickEncounter } from '../../progress/rail/encounters.js';
import { SHIPS } from '../../progress/rail/ships.js';
import { ShotField } from './shotfield.js';
import { PatternPlayer } from './patternplayer.js';
import { LegRunner } from './legrunner.js';
import { stream } from '../../core/rng.js';

const MUSIC_ID = { leviathan: 'nobody' }; // (the cue's names for a leg where they differ from the waypoint's)
const CHOICE_WORD = { mend: 'Caulk the hull.', reckon: 'Reckon the sea.', fuel: 'Take on fuel.' }; // (Espada's words: the campfire is heaving to)
// each encounter's title and its choices' words (Espada's: docs/LORE.md, "The encounters at sea"); a choice not listed shows its `does`
const ENCOUNTER_WORDS = {
  ghostConvoy: { title: 'THE DEAD RECKONERS', follow: 'Follow them.', loot: 'Board the last ship.' },
  lettysCutter: { title: 'THE LAST WORD', bounty: 'Take her bounty.', sell: 'Sell her your rutter.' },
  lightWhale: { title: 'THE CANTOR', listen: 'Listen.', follow: 'Follow it down.' },
  castaway: { title: 'A RAFT ADRIFT', rescue: 'Take them aboard.', leave: 'Sail on.' },
  pursersBarge: { title: 'THE BOURSE', trade: 'Trade casks.', rutter: 'Buy today\'s rutter.' },
  mirrorSea: { title: 'THE GLASS', race: 'Race your double.', pass: 'Let it pass.' },
  driftBottle: { title: 'A DRIFT BOTTLE', read: 'Read it.' },
};

export class TripRun {
  constructor(stage) { this.st = stage; this.game = stage.game; this.active = false; this.swings = []; }

  boot(scene) {
    const S = this.st;
    this.field = new ShotField({ rail: S.rail }); this.field.build(scene);
    this.player = new PatternPlayer(this.field, { rng: stream('rail/patterns') });
    this.runner = new LegRunner({ waves: S.waves, player: this.player, object: () => S.piece?.emitter?.() || null, onDirector: (id) => S.startPiece(id), scene });
  }
  parked() { return this.field?.meshes || []; }
  show(on) { this.field?.show(on); }

  /** A passage sailed: its legs for the cue, the layout, the trip's state. Null for a direct hop (the old crossing). */
  begin(V) {
    this.active = false; if (!V?.passage?.waypoints?.length) return null;
    const P = V.passage, rng = stream('rail/encounters'), seen = {};
    this.wps = P.waypoints.map((w) => ({ ...w })); this.chart = P.chart;
    const legs = this.wps.map((w) => {
      const plan = w.type === 'encounter' ? null : schedule(w.type, { strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm });
      const enc = w.type === 'encounter' ? pickEncounter(seen, rng) : null; if (enc) seen[enc] = (seen[enc] || 0) + 1;
      const phases = plan ? Object.fromEntries(['open', 'build', 'peak', 'release'].map((id) => [id, (plan.phases.find((p) => p.id === id)?.to ?? 0) - (plan.phases.find((p) => p.id === id)?.from ?? 0)])) : null;
      return { id: MUSIC_ID[w.type] || w.type, type: w.type, aspect: w.feel || null, feeling: w.feel || null, storm: !!w.storm, encounter: enc, phases, plan };
    });
    this.layout = tripLayout(legs); this.legs = legs;
    this.state = start(V.ship || 'sloop'); this.k = -1; this.chosen = new Set();
    // the views by phase, and a swing at each phase whose view differs from the one before (the stage's camera grammar)
    this.views = []; let prev = 'chase';
    this.layout.legs.forEach((L, k) => {
      const plan = legs[k].plan;
      if (!plan) { this.views.push({ from: L.at, to: L.end, view: 'chase' }); return; }
      for (const ph of plan.phases) this.views.push({ from: L.at + ph.from, to: L.at + ph.to, view: ph.view || 'chase' });
    });
    this.swings = [];
    for (const v of this.views) { if (v.view !== prev) this.swings.push({ bar: v.from, from: prev, to: v.view }); prev = v.view; }
    this.active = true;
    const st = this.st.stage;
    st.legs = legs.map(({ plan, type, ...music }) => music); // (Wanda's cue reads these: music/legs.js tripCue)
    st.fuel = 1; st.adrift = false; st.campfire = null; st.encounter = null;
    return { bars: this.layout.bars, legs: st.legs };
  }

  viewAt(bar) { return ((this.views || []).find((v) => bar >= v.from && bar < v.to) || { view: 'chase' }).view; }

  /** Once a frame: the leg the bar is in begun, run and closed; the haven's choice offered at its release; the shots flown. */
  update(dt, bar) {
    if (!this.active) return;
    const S = this.st, k = this.layout.legs.findIndex((L) => bar >= L.at && bar < L.end);
    if (k !== this.k) {
      if (this.k >= 0) this.leave(this.k);
      this.k = k;
      if (k >= 0) this.enter(k);
    }
    if (k >= 0) {
      const L = this.layout.legs[k], leg = this.legs[k], rel = bar - L.at;
      if (leg.plan) this.runner.update(rel);
      // a haven's choice, as its release begins (an encounter's at once): the cue holds until it is made
      if (!this.chosen.has(k) && ((leg.type === 'calm' && L.release != null && bar >= L.release) || leg.type === 'encounter')) this.offer(k);
    }
    this.player.update(dt, S.ship);
    this.field.update(dt, { ship: S.ship, waves: S.waves });
  }

  enter(k) {
    const leg = this.legs[k], w = this.wps[k];
    if (leg.plan) this.runner.begin({ type: w.type, strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm });
    else this.runner.done = true;
    this.hitsAt = this.st.run.hits;
    this.game.events?.emit('passage.waypoint', { type: w.type, k, storm: !!w.storm, feel: w.feel || null, by: 'environment' });
  }
  leave(k) {
    const S = this.st, w = this.wps[k];
    if (S.piece) S.close();
    const hits = Math.max(0, S.run.hits - (this.hitsAt ?? S.run.hits));
    this.state = arrive(this.state, this.chart, w.id, { hits, cleared: true });
    // the hull carries: the run's hits are the hull's damage (trip.js); a haven's mend shows there
    S.run.hits = Math.max(0, (SHIPS[this.state.ship]?.bears ?? S.run.bears) - this.state.hull);
    S.stage.fuel = Math.max(0, Math.min(1, this.state.fuel / (SHIPS[this.state.ship]?.tank || 1)));
  }

  /** A calm's campfire or an encounter's choice, offered in the Index's window (the game holds; the cue holds: Wanda's). */
  offer(k) {
    const S = this.st, M = this.game.indexMenu, leg = this.legs[k], w = this.wps[k]; if (!M || S.offering) return;
    this.chosen.add(k); S.offering = true;
    const enc = leg.encounter && ENCOUNTERS[leg.encounter], st = S.stage;
    const opts = enc ? enc.choices.filter((c) => !(c.needs === 'dive' && !SHIPS[this.state.ship]?.dive)).map((c) => ({ id: c.id, word: ENCOUNTER_WORDS[leg.encounter]?.[c.id] || c.does }))
      : havenChoices(this.state, w).map((id) => ({ id, word: CHOICE_WORD[id] || id }));
    if (enc) { st.encounter = { id: leg.encounter, chosen: false }; this.state = { ...this.state, hull: Math.min(SHIPS[this.state.ship].bears, this.state.hull + (enc.mend || 0)) }; }
    else st.campfire = { chosen: false };
    const pick = (id) => {
      if (!enc) this.state = choose(this.state, id);
      if (st.encounter) st.encounter.chosen = true; if (st.campfire) st.campfire.chosen = true;
      S.run.hits = Math.max(0, (SHIPS[this.state.ship]?.bears ?? S.run.bears) - this.state.hull);
      S.stage.fuel = Math.max(0, Math.min(1, this.state.fuel / (SHIPS[this.state.ship]?.tank || 1)));
      if (id === 'reckon' || id === 'listen') { const V = this.game.voyage, s = V.sailing; if (s) V.reckon(s.from, s.to, Math.min(1, V.reckoning(s.from, s.to) + 0.25), null); }
      this.game.events?.emit(enc ? 'passage.encounter' : 'passage.campfire', { encounter: leg.encounter || null, choice: id, hull: this.state.hull, by: 'courier' });
      S.offering = false; M.close();
    };
    M.showPage(enc ? 'encounter' : 'campfire', (im, el) => {
      const box = el('div', 'rooms');
      for (const o of opts) { const d = el('div', 'room', `<span class="n">·</span><span><b>${o.word}</b></span>`); d.onclick = () => pick(o.id); box.appendChild(d); }
      im.appendChild(box);
    }, { title: enc ? (ENCOUNTER_WORDS[leg.encounter]?.title || 'A SIGHTING') : 'HEAVING TO', sub: enc ? 'choose one' : 'the sea lies still a while' }); // (Espada's words)
  }

  stop() { this.active = false; this.field?.clear(); this.player?.stop(); if (this.runner) this.runner.done = true; const st = this.st.stage; st.legs = null; st.campfire = null; st.encounter = null; st.fuel = null; }
}
