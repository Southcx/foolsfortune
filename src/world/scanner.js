// ---------------------------------------------------------------------------------------
// THE SCANNER: any real barcode or QR code read into the game (docs/plans/SEEDS-SLABS-SCANS.md 3; Dovina's rules in progress/scans.js:
// readCode, holdOf, scanResult, SCAN). On the desk the code's digits are typed (`/scan 5012345678900`, or into the scan page's field); on a
// phone whose browser reads codes (BarcodeDetector: Chrome on Android) the camera reads it, frames never leaving the device; where it
// cannot (iOS has no BarcodeDetector), the digits are typed there too. The page is opened at the plate shrine (its row) or by `/scan`.
// A code is judged by its hash, so the same code gives everyone the same thing: a material into the Pneuka Box (makeMaterial), or a
// SPIRIT SLAB (world/garden/bench.js: its creature, feeling, class as stars and grain as its seed), SEALED when its kind was never
// photographed (it opens once one is met). A code read again gives a minute of play in cubes once, then nothing; three new codes a game
// day. Only the hash is kept (to know a code was read), never the code. The game's own codes are read as what they are: a made track's
// FF2- goes to the track editor's Load code, a spirit's FFS- is refused until spirits are shared.
// Kept in the save (section `scans`, scope player): each hash read and how often, and the game day's count.
// Events: scan.read { what, kind, cls, sealed, again, own }, with `by`.
//
// Prior art: Monster Rancher (any CD seeds a monster, the same disc the same monster), Skannerz (real UPCs as monsters and items),
// Barcode Battler, Pokemon Sun and Moon's QR scanner (a few a day), the Shape Detection API's BarcodeDetector.
//
//   game.scanner = new Scanner(game)   .commands() (the chat's /scan)   .read(text, how) -> result   .open()   .left() -> new codes left today   .update()
// ---------------------------------------------------------------------------------------
import { scanResult, SCAN, ROSTER } from '../progress/scans.js';
import { makeMaterial } from '../progress/econ/materials.js';
import { today } from '../core/calendar.js';

/** The formats the camera looks for (the shop's barcodes and QR codes), and how often it looks (real seconds). */
const CAMERA = { formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'], every: 0.25 };

export class Scanner {
  constructor(game) {
    this.game = game; this.seen = new Map(); this.day = { d: -1, n: 0 }; this.stream = null; this.lookT = 0;
    game.save?.section('scans', { scope: 'player', version: 1,
      dump: () => ({ seen: [...this.seen], day: [this.day.d, this.day.n] }),
      load: (d) => { this.seen = new Map(Array.isArray(d?.seen) ? d.seen.filter((x) => Array.isArray(x)).map(([h, n]) => [h >>> 0, n | 0]) : []); this.day = Array.isArray(d?.day) ? { d: d.day[0] | 0, n: d.day[1] | 0 } : { d: -1, n: 0 }; },
      reset: () => { this.seen = new Map(); this.day = { d: -1, n: 0 }; } });
  }
  /** `/scan` on the chat line (boot/chatcommands.js calls it once the chat is made). */
  commands() { this.game.chat?.add('scan', { help: 'read a code: /scan and its digits (a barcode\'s numbers, a QR code\'s text); /scan alone opens the scanner', run: (args) => { const t = (args || []).join(' ').trim(); if (t) this.read(t, 'typed'); else this.open(); } }); }
  /** New codes the game day still takes. */
  left() { const d = today(); if (this.day.d !== d) this.day = { d, n: 0 }; return Math.max(0, SCAN.perDay - this.day.n); }
  /** The kinds photographed (the Veritome's Book): a slab of one is never sealed. */
  met() { return new Set(Object.entries(this.game.veritome?.book?.photos || {}).filter(([, p]) => p?.stars > 0).map(([k]) => k)); }

  /** A code read (typed or seen by the camera): judged, and what it holds given. The result, or { ok: false, why }. */
  read(text, how = 'typed') {
    const g = this.game, say = (s) => g.log?.say('warn', s, { key: 'scan', throttle: 1 });
    this.left();
    const r = scanResult(text, { seen: this.seen, today: this.day.n, met: this.met(), roster: ROSTER });
    if (!r.ok) { say(r.why === 'day' ? `The scanner takes no more new codes this game day (${SCAN.perDay} a game day).` : r.why === 'known' ? 'That code has given all it has.' : 'That is not a code.'); return r; }
    if (r.own) return this.own(r, text);
    if (r.again) {
      this.seen.set(r.hash, 2); g.cubes?.earn(r.cubes, 'scan');
      g.events?.emit('scan.read', { what: 'again', again: true, how, by: 'courier' }); g.save?.dirty('scans'); return r;
    }
    const H = r.hold, box = g.pneuka;
    const slot = H.what === 'material' ? box?.add(`mat.${H.kind}`, 'scan', 0, makeMaterial(H.kind, r.hash, H.tier))
      : box?.add('slab', 'scan', 0, { kind: H.kind, stars: H.cls + 1, seed: H.grain, feeling: H.feeling, from: 'scan', sealed: r.sealed || undefined });
    if (slot == null || slot < 0) { say('Your Pneuka Box is full: the code waits until there is room.'); return { ok: false, why: 'full' }; } // (nothing counted: read it again with room)
    this.seen.set(r.hash, 1); this.day.n++;
    g.events?.emit('scan.read', { what: H.what, kind: H.kind, cls: H.what === 'slab' ? H.cls : H.tier, sealed: !!r.sealed, how, by: 'courier' });
    if (H.what === 'slab') g.events?.emit('slab.make', { kind: H.kind, stars: H.cls + 1, from: 'scan', by: 'courier' });
    g.save?.dirty('scans');
    return r;
  }
  /** One of the game's own codes: a made track's to the track editor, a spirit's not yet. */
  own(r, text) {
    const g = this.game;
    g.events?.emit('scan.read', { what: r.own, own: true, by: 'courier' });
    if (r.own === 'track') { const E = g.trackEditor; if (!E?.load) g.log?.say('info', 'A made track\'s code: paste it into the track editor\'s Load code at the Raceway.', { key: 'scan.own', throttle: 1 }); else if (E.load(r.code)) g.log?.say('info', 'A made track\'s code: it waits in the track editor\'s slots at the Raceway.', { key: 'scan.own', throttle: 1 }); }
    else g.log?.say('info', 'A spirit\'s code: spirits cannot be shared yet.', { key: 'scan.own', throttle: 1 });
    return r;
  }

  // ------------------------------------------------------------------ the scan page
  /** The scanner's page: the camera where the browser reads codes, a field for the digits, the game day's count. */
  open() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage) return;
    const canSee = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
    menu.showPage('scan', (im, el) => {
      const rows = el('div', 'rooms'), field = document.createElement('input');
      field.type = 'text'; field.inputMode = 'text'; field.placeholder = 'a barcode\'s digits, or a QR code\'s text'; field.className = 'scan-field'; field.autocomplete = 'off';
      Object.assign(field.style, { width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: '15px', padding: '8px 10px', margin: '4px 0 8px', background: 'rgba(0,0,0,.35)', color: '#f3e2cc', border: '1px solid rgba(255,230,200,.35)', borderRadius: '3px' });
      const go = () => { const t = field.value.trim(); if (!t) return; const r = this.read(t, 'typed'); if (r.ok !== false) { field.value = ''; this.open(); } };
      field.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'NumpadEnter') { go(); e.preventDefault(); } e.stopPropagation(); });
      const row = (t, sub, run) => { const d = el('div', 'room', `<span class="n">▦</span><span><b>${t}</b><s>${sub}</s></span>`); if (run) d.onclick = run; rows.appendChild(d); return d; };
      row('Read the code typed', `${this.left()} of ${SCAN.perDay} new codes left this game day · a code read again gives a little, once`, go);
      if (canSee) row(this.stream ? 'Stop the camera' : 'Read with the camera', this.stream ? 'hold a barcode or QR code in the view' : 'the camera\'s frames never leave this device', () => { if (this.stream) this.stop(); else this.start(); this.open(); });
      im.appendChild(el('div', 'grp', 'THE SCANNER'));
      if (this.video) im.appendChild(this.video);
      im.appendChild(field); im.appendChild(rows);
      setTimeout(() => field.focus?.(), 0);
    }, { title: 'THE SCANNER', sub: 'a real barcode or QR code: the same code gives everyone the same thing · Esc closes' });
  }
  /** The camera on, looking for a code a few times a real second. */
  async start() {
    if (this.stream) return;
    try {
      const have = (await window.BarcodeDetector.getSupportedFormats?.()) || CAMERA.formats;
      this.detector ||= new window.BarcodeDetector({ formats: CAMERA.formats.filter((f) => have.includes(f)) });
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = (this.video ||= document.createElement('video')); v.muted = true; v.playsInline = true; v.autoplay = true;
      Object.assign(v.style, { width: '100%', maxHeight: '40vh', objectFit: 'cover', borderRadius: '3px', background: '#000' });
      v.srcObject = this.stream; await v.play().catch(() => {});
      this.open();
    } catch { this.stop(); this.game.log?.say('warn', 'The camera could not be opened: type the code\'s digits.', { key: 'scan.camera', throttle: 2 }); }
  }
  stop() { for (const t of this.stream?.getTracks?.() || []) t.stop(); this.stream = null; if (this.video) { this.video.srcObject = null; this.video.remove(); this.video = null; } }
  /** Each frame: the camera stopped when its page closes; while it runs, a look for a code every CAMERA.every real seconds. */
  update(raw = 1 / 60) {
    if (!this.stream) return;
    const menu = this.game.indexMenu || this.game.course?.menu;
    if (!(menu?.open && menu.page?.name === 'scan')) { this.stop(); return; }
    if ((this.lookT -= raw) > 0 || this.looking || !this.video || this.video.readyState < 2) return;
    this.lookT = CAMERA.every; this.looking = true;
    this.detector.detect(this.video).then((found) => { const c = found?.[0]?.rawValue; if (c && this.stream) { this.stop(); this.read(c, 'camera'); this.open(); } }).catch(() => {}).finally(() => { this.looking = false; });
  }
}
