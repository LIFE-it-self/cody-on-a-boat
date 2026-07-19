# Template — copy this as `docs/PHASE_LOG.md` in your project in Session 1

The phase log is the history of the build. One row per session. It records what was built, what changed from the plan, and any open issues to address later.

The block below — between the `===` lines — is the actual content to copy into `docs/PHASE_LOG.md`. Everything outside the block is instructions for you (the human) and should not be in the file.

```
==========================================================================
# Cody On A Boat — Phase Log

This file tracks the build session by session. Add a new row to the table at the end of every session.

| # | Date | Session | Status | Deviations from plan | Open issues / TODO |
|---|------|---------|--------|----------------------|-------------------|
|   |      |         |        |                      |                   |

## Session notes

(Free-form notes go here, organized by session number. Use this section for anything that doesn't fit in the table — gotchas, decisions, links to commits, etc.)

### Session 1
_pending_

==========================================================================
```

---

## How to fill in the table

Each session ends with Claude Code telling you exactly what to add. Example after Session 1:

```
| 1 | 2026-04-12 | Scaffold + Deploy | ✓ Complete | none | none |
```

Example after Session 4 if a minigame ended up needing a different mechanic:

```
| 4 | 2026-04-19 | Act 1: Werewolf + Pipe | ✓ Complete | CokeDrink rhythm window widened from ±150ms to ±200ms after playtesting | Tune RhythmBar visual contrast — dark notes hard to see on dark BG |
```

Status options:
- `✓ Complete` — all session goals met, verification passed, committed and pushed
- `◐ Partial` — some goals met, some pushed to next session (note in deviations)
- `✗ Stuck` — session ran into a blocker, see notes section for details

Always include the date in `YYYY-MM-DD` format. Always commit and push at the end of the session before closing the chat.
