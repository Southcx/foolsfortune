// ---------------------------------------------------------------------------------------
// TRACKING, THE PAIRS: `/pairs` lists the 21 cards a main and a sub make (progress/toolpairs.js; TOOLS-TOGETHER.md 8), each with its two
// tools and what the sub would lend, in the log, until the Pneuka Box shows them (docs/plans/PNEUKA-BOX.md). `/pairs <tool>` lists that
// tool's six. Words are placeholders for Espada.
//
//   pairRules({ on, log, g })   (tracking/rules.js calls it)   event pairs.ask { tool, by }
// ---------------------------------------------------------------------------------------
import { PAIRS, pairsOf, SUB_GIFTS, TOOL_IDS } from '../../progress/toolpairs.js';

const NAME = { psygun: 'the psygun', sondelass: 'the Sondelass', soulbrush: 'the Soul Brush', veritome: 'the Veritome', dreamvane: 'the Dreamvane', crucibelle: 'the Crucibelle', lockheart: 'the Lockheart' };

export function pairRules({ on, log, g }) {
  // (the chat line is built after the rules, main.js: the command is added once it exists, at session.open)
  const add = () => g.chat?.add?.('pairs', { help: 'the 21 cards a main and a sub tool make: /pairs, or /pairs <tool> for its six',
    run: (args) => g.events?.emit('pairs.ask', { tool: String(args?.[0] ?? '').trim().toLowerCase() || null, by: 'courier' }) });
  add(); on('session.open', add);
  on('pairs.ask', (e) => {
    const tool = TOOL_IDS.includes(e.tool) ? e.tool : null;
    if (e.tool && !tool) { log.say('system', `No tool called "${e.tool}". The tools: ${TOOL_IDS.join(', ')}.`, { key: 'pairs.ask', throttle: 0.5 }); return; }
    for (const p of tool ? pairsOf(tool) : PAIRS) {
      const [a, b] = p.tools, other = tool ? (a === tool ? b : a) : null;
      const lend = tool ? ` As the sub, ${NAME[other]} lends R: ${SUB_GIFTS[other].verb}.` : '';
      log.say('system', `${p.label}: ${NAME[a]} with ${NAME[b]}.${lend}`, { key: `pair.${p.n}`, throttle: 0.5 });
    }
  });
}
