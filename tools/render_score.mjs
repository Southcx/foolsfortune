// Render a score offline to a WAV (the game's own arranger and band, in Chromium's OfflineAudioContext), and print each section's
// level (RMS and peak, dB): how a cue is checked (docs/OST.md, production notes: a climax about twice a verse's loudness).
//
//   npm i --no-save playwright          (once)
//   npm run dev &                        (or: URL=http://host:port/)
//   node tools/render_score.mjs /src/music/suits.js SUITS suits.wav      (CHROMIUM=/path/to/chrome to use a given browser)
//   node tools/render_score.mjs /src/music/petra.js PETRA petra_loop.wav loop
//     (loop: the looping part only, from `loopFrom` to the end, rendered twice and the second time kept, so the file's start
//      already holds the end's reverb and echo: played on repeat it has no seam. Use a lossless format for it; MP3 pads the ends)
import { chromium } from 'playwright';
import fs from 'fs';
const [mod = '/src/music/suits.js', name = 'SUITS', out = 'suits.wav', mode = ''] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('page:', m.text()); });
await p.goto((process.env.URL || 'http://127.0.0.1:5173/') + 'dev/animlab.html').catch(() => {});
const r = await p.evaluate(async ({ mod, name, loop }) => {
  const { Arranger } = await import('/src/music/arranger.js');
  const { Sfx } = await import('/src/audio/core.js');
  const S = (await import(mod))[name], sr = 44100;
  const L0 = loop ? S.loopFrom : 0;
  if (loop && (L0 == null || L0 < 0)) throw new Error(name + ' does not loop (loopFrom is null)');
  const body = S.sections.slice(L0);
  let secs = 0; for (const s of body) secs += s.bars * (s.beats || S.beats || 4) * 60 / (s.bpm || S.bpm);
  if (loop) secs = secs * 2 + 8; // (twice round, and a little of the third: the seam is checked against it)
  const ctx = new OfflineAudioContext(2, Math.ceil((secs + (S.tail ?? 3) + 0.5) * sr), sr);
  // the game's master: a gain through the compressor (audio/core.js)
  const sfx = new Sfx(); sfx.ctx = ctx; sfx.master = ctx.createGain(); sfx.master.gain.value = 0.8;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; sfx.master.connect(comp).connect(ctx.destination);
  sfx.noiseBuf = sfx.makeNoise(2); sfx.ok = () => true;
  const A = new Arranger(sfx); A.score = S; A.build(); A.bus.gain.value = A.volume; A.next = 0.1; A.section = L0; A.bar = 0; A.ended = false; if (loop) A.jitter = 0;
  const marks = []; let guard = 0, cut = null;
  // (one pass through the sections: a score that loops is rendered once round, and its tail rings out; a loop, twice round from loopFrom)
  const total = body.reduce((n, s) => n + s.bars, 0);
  let cut2 = null;
  while (!A.ended && guard < total * (loop ? 2 : 1) + (loop ? 1 : 0)) {
    if (loop && guard === total) cut = A.next;
    if (loop && guard === total * 2) cut2 = A.next;
    if (A.bar === 0 && (!loop || (guard >= total && guard < total * 2))) marks.push([S.sections[A.section].id, A.next]);
    A.step(); guard++;
  }
  const loopEnd = loop ? cut2 : A.next;
  const buf = await ctx.startRendering();
  let L = buf.getChannelData(0), R = buf.getChannelData(1), seam = null;
  if (loop) { // keep the second pass, to the sample
    const i0 = Math.round(cut * sr), n = Math.round((loopEnd - cut) * sr);
    const real = Math.abs(L[i0 + n] - L[i0 + n - 1]); // (what the music itself does at that moment, played straight on into the third time round)
    // the first 10 ms crossfade from the true continuation of the end (the third time round, rendered) into the file's own start:
    // the same music either way, but the band's noises start at random places in their noise, and that would leave a hair of a step
    const X = Math.round(0.01 * sr), L3 = L.slice(i0 + n, i0 + n + X), R3 = R.slice(i0 + n, i0 + n + X);
    L = L.slice(i0, i0 + n); R = R.slice(i0, i0 + n);
    for (let k = 0; k < X; k++) { const w = k / X; L[k] = L3[k] * (1 - w) + L[k] * w; R[k] = R3[k] * (1 - w) + R[k] * w; }
    for (const m of marks) m[1] -= cut;
    // the seam: the jump from the last sample to the first, against the signal's ordinary step from one sample to the next
    const steps = []; for (let i = 1; i < L.length; i += 7) steps.push(Math.abs(L[i] - L[i - 1]));
    steps.sort((a, b) => a - b);
    seam = { jump: +Math.abs(L[0] - L[L.length - 1]).toFixed(5), real: +real.toFixed(5), p99: +steps[Math.floor(steps.length * 0.99)].toFixed(5), seconds: +(n / sr).toFixed(3) };
  }
  const lvl = (a, z) => { let s = 0, pk = 0; const i0 = Math.floor(a * sr), i1 = Math.min(L.length, Math.floor(z * sr)); for (let i = i0; i < i1; i++) { s += L[i] * L[i] + R[i] * R[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); } return [+(10 * Math.log10(s / (2 * (i1 - i0)))).toFixed(1), +(20 * Math.log10(pk)).toFixed(1)]; };
  const sec = marks.map(([id, t], i) => [id, ...lvl(t, i + 1 < marks.length ? marks[i + 1][1] : L.length / sr)]);
  const pcm = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { sec, secs: L.length / sr, b64: btoa(bin), seam };
}, { mod, name, loop: mode === 'loop' });
console.log('length', r.secs.toFixed(1), 's; per section [id, rms dB, peak dB]:', JSON.stringify(r.sec));
if (r.seam) console.log('loop seam: jump', r.seam.jump, '| the music straight through at that moment', r.seam.real, '| its 99th-percentile step', r.seam.p99, '|', r.seam.seconds, 's a loop');
const pcm = Buffer.from(r.b64, 'base64'), h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
h.writeUInt32LE(44100, 24); h.writeUInt32LE(44100 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
await b.close();
