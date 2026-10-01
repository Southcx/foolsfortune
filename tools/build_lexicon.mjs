// ---------------------------------------------------------------------------------------
// BUILD THE LEXICON: the pronunciations the System's voice knows (src/system/speech/lexicon.data.js). Every word the voice can say
// is gathered from the game itself (its line templates, the achievements and their titles, the skills, the cards, the creatures, the
// fish, the curios) together with a few hundred common words, and looked up in the CMU Pronouncing Dictionary (BSD licence, Carnegie
// Mellon University: https://github.com/cmusphinx/cmudict). Words the dictionary does not have (the game's own: Pneuka, Veritome,
// clapperjar, kintsugi...) are in src/system/speech/lexicon.js by hand; anything still unknown at run time goes through
// letter-to-sound rules there.
//
//   node tools/build_lexicon.mjs [path/to/cmudict.dict]      (downloads the dictionary when no path is given)
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = (p) => fs.readFileSync(path.join(ROOT, 'src', p), 'utf8');
const URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';

let text;
if (process.argv[2]) text = fs.readFileSync(process.argv[2], 'utf8');
else { const r = await fetch(URL); if (!r.ok) throw new Error(`cmudict: ${r.status}`); text = await r.text(); }
const dict = new Map();
for (const l of text.split('\n')) {
  const m = l.match(/^(\S+?)(\(\d\))?\s+(.*?)(\s+#.*)?$/);
  if (m && !m[2] && !dict.has(m[1])) dict.set(m[1], m[3]);
}

// the words: the game's own, and common ones
const words = new Set();
const add = (s) => { for (const w of String(s).toLowerCase().replace(/[^a-z' -]/g, ' ').split(/[\s-]+/)) { const x = w.replace(/^'+|'+$/g, ''); if (x && /[a-z]/.test(x)) words.add(x); } };
for (const m of SRC('achievements.js').matchAll(/(?:C|H|F)\('[^']+', '[^']+', '[^']+', \d, '[^']+', (['"])(.*?)\1/g)) add(m[2]);
for (const m of SRC('achievements.js').matchAll(/title: (['"])(.*?)\1/g)) add(m[2]);
for (const m of SRC('achievements.js').matchAll(/\['[A-Z]+', '([^']+)'\]/g)) add(m[1]);
for (const m of SRC('system/skills.js').matchAll(/(?:name|title): '([^']+)'/g)) add(m[1]);
for (const m of SRC('veritome/arcana.js').matchAll(/name: '([^']+)'/g)) add(m[1]);
for (const m of SRC('angling/species.js').matchAll(/name: (['"])(.*?)\1/g)) add(m[2]);
for (const m of SRC('treasure.js').matchAll(/name: (['"])(.*?)\1/g)) add(m[2]);
for (const m of SRC('system/voice.js').matchAll(/say\(\s*(?:`([^`]*)`|'([^']*)')/g)) add((m[1] || m[2] || '').replace(/\$\{[^}]*\}/g, ' ')); // (the System's own lines)
add(`zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty
thirty forty fifty sixty seventy eighty ninety hundred thousand million first second third
a about above across after again against all almost along already also always am among an and another any anything are around as ask at
away back be became because become been before began being below best better between big both but by call came can cannot change come
could day did different do does done down during each early end enough even ever every eye face fact far feel few find found for form
found from full gave get give go going good got great had hand has have he her here high him his home house how however i if important
in into is it its just keep kind know known large last later leave left less let life light like line little long look made make man
many may me mean might more most move much must my name near need never new next night no not nothing now number of off often old on
once only open or order other our out over own part people place point power put rather read real right room said same saw say see seem
seen set several shall she should show side since small so some something sometimes soon still such sure take than that the their them
then there these they thing things think this those though thought three through time to together too took toward turn two under until
up upon us use used very want was water way we well went were what when where which while who whole why will with within without word
work world would year yet you young your ready begin begins began unlocked unlock level levels experience gained gain lost new record
detected detection warning caution notice confirmed denied answer analysis complete completed progress progressed acquired acquisition
skill skills title titles rank ranks card cards bound box full ground left landed found opened open chest prismatic legendary rare epic
common fine abnormal concentration report reports status system voice speak will enabled disabled music on off`);

const out = [], missing = [];
for (const w of [...words].sort()) { const p = dict.get(w); if (p) out.push(`${w}:${p}`); else missing.push(w); }
const file = `// generated by tools/build_lexicon.mjs from the CMU Pronouncing Dictionary: the pronunciations, in ARPAbet with stress digits,
// of every word the System's voice is likely to say. Do not edit: rebuild.
//
// The CMU Pronouncing Dictionary: Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved. Redistribution and use in
// source and binary forms, with or without modification, are permitted provided that the following conditions are met: (1)
// redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer; (2)
// redistributions in binary form must reproduce them in the documentation and/or other materials provided with the distribution.
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON
// UNIVERSITY NOR ITS EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING IN
// ANY WAY OUT OF THE USE OF THIS SOFTWARE. (The full licence: https://github.com/cmusphinx/cmudict/blob/master/LICENSE)
export const LEXICON_DATA = ${JSON.stringify(out.join('|'))};
`;
fs.writeFileSync(path.join(ROOT, 'src/system/speech/lexicon.data.js'), file);
console.log(`${out.length} words written; not in the dictionary (give them by hand in lexicon.js): ${missing.join(' ')}`);
