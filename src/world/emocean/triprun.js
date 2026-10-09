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
//                  stage.encounter: Wanda's hold); the tank burned waypoint by waypoint (stage.fuel, shown); a bunker short of every
//                  way on is adrift: the current takes the rest of the route, the legs ahead relaid (driftOn).
//   THE ASKS       an encounter's choice is Dovina's `apply` (encounters.js): its state taken, its asks done here (act): casks into the
//                  hold, a bounty paid on a leg ahead cleared, a rutter sold or bought, the Purser's counter, a ghost raced, a word found,
//                  portents told; the whale's hidden leg is sailed as the next fight leg in its form, paid at its rate (a leg of its
//                  own would relay the cue mid-leg). A squall cleared pays its leg's score at STORM.pays (trip.js legScore).
//
// Prior art: Slay the Spire's act (the map drafted, then each room in turn, the campfire's choice), FTL's jumps, Star Fox 64's stages on
// the beat, Rez's areas.
//
//   const R = new TripRun(stage)   R.boot(scene)   R.begin(sailing) -> { bars, legs } | null   R.update(dt, bar)   R.viewAt(bar)
//   R.swings   R.stop()   R.parked()   R.show(on)
// ---------------------------------------------------------------------------------------
import { tripLayout } from '../../music/legs.js';
import { schedule } from '../../progress/rail/legs.js';
import { start, arrive, havenChoices, choose, legScore, adrift, drift } from '../../progress/rail/trip.js';
import { ENCOUNTERS, pickEncounter, offered, apply, strengthOf } from '../../progress/rail/encounters.js';
import { rutterWorth, next } from '../../progress/econ/passage.js';
import { ECON } from '../../progress/econ/table.js';
import { worthOf } from '../../progress/shop/catalogue.js';
import { today } from '../../core/calendar.js';
import { SHIPS } from '../../progress/rail/ships.js';
import { ShotField } from './shotfield.js';
import { PatternPlayer } from './patternplayer.js';
import { LegRunner } from './legrunner.js';
import { stream } from '../../core/rng.js';
import { BAR_S } from '../../progress/rail/crossing.js';

const MUSIC_ID = { leviathan: 'nobody' };
const BAR_S_GUESS = 2; // (a bar's real seconds near enough for the barge's rutter price: stage.js BAR_S) // (the cue's names for a leg where they differ from the waypoint's)
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
    const P = V.passage;
    this.rng = stream('rail/encounters'); this.seen = {}; this.ghost = !!(P.chart && this.game.voyage?.bestOf?.(P.chart)); this.V = V;
    this.wps = P.waypoints.map((w) => ({ ...w })); this.chart = P.chart;
    this.legs = this.wps.map((w) => this.legOf(w));
    this.state = { ...start(V.ship || 'sloop'), plan: this.wps.map((w) => w.id) }; this.k = -1; this.chosen = new Set(); // (plan: "ahead" is the drafted path, encounters.js)
    this.bounty = null; this.hidden = null; this.race = null; this.filmed = null;
    this.game.encounterFilm?.prepare(this.legs.map((l) => l.encounter).filter(Boolean), { hull: V.ship || 'sloop' }); // (the encounters' sets built and compiled under the cast-off's cover: vfx/encounters/film.js, Calissa's)
    this.layOut();
    this.active = true;
    const st = this.st.stage;
    st.fuel = 1; st.adrift = false; st.campfire = null; st.encounter = null;
    return { bars: this.layout.bars, legs: st.legs };
  }

  /** A waypoint's leg: its schedule (Dovina's), its encounter drawn, its phases as the cue lays them, its music. */
  legOf(w) {
    const plan = w.type === 'encounter' ? null : schedule(w.type, { strength: w.strength ?? 1, feel: w.feel ?? null, storm: !!w.storm });
    const enc = w.type === 'encounter' ? pickEncounter(this.seen, this.rng, { ghost: this.ghost }) : null; if (enc) this.seen[enc] = (this.seen[enc] || 0) + 1;
    const phases = plan ? Object.fromEntries(['open', 'build', 'peak', 'release'].map((id) => [id, (plan.phases.find((p) => p.id === id)?.to ?? 0) - (plan.phases.find((p) => p.id === id)?.from ?? 0)])) : null;
    return { id: MUSIC_ID[w.type] || w.type, type: w.type, aspect: w.feel || null, feeling: w.feel || null, storm: !!w.storm, encounter: enc, phases, plan };
  }

  /** The legs laid as the cue lays them (Wanda's tripLayout), the views by phase, a swing at each phase whose view differs from the
   *  one before (the stage's camera grammar), and the legs handed to the cue (music/legs.js tripCue reads stage.legs). */
  layOut() {
    const legs = this.legs; this.layout = tripLayout(legs);
    this.views = []; let prev = 'chase';
    this.layout.legs.forEach((L, k) => {
      const plan = legs[k].plan;
      if (!plan) { this.views.push({ from: L.at, to: L.end, view: 'chase' }); return; }
      for (const ph of plan.phases) this.views.push({ from: L.at + ph.from, to: L.at + ph.to, view: legs[k].type === 'maelstrom' && ph.id === 'peak' ? 'side' : ph.view || 'chase' }); // (the arena: Charybdis abeam, seen across the ship from outside the circle)
    });
    this.swings = [];
    for (const v of this.views) { if (v.view !== prev) this.swings.push({ bar: v.from, from: prev, to: v.view }); prev = v.view; }
    this.st.stage.legs = legs.map(({ plan, type, ...music }) => music);
  }

  /** Adrift (PASSAGE.md 14.2, trip.js): at a leg's close, a bunker short of every way on's burn gives the ship to the current, which
   *  carries it to the end (drift: straight on likelier than a diagonal). The legs ahead are relaid when its route is not the drafted
   *  one: the cue swaps in place (Wanda's Arranger.follow keeps its bar while the past is the same), the rail is relaid keeping the
   *  turns already flown (stage.relay). Its legs are capped at a C (Dovina's rank: `passage.adrift`). */
  driftOn(k) {
    const w = this.wps[k], S = this.st;
    if (k >= this.wps.length - 1 || (!this.state.adrift && !adrift(this.state, this.chart, w.id))) return;
    const first = !this.state.adrift; this.state = { ...this.state, adrift: true }; S.stage.adrift = true; this.V.passage.adrift = true;
    if (!first) return; // (the route the current took is laid once, as it first takes the ship)
    const rng = stream('rail/drift'), ids = []; let cur = w.id;
    while (next(this.chart, cur).length) { cur = drift(this.chart, cur, rng); ids.push(cur); }
    const planned = this.wps.slice(k + 1).map((x) => x.id), same = ids.length === planned.length && ids.every((id, i) => id === planned[i]);
    if (!same) {
      const ahead = ids.map((id) => ({ ...this.chart.waypoints[id] }));
      this.wps = [...this.wps.slice(0, k + 1), ...ahead]; this.legs = [...this.legs.slice(0, k + 1), ...ahead.map((x) => this.legOf(x))];
      this.game.encounterFilm?.prepare(this.legs.slice(k + 1).map((l) => l.encounter).filter(Boolean), { hull: this.state.ship }); // (a new encounter's set, as at cast-off)
      this.state = { ...this.state, plan: this.wps.map((x) => x.id) };
      this.layOut(); S.relay?.();
    }
    this.game.events?.emit('passage.adrift', { at: w.id, types: this.wps.slice(k + 1).map((x) => x.type), relaid: !same, by: 'environment' });
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
      if (leg.type === 'maelstrom') this.st.charybdis?.update(dt, bar);
      // a haven's choice, as its release begins (an encounter's at once): the cue holds until it is made
      if (!this.chosen.has(k) && ((leg.type === 'calm' && L.release != null && bar >= L.release) || (leg.type === 'encounter' && this.filmed?.k === k && this.filmed.done))) this.offer(k); // (an encounter's once its film is held: vfx/encounters/film.js)
    }
    // a swing of view begins: what is still in the air is let go (no shot lives across one: the owner's R17, Dovina's pacing law in
    // legs.js keeps new ones out of the bars round it)
    const sw = !!S.swingAt?.(bar); if (sw && !this.swung) this.field.clear(); this.swung = sw;
    this.player.update(dt, S.ship);
    this.field.update(dt, { ship: S.ship, waves: S.waves });
  }

  enter(k) {
    const leg = this.legs[k], w = this.wps[k];
    if (leg.plan) this.runner.begin({ type: w.type, strength: strengthOf(this.state, w), feel: w.feel ?? null, storm: !!w.storm }); // (the Wreckers drawn by a loot)
    else this.runner.done = true;
    if (leg.encounter) { const f = this.filmed = { k, done: false }; f.done = !this.game.encounterFilm?.play(leg.encounter, { feel: w.feel ?? null, hull: this.state.ship, onDone: () => { f.done = true; } }); } // (filmed first, then the choice)
    this.hitsAt = this.st.run.hits; this.scoreAt = this.st.run.score;
    if (w.type === 'maelstrom') this.st.charybdis?.begin(k, w); // (its director: the arena and Charybdis, charybdis.js)
    if (leg.plan && this.hidden && !this.hidden.k) { this.hidden.k = k; this.st.ship.form = this.hidden.form; } // (the whale's dive: this leg sailed in its form)
    this.game.events?.emit('passage.waypoint', { type: w.type, k, storm: !!w.storm, feel: w.feel || null, by: 'environment' });
  }
  leave(k) {
    const S = this.st, w = this.wps[k];
    if (S.piece) S.close();
    const hits = Math.max(0, S.run.hits - (this.hitsAt ?? S.run.hits)), scored = Math.max(0, S.run.score - (this.scoreAt ?? S.run.score));
    this.state = arrive(this.state, this.chart, w.id, { hits, cleared: true });
    // what the leg's score is worth besides: a squall's pay (trip.js legScore), the whale's dive, a bounty, a ghost raced
    let more = legScore(scored, w) - scored;
    if (this.hidden?.k === k) { more += Math.round(scored * (this.hidden.pays - 1)); this.hidden = null; }
    if (more) S.run.score += more;
    if (this.bounty?.waypoint === w.id && this.legs[k].plan) { const cubes = this.bounty.cubes; this.game.cubes?.earn(cubes, 'bounty'); this.bounty = null; this.game.events?.emit('passage.bounty', { waypoint: w.id, type: w.type, cubes, by: 'courier' }); }
    if (this.race && this.legs[k].plan) { const par = this.race.par, beat = scored + more >= par; this.V.passage.race = { beat }; this.race = null; this.game.events?.emit('passage.race', { beat, score: scored + more, par: Math.round(par), by: 'courier' }); }
    // the hull carries: the run's hits are the hull's damage (trip.js); a haven's mend shows there
    S.run.hits = Math.max(0, (SHIPS[this.state.ship]?.bears ?? S.run.bears) - this.state.hull);
    S.stage.fuel = Math.max(0, Math.min(1, this.state.fuel / (SHIPS[this.state.ship]?.tank || 1)));
    this.driftOn(k);
  }

  /** A calm's campfire or an encounter's choice, offered in the Index's window (the game holds; the cue holds: Wanda's). */
  offer(k) {
    const S = this.st, M = this.game.indexMenu, leg = this.legs[k], w = this.wps[k]; if (!M || S.offering) return;
    this.chosen.add(k); S.offering = true;
    const enc = leg.encounter && ENCOUNTERS[leg.encounter], st = S.stage;
    const opts = enc ? offered(leg.encounter, this.state.ship, { rutter: this.rutterWorth(), fuel: this.state.fuel }).map((c) => ({ id: c.id, word: ENCOUNTER_WORDS[leg.encounter]?.[c.id] || c.does }))
      : havenChoices(this.state, w).map((id) => ({ id, word: CHOICE_WORD[id] || id }));
    if (enc) st.encounter = { id: leg.encounter, chosen: false }; // (its mend is the rule's, at arrive: trip.js LEG.mend)
    else st.campfire = { chosen: false };
    let asks = [];
    const pick = (id) => {
      if (!enc) this.state = choose(this.state, id);
      else {
        const r = apply({ ...this.state, at: w.id }, leg.encounter, id, { chart: this.chart, rng: this.rng, rutter: this.rutterWorth(), minutes: (this.layout.bars * BAR_S) / 60, ghost: this.game.voyage?.bestOf?.(this.chart) || null, wordsLeft: this.game.ostraca?.left?.() ?? 0 });
        this.state = { ...r.state, at: this.state.at }; asks = r.asks; // (at: arrive sets it as the leg closes)
      }
      if (st.encounter) st.encounter.chosen = true; if (st.campfire) st.campfire.chosen = true;
      S.run.hits = Math.max(0, (SHIPS[this.state.ship]?.bears ?? S.run.bears) - this.state.hull);
      S.stage.fuel = Math.max(0, Math.min(1, this.state.fuel / (SHIPS[this.state.ship]?.tank || 1)));
      if (id === 'reckon' || id === 'listen') { const V = this.game.voyage, s = V.sailing; if (s) V.reckon(s.from, s.to, Math.min(1, V.reckoning(s.from, s.to) + 0.25), null); }
      this.game.events?.emit(enc ? 'passage.encounter' : 'passage.campfire', { encounter: leg.encounter || null, choice: id, hull: this.state.hull, by: 'courier' });
      S.offering = false; M.close();
      for (const a of asks) this.act(a);
    };
    M.showPage(enc ? 'encounter' : 'campfire', (im, el) => {
      const box = el('div', 'rooms');
      for (const o of opts) { const d = el('div', 'room', `<span class="n">·</span><span><b>${o.word}</b></span>`); d.onclick = () => pick(o.id); box.appendChild(d); }
      im.appendChild(box);
    }, { title: enc ? (ENCOUNTER_WORDS[leg.encounter]?.title || 'A SIGHTING') : 'HEAVING TO', sub: enc ? 'choose one' : 'the sea lies still a while' }); // (Espada's words)
  }

  /** The carried rutter's worth today (the best one aboard), or 0: what Letty would weigh. */
  rutterWorth() { return Math.max(0, ...(this.game.pneuka?.slots || []).filter((x) => x?.id === 'rutter').map((x) => x.data?.worth || 0)); }

  /** An encounter's ask done in the world (encounters.js apply: the table of asks). */
  act(a) {
    const g = this.game, V = g.voyage, box = g.pneuka, ev = (n, p) => g.events?.emit(n, { ...p, by: 'courier' });
    switch (a.ask) {
      case 'exact': ev('passage.exact', { waypoints: a.waypoints, types: a.waypoints.map((id) => this.chart.waypoints[id]?.type) }); break;
      case 'casks': { // crude into the hold, up to its limit (the manifest's entry paid nothing: found, not bought)
        const room = Math.max(0, (ECON.ships[this.state.ship]?.hold ?? 0) - (V?.casks?.() ?? 0)); let n = 0;
        for (let i = 0; i < Math.min(a.n, room); i++) if ((box?.add(`cask.${a.grade}`, 'loot') ?? -1) >= 0) { (V.s.manifest[a.grade] ||= []).push({ from: 'convoy', paid: 0 }); n++; }
        V?.dirty?.(); ev('passage.casks', { n, grade: a.grade }); break;
      }
      case 'bounty': this.bounty = { waypoint: a.waypoint, cubes: a.cubes ?? 0 }; ev('passage.posted', { waypoint: a.waypoint, type: this.chart.waypoints[a.waypoint]?.type, cubes: a.cubes ?? 0 }); break; // (its pay is the ask's: encounters.js postedBounty, Dovina's)
      case 'sellRutter': {
        const i = (box?.slots || []).findIndex((x) => x?.id === 'rutter'); if (i < 0) break;
        box.take(i); g.cubes?.earn(a.cubes, 'sell'); ev('rutter.sell', { cubes: a.cubes, to: 'letty' }); break;
      }
      case 'hiddenLeg': this.hidden = { form: a.form, pays: a.pays, k: 0 }; ev('passage.dive', { form: a.form, pays: a.pays }); break;
      case 'crew': ev('passage.crew', { slots: a.slots, legs: a.legs }); break; // (a hand aboard; the mount they man waits on the pier's loadout carrying a spare: next round)
      case 'counter': { // the Purser's counter, the cue held while it is open (its factors: Dovina's, shops.open's)
        const S = this.st; S.offering = true; g.shops?.open('purser', { factor: { sell: a.sell, buy: a.buy } });
        const off = g.events?.on?.('shop.close', () => { S.offering = false; off?.(); }); break;
      }
      case 'buyRutter': {
        if (!box?.room('rutter')) { g.log?.say('warn', 'Your Pneuka Box is full.', { key: 'rail.box', throttle: 2 }); break; }
        if (!g.cubes?.spend(a.cubes, 'barge')) { g.log?.say('warn', `You cannot afford it. (${a.cubes} cubes)`, { key: 'rail.poor', throttle: 2 }); break; }
        const P = this.V.passage, s = this.V, worth = rutterWorth({ minutes: 5, rank: 'B', read: 1 });
        box.add('rutter', 'barge', 0, { from: s.from, to: s.to, route: a.route, day: a.day ?? today(), passage: P.ids, legs: P.legs, rank: 'B', read: 1, minutes: 5, worth });
        ev('rutter.buy', { cubes: a.cubes, worth: worthOf('rutter') }); break;
      }
      case 'ghost': { const best = V?.bestOf?.(this.chart); this.race = { par: best ? best.score / Math.max(1, this.wps.length) : 0 }; ev('passage.ghost', { legs: a.legs, score: best?.score ?? null }); break; }
      case 'ostracon': g.ostraca?.fromSea?.('bottle'); break;
      default: break;
    }
  }

  stop() { this.st.charybdis?.end(); if (this.active && this.V?.passage) { this.V.passage.storms = this.state.storms; this.V.passage.sailed = this.wps.map(({ id, type, strength, feel, storm }) => ({ id, type, strength, feel, storm })); } // (the squalls cleared, for the rutter's worth: voyage.js reads P.storms)
    this.active = false; this.field?.clear(); this.player?.stop(); if (this.runner) this.runner.done = true; const st = this.st.stage; st.legs = null; st.campfire = null; st.encounter = null; st.fuel = null; }
}
