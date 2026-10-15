// ---------------------------------------------------------------------------------------
// THE CEREMONY'S DEMO: a Querent-shaped top-tier step list and a mount, so the score ceremony, the rolling number and the reel can be
// shown alone (the coach, Dovina's, does not exist yet: this is the brief's section 2g shape as plain data). Not wired into the game.
//   demoSteps(kind = 'top' | 'plain' | 'loss')   mountDemo(root, { speed, events }) -> { ceremony, reels, play(kind) }
// ---------------------------------------------------------------------------------------
import { ScoreCeremony } from './scoreceremony.js';
import { Reel } from './reel.js';

export function demoSteps(kind = 'top') {
  if (kind === 'loss') return [
    { kind: 'name', label: 'Bust' }, { kind: 'base', label: 'Hand', value: 24 },
    { kind: 'piece', label: 'Over by', value: -9, colour: 'loss' }, { kind: 'total', label: 'Total', value: 15, colour: 'loss' }];
  if (kind === 'plain') return [
    { kind: 'name', label: 'Pair of Cups' }, { kind: 'base', label: 'Pair', value: 40 },
    { kind: 'piece', label: 'Cups 7', value: 7 }, { kind: 'piece', label: 'Cups 7', value: 7 },
    { kind: 'mult', label: 'Suit', value: 2 }, { kind: 'total', label: 'Total', value: 108 }];
  return [
    { kind: 'name', label: 'Tier 3: All Runs' }, { kind: 'base', label: 'Melds', value: 120 },
    { kind: 'piece', label: 'The Fool', value: 22 }, { kind: 'piece', label: 'Wands 4', value: 30 }, { kind: 'piece', label: 'Cups 5', value: 38 },
    { kind: 'piece', label: 'Swords 6', value: 46 }, { kind: 'bonus', label: 'Fate Clause', value: 150, colour: 'money' },
    { kind: 'mult', label: 'Major Arcana', value: 3 }, { kind: 'mult', label: 'Full house', value: 2 }, { kind: 'total', label: 'Total', value: 4224 }];
}

export function mountDemo(root, { speed = 1, events = null } = {}) {
  const ceremony = new ScoreCeremony({ root, events, speed, median: 150 });
  const strip = document.createElement('div'); strip.style.cssText = 'position:fixed;left:16px;top:16px;display:flex;gap:8px;z-index:70';
  root.appendChild(strip);
  const reels = ['The Fool', 'Death', 'The Star'].map((_, i) => {
    const e = document.createElement('div'); strip.appendChild(e);
    return new Reel(e, ['I', 'II', 'III', 'IV', 'V', 'VI'].map((t, k) => ({ text: t, colour: k % 2 ? '#e8b923' : '#f4ecd8' })), { speed });
  });
  return { ceremony, reels, play: (kind) => ceremony.play(demoSteps(kind), { speed }) };
}
