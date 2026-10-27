@AGENTS.md

## Claude Code specifics

- Start a session by reading TASKS.md and stating which task you are picking up.
  `/next-task` does this for you.
- Preview servers are defined in `.claude/launch.json` (`www` on 3000, `app` on 3001); use them
  to check UI changes in the browser pane instead of starting servers by hand.
- Shell: Windows. PowerShell is the default; Git Bash is also available. Prefer `npm run …` scripts
  over ad-hoc commands so Codex and Claude run the same things.
- When a task is finished: tick it in TASKS.md, run typecheck/lint/build, then summarise what changed.
- The user pushes to GitHub at the end of a session — don't push without being asked.
