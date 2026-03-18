---
mode: agent
description: "Run the SHIP workflow: verify, test, smoke-check, commit/push develop, then optionally merge main with confirmation"
---
Run the SHIP workflow exactly as defined in `.github/copilot-instructions.md`.

Execution requirements:
1. Follow each stage in order: Preflight, Quality Checks, Runtime Smoke Checks, Commit/Push Develop, Merge to Main.
2. Stop immediately on any failed check and report the root error clearly.
3. Require explicit user confirmation at Checkpoint A, Checkpoint C, and before Merge to Main.
4. Use conventional commits.
5. Never bypass failed checks.
6. Never use destructive git commands unless explicitly requested.

Output requirements:
1. Show a concise checklist with pass/fail status for each stage.
2. Include commands executed and key results.
3. Include commit hash(es) and branch sync status.
4. If merge happens, include merge result and final branch status.
