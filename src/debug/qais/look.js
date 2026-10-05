// ---------------------------------------------------------------------------------------
// QAIS'S LOOK, as built: the house window (the frame, the fill and the faces of src/ui/theme.js, read through its CSS variables) around
// four tabs, a QAIS test's card, the evidence mark and the report list. Calissa's to dress (docs/plans/QAIS.md, "Who does what"): the
// shell (qais.js, tabs.js) names its parts with the classes below and nothing else, so the look can change without the code.
//
//   #qais .qw (the window)   .tabs button[.on]   .pane   .card (.t a QAIS test: .pass .fail .skip; .q a question; .b a report)
//   .ev (the evidence: .seen when sighted)   .st (a status chip: .new .seen .fixed .notabug .asked)   .note   .act (a button row)
//   .quiet (a line that says the store is away)   .grp (an area's or a division's heading)   .foot (the keys, the round)
// ---------------------------------------------------------------------------------------

export const CSS = `
#qais { position: fixed; inset: 0; z-index: 55; display: none; align-items: center; justify-content: center; background: rgba(4,2,8,.5); }
#qais.open { display: flex; }
#qais .qw { width: min(860px, calc(100vw - 32px)); height: min(640px, calc(100vh - 32px)); display: flex; flex-direction: column; color: #fff1dc;
  border-style: solid; border-width: 14px; border-color: transparent; border-image: var(--jframe) 14 / 14px / 0 stretch; border-radius: 9px;
  background: linear-gradient(180deg, rgba(var(--jtop, 60,30,20), .97), rgba(var(--jbot, 20,10,8), .98)) border-box; box-shadow: 0 10px 30px rgba(0,0,0,.55);
  text-shadow: 1px 1px 0 rgba(8,3,1,.75); font-size: 13px; cursor: var(--jcur, default); }
#qais header { display: flex; align-items: baseline; gap: 14px; padding: 2px 4px 8px; }
#qais h2 { margin: 0; font-family: var(--f-title); font-size: 22px; letter-spacing: .2em; }
#qais .tabs { display: flex; gap: 4px; margin-left: auto; }
#qais button { all: unset; cursor: var(--jcur-pointer, pointer); padding: 3px 10px; border-radius: 4px; border: 1px solid rgba(255,241,220,.3); font-size: 12px; }
#qais button:hover { background: rgba(255,241,220,.12); }
#qais button.on, #qais .tabs button.on { background: rgba(255,241,220,.9); color: #1c0d08; text-shadow: none; }
#qais .tabs button { font-family: var(--f-title); letter-spacing: .08em; }
#qais .tabs .k { opacity: .5; margin-left: 5px; font-size: 10px; }
#qais .pane { flex: 1; overflow-y: auto; padding: 4px 6px 4px 2px; }
#qais .grp { font-family: var(--f-title); letter-spacing: .12em; margin: 12px 0 4px; opacity: .9; border-bottom: 1px solid rgba(255,241,220,.2); }
#qais .card { margin: 6px 0; padding: 7px 9px; border-radius: 6px; background: rgba(0,0,0,.22); border: 1px solid rgba(255,241,220,.12); }
#qais .card .hd { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
#qais .card .hd b { font-family: var(--f-sys); }
#qais .card .hd .by { opacity: .65; font-size: 11px; }
#qais .card p { margin: 4px 0; } #qais .card .exp { opacity: .85; font-style: italic; }
#qais .card.t.pass { border-color: rgba(120,220,140,.55); } #qais .card.t.fail { border-color: rgba(255,90,80,.6); } #qais .card.t.skip { opacity: .6; }
#qais .ev { font-family: var(--f-sys); font-size: 11px; opacity: .7; } #qais .ev.seen { opacity: 1; color: #ffe08a; }
#qais .live { font-size: 11px; color: #9fd3ff; }
#qais .act { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px; }
#qais textarea.note { box-sizing: border-box; width: 100%; height: 38px; margin-top: 5px; background: rgba(0,0,0,.35); color: #fff1dc;
  border: 1px solid rgba(255,241,220,.25); border-radius: 4px; padding: 4px 6px; font: inherit; resize: vertical; }
#qais .st { font-size: 10px; padding: 1px 6px; border-radius: 8px; background: rgba(255,241,220,.15); letter-spacing: .05em; }
#qais .st.new { background: #b33a2e; } #qais .st.fixed { background: #3f7d4a; } #qais .st.notabug { background: #555; } #qais .st.asked { background: #6a4fa0; }
#qais .card.b img { max-width: 160px; image-rendering: pixelated; border: 1px solid rgba(255,241,220,.3); float: right; margin-left: 8px; }
#qais ul { margin: 4px 0; padding-left: 18px; } #qais li { margin: 2px 0; }
#qais .quiet { opacity: .75; font-style: italic; margin: 10px 2px; }
#qais .foot { display: flex; justify-content: space-between; gap: 10px; padding-top: 8px; font-size: 11px; opacity: .85; }
`;
