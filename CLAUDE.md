# Claude Code — house rules (Mac mini / any machine)

You have full authority on this machine (network, Chrome, edits, screenshots) unless Zak restricts you.

## Always start

1. `git pull`
2. Read `ai-hq/MISSION.md`, `ai-hq/BACKLOG.md`, `ai-hq/HANDOFF.md`
3. Continue from HANDOFF; do not invent a new mission

## Files from Zak’s phone (Grok audits, etc.)

- Look in `ai-hq/inbox/` after pull — **not** the phone Downloads folder (you cannot see that).
- After handling an inbox file, move it to `ai-hq/audits/` when it is an audit, update `BACKLOG.md` with chosen items, then commit.

## Visual verification

1. Open the site in Chrome as usual
2. Save screenshot(s) to `ai-hq/previews/YYYY-MM-DD-description.png`
3. Commit + push so Zak can view them on GitHub from his phone
4. Briefly say what looks right / wrong

## Always end a session

1. Update `BACKLOG.md` checkboxes honestly
2. Rewrite `HANDOFF.md` (≤ ~10 lines): state, blocked, next 3 moves
3. Append a short entry to `TODAY.md`
4. Commit + push

## Rabbit holes

If you are deep on one sub-task, re-read `MISSION.md` and the unchecked **parent** items in `BACKLOG.md` before starting something new. Prefer finishing the mission over perfecting a side quest.
