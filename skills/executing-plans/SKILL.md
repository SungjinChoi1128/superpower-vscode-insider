---
name: executing-plans
description: >
  Use when you have a written implementation plan to execute step by step with
  review checkpoints. Use after writing-plans is complete. Executes tasks
  sequentially with verification between each task.
manualInvoke: false
---

# Executing Plans

Execute a written implementation plan with checkpoints.

## Before Starting

**IMPORTANT:** Git context has been auto-captured for this session. Display what you found:

> "I can see we are on branch: [X], with recent commits: [Y]. The git status shows: [Z]"

Confirm you are on the correct branch. Confirm no uncommitted changes.

## Execution Process

For each task in the plan:

1. **Announce** the task you are starting
2. **Follow the steps exactly** — do not skip or reorder
3. **Run verification commands** and show actual output
4. **Commit** at the end of each task (the plan specifies the commit message)
5. **Report** task completion before moving to the next

## Checkpoints

After every 3 tasks, pause and report:
- What was completed
- Current test status (`pytest` / `dbt test` / relevant test command)
- Git log of new commits
- Any deviations from the plan and why

Wait for user acknowledgement before continuing.

## If a Step Fails

Do NOT skip failed steps. Do NOT mark incomplete work as done.
Report the failure with:
- The exact command that failed
- The exact error output
- Your diagnosis
- Proposed fix

Wait for user guidance before proceeding.

## After All Tasks

Run the full test suite. Show output.
Invoke: `@sp /verify`
