// Render a score offline to a WAV (the game's own arranger and band, in Chromium's OfflineAudioContext), and print each section's
// level (RMS and peak, dB): how a cue is checked (docs/OST.md, production notes: a climax about twice a verse's loudness).
//
//   npm i --no-save playwright          (once)
//   npm run dev &                        (or: URL=http://host:port/)
//   node tools/render_score.mjs /src/music/suits.js SUITS suits.wav      (CHROMIUM=/path/to/chrome to use a given browser)
import { chromium } from 'playwright';
import fs from 'fs';
const [mod = '/src/music/suits.js', name = 'SUITS', out = 'suits.wav'] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('page:', m.text()); });
await p.goto((process.env.URL || 'http://127.0.0.1:5173/') + 'dev/animlab.html').catch(() => {});
const r = await p.evaluate(async ({ mod, name }) => {
  const { Arranger } = await import('/src/music/arranger.js');
  const { Sfx } = await import('/src/audio/core.js');
  const S = (await import(mod))[name], sr = 44100;
  let secs = 0; for (const s of S.sections) secs += s.bars * (s.beats || S.beats || 4) * 60 / (s.bpm || S.bpm);
  const ctx = new OfflineAudioContext(2, Math.ceil((secs + (S.tail ?? 3) + 0.5) * sr), sr);
  // the game's master: a gain through the compressor (audio/core.js)
  const sfx = new Sfx(); sfx.ctx = ctx; sfx.master = ctx.createGain(); sfx.master.gain.value = 0.8;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; sfx.master.connect(comp).connect(ctx.destination);
  sfx.noiseBuf = sfx.makeNoise(2); sfx.ok = () => true;
  const A = new Arranger(sfx); A.score = S; A.build(); A.bus.gain.value = A.volume; A.next = 0.1; A.section = 0; A.bar = 0; A.ended = false;
  const marks = []; let guard = 0;
  while (!A.ended && guard++ < 1000) { if (A.bar === 0) marks.push([S.sections[A.section].id, A.next]); A.step(); }
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const lvl = (a, z) => { let s = 0, pk = 0; const i0 = Math.floor(a * sr), i1 = Math.min(L.length, Math.floor(z * sr)); for (let i = i0; i < i1; i++) { s += L[i] * L[i] + R[i] * R[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); } return [+(10 * Math.log10(s / (2 * (i1 - i0)))).toFixed(1), +(20 * Math.log10(pk)).toFixed(1)]; };
  const sec = marks.map(([id, t], i) => [id, ...lvl(t, i + 1 < marks.length ? marks[i + 1][1] : L.length / sr)]);
  const pcm = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { sec, secs: L.length / sr, b64: btoa(bin) };
}, { mod, name });
console.log('length', r.secs.toFixed(1), 's; per section [id, rms dB, peak dB]:', JSON.stringify(r.sec));
const pcm = Buffer.from(r.b64, 'base64'), h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
h.writeUInt32LE(44100, 24); h.writeUInt32LE(44100 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(out, Buffer.concat([h, pcm]));
await b.close();
