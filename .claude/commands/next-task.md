---
description: Pick up the next unchecked task from TASKS.md and implement it
---

1. Read TASKS.md. Find the current phase and its first unchecked task (or the task named in: $ARGUMENTS).
2. Read the matching section of PLAN.md and any files the task touches. Follow AGENTS.md.
3. Say in one line which task you are doing, then implement it.
4. Run `npm run typecheck`, `npm run lint`, `npm run build` (and the Python tool if touched). For UI work,
   check the page in the browser pane using `.claude/launch.json`.
5. Tick the task in TASKS.md, add a short note if useful, and record any architecture change in docs/DECISIONS.md.
6. Summarise what changed. Do not commit unless asked.
