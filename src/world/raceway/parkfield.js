// ---------------------------------------------------------------------------------------
// THE PARK'S FIELD (Petra's v198 measure: the first trip to the Raceway froze 4.5 s working out 1.1 million heights): the park's height
// function sampled on the terrain's grid, once, as one array, so it can be worked out a few rows at a time in the idle time between
// frames (fieldJob, started after boot by raceway.prefetch: requestIdleCallback) and handed to the terrain ready. The same numbers as park.heightAt at each grid point: nothing is guessed.
//
//   fieldJob(park) -> { step(more) -> done, field }   fieldOf(park) -> { n, h: Float32Array (row j, column i: h[j * n + i] is at x = -half + i step, z = -half + j step) }
// ---------------------------------------------------------------------------------------
import { RW } from './track.js';

export function fieldOf(P) {
  const n = Math.round((2 * RW.half) / RW.step) + 1, h = new Float32Array(n * n);
  for (let j = 0; j < n; j++) { const z = -RW.half + j * RW.step; for (let i = 0; i < n; i++) h[j * n + i] = P.heightAt(-RW.half + i * RW.step, z); }
  return { n, h };
}

/** The same, a row at a time: `step(more)` works rows while `more()` says there is time, and is true once the field is whole. */
export function fieldJob(P) {
  const n = Math.round((2 * RW.half) / RW.step) + 1, h = new Float32Array(n * n); let j = 0;
  return {
    get field() { return j >= n ? { n, h } : null; },
    step(more) { do { const z = -RW.half + j * RW.step; for (let i = 0; i < n; i++) h[j * n + i] = P.heightAt(-RW.half + i * RW.step, z); j++; } while (j < n && more()); return j >= n; },
  };
}
