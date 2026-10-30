// ---------------------------------------------------------------------------------------
// THE ZONES' ACOUSTICS (Petra's `acoustic` on each render zone, `zone.acoustic { acoustic, wet }`): the world's one reverb (audio/core.js
// `verb`) swapped for the zone's kind of space, crossfaded over half a real second so no tail is cut, and its send set to the zone's
// `wet`. Five kinds, each an impulse of its length and decay: a room (the workshop's floors), a hall (the hub, the bazaar), a cave
// (the basement's deep rooms, the Great Dunemaw's floors), the open (the Dunes, the Raceway, the garden) and the sea (the Emocean, a
// dry open with a little more air). A phone's impulses are held to PHONE.verb (core.js) as every reverb is.
//
// Prior art: every game's reverb zones (Half-Life's DSP rooms, Wwise's auxiliary sends), the convolution impulse as decaying noise
// (Schroeder's), a crossfade between two convolvers rather than a buffer swapped under a playing tail.
//
//   sfx.setAcoustic(kind, wet)   ACOUSTICS[kind] -> { sec, decay, wet }
// ---------------------------------------------------------------------------------------

/** Each space: its impulse's length (s) and decay exponent, and the send it takes when the zone names none. */
export const ACOUSTICS = {
  room: { sec: 1.4, decay: 3.2, wet: 0.25 },
  hall: { sec: 2.4, decay: 2.6, wet: 0.4 },
  cave: { sec: 3.2, decay: 2.0, wet: 0.55 },
  open: { sec: 0.6, decay: 5.0, wet: 0.08 },
  sea: { sec: 1.0, decay: 4.5, wet: 0.05 },
};
const FADE = 0.5; // (real s: the crossfade between two spaces)
const SEND = 0.88; // (the send's gain for a wet of 1: room's 0.25 lands on the old fixed 0.22)

export class AcousticSounds {
  setAcoustic(kind = 'room', wet) {
    const A = ACOUSTICS[kind] || ACOUSTICS.room, c = this.ctx; if (!c || !this.verbSend) return;
    const w = Math.max(0, Math.min(1, wet ?? A.wet)), t = c.currentTime;
    this.verbSend.gain.setTargetAtTime(SEND * w, t, FADE / 3);
    if (this._space?.kind === kind) return; // (the same space: only its send moves)
    if (!this._space) { try { this.verbSend.disconnect(this.verb); } catch { /* not joined */ } } // (the first call: core.js's fixed room taken under the crossfade)
    const conv = c.createConvolver(), g = c.createGain();
    conv.buffer = this.impulse(A.sec, A.decay); g.gain.value = 0;
    this.verbSend.connect(conv).connect(g).connect(this.master);
    g.gain.setTargetAtTime(1, t, FADE / 3);
    const old = this._space;
    if (old) { old.g.gain.setTargetAtTime(0, t, FADE / 3); setTimeout(() => { try { this.verbSend.disconnect(old.conv); old.g.disconnect(); } catch { /* gone */ } }, (FADE + A.sec) * 1000 + 500); }
    this._space = { kind, conv, g, sec: A.sec, decay: A.decay };
  }
}
