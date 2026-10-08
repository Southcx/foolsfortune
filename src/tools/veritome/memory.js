// ---------------------------------------------------------------------------------------
// THE MEMORY: the Veritome's photographs before they are appraised (a digital camera's: the glossary, "memory"; there is no film since
// 2026-10-06, and nothing is spent but room). Every shutter exposes one PLATE: the picture itself (a small JPEG of
// the frame), what was in it as it was at that instant (photo.js's serial form), and where and when it was taken. A plate is not
// worth anything yet: it is APPRAISED later, in a batch, in the darkroom (darkroom.js, from the Codex), which is where cards,
// Compendium entries and bestiary facts come from. The memory holds MEMORY_PLATES plates; when it is full the shutter will not close
// until some are appraised or thrown out, so a photographer chooses what is worth a plate.
//
// Prior art: Wind Waker's Picto Box (a few pictographs held at once, and the good ones taken somewhere to be made into something),
// Dark Cloud 2's camera (photographs kept in an album to be turned into ideas later, its slots limited), Pokémon Snap's film and its
// report at the end of the course (the shots are judged together, after), and Fatal Frame's film as a resource.
//
//   const m = new VeritomeMemory(state)   m.expose({ shot, thumb, at, yaw, zone, tide, chance }) -> plate | null    m.left   m.full
//   m.remove(ids)   m.take(ids) -> plates (removed)                                                       MEMORY_PLATES (what it holds)
// ---------------------------------------------------------------------------------------
import { now } from '../../core/calendar.js';

export const MEMORY_PLATES = 24;

export class VeritomeMemory {
  /** `state`: the Book's saved array of plates (kept by reference: the Book saves it). */
  constructor(state = []) { this.plates = state; this.seq = state.reduce((m, p) => Math.max(m, p.id || 0), 0); }
  get left() { return Math.max(0, MEMORY_PLATES - this.plates.length); }
  get full() { return this.plates.length >= MEMORY_PLATES; }
  expose(plate) {
    if (this.full) return null;
    const p = { id: ++this.seq, t: now(), ...plate }; // (the calendar's clock: a replay sees the time it was played)
    this.plates.push(p);
    return p;
  }
  remove(ids) { const s = new Set(ids); for (let i = this.plates.length - 1; i >= 0; i--) if (s.has(this.plates[i].id)) this.plates.splice(i, 1); }
  /** Take plates out of the memory (to be appraised): all of them, or those ids. */
  take(ids = null) {
    const out = ids ? this.plates.filter((p) => ids.includes(p.id)) : [...this.plates];
    this.remove(out.map((p) => p.id));
    return out;
  }
}
