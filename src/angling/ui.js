// ---------------------------------------------------------------------------------------
// The angling gauges: no words, only shapes. A ring around the crosshair that fills as a cast charges; while a fish is on, a
// vertical tension gauge with its sweet band marked (the needle should live in it), the fish's stamina and how much line is
// out as two thin bars, and an arrow for the way it is pulling (lean the rod the other way, after FFXI's arrows). Everything
// the fish does is also in the world (the rod bends, the line hums, the water breaks); these are only there to be read at a glance.
// ---------------------------------------------------------------------------------------
import { BAND } from './fight.js';
import { ASPECTS } from './species.js';

const CSS = `
#angling { position: absolute; inset: 0; pointer-events: none; }
#angling .castring { position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; opacity: 0; transition: opacity .12s; }
#angling .castring circle { fill: none; stroke-width: 3; }
#angling .castring .bg { stroke: rgba(28,13,8,.55); }
#angling .castring .arc { stroke: var(--accent); stroke-dasharray: 100; stroke-dashoffset: 100; transform: rotate(-90deg); transform-origin: 50% 50%; stroke-linecap: round; }
#angling .fight { position: absolute; left: calc(50% + 74px); top: 50%; transform: translateY(-50%); display: none; gap: 8px; align-items: stretch; height: 190px; }
#angling .fight.on { display: flex; }
#angling .gauge { position: relative; width: 16px; border: 1px solid rgba(255,178,122,.6); background: rgba(28,13,8,.6); border-radius: 3px; overflow: hidden; }
#angling .gauge .band { position: absolute; left: 0; right: 0; background: rgba(255,178,122,.28); border-top: 1px solid rgba(255,178,122,.7); border-bottom: 1px solid rgba(255,178,122,.7); }
#angling .gauge .danger { position: absolute; left: 0; right: 0; top: 0; background: rgba(255,80,60,.35); }
#angling .gauge .needle { position: absolute; left: -2px; right: -2px; height: 4px; background: #fff1dc; box-shadow: 0 0 6px #ffb27a; }
#angling .gauge.hot .needle { background: #ff8f7d; box-shadow: 0 0 8px #ff5a3c; }
#angling .thin { position: relative; width: 6px; border: 1px solid rgba(255,178,122,.35); background: rgba(28,13,8,.6); border-radius: 3px; overflow: hidden; }
#angling .thin i { position: absolute; left: 0; right: 0; bottom: 0; }
#angling .thin.stam i { background: linear-gradient(0deg, #ffb27a, #fff1dc); }
#angling .thin.line i { background: linear-gradient(0deg, #6a9fa0, #cfe6e4); }
#angling .arrow { position: absolute; left: calc(50% - 22px); top: calc(50% + 46px); width: 44px; height: 20px; display: none; text-align: center; font-size: 22px; line-height: 20px; color: #ffb27a; text-shadow: 0 0 6px #1c0d08; }
#angling .arrow.on { display: block; }
#angling .arrow.warn { color: #ff8f7d; }
#angling .bite { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 3px solid rgba(255,241,220,.0); opacity: 0; }
#angling .bite.on { animation: bitepulse .5s ease-out; }
@keyframes bitepulse { 0% { opacity: 1; transform: scale(.4); border-color: rgba(255,241,220,.9); } 100% { opacity: 0; transform: scale(1.5); border-color: rgba(255,178,122,0); } }
`;

export class AnglerUI {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = document.createElement('div'));
    root.id = 'angling';
    const lo = Math.round((1 - BAND[1] / 1.3) * 100), hi = Math.round((1 - BAND[0] / 1.3) * 100);
    root.innerHTML = `
      <svg class="castring" viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="15.9" pathLength="100"/><circle class="arc" cx="20" cy="20" r="15.9" pathLength="100"/></svg>
      <div class="fight"><div class="gauge"><div class="danger" style="height:${Math.round((1 - 1 / 1.3) * 100)}%"></div><div class="band" style="top:${lo}%;height:${hi - lo}%"></div><div class="needle"></div></div>
        <div class="thin stam"><i></i></div><div class="thin line"><i></i></div></div>
      <div class="arrow"></div><div class="bite"></div>`;
    document.getElementById('hud')?.appendChild(root);
    const q = (s) => root.querySelector(s);
    this.el = { ring: q('.castring'), arc: q('.castring .arc'), fight: q('.fight'), gauge: q('.gauge'), needle: q('.needle'), stam: q('.stam i'), line: q('.line i'), arrow: q('.arrow'), bite: q('.bite') };
  }

  cast(k) {
    this.el.ring.style.opacity = k > 0 ? 1 : 0;
    this.el.arc.style.strokeDashoffset = `${(1 - k) * 100}`;
  }

  fight(f, maxLine) {
    const e = this.el;
    if (!f) { e.fight.classList.remove('on'); e.arrow.classList.remove('on'); return; }
    e.fight.classList.add('on');
    e.needle.style.top = `${(1 - Math.min(1.3, f.tension) / 1.3) * 100}%`;
    e.gauge.classList.toggle('hot', f.tension > 0.9);
    e.stam.style.height = `${f.stamina * 100}%`;
    e.line.style.height = `${Math.max(0, Math.min(1, 1 - f.dist / (maxLine + 2))) * 100}%`;
    const s = f.seg;
    const show = s && s.side !== 0 && f.pull > 0.3;
    e.arrow.classList.toggle('on', !!show || (s && s.kind === 'thrash'));
    e.arrow.classList.toggle('warn', s && s.kind === 'thrash');
    e.arrow.textContent = s && s.kind === 'thrash' ? '‼' : s?.side > 0 ? '⟵' : s?.side < 0 ? '⟶' : '⇩';
  }

  biteFlash() { const b = this.el.bite; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }

  strip(aspect) {
    return `<div class="gap"></div>${ASPECTS.map((a, i) => `<div class="slot asp${i === aspect ? ' sel' : ''}" style="${i === aspect ? `border-color:#${a.color.toString(16).padStart(6, '0')}` : ''}"><i style="color:#${a.color.toString(16).padStart(6, '0')}">${a.glyph}</i><span>${a.name}</span></div>`).join('')}`;
  }
}
