// ---------------------------------------------------------------------------------------
// THE VOICE'S WORKER: the System's lines synthesised off the main thread (speech/synth.js is pure: text in, samples out), so a line
// never costs a frame however many come at once (achievements unlocked in a run: 5 to 50 ms a line on the desk, more on a phone).
// Loaded inline by audio/voice/voice.js (`?worker&inline`: the page's pack loads no file by its own URL); the samples come back
// transferred, not copied.
//
//   postMessage({ id, text, opts }) -> { id, fs, samples } | { id, error }
// ---------------------------------------------------------------------------------------
import { synthesize } from './synth.js';

self.onmessage = (e) => {
  const { id, text, opts } = e.data || {};
  try {
    const r = synthesize(text, opts);
    self.postMessage({ id, fs: r.fs, samples: r.samples }, [r.samples.buffer]);
  } catch (err) { self.postMessage({ id, error: String(err?.message || err) }); }
};
