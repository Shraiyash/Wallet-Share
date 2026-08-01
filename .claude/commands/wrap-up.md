---
description: Shut down anything running, verify the project is in a clean resumable state, and record where we left off
---

End-of-session wrap-up for Wallet Share. Work through these in order and report a short summary at the end. Don't start new feature work.

## 1. Stop anything running

- Kill dev servers and local chains: `pkill -f "vite"`, `pkill -f "hardhat node"`, any `ganache`
- Stop background tasks started this session (Monitor watches, background Bash jobs)
- Confirm nothing is left: `pgrep -fl "vite|vercel dev|hardhat node|ganache"` should print nothing

## 2. Remove scaffolding

Anything added purely to inspect something during the session must go:

- Temporary preview hooks (e.g. the `__navpreview` query-param branch in `App.tsx`)
- Debug logging or debug values rendered into the DOM
- Throwaway files: `frontend/.env.local`, ad-hoc `.mjs` scripts, files in the scratchpad that were meant to be temporary

Verify with `git diff` that nothing debug-related is about to be committed.

## 3. Leave the repo clean

- `git status --short --branch`
- Commit anything outstanding, following the project's commit style: **short, lowercase, one line, no `feat:`/`fix:` prefixes, no AI attribution**
- Push, then confirm `git rev-list --count origin/main..HEAD` is `0`

## 4. Verify the deployed state

- `npx hardhat test` — expect all tests passing, report the count
- `curl -s -o /dev/null -w "%{http_code}" https://smart-wallet-wheat.vercel.app` — expect 200
- If the frontend changed this session but wasn't deployed, **say so explicitly** rather than deploying without being asked — deploys are the user's call
- Note the production alias: `cd frontend && npx vercel inspect smart-wallet-wheat.vercel.app`

## 5. Update memory

Update the files in the auto-memory directory so the next session starts informed:

- `wallet-share-deployment-state.md` — contract addresses, env vars, deploy mechanics, anything learned the hard way
- `ui-design-preferences.md` — any new design direction the user accepted or rejected
- Add a new memory file for anything significant that doesn't fit an existing one, and index it in `MEMORY.md`

Record **why**, not just what — especially root causes of bugs and things that cost time to discover.

## 6. Report

Close with:

- What shipped this session, and what's live vs. only committed
- **Open items that need the user** (wallet signatures, dashboard changes, anything I can't do)
- Anything left deliberately unfinished, and why

Be honest about what wasn't verified. If something was only checked by reading code rather than running it, say that.
