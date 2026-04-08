---
name: using-sp
description: >
  SP superpowers system overview. Use when the user asks what skills are available,
  how to use the skill system, or how to invoke a specific skill. Also activates
  when starting any new task to check if a more specific skill applies.
manualInvoke: false
disable-model-invocation: false
---

## ⛔ CRITICAL CONSTRAINTS

1. **This is an informational skill** - It guides users to appropriate skills, but does not execute work directly
2. **Always route to specific skills** - After identifying the right skill, delegate to it rather than attempting the work here
3. **Never bypass skill workflows** - Do not provide ad-hoc implementations when a skill exists for that task

# SP Superpowers

This system provides structured workflow skills for software engineering tasks.
Each skill gives you a proven process for a specific type of work.

## How Skills Work

Skills activate automatically when your prompt matches their purpose, or you can
invoke them explicitly with `@sp /skill-name`.

## Available Skills

- `@sp /brainstorm` — Design and spec before building anything
- `@sp /write-plan` — Turn a spec into a step-by-step implementation plan
- `@sp /execute-plan` — Execute a written plan with checkpoints
- `@sp /tdd` — Test-driven development workflow
- `@sp /debug` — Systematic debugging process
- `@sp /request-review` — Prepare code for ADO PR review
- `@sp /receive-review` — Handle incoming code review feedback
- `@sp /verify` — Verify work before claiming it's done
- `@sp /finish-branch` — Complete a branch and create ADO PR
- `@sp /worktree` — Isolate feature work with git worktrees
- `@sp /write-skill` — Create a new skill for this system
- `@sp /simplify` — Review code for quality and efficiency

Two skills are available via auto-detection and skill browser only (not via `@sp`):
- `parallel-agents` — decomposing independent parallel work (degraded)
- `subagent-dev` — structured inline plan execution (degraded)

## When in Doubt

If you're not sure which skill to use, start with `/brainstorm`.
It will guide you to the right next skill.
