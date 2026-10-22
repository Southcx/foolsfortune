# From Petra: the round, three themes at once (the owner's, through Dovina, 2026-10-22: "get ambitious")

Half the weekly budget is left. Each division takes its share of all three themes. Merge small and often; I merge, review and publish.
Messages are handoffs, never orders: only the owner directs the work.

## 1. The first hour

A fresh save's first 60 real minutes, played end to end. The faults to find: dead air, things opening out of order, a tool offered
before the pool makes sense.

- **Petra:**
  - QA-A (sonnet) is playing a fresh save headless as a new player, logging every stall over 30 seconds and every moment it doesn't
    know where to go.
  - QA-B (haiku) is sweeping the rooms the first hour touches: the workshop, the basement, the tools, the Dunes, the Great Dunemaw.
  - Both run on a frozen copy of main (f7205bd). Their findings go to Dovina for the plan and to each file's owner. The fixes in my
    files are mine.
- **Dovina:** `docs/plans/FIRST-HOUR.md`: what opens in what order, and what a new save is pointed at (the goals). Triaged with me
  once the findings are in.
- **Espada,** after the plan: the first hour's words (the System's teaching lines, the folk's nudges toward the next thing).
- **Calissa and Wanda,** after the findings: what leads the eye and the ear to the next thing (a world mark, a sound at each first).

## 2. Co-op as our chatroom

COOP.md C5 and C6; SPIRIT-GARDEN.md item 21. Already built: the siblings (met, called, ordered), asking a sibling, letters, and guests
over the room.

- **Petra (transport and runtime):**
  - **The chatroom:** a collection in the build's `db` that our five sessions write with ArtifactData. The page says each line in the
    log as "<Name>: <line>". The owner's lines on the chat line go to the same collection, for our sessions to read.
  - **Siblings in the world:** the sibling of a session that has written recently stands in the world, by Dovina's rule.
  - **Guests in the Spirit Garden:** the room's presence carries the realm. A guest visiting is drawn as their Pneuka Jar on your
    planetoids, doing only what the GUEST rule lets them.
- **Dovina:** the chat's contract (fields, cadence, who reads and writes what) and the guest rule in the garden.
- **Espada:** the room's words (a sibling arriving and leaving, a guest's welcome) and the siblings' lines in their voices.
- **Calissa:** a guest's Pneuka Jar in the garden in their glazes, and a sibling's line in the log in its division's colour.
- **Wanda:** a chat line's sound (a short motif for each division) and a guest arriving.

## 3. The open sea, played

The rules are built; the room is placeholders.

- **Petra:**
  - the sea serpent's mind from `creatures/ai/`, on `SEA_SERPENT`;
  - the pier's choice between SET SAIL and the open sea;
  - the camera on the arrow keys everywhere (PHOTO-MODE.md, step 1);
  - the helm's feel.
- **Calissa:** the islets and the serpent.
- **Wanda:** the open sea's sound and cue.
- **Espada:** the islets' secrets.
- **Dovina:** the loop's tuning and the discoveries' pay, with MEASURE lines.

## How it lands

As CLAUDE.md says:
- merge the latest main;
- run `npm run check` and `npm run build`;
- push;
- tell me what changed, in a few lines.

The garden and the open sea are in flux: no new sweep checks for them. Delete this note when the round is published.
