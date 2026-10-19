# The System's interface (a working name): the game as any agent reaches it

Kept by Dovina (the design). The core is Petra's (`src/agent/`, `scripts/agent.mjs`); each division registers its own system's
readouts and intents as it builds them. **A plan only (the owner, 2026-10-16): nothing here is asked of anyone yet.**

> "We're entering an age of esotericism actualized through silicon and I think I've been wanting to capture that sense through this game."
> "I don't know how long we'll still be in the paradigms of 'MCP' when [the next models come] online, but we do our best to lay the
> foundation now!" (the owner, 2026-10-16)

## 0. The stance

**Bet on the data, not the protocol.** MCP is today's way for an agent to reach a program; something else may replace it. What lasts is
a game whose every system can say, as data, what is there and what can be done. Over that core, a protocol is a thin skin of about a
hundred lines, and the next protocol is another skin.

**The fiction already holds it.** The System is "the game's code made a voice". An agent that connects is talking to the System, as the
Courier does. The siblings are already Claude sessions in the owner's world (`coop/`). Whether a connected agent has a name in the
world (a Tulpa: "a thought-form authored with care"?) is Espada's and the owner's to rule.

**One layer for the player's eye and the agent's.** The overlay (OVERLAY.md) draws readouts. If every readout is data first and drawn
second, as the casino's coach already is, then the overlay and the agent read the same thing. Nothing is built twice, and nothing an
agent sees is more than a player sees.

## 1. Prior art, and what each gives

- **The accessibility tree** (ARIA, the browser's semantic layer a screen reader reads): the closest match. A visual interface with a
  parallel tree of what each thing is and what can be done to it. Our readouts are that tree.
- **GMCP, the Generic MUD Communication Protocol**: MUDs send the story as text and the state as structured data on the same line. Here,
  the log is the text and the readouts are the data.
- **OpenAI Gym and the Minecraft agents** (Mineflayer under Voyager, MineDojo): observe, act, step; named places and high-level skills
  over raw input. Taken already by `src/agent/agent.js`.
- **Screeps, and Factorio's remote console and mod API**: a game played or extended entirely through code, with the same rules as play.
- **Pokémon Showdown's battle protocol**: every legal choice listed with an id, so bots and people play the same game. Taken already
  by the casino's coach (a move's `id`).

## 2. What exists (2026-10-16)

| piece | where | what it gives | what it lacks |
|---|---|---|---|
| the agent | `src/agent/agent.js` | `observe()`: the Courier, what is near (creatures, items, folk), what F could reach, the dialogue and its choices, the Pneuka Box, events and log lines since the last look. `act()`: intents (goto, travel, face, hold, press, interact, use, attack, choose, say) carried out through the player's own input | per-system meaning: it sees a creature's true hp (OVERLAY.md 13 says it should see the player's familiarity); no table, crystal, kiln or garden is legible to it |
| the bridge | `scripts/agent.mjs` | the game headless on a small HTTP server, played a turn at a time from a shell: look, act, do, step, stop | not a protocol an agent's host speaks natively |
| the coach | `progress/casino/coach/` | one moment at Raku's tables as data: the goal, the turn, every legal move with its id, preview and the house's suggestion | the agent cannot sit at a table, so it cannot use it |
| the chat line | `feedback/chat.js` (`chat.add`) | a table of typed commands any module adds to | not listed to the agent with their help |
| playtests, replays | `scripts/playtest/`, `core/replay.js` | scenarios played to goals; a session kept so it plays again the same | (they are clients of the agent, as they should be) |
| the page as a client | `coop/letters.js`, `debug/qais/store.js` | the published page already calls MCP tools itself (letters to a division's session, QAIS's store) | (the other direction: the game reaching out) |

## 3. The design: four layers and a skin

1. **Readouts** (working name: the readout table). Every system registers what it can show:
   `readout(id, (viewer) -> data)`. The data is what the overlay draws: a creature's tag (OVERLAY.md 8), a System window's sheet, the
   coach. The `viewer` gates it: familiarity (OVERLAY.md 13), the windows' privacy (the owner: only the player, unless allowed), the
   fog of the map. `observe()` returns the readouts in view, and the overlay draws the same ones.
2. **Intents.** Every system registers what can be done: `intent(name, schema, run) -> { ok, why? }`, its targets named by the
   readouts' ids (sit at a table, take move 3, tune a crystal to its fret, fire a glaze). An intent goes through the player's own input
   or the same call the UI makes, never around a rule; a refusal says why, as the log would. The agent's ten intents are the first.
3. **Time.** Manual stepping (exists: the world waits between calls); `until(event)` (wait for a named event, with a cap); and
   real-time play beside the owner for co-op (an agent as a guest, COOP.md).
4. **Resources** (read-only): the glossary, the plans, the ledger, the Codex's pages, every HOWTO card, the achievements as their
   predicates in words, the chat line's commands with their help.

**The skins:** the HTTP bridge (exists); an MCP server script (not built; the four layers as tools: look, act, step, until, and
as resources: read); the page's own runtime (a guest's or a sibling's agent in the published build). A later protocol is another skin;
the core does not change.

## 4. Rules (proposed)

- **An agent sees what a player sees and does what a player can.** Readouts are gated by the same familiarity, fog and privacy;
  intents go through input or the UI's own calls. No readout of hidden state, no intent that skips a rule.
- **The log stays the narration for agents too**: what happened comes as the log's lines and the events, never as a readout.
- **A system is not done until it is legible**: its readouts and intents are registered with its overlay surfaces, by its owner, in the
  same round (once the table exists).

## 5. Order of work (when the owner says go)

1. The readout table and the intent table (Petra's core; the shape here is Dovina's to settle with her).
2. `observe()` from the readout table, gated by familiarity (Petra; `progress/familiarity.js` exists).
3. Raku's tables as the first system made legible: the coach as a readout, sit / take / leave as intents (Dovina).
4. The MCP skin over the bridge (Petra).
5. The resources (Dovina: the glossary, plans, ledger and achievements as text).
6. Every other system, by its owner, as its overlay surfaces are built.

## 6. Open (for the owner)

- **Does an agent's play count?** An agent driving the Courier is, to the game, the Courier: its downs and achievements would count
  toward your records. Keep that, or mark an agent's play (`by: 'agent'`) and count it apart?
- **A name in the world** for a connected agent (Espada's and yours).
