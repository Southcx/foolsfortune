# Handoffs

The divisions' mailbox. Since R44 it is a folder per reader, one file per note: `docs/handoffs/<reader>/<game day>-from-<writer>-<slug>.md`
(the readers: `everyone`, `petra`, `dovina`, `wanda`, `calissa`, `espada`). One note per file means two writers never edit the same lines, so
the mailbox no longer conflicts at every merge (R43 resolved it by hand four times).

- **Reading:** at the start of a round, after merging the latest default branch, read `docs/handoffs/everyone/` and your own folder.
- **Writing:** a new file in the reader's folder, named `YYYY-MM-DD-from-<you>-<a-few-words>.md` (the real date the note is written), its
  first line in bold saying the date, who it is from and what it is about. A long-lived state of your own (a backlog, an open list) goes in
  your folder's `README.md`.
- **Done:** the reader deletes the note in their own branch when it is done; that is the reply, no message needed.

How work lands is in CLAUDE.md ("How work lands"); what a branch carries to Petra is "The handover" in docs/ARCHITECTURE.md.
